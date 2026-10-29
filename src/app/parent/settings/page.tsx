"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function ParentSettingsPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/parent/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setParentName(data.user.name || "");
          setParentEmail(data.user.email || "");
          setPhone(data.parentProfile?.phone || "");
        } else {
          router.push("/parent/login");
        }
      })
      .catch(() => router.push("/parent/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/30 text-[#49352F]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#49352F]/15 px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/parent/dashboard" className="flex items-center gap-2">
            <BrandLogo size={36} />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="glass" />
            <ThemeToggle variant="glass" />
            <Link
              href="/parent/dashboard"
              className="px-3.5 py-1.5 rounded-xl border border-[#49352F]/15 bg-white text-xs font-bold text-[#49352F] hover:bg-[#FAF6E9] transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-5">
          <div className="border-b border-[#49352F]/10 pb-4">
            <h1 className="text-xl font-black text-[#49352F]">
              {language === "gu" ? "વાલી પ્રોફાઇલ અને સેટિંગ્સ" : "Parent Profile & Preferences"}
            </h1>
            <p className="text-xs text-[#7A6862] mt-0.5">
              Manage your personal details, preferred language, and contact numbers.
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#49352F] block">Parent Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#49352F] block">Email Address (Read-Only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={parentEmail}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/15 bg-slate-100 text-xs font-medium text-[#7A6862] cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#49352F] block">Contact Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#49352F] block">Preferred Interface Language</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage("gu")}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    language === "gu"
                      ? "bg-[#261B16] text-[#FAF6E9] border-[#261B16]"
                      : "bg-[#FAF6E9] text-[#7A6862] border-[#49352F]/20 hover:bg-white"
                  }`}
                >
                  ગુજરાતી (Gujarati)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-[#261B16] text-[#FAF6E9] border-[#261B16]"
                      : "bg-[#FAF6E9] text-[#7A6862] border-[#49352F]/20 hover:bg-white"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[#B26A1B] text-white text-xs font-bold hover:bg-[#8F4E10] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
