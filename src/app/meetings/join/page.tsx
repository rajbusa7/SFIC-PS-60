"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Video,
  User,
  GraduationCap,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiClient } from "@/services/apiClient";
import { formatMeetingDateTime } from "@/components/ptm/MeetingStatusBadge";

function JoinMeetingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, loginWithSessionUser } = useAuth();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingData, setMeetingData] = useState<{
    meeting: any;
    parent: any;
    student: any;
    redirectUrl: string;
    payload: any;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError(
        language === "gu"
          ? "અમાન્ય જોડાણ લિંક: ટોકન ખૂટે છે."
          : "Invalid join link: Token parameter is missing."
      );
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await apiClient.verifyJoinToken(token!);
        if (!res.success || !res.valid) {
          setError(
            (res as any).error ||
              (language === "gu"
                ? "જોડાણ લિંક સમાપ્ત થઈ ગઈ છે અથવા અમાન્ય છે."
                : "The meeting join link has expired or is invalid.")
          );
          setLoading(false);
          return;
        }

        setMeetingData(res);

        // If parent is not logged in, auto-authenticate with the signed parent credentials
        if (!user && res.parent) {
          const authUser = {
            id: res.parent.id,
            name: res.parent.name,
            email: res.parent.email || `${res.parent.id}@parent.studysaathi.edu.in`,
            phone: res.parent.phone,
            role: "parent" as const,
            schoolId: "sch-gn-01",
            provider: "local" as const,
          };
          loginWithSessionUser(authUser);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to verify meeting token.");
        setLoading(false);
      }
    }

    verify();
  }, [token, user, language, loginWithSessionUser]);

  const handleProceed = () => {
    if (meetingData?.meeting?.roomId) {
      router.push(`/meetings/room/${meetingData.meeting.roomId}`);
    } else if (meetingData?.redirectUrl) {
      router.push(meetingData.redirectUrl);
    } else {
      router.push("/parent/meetings");
    }
  };

  return (
    <div className="max-w-lg w-full mx-auto p-4 sm:p-6">
      <Card className="p-6 sm:p-8 space-y-6 shadow-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white/95 dark:bg-[#1E1916]/95 backdrop-blur-xl rounded-3xl text-center">
        {loading ? (
          <div className="py-12 space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-[#B26A1B] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80 font-medium">
              {language === "gu"
                ? "તમારી સુરક્ષિત મીટિંગ લિંક ચકાસાઈ રહી છે..."
                : "Verifying your secure signed meeting link..."}
            </p>
          </div>
        ) : error ? (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {language === "gu" ? "લિંક સમાપ્ત થઈ ગઈ છે" : "Link Expired or Invalid"}
              </h2>
              <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/75 leading-relaxed">
                {error}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link href="/parent/login">
                <Button variant="saffron" size="md" className="w-full rounded-full text-xs font-bold">
                  <span>{language === "gu" ? "વાલી કોડથી પ્રવેશ કરો" : "Sign in with Parent Code"}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
              <Link href="/meetings">
                <Button variant="outline" size="sm" className="w-full rounded-full text-xs">
                  {language === "gu" ? "મુખ્ય પૃષ્ઠ પર પાછા જાઓ" : "Return to Home"}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B26A1B]/10 text-[#B26A1B] dark:text-[#F2CAB3] uppercase tracking-wider">
                {language === "gu" ? "ચકાસાયેલ વાલી સત્ર" : "Verified Parent Session"}
              </span>
              <h2 className="font-heading text-xl font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {meetingData?.meeting?.title}
              </h2>
              <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80">
                {language === "gu"
                  ? `શિક્ષક: ${meetingData?.meeting?.teacherName || "શિક્ષક"}`
                  : `Teacher: ${meetingData?.meeting?.teacherName || "Teacher"}`}
              </p>
            </div>

            {/* Meeting Detail Card */}
            <div className="p-4 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/12 dark:border-[#F2CAB3]/15 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/10">
                <span className="text-[#7A6862] dark:text-[#FAF6E9]/70">
                  {language === "gu" ? "સમય:" : "Scheduled Time:"}
                </span>
                <span className="font-bold text-[#49352F] dark:text-[#F4F1E1]">
                  {formatMeetingDateTime(meetingData?.meeting?.startTime, language as "en" | "gu")}
                </span>
              </div>

              {meetingData?.student && (
                <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/10">
                  <span className="text-[#7A6862] dark:text-[#FAF6E9]/70">
                    {language === "gu" ? "વિદ્યાર્થી:" : "Student:"}
                  </span>
                  <span className="font-bold text-[#49352F] dark:text-[#F4F1E1]">
                    {meetingData.student.displayName} (
                    {language === "gu"
                      ? `ધોરણ ${meetingData.student.grade}`
                      : `Class ${meetingData.student.grade}`}
                    )
                  </span>
                </div>
              )}

              {meetingData?.parent && (
                <div className="flex items-center justify-between">
                  <span className="text-[#7A6862] dark:text-[#FAF6E9]/70">
                    {language === "gu" ? "વાલી:" : "Parent:"}
                  </span>
                  <span className="font-bold text-[#49352F] dark:text-[#F4F1E1]">
                    {meetingData.parent.name}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="saffron"
              size="lg"
              onClick={handleProceed}
              className="w-full rounded-full text-xs font-black shadow-md cursor-pointer"
            >
              <Video className="w-4 h-4 mr-1.5" />
              <span>
                {language === "gu" ? "મીટિંગમાં સીધા પ્રવેશો →" : "Enter Meeting Room Directly →"}
              </span>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function JoinMeetingPage() {
  return (
    <div className="min-h-screen bg-[#F4F1E1] dark:bg-[#15110E] text-[#49352F] dark:text-[#F4F1E1] flex flex-col justify-between">
      <header className="p-4 sm:px-8 max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link href="/">
          <BrandLogo size={32} />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="default" />
          <ThemeToggle variant="button" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-center p-8 text-xs text-[#7A6862]">Loading join link...</div>}>
          <JoinMeetingContent />
        </Suspense>
      </main>

      <footer className="py-4 text-center text-xs text-[#7A6862] dark:text-[#FAF6E9]/60 border-t border-[#49352F]/10">
        © 2026 StudySaathi AI • Verified Secure Meeting Access
      </footer>
    </div>
  );
}
