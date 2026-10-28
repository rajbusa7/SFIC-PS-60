"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SchoolSettings } from "@/lib/types";
import { subscribeDataUpdates, broadcastDataUpdate } from "@/lib/events";

interface SettingsContextType {
  settings: SchoolSettings | null;
  aiAssistantName: string;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateAssistantName: (newName: string) => Promise<{ success: boolean; error?: string }>;
}

const DEFAULT_AI_NAME = "Study Buddy";
const STORAGE_KEY = "studysaathi_ai_assistant_name";

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  aiAssistantName: DEFAULT_AI_NAME,
  loading: true,
  refreshSettings: async () => {},
  updateAssistantName: async () => ({ success: false }),
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [aiAssistantName, setAiAssistantName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached && cached.trim()) return cached.trim();
    }
    return DEFAULT_AI_NAME;
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        const name = (data.settings.aiAssistantName && data.settings.aiAssistantName.trim()) || DEFAULT_AI_NAME;
        setAiAssistantName(name);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, name);
        }
      }
    } catch (e) {
      console.error("[SettingsContext] Failed to fetch settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Listen to real-time events broadcast across tabs/components
    const unsubscribe = subscribeDataUpdates("settings", () => {
      fetchSettings();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchSettings]);

  const updateAssistantName = async (newName: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = (newName || "").trim();
    if (!trimmed) {
      return { success: false, error: "AI Assistant Name cannot be empty or contain only whitespace." };
    }
    if (trimmed.length > 60) {
      return { success: false, error: "AI Assistant Name cannot exceed 60 characters." };
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiAssistantName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to update assistant name" };
      }

      setAiAssistantName(trimmed);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, trimmed);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      broadcastDataUpdate("settings", "update");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error updating AI Assistant name" };
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        aiAssistantName,
        loading,
        refreshSettings: fetchSettings,
        updateAssistantName,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

