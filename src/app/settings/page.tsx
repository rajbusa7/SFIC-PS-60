"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Settings,
  ShieldCheck,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Sun,
  Moon,
  Monitor,
  Palette,
} from "lucide-react";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [masteryThreshold, setMasteryThreshold] = useState<number>(80);
  const [developingThreshold, setDevelopingThreshold] = useState<number>(60);
  const [preferredLang, setPreferredLang] = useState<"en" | "gu">("en");
  const [enableAiAssist, setEnableAiAssist] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [tutorialResetSuccess, setTutorialResetSuccess] = useState(false);

  const handleResetTutorial = () => {
    if (typeof window !== "undefined") {
      const keys = [
        "shikshasetu_tour_completed_dashboard",
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
      setTutorialResetSuccess(true);
      setTimeout(() => setTutorialResetSuccess(false), 4000);
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setMasteryThreshold(data.settings.masteryThreshold);
          setDevelopingThreshold(data.settings.developingThreshold);
          setPreferredLang(data.settings.preferredLanguage);
          setEnableAiAssist(data.settings.enableAiAssist);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (developingThreshold >= masteryThreshold) {
      setError("Developing threshold must be less than Mastery threshold.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masteryThreshold: Number(masteryThreshold),
          developingThreshold: Number(developingThreshold),
          preferredLanguage: preferredLang,
          enableAiAssist,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setLanguage(preferredLang);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to update settings");
      }
    } catch {
      setError("Network error updating settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset-demo", { method: "POST" });
      if (res.ok) {
        setShowResetConfirm(false);
        window.location.reload();
      }
    } catch (e) {
      console.error("Reset failed", e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Institutional Settings & Engine Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure operational gap thresholds, appearance themes, bilingual defaults, and child privacy protections.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card 1: Theme & Interface Appearance */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                  <span>{t.theme?.appearance || "Appearance & Interface Theme"}</span>
                </CardTitle>
                <CardDescription>
                  {t.theme?.themeDescription || "Choose your preferred interface theme or match your device system settings."}
                </CardDescription>
              </div>
              <Badge variant="outline" size="sm" className="capitalize">
                {theme === "system" ? `System (${resolvedTheme})` : theme}
              </Badge>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  theme === "light"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Mini UI Mockup */}
                <div className="w-full h-16 rounded-xl border border-slate-200 bg-slate-50 p-1.5 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="h-2.5 w-full bg-white rounded-sm border border-slate-200 flex items-center justify-between px-1">
                    <div className="h-1 w-6 bg-indigo-600 rounded-full" />
                    <div className="h-1 w-2 bg-amber-400 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-6 bg-white rounded border border-slate-200 p-1">
                      <div className="h-1 w-5 bg-slate-300 rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-emerald-500 rounded-full" />
                    </div>
                    <div className="h-6 bg-white rounded border border-slate-200 p-1">
                      <div className="h-1 w-5 bg-slate-300 rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-indigo-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{t.theme?.lightMode || "Light Mode"}</span>
                  </div>
                  {theme === "light" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Clean, high-clarity layout optimized for daytime classroom presentation.
                </p>
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  theme === "dark"
                    ? "border-cyan-500 bg-cyan-950/20 dark:bg-cyan-950/40 ring-2 ring-cyan-500/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Mini UI Mockup */}
                <div className="w-full h-16 rounded-xl border border-slate-800 bg-[#070a13] p-1.5 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="h-2.5 w-full bg-slate-900 rounded-sm border border-slate-800 flex items-center justify-between px-1">
                    <div className="h-1 w-6 bg-cyan-400 rounded-full" />
                    <div className="h-1 w-2 bg-amber-400 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-6 bg-slate-900 rounded border border-slate-800 p-1">
                      <div className="h-1 w-5 bg-slate-700 rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-emerald-400 rounded-full" />
                    </div>
                    <div className="h-6 bg-slate-900 rounded border border-slate-800 p-1">
                      <div className="h-1 w-5 bg-slate-700 rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-cyan-400 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Moon className="w-4 h-4 text-cyan-400" />
                    <span>{t.theme?.darkMode || "Dark Mode"}</span>
                  </div>
                  {theme === "dark" && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Reduced eye strain with deep slate contrast and glowing accents.
                </p>
              </button>

              {/* System Preference Option */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  theme === "system"
                    ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Mini UI Mockup */}
                <div className="w-full h-16 rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-100 to-[#070a13] p-1.5 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="h-2.5 w-full bg-white/70 dark:bg-slate-900/70 rounded-sm border border-slate-300 dark:border-slate-700 flex items-center justify-between px-1">
                    <div className="h-1 w-6 bg-purple-600 dark:bg-purple-400 rounded-full" />
                    <div className="h-1 w-2 bg-amber-400 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-6 bg-white rounded border border-slate-200 p-1">
                      <div className="h-1 w-4 bg-slate-300 rounded-full mb-1" />
                      <div className="h-1.5 w-2 bg-indigo-500 rounded-full" />
                    </div>
                    <div className="h-6 bg-slate-900 rounded border border-slate-800 p-1">
                      <div className="h-1 w-4 bg-slate-700 rounded-full mb-1" />
                      <div className="h-1.5 w-2 bg-cyan-400 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Monitor className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>{t.theme?.systemMode || "System Sync"}</span>
                  </div>
                  {theme === "system" && (
                    <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Matches your OS settings (active: {resolvedTheme === "dark" ? "Dark" : "Light"}).
                </p>
              </button>
            </div>
          </Card>

          {/* Card 2: Thresholds Configuration */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                  <span>Learning Gap Detection Thresholds</span>
                </CardTitle>
                <CardDescription>
                  Configure operational cutoffs for flagging student concepts into Mastery, Developing, or Needs Support categories.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ℹ️ <strong>Note:</strong> These thresholds are configurable operational metrics for classroom prioritization, not immutable universal standards. Changing them dynamically recalculates all stored learning gaps.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mastery Cutoff (% Score)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={masteryThreshold}
                    onChange={(e) => setMasteryThreshold(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Scores &ge; {masteryThreshold}% marked as &quot;Mastered&quot;
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Developing Cutoff (% Score)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="90"
                    required
                    value={developingThreshold}
                    onChange={(e) => setDevelopingThreshold(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm font-bold text-amber-700 dark:text-amber-400 focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Scores below {developingThreshold}% marked as &quot;Needs Support&quot;
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Language & AI Assist Preferences */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Language & System Preferences</CardTitle>
                <CardDescription>Default language and offline assistance engine</CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Platform Language
                </label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as "en" | "gu")}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-indigo-500 dark:focus:border-cyan-400 outline-hidden"
                >
                  <option value="en">English (default)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recommendation Engine Mode
                </label>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block">Deterministic Pedagogical Engine (Offline)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Works 100% offline with zero paid API keys required.
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Privacy & Security Statement */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <CardTitle>Child Privacy & Ethical AI Standards</CardTitle>
                  <CardDescription>Privacy-by-design policy for primary education</CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                • <strong>No Unnecessary Sensitive Data:</strong> We do not collect home addresses, phone numbers, family financial status, biometric data, or facial images.
              </p>
              <p>
                • <strong>Supportive Language:</strong> Students are never labeled with negative terms. The platform uses positive pedagogical phrasing such as &quot;Needs Support,&quot; &quot;Developing,&quot; and &quot;Ready for Next Step.&quot;
              </p>
              <p>
                • <strong>No Public Rankings:</strong> Individual student scores are confidential to the teacher and parent. Stigmatizing class rank ladders are strictly prohibited.
              </p>
              <p>
                • <strong>Offline Telemetry:</strong> All learning gaps and remedial plans run locally on the school server or device without transmitting children&apos;s records to third parties.
              </p>
            </div>
          </Card>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Settings saved! Learning gap statuses recalculated across all students.</span>
            </div>
          )}

          {tutorialResetSuccess && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Tutorial &amp; guided walkthrough progress reset! You will see the guided tour on your next visit to any page.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Database</span>
              </button>

              <button
                type="button"
                onClick={handleResetTutorial}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Tutorial &amp; Onboarding</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Demo Data?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              This will restore the 15 demonstration students, initial assessment scores, learning gaps, and remedial plans to their original state.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDemo}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResetting ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
