"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { TourStep, PAGE_TOURS, dashboardTourSteps } from "@/lib/tutorialData";

export interface TutorialContextType {
  tutorialOpen: boolean;
  tutorialMode: "auto" | "manual";
  tutorialStep: number;
  activeTourPage: string;
  steps: TourStep[];
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
  activeTourPage: "tutorial",
  steps: dashboardTourSteps,
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
  const [activeTourPage, setActiveTourPage] = useState<string>("tutorial");

  const steps: TourStep[] = PAGE_TOURS[activeTourPage] || dashboardTourSteps;

  const setTutorialStep = useCallback((step: number) => {
    setTutorialStepState(step);
  }, []);

  // Central manual tutorial opener - called by both "Replay Guided Tour" & "Open Tutorial →"
  const openTutorial = useCallback(
    (options?: { step?: number; page?: string }) => {
      const targetPage = options?.page || "tutorial";
      const startStep = options?.step ?? 0;

      setTutorialMode("manual");
      setTutorialStepState(startStep);
      setActiveTourPage(targetPage);
      setTutorialOpen(true);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "shikshasetu_pending_tutorial",
          JSON.stringify({
            mode: "manual",
            step: startStep,
            page: targetPage,
          })
        );
      }

      // Directly navigate to the dedicated Tutorial page /tutorial
      if (pathname !== "/tutorial") {
        router.push("/tutorial");
      }
    },
    [pathname, router]
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
        "shikshasetu_checklist_completed",
        "shikshasetu_checklist_steps",
        "shikshasetu_checklist_dismissed",
      ];
      keys.forEach((k) => localStorage.removeItem(k));
      sessionStorage.removeItem("shikshasetu_pending_tutorial");
    }
  }, [setHasSeenTutorial]);

  // Handle route transitions & Pending / Automatic Onboarding checks
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check for pending manual tutorial request from navigation
    const pending = sessionStorage.getItem("shikshasetu_pending_tutorial");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        sessionStorage.removeItem("shikshasetu_pending_tutorial");
        if (pathname === "/tutorial" || pathname === "/dashboard") {
          setTutorialMode(parsed.mode || "manual");
          setTutorialStepState(parsed.step || 0);
          setActiveTourPage(parsed.page || "tutorial");
          const timer = setTimeout(() => {
            setTutorialOpen(true);
          }, 100);
          return () => clearTimeout(timer);
        }
      } catch {
        sessionStorage.removeItem("shikshasetu_pending_tutorial");
      }
    }

    // 2. Automatic onboarding logic:
    // ONLY fires for brand new users (has_seen_tutorial === false) on first login!
    // Experienced users (has_seen_tutorial === true) will NEVER trigger this.
    if (pathname === "/dashboard" && user && user.has_seen_tutorial === false && !tutorialOpen) {
      setTutorialMode("auto");
      setTutorialStepState(0);
      setActiveTourPage("tutorial");
      setTutorialOpen(true);
      router.push("/tutorial");
    }
  }, [pathname, user, tutorialOpen, router]);

  // Support global custom event for backwards compatibility
  useEffect(() => {
    const handleReplay = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetPage = customEvent.detail?.page || "tutorial";
      openTutorial({ page: targetPage, step: 0 });
    };
    window.addEventListener("shikshasetu_start_tour", handleReplay);
    return () => window.removeEventListener("shikshasetu_start_tour", handleReplay);
  }, [openTutorial]);

  return (
    <TutorialContext.Provider
      value={{
        tutorialOpen,
        tutorialMode,
        tutorialStep,
        activeTourPage,
        steps,
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
