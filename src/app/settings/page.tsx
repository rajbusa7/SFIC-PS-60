"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import type { AuditLogEntry, SupportedLanguage } from "@/lib/types";
import { ALL_LANGUAGES } from "@/lib/i18n/registry";
import { useTheme } from "@/context/ThemeContext";
import { useTutorial } from "@/context/TutorialContext";
import { broadcastDataUpdate } from "@/lib/events";
import { TeacherManagementSection } from "@/components/admin/TeacherManagementSection";
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
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const { t, tr, setLanguage, formatDate, formatSubject } = useLanguage();
  const st = t.settings;
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { resetTutorial } = useTutorial();

  const [masteryThreshold, setMasteryThreshold] = useState<number>(80);
  const [developingThreshold, setDevelopingThreshold] = useState<number>(60);
  const [preferredLang, setPreferredLang] = useState<SupportedLanguage>("en");
  const [enableAiAssist, setEnableAiAssist] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [tutorialResetSuccess, setTutorialResetSuccess] = useState(false);


  const { user, role } = useAuth();
  const isAdmin = user?.role === "admin" || role === "admin";

  const [auditLogsList, setAuditLogsList] = useState<AuditLogEntry[]>([]);

  const fetchAuditLogs = async () => {
    try {
      const logRes = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      const logData = await logRes.json();
      if (logData.success) {
        setAuditLogsList(logData.auditLogs || []);
      }
    } catch (e) {
      console.warn("Failed to fetch audit logs", e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [isAdmin]);

  const handleResetTutorial = () => {
    resetTutorial();
    setTutorialResetSuccess(true);
    setTimeout(() => setTutorialResetSuccess(false), 4000);
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
      setError(st.errThresholdOrder);
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
        broadcastDataUpdate("settings", "update");
        broadcastDataUpdate("gaps", "update");
        setSaveSuccess(true);
        setLanguage(preferredLang);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.error || st.errUpdateFailed);
      }
    } catch {
      setError(st.errNetwork);
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#49352F] tracking-tight font-heading">
            {st.pageMainTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6862] mt-0.5">
            {st.pageMainSubtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card 1: Theme & Interface Appearance */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#B26A1B]" />
                  <span>{t.theme?.appearance || "Appearance & Interface Theme"}</span>
                </CardTitle>
                <CardDescription>
                  {t.theme?.themeDescription || "Choose your preferred interface theme or match your device system settings."}
                </CardDescription>
              </div>
              <Badge variant="outline" size="sm" className="capitalize">
                {theme === "system" ? tr("settings.systemThemeWithResolved", { resolved: resolvedTheme || "" }) : theme}
              </Badge>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${theme === "light"
                    ? "border-[#49352F] bg-[#FAF6E9] ring-2 ring-[#F2CAB3] shadow-xs"
                    : "border-[#49352F]/12 bg-white hover:border-[#49352F]/25"
                  }`}
              >
                {/* Mini UI Mockup */}
                <div className="w-full h-16 rounded-xl border border-[#49352F]/12 bg-[#FAF6E9] p-1.5 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="h-2.5 w-full bg-white rounded-sm border border-[#49352F]/10 flex items-center justify-between px-1">
                    <div className="h-1 w-6 bg-[#F2CAB3] rounded-full" />
                    <div className="h-1 w-2 bg-[#B26A1B] rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-6 bg-white rounded border border-[#49352F]/10 p-1">
                      <div className="h-1 w-5 bg-[#FAF6E9] rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-[#2E7D5E] rounded-full" />
                    </div>
                    <div className="h-6 bg-white rounded border border-[#49352F]/10 p-1">
                      <div className="h-1 w-5 bg-[#FAF6E9] rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-[#B26A1B] rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#49352F]">
                    <Sun className="w-4 h-4 text-[#B26A1B]" />
                    <span>{t.theme?.lightMode || "Warm Cream (Master)"}</span>
                  </div>
                  {theme === "light" && (
                    <span className="w-2 h-2 rounded-full bg-[#B26A1B]" />
                  )}
                </div>
                <p className="text-[11px] text-[#7A6862] mt-1 leading-snug">
                  {st.themeLightDesc}
                </p>
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${theme === "dark"
                    ? "border-[#49352F] bg-[#FAF6E9] ring-2 ring-[#F2CAB3] shadow-xs"
                    : "border-[#49352F]/12 bg-white hover:border-[#49352F]/25"
                  }`}
              >
                {/* Mini UI Mockup */}
                <div className="w-full h-16 rounded-xl border border-slate-800 bg-[#14123D] p-1.5 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="h-2.5 w-full bg-slate-900 rounded-sm border border-slate-800 flex items-center justify-between px-1">
                    <div className="h-1 w-6 bg-[#F2CAB3] rounded-full" />
                    <div className="h-1 w-2 bg-[#B26A1B] rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-6 bg-slate-900 rounded border border-slate-800 p-1">
                      <div className="h-1 w-5 bg-slate-700 rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-[#2E7D5E] rounded-full" />
                    </div>
                    <div className="h-6 bg-slate-900 rounded border border-slate-800 p-1">
                      <div className="h-1 w-5 bg-slate-700 rounded-full mb-1" />
                      <div className="h-1.5 w-3 bg-[#B26A1B] rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#49352F]">
                    <Moon className="w-4 h-4 text-[#B26A1B]" />
                    <span>{t.theme?.darkMode || "Dark Slate Mode"}</span>
                  </div>
                  {theme === "dark" && (
                    <span className="w-2 h-2 rounded-full bg-[#B26A1B]" />
                  )}
                </div>
                <p className="text-[11px] text-[#7A6862] mt-1 leading-snug">
                  {st.themeDarkDesc}
                </p>
              </button>

              {/* System Preference Option */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${theme === "system"
                    ? "border-[#49352F] bg-[#FAF6E9] ring-2 ring-[#F2CAB3] shadow-xs"
                    : "border-[#49352F]/12 bg-white hover:border-[#49352F]/25"
                  }`}
              >
                {/* Mini UI Mockup */}
                <div className="w-full h-16 rounded-xl border border-[#49352F]/12 bg-gradient-to-r from-[#FAF6E9] to-slate-800 p-1.5 flex flex-col justify-between mb-3 shadow-2xs">
                  <div className="h-2.5 w-full bg-white/80 rounded-sm border border-[#49352F]/10 flex items-center justify-between px-1">
                    <div className="h-1 w-6 bg-[#B26A1B] rounded-full" />
                    <div className="h-1 w-2 bg-[#F2CAB3] rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-6 bg-white rounded border border-[#49352F]/10 p-1">
                      <div className="h-1 w-4 bg-[#FAF6E9] rounded-full mb-1" />
                      <div className="h-1.5 w-2 bg-[#2E7D5E] rounded-full" />
                    </div>
                    <div className="h-6 bg-slate-900 rounded border border-slate-800 p-1">
                      <div className="h-1 w-4 bg-slate-700 rounded-full mb-1" />
                      <div className="h-1.5 w-2 bg-[#F2CAB3] rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#49352F]">
                    <Monitor className="w-4 h-4 text-[#B26A1B]" />
                    <span>{t.theme?.systemMode || "System Sync"}</span>
                  </div>
                  {theme === "system" && (
                    <span className="w-2 h-2 rounded-full bg-[#B26A1B]" />
                  )}
                </div>
                <p className="text-[11px] text-[#7A6862] mt-1 leading-snug">
                  {st.themeSystemDesc}
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
                  <span>
                    {st.thresholdsTitle}
                  </span>
                </CardTitle>
                <CardDescription>
                  {st.thresholdsDesc}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/12 text-xs text-[#49352F] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-[#8D4E10] shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>{st.notePrefix}</strong>{" "}
                  {st.thresholdsNote}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] mb-1">
                    {st.masteryCutoffLabel}
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={masteryThreshold}
                    onChange={(e) => setMasteryThreshold(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm font-bold text-[#2E7D5E] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
                  />
                  <span className="text-[11px] text-[#7A6862] mt-1 block">
                    {tr("settings.masteryCutoffHint", { val: masteryThreshold })}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] mb-1">
                    {st.developingCutoffLabel}
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="90"
                    required
                    value={developingThreshold}
                    onChange={(e) => setDevelopingThreshold(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm font-bold text-[#B26A1B] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
                  />
                  <span className="text-[11px] text-[#7A6862] mt-1 block">
                    {tr("settings.developingCutoffHint", { val: developingThreshold })}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Language & AI Assist Preferences */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>
                  {st.langSysTitle}
                </CardTitle>
                <CardDescription>
                  {st.langSysDesc}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#49352F] mb-1">
                  {st.languagePreferenceLabel}
                </label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as SupportedLanguage)}
                  className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs font-semibold text-[#49352F] focus:border-[#B26A1B] outline-hidden cursor-pointer"
                >
                  {ALL_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#49352F] mb-1">
                  {st.recEngineLabel}
                </label>
                <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/12 text-xs text-[#49352F]">
                  <span className="font-bold text-[#49352F] block">
                    {st.recEngineTitle}
                  </span>
                  <span className="text-[11px] text-[#7A6862]">
                    {st.recEngineDesc}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Privacy & Security Statement */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2E7D5E]" />
                <div>
                  <CardTitle>
                    {st.privacyTitle}
                  </CardTitle>
                  <CardDescription>
                    {st.privacyDesc}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-2 text-xs text-[#49352F] leading-relaxed">
              <p>
                • <strong>{st.privacyP1Title}</strong> {st.privacyP1Body}
              </p>
              <p>
                • <strong>{st.privacyP2Title}</strong> {st.privacyP2Body}
              </p>
              <p>
                • <strong>{st.privacyP3Title}</strong> {st.privacyP3Body}
              </p>
              <p>
                • <strong>{st.privacyP4Title}</strong> {st.privacyP4Body}
              </p>
            </div>
          </Card>


          {/* Teacher Management & Subject Assignment Suite */}
          {isAdmin && (
            <div className="pt-2">
              <TeacherManagementSection />
            </div>
          )}

          {/* Academic Mark Change Audit Log Card */}
          <Card variant="glass" className="p-5 sm:p-6 border-[#49352F]/15 space-y-4 text-[#49352F]">
            <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10">
              <div>
                <h3 className="font-heading text-base font-bold text-[#49352F]">
                  {st.auditLogTitle}
                </h3>
                <p className="text-xs text-[#7A6862]">
                  {st.auditLogDesc}
                </p>
              </div>
              <Badge variant="mint" size="sm">
                {auditLogsList.length} {st.auditEntriesSuffix}
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#49352F]/10 text-[#7A6862] font-semibold">
                    <th className="py-2 px-3">{st.thTimestamp}</th>
                    <th className="py-2 px-3">{st.thTeacher}</th>
                    <th className="py-2 px-3">{st.thStudent}</th>
                    <th className="py-2 px-3">{st.thSubject}</th>
                    <th className="py-2 px-3 text-center">{st.thScoreDelta}</th>
                    <th className="py-2 px-3">{st.thAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#49352F]/8">
                  {auditLogsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-[#7A6862]">
                        {st.noAuditLogs}
                      </td>
                    </tr>
                  ) : (
                    auditLogsList.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF6E9]/40">
                        <td className="py-2 px-3 text-[11px] font-mono text-[#7A6862]">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="py-2 px-3 font-medium text-[#49352F]">
                          {log.teacherName}
                        </td>
                        <td className="py-2 px-3 font-medium text-[#49352F]">
                          {log.studentName}
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#B26A1B]">
                          {formatSubject(log.subjectCode)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {log.previousMarks} &rarr; {log.updatedMarks}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF6E9] border border-[#49352F]/10">
                            {log.action}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-[#2E7D5E]/15 border border-[#2E7D5E]/30 text-xs text-[#2E7D5E] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D5E]" />
              <span>
                {st.saveSuccessRecalc}
              </span>
            </div>
          )}

          {tutorialResetSuccess && (
            <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#B26A1B]/30 text-xs text-[#B26A1B] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#B26A1B]" />
              <span>
                {st.tutorialResetMsg}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#C54738] hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{st.resetDemoDbBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleResetTutorial}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#B26A1B] hover:bg-[#FAF6E9] border border-[#49352F]/15 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{st.resetTutorialBtn}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSaving ? st.savingSettings : st.saveSettingsBtn}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#49352F]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#49352F]/12 text-[#49352F]">
            <h3 className="text-base font-bold text-[#49352F] font-heading">
              {st.resetModalTitle}
            </h3>
            <p className="text-xs text-[#7A6862] mt-2">
              {st.resetModalDesc}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] hover:text-[#49352F] rounded-xl transition-colors cursor-pointer"
              >
                {st.cancelBtn}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDemo}
                className="px-4 py-1.5 text-xs font-semibold bg-[#C54738] hover:bg-[#C54738]/90 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResetting ? st.resettingBtn : st.confirmResetBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
