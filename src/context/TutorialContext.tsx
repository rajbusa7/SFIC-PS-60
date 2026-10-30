"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { TourStep, PAGE_TOURS, dashboardTourSteps } from "@/lib/tutorialData";

export type TutorialTourMode = "FULL_SITE_TOUR" | "AARAV_CASE_TOUR";

export interface TutorialContextType {
  tutorialOpen: boolean;
  tutorialMode: "auto" | "manual";
  tutorialStep: number;
  activeTourPage: string;
  steps: TourStep[];
  startTutorial: (mode: "FULL_SITE_TOUR" | "AARAV_CASE_TOUR" | string) => void;
  openTutorial: (options?: { step?: number; page?: string }) => void;
  closeTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setTutorialStep: (step: number) => void;
  resetTutorial: () => void;
  hasSeenTutorial: boolean;
}

const TutorialContext = createContext<TutorialContextType>({
  tutorialOpen: false,
  tutorialMode: "manual",
  tutorialStep: 0,
  activeTourPage: "FULL_SITE_TOUR",
  steps: dashboardTourSteps,
  startTutorial: () => {},
  openTutorial: () => {},
  closeTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  setTutorialStep: () => {},
  resetTutorial: () => {},
  hasSeenTutorial: true,
});

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setHasSeenTutorial } = useAuth();

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialMode, setTutorialMode] = useState<"auto" | "manual">("manual");
  const [tutorialStep, setTutorialStepState] = useState(0);
  const [activeTourPage, setActiveTourPage] = useState<string>("FULL_SITE_TOUR");

  const steps: TourStep[] = PAGE_TOURS[activeTourPage] || dashboardTourSteps;

  const setTutorialStep = useCallback((step: number) => {
    setTutorialStepState(step);
  }, []);

  // Dedicated starter for the two decoupled tutorial flows: FULL_SITE_TOUR & AARAV_CASE_TOUR
  const startTutorial = useCallback((mode: "FULL_SITE_TOUR" | "AARAV_CASE_TOUR" | string) => {
    const isAarav = mode === "AARAV_CASE_TOUR" || mode === "aarav";
    const targetPage = isAarav ? "AARAV_CASE_TOUR" : "FULL_SITE_TOUR";

    setTutorialMode("manual");
    setTutorialStepState(0);
    setActiveTourPage(targetPage);
    setTutorialOpen(true);
  }, []);

  // Central manual tutorial opener (supports options for backwards compatibility)
  const openTutorial = useCallback(
    (options?: { step?: number; page?: string }) => {
      const targetPage = options?.page || "FULL_SITE_TOUR";
      const startStep = options?.step ?? 0;

      setTutorialMode("manual");
      setTutorialStepState(startStep);
      setActiveTourPage(targetPage);
      setTutorialOpen(true);
    },
    []
  );

  // Close tutorial handler
  const closeTutorial = useCallback(() => {
    setTutorialOpen(false);
    // Mark tutorial as completed for this user
    setHasSeenTutorial(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`shikshasetu_tour_completed_${activeTourPage}`, "true");
      // Fire action completed for checklist milestone 1 (Review class)
      window.dispatchEvent(new CustomEvent("shikshasetu_step_class_reviewed"));
    }
  }, [activeTourPage, setHasSeenTutorial]);

  const nextStep = useCallback(() => {
    setTutorialStepState((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      } else {
        closeTutorial();
        return prev;
      }
    });
  }, [steps.length, closeTutorial]);

  const prevStep = useCallback(() => {
    setTutorialStepState((prev) => Math.max(0, prev - 1));
  }, []);

  // Explicit reset button logic (Settings only)
  const resetTutorial = useCallback(() => {
    setHasSeenTutorial(false);
    if (typeof window !== "undefined") {
      const keys = [
        "shikshasetu_tour_completed_dashboard",
        "shikshasetu_tour_completed_tutorial",
        "shikshasetu_tour_completed_students",
        "shikshasetu_tour_completed_studentDetail",
        "shikshasetu_tour_completed_learningGaps",
        "shikshasetu_tour_completed_remedialPlans",
        "shikshasetu_tour_completed_reports",
        "shikshasetu_tour_completed_FULL_SITE_TOUR",
        "shikshasetu_tour_completed_AARAV_CASE_TOUR",
        "shikshasetu_checklist_completed",
        "shikshasetu_checklist_steps",
        "shikshasetu_checklist_dismissed",
      ];
      keys.forEach((k) => localStorage.removeItem(k));
      sessionStorage.removeItem("shikshasetu_pending_tutorial");
    }
  }, [setHasSeenTutorial]);

  // Automatic onboarding logic:
  // ONLY fires for brand new users (has_seen_tutorial === false) on first login!
  // Experienced users (has_seen_tutorial === true) will NEVER trigger this.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (pathname === "/dashboard" && user && user.has_seen_tutorial === false && !tutorialOpen) {
      setTutorialMode("auto");
      setTutorialStepState(0);
      setActiveTourPage("FULL_SITE_TOUR");
      setTutorialOpen(true);
    }
  }, [pathname, user, tutorialOpen]);

  // Support global custom event for backwards compatibility
  useEffect(() => {
    const handleReplay = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetPage = customEvent.detail?.page || "FULL_SITE_TOUR";
      if (targetPage === "aarav" || targetPage === "AARAV_CASE_TOUR") {
        startTutorial("AARAV_CASE_TOUR");
      } else {
        startTutorial("FULL_SITE_TOUR");
      }
    };
    window.addEventListener("shikshasetu_start_tour", handleReplay);
    return () => window.removeEventListener("shikshasetu_start_tour", handleReplay);
  }, [startTutorial]);

  return (
    <TutorialContext.Provider
      value={{
        tutorialOpen,
        tutorialMode,
        tutorialStep,
        activeTourPage,
        steps,
        startTutorial,
        openTutorial,
        closeTutorial,
        nextStep,
        prevStep,
        setTutorialStep,
        resetTutorial,
        hasSeenTutorial: user?.has_seen_tutorial ?? true,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
