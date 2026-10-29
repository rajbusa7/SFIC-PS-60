"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useTutorial } from "@/context/TutorialContext";
import { broadcastDataUpdate } from "@/lib/events";
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
  const { t, language, setLanguage } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { resetTutorial } = useTutorial();

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
        broadcastDataUpdate("settings", "update");
        broadcastDataUpdate("gaps", "update");
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#49352F] tracking-tight font-heading">
            {language === "gu"
              ? "સંસ્થાકીય સેટિંગ્સ અને એન્જિન રૂપરેખાંકન"
              : "Institutional Settings & Engine Configuration"}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6862] mt-0.5">
            {language === "gu"
              ? "ઓપરેશનલ ગેપ મર્યાદાઓ, થીમ, દ્વિભાષી ડિફોલ્ટ અને બાળ ગોપનીયતા સુરક્ષાઓ ગોઠવો."
              : "Configure operational gap thresholds, appearance themes, bilingual defaults, and child privacy protections."}
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
                  {language === "gu"
                    ? "મુખ્ય લેન્ડિંગ પૃષ્ઠમાંથી ક્યુરેટ કરેલ ગરમ ક્રીમ અને પીચ ડિઝાઇન સિસ્ટમ."
                    : "Curated warm cream & peach design system from the master landing page."}
                </p>
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  theme === "dark"
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
                  {language === "gu"
                    ? "રાત્રિના મૂલ્યાંકન માટે આંખોને આરામ આપતો ડાર્ક સ્લેટ કોન્ટ્રાસ્ટ."
                    : "Deep slate contrast for low-light evening evaluation."}
                </p>
              </button>

              {/* System Preference Option */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  theme === "system"
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
                  {language === "gu"
                    ? "તમારી ઑપરેટિંગ સિસ્ટમની પસંદગી સાથે આપમેળે મેળ ખાય છે."
                    : "Automatically sync with your operating system preference."}
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
                    {language === "gu"
                      ? "અધ્યયન ત્રુટિ શોધ મર્યાદાઓ"
                      : "Learning Gap Detection Thresholds"}
                  </span>
                </CardTitle>
                <CardDescription>
                  {language === "gu"
                    ? "વિદ્યાર્થી સંકલ્પનાઓને પ્રવીણ, વિકાસશીલ અથવા સહાય જરૂરી શ્રેણીઓમાં વર્ગીકૃત કરવા માટે ઓપરેશનલ કટઓફ ગોઠવો."
                    : "Configure operational cutoffs for flagging student concepts into Mastery, Developing, or Needs Support categories."}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/12 text-xs text-[#49352F] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-[#8D4E10] shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>{language === "gu" ? "નોંધ:" : "Note:"}</strong>{" "}
                  {language === "gu"
                    ? "આ થ્રેશોલ્ડ વર્ગખંડ પ્રાથમિકતા માટે રૂપરેખાંકિત કાર્યકારી મેટ્રિક્સ છે, કોઈ અપરિવર્તનીય ધોરણ નથી. તેમને બદલવાથી બધી સંગ્રહિત શીખવાની ખામીઓ પુનઃ ગણતરી થાય છે."
                    : "These thresholds are configurable operational metrics for classroom prioritization, not immutable universal standards. Changing them dynamically recalculates all stored learning gaps."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] mb-1">
                    {language === "gu" ? "નિપુણતા કટઓફ (% ગુણ)" : "Mastery Cutoff (% Score)"}
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
                    {language === "gu"
                      ? `${masteryThreshold}% કે તેથી વધુ ગુણ "પ્રવીણ" તરીકે ચિહ્નિત થાય છે`
                      : `Scores >= ${masteryThreshold}% marked as "Mastered"`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] mb-1">
                    {language === "gu" ? "વિકાસશીલ કટઓફ (% ગુણ)" : "Developing Cutoff (% Score)"}
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
                    {language === "gu"
                      ? `${developingThreshold}% થી ઓછા ગુણ "સહાય જરૂરી" તરીકે ચિહ્નિત થાય છે`
                      : `Scores below ${developingThreshold}% marked as "Needs Support"`}
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
                  {language === "gu" ? "ભાષા અને સિસ્ટમ પસંદગીઓ" : "Language & System Preferences"}
                </CardTitle>
                <CardDescription>
                  {language === "gu"
                    ? "ડિફોલ્ટ ભાષા અને ઑફલાઇન સહાયતા એન્જિન"
                    : "Default language and offline assistance engine"}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#49352F] mb-1">
                  {language === "gu" ? "ડિફોલ્ટ પ્લેટફોર્મ ભાષા" : "Default Platform Language"}
                </label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as "en" | "gu")}
                  className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs font-semibold text-[#49352F] focus:border-[#B26A1B] outline-hidden cursor-pointer"
                >
                  <option value="en">English (default)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#49352F] mb-1">
                  {language === "gu" ? "ભલામણ એન્જિન મોડ" : "Recommendation Engine Mode"}
                </label>
                <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/12 text-xs text-[#49352F]">
                  <span className="font-bold text-[#49352F] block">
                    {language === "gu"
                      ? "નિશ્ચયાત્મક શૈક્ષણિક એન્જિન (ઑફલાઇન)"
                      : "Deterministic Pedagogical Engine (Offline)"}
                  </span>
                  <span className="text-[11px] text-[#7A6862]">
                    {language === "gu"
                      ? "કોઈપણ ચૂકવણી કરેલ API કી વિના 100% ઑફલાઇન કાર્ય કરે છે."
                      : "Works 100% offline with zero paid API keys required."}
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
                    {language === "gu"
                      ? "બાળ ગોપનીયતા અને નૈતિક AI ધોરણો"
                      : "Child Privacy & Ethical AI Standards"}
                  </CardTitle>
                  <CardDescription>
                    {language === "gu"
                      ? "પ્રાથમિક શિક્ષણ માટે પ્રાઇવસી-બાય-ડિઝાઇન નીતિ"
                      : "Privacy-by-design policy for primary education"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-2 text-xs text-[#49352F] leading-relaxed">
              <p>
                • <strong>{language === "gu" ? "કોઈ બિનજરૂરી સંવેદનશીલ ડેટા નહીં:" : "No Unnecessary Sensitive Data:"}</strong>{" "}
                {language === "gu"
                  ? "અમે સરનામા, ફોન નંબર, આર્થિક સ્થિતિ, બાયોમેટ્રિક ડેટા કે ચહેરાના ફોટા એકત્રિત કરતા નથી."
                  : "We do not collect home addresses, phone numbers, family financial status, biometric data, or facial images."}
              </p>
              <p>
                • <strong>{language === "gu" ? "સકારાત્મક ભાષા:" : "Supportive Language:"}</strong>{" "}
                {language === "gu"
                  ? "વિદ્યાર્થીઓને ક્યારેય નકારાત્મક શબ્દોથી લેબલ કરવામાં આવતા નથી. પ્લેટફોર્મ 'સહાય જરૂરી', 'વિકાસશીલ' અને 'આગળ વધવા માટે તૈયાર' જેવા સકારાત્મક શબ્દો વાપરે છે."
                  : "Students are never labeled with negative terms. The platform uses positive pedagogical phrasing such as \"Needs Support,\" \"Developing,\" and \"Ready for Next Step.\""}
              </p>
              <p>
                • <strong>{language === "gu" ? "કોઈ સાર્વજનિક રેન્કિંગ નહીં:" : "No Public Rankings:"}</strong>{" "}
                {language === "gu"
                  ? "વ્યક્તિગત ગુણ શિક્ષક અને વાલી માટે ગુપ્ત છે. હાનિકારક વર્ગ રેન્ક યાદીઓ સખત પ્રતિબંધિત છે."
                  : "Individual student scores are confidential to the teacher and parent. Stigmatizing class rank ladders are strictly prohibited."}
              </p>
              <p>
                • <strong>{language === "gu" ? "ઑફલાઇન ટેલિમેટ્રી:" : "Offline Telemetry:"}</strong>{" "}
                {language === "gu"
                  ? "શીખવાની ખામીઓ અને ઉપચાર યોજનાઓ સ્થાનિક શાળા સર્વર પર ચાલે છે, ત્રીજા પક્ષને બાળકોના રેકોર્ડ મોકલ્યા વિના."
                  : "All learning gaps and remedial plans run locally on the school server or device without transmitting children's records to third parties."}
              </p>
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
                {language === "gu"
                  ? "સેટિંગ્સ સચવાઈ ગઈ! તમામ વિદ્યાર્થીઓની શીખવાની ખામી સ્થિતિ પુનઃ ગણતરી થઈ."
                  : "Settings saved! Learning gap statuses recalculated across all students."}
              </span>
            </div>
          )}

          {tutorialResetSuccess && (
            <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#B26A1B]/30 text-xs text-[#B26A1B] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#B26A1B]" />
              <span>
                {language === "gu"
                  ? "ટ્યુટોરીયલ અને માર્ગદર્શિત પ્રવાસ પ્રગતિ રીસેટ થઈ ગઈ! હવે તમે કોઈપણ પૃષ્ઠ પર માર્ગદર્શિકા જોશો."
                  : "Tutorial & guided walkthrough progress reset! You will see the guided tour on your next visit to any page."}
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
                <span>{language === "gu" ? "ડેમો ડેટાબેઝ પુનઃસ્થાપિત કરો" : "Reset Demo Database"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetTutorial}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#B26A1B] hover:bg-[#FAF6E9] border border-[#49352F]/15 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === "gu" ? "ટ્યુટોરીયલ અને ઑનબોર્ડિંગ રીસેટ કરો" : "Reset Tutorial & Onboarding"}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {language === "gu"
                  ? isSaving
                    ? "સાચવી રહ્યું છે..."
                    : "સેટિંગ્સ સાચવો"
                  : isSaving
                  ? "Saving..."
                  : "Save Settings"}
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
              {language === "gu" ? "ડેમો ડેટા પુનઃસ્થાપિત કરવો છે?" : "Reset Demo Data?"}
            </h3>
            <p className="text-xs text-[#7A6862] mt-2">
              {language === "gu"
                ? "આનાથી ૧૫ ડેમો વિદ્યાર્થીઓ, પ્રારંભિક મૂલ્યાંકન ગુણ, શીખવાની ખામીઓ અને ઉપચાર યોજનાઓ તેમની મૂળ સ્થિતિમાં પુનઃસ્થાપિત થશે."
                : "This will restore the 15 demonstration students, initial assessment scores, learning gaps, and remedial plans to their original state."}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] hover:text-[#49352F] rounded-xl transition-colors cursor-pointer"
              >
                {language === "gu" ? "રદ કરો" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDemo}
                className="px-4 py-1.5 text-xs font-semibold bg-[#C54738] hover:bg-[#C54738]/90 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResetting
                  ? language === "gu"
                    ? "રીસેટ થઈ રહ્યું છે..."
                    : "Resetting..."
                  : language === "gu"
                  ? "પુષ્ટિ કરો અને રીસેટ કરો"
                  : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
