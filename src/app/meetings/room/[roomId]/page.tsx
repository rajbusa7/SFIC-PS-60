"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Share2,
  Hand,
  MessageSquare,
  Users,
  ShieldCheck,
  WifiOff,
  Sparkles,
  Play,
  Volume2,
  VolumeX,
  UserX,
  Send,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { MeetingStatusBadge } from "@/components/ptm/MeetingStatusBadge";

interface MeetingData {
  id: string;
  teacherId: string;
  teacherName?: string;
  classId?: string;
  title: string;
  agenda?: string;
  type: "one_to_one" | "group";
  startTime: string;
  durationMin: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  roomId: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: "teacher" | "parent" | "system";
  text: string;
  timestamp: string;
}

interface Participant {
  id: string;
  name: string;
  role: "teacher" | "parent";
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  handRaised?: boolean;
  isLocal?: boolean;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const { t, language } = useLanguage();
  const { user, role } = useAuth();
  const vt = (t as any).video || {};

  // Screen states: 'loading' | 'prejoin' | 'waiting' | 'in_call' | 'ended' | 'error'
  const [screenState, setScreenState] = useState<
    "loading" | "prejoin" | "waiting" | "in_call" | "ended" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Meeting & Token state
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    token: string;
    serverUrl: string;
    isModerator: boolean;
    simulated: boolean;
    participantName: string;
    participantIdentity: string;
  } | null>(null);

  // Media states
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [audioOnly, setAudioOnly] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // UI Panels: 'none' | 'chat' | 'participants' | 'student_report'
  const [activePanel, setActivePanel] = useState<"none" | "chat" | "participants" | "student_report">("none");
  const [studentReport, setStudentReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Participants list (in-call)
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Video stream refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const prejoinVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Detect offline / online
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 1. Initial Load: Fetch Token & Meeting Data
  const initializeRoom = useCallback(async () => {
    if (!roomId) return;
    setScreenState("loading");
    setErrorMessage(null);

    try {
      const res = await apiClient.getMeetingToken(roomId, {
        audioOnly,
        participantName: user?.name,
      });

      if (!res.success) {
        setErrorMessage(res.error || vt.notAllowedDesc);
        setScreenState("error");
        return;
      }

      setTokenInfo({
        token: res.token,
        serverUrl: res.serverUrl,
        isModerator: res.isModerator,
        simulated: res.simulated,
        participantName: res.participantName,
        participantIdentity: res.participantIdentity,
      });

      // Construct meeting details from token payload
      const meetingDetails: MeetingData = {
        id: res.meetingId,
        teacherId: res.isModerator ? user?.id || "" : "",
        title: res.meetingTitle,
        type: "group",
        startTime: new Date().toISOString(),
        durationMin: 30,
        status: res.meetingStatus,
        roomId: res.roomId,
        createdAt: new Date().toISOString(),
      };
      setMeeting(meetingDetails);

      // Routing logic:
      if (meetingDetails.status === "ended" || meetingDetails.status === "cancelled") {
        setScreenState("ended");
        return;
      }

      // If user is a parent and meeting is not live yet -> Waiting room
      if (!res.isModerator && meetingDetails.status === "scheduled") {
        setScreenState("waiting");
      } else {
        // Teacher or live meeting -> Pre-join check
        setScreenState("prejoin");
      }
    } catch (err: any) {
      console.error("Failed to load meeting room:", err);
      setErrorMessage(err.message || vt.notAllowedDesc);
      setScreenState("error");
    }
  }, [roomId, audioOnly, user?.name, user?.id, vt.notAllowedDesc]);

  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  // 2. Waiting Room Polling: Check if Teacher started the meeting
  useEffect(() => {
    if (screenState !== "waiting" || !roomId) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.getMeetingToken(roomId);
        if (res.success && res.meetingStatus === "live") {
          setMeeting((prev) => (prev ? { ...prev, status: "live" } : null));
          setScreenState("prejoin");
        } else if (res.success && (res.meetingStatus === "ended" || res.meetingStatus === "cancelled")) {
          setScreenState("ended");
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [screenState, roomId]);

  // 3. Setup Pre-join camera/mic preview
  useEffect(() => {
    if (screenState !== "prejoin") return;

    let activeStream: MediaStream | null = null;
    async function startPreview() {
      try {
        if (!audioOnly && cameraEnabled) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: micEnabled,
          });
          activeStream = stream;
          localStreamRef.current = stream;
          if (prejoinVideoRef.current) {
            prejoinVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Camera/Mic preview failed:", err);
      }
    }

    startPreview();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((trk) => trk.stop());
      }
    };
  }, [screenState, cameraEnabled, micEnabled, audioOnly]);

  // 4. Enter Call: start media & record attendance join
  const handleEnterCall = async () => {
    setScreenState("in_call");

    // Initialize mock participants
    const isTeacher = tokenInfo?.isModerator;
    const initialParticipants: Participant[] = [
      {
        id: tokenInfo?.participantIdentity || "self",
        name: tokenInfo?.participantName || (isTeacher ? "Pooja Sharma" : "Dineshbhai Patel"),
        role: isTeacher ? "teacher" : "parent",
        isAudioMuted: !micEnabled,
        isVideoMuted: audioOnly || !cameraEnabled,
        isLocal: true,
      },
    ];

    // Add peer participant for realistic Google Meet experience
    if (isTeacher) {
      initialParticipants.push({
        id: "par-peer-01",
        name: "Dineshbhai Patel (Parent)",
        role: "parent",
        isAudioMuted: false,
        isVideoMuted: false,
        isLocal: false,
      });
    } else {
      initialParticipants.push({
        id: "tch-peer-01",
        name: "Pooja Sharma (Class Teacher)",
        role: "teacher",
        isAudioMuted: false,
        isVideoMuted: false,
        isLocal: false,
      });
    }
    setParticipants(initialParticipants);

    // Initial system chat message
    setChatMessages([
      {
        id: "sys-1",
        senderName: "StudySaathi System",
        senderRole: "system",
        text: vt.callNotRecordedBadge,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    // Request actual stream for the call
    try {
      if (!audioOnly && cameraEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: micEnabled,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn("Could not start live stream in call:", err);
    }

    // Record attendance join
    if (meeting?.id) {
      try {
        await apiClient.recordMeetingAttendance(meeting.id, "join", user?.id);
      } catch (err) {
        console.warn("Attendance record failed:", err);
      }
    }
  };

  // 5. Media Toggles
  const toggleMic = () => {
    setMicEnabled((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((trk) => {
          trk.enabled = next;
        });
      }
      setParticipants((list) =>
        list.map((p) => (p.isLocal ? { ...p, isAudioMuted: !next } : p))
      );
      return next;
    });
  };

  const toggleCamera = () => {
    setCameraEnabled((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((trk) => {
          trk.enabled = next;
        });
      }
      setParticipants((list) =>
        list.map((p) => (p.isLocal ? { ...p, isVideoMuted: !next } : p))
      );
      return next;
    });
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((trk) => trk.stop());
      }
      setScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = displayStream;
        setScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
        }
        displayStream.getVideoTracks()[0].onended = () => {
          setScreenSharing(false);
        };
      } catch (err) {
        console.warn("Screen share cancelled or not supported:", err);
      }
    }
  };

  const toggleHandRaise = () => {
    setHandRaised((prev) => {
      const next = !prev;
      setParticipants((list) =>
        list.map((p) => (p.isLocal ? { ...p, handRaised: next } : p))
      );
      return next;
    });
  };

  // 6. Moderation Controls (Teacher Only)
  const handleStartMeetingByTeacher = async () => {
    if (!meeting?.id) return;
    try {
      await apiClient.startMeeting(meeting.id);
      setMeeting((prev) => (prev ? { ...prev, status: "live" } : null));
      handleEnterCall();
    } catch (err: any) {
      alert(err.message || "Failed to start meeting");
    }
  };

  const handleEndMeetingEveryone = async () => {
    if (!meeting?.id) return;
    try {
      await apiClient.endMeeting(meeting.id);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((trk) => trk.stop());
      }
      await apiClient.recordMeetingAttendance(meeting.id, "leave", user?.id);
      setScreenState("ended");
    } catch (err: any) {
      alert(err.message || "Failed to end meeting");
    }
  };

  const handleLeaveCall = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((trk) => trk.stop());
    }
    if (meeting?.id) {
      try {
        await apiClient.recordMeetingAttendance(meeting.id, "leave", user?.id);
      } catch (err) {
        // Ignore
      }
    }
    router.push(role === "parent" ? "/parent/meetings" : "/meetings");
  };

  const handleMuteParticipant = (id: string) => {
    setParticipants((list) =>
      list.map((p) => (p.id === id ? { ...p, isAudioMuted: true } : p))
    );
  };

  // Fetch student progress report for teacher
  const toggleStudentReport = async () => {
    if (activePanel === "student_report") {
      setActivePanel("none");
      return;
    }
    setActivePanel("student_report");
    if (!studentReport) {
      setLoadingReport(true);
      try {
        const studentId = meeting?.classId || "stu-001";
        const res = await apiClient.getStudentReport(studentId);
        if (res.success) {
          setStudentReport(res.report || res);
        }
      } catch (err) {
        console.warn("Could not load student report:", err);
      } finally {
        setLoadingReport(false);
      }
    }
  };

  // 7. Chat Send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatDraft.trim()) return;

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      senderName: tokenInfo?.participantName || user?.name || "Participant",
      senderRole: tokenInfo?.isModerator ? "teacher" : "parent",
      text: chatDraft.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatDraft("");
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // -------------------------------------------------------------
  // RENDERING VIEWS
  // -------------------------------------------------------------

  // View: Loading
  if (screenState === "loading") {
    return (
      <div className="min-h-screen bg-[#F4F1E1] dark:bg-[#1B1614] text-[#49352F] dark:text-[#F4F1E1] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-full border-3 border-[#B26A1B] dark:border-[#F2CAB3] border-t-transparent animate-spin mb-5" />
        <h2 className="font-heading text-xl sm:text-2xl font-black text-[#49352F] dark:text-[#F4F1E1]">
          {language === "gu" ? "મીટિંગ રૂમ સાથે જોડાઈ રહ્યા છીએ..." : "Connecting to Meeting Room..."}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] mt-1.5 text-center">
          {language === "gu" ? "રૂમ સુરક્ષા અને ઓળખ ચકાસાઈ રહી છે" : "Verifying room security & credentials"}
        </p>
      </div>
    );
  }

  // View: Access Denied / Error
  if (screenState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/25 dark:from-[#1B1614] dark:via-[#1E1916] dark:to-[#26201C] text-[#49352F] dark:text-[#F4F1E1] flex flex-col items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full p-8 rounded-[28px] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#FBECE9] dark:bg-[#38201D] border border-[#C54738]/25 text-[#C54738] dark:text-[#FA8C7C] flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-black text-[#49352F] dark:text-[#F4F1E1]">
            {vt.notAllowedTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] leading-relaxed">
            {errorMessage || vt.notAllowedDesc}
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => router.push(role === "parent" ? "/parent/meetings" : "/meetings")}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {language === "gu" ? "મીટિંગ્સ પર પાછા જાઓ" : "Back to Meetings"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // View: Meeting Ended
  if (screenState === "ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/25 dark:from-[#1B1614] dark:via-[#1E1916] dark:to-[#26201C] text-[#49352F] dark:text-[#F4F1E1] flex flex-col items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full p-8 rounded-[28px] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#EAF4EE] dark:bg-[#1A3326] border border-[#2E7D5E]/25 text-[#2E7D5E] dark:text-[#3DDBA9] flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-black text-[#49352F] dark:text-[#F4F1E1]">
            {language === "gu" ? "મીટિંગ પૂર્ણ થઈ ગઈ છે" : "Meeting has Ended"}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] leading-relaxed">
            {language === "gu"
              ? "વાલી-શિક્ષક મીટિંગમાં હાજરી આપવા બદલ આભાર. તમારી હાજરી નોંધવામાં આવી છે."
              : "Thank you for attending the Parent-Teacher Meeting. Attendance has been logged securely."}
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => router.push(role === "parent" ? "/parent/meetings" : "/meetings")}
            >
              {language === "gu" ? "ડેશબોર્ડ પર પાછા જાઓ" : "Return to Dashboard"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // View: Waiting Room (Parents waiting for teacher to start)
  if (screenState === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/25 dark:from-[#1B1614] dark:via-[#1E1916] dark:to-[#26201C] text-[#49352F] dark:text-[#F4F1E1] flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#221C18]/90 backdrop-blur-md border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 px-4 sm:px-8 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size={36} />
              <div className="h-5 w-px bg-[#49352F]/15 dark:bg-[#F2CAB3]/20 hidden sm:block" />
              <span className="font-heading font-bold text-sm text-[#49352F] dark:text-[#F4F1E1] truncate max-w-[220px]">
                {meeting?.title || "Parent-Teacher Meeting"}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector variant="default" />
              <ThemeToggle variant="button" />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <Card variant="glass" className="max-w-lg w-full p-8 sm:p-10 rounded-[28px] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 shadow-xl text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F2CAB3] via-[#B26A1B] to-[#2E7D5E]" />
            <div className="w-16 h-16 rounded-3xl bg-[#F2CAB3]/40 dark:bg-[#2B231D] text-[#8D4E10] dark:text-[#F2CAB3] border border-[#F2CAB3]/40 flex items-center justify-center mx-auto shadow-xs">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-xl sm:text-2xl font-black text-[#49352F] dark:text-[#F4F1E1]">
                {vt.waitingForTeacherTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC]">
                {vt.waitingForTeacherDesc}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6E9] dark:bg-[#221C18] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#7A6862] dark:text-[#C2B3AC] font-medium">{language === "gu" ? "વિષય:" : "Meeting Topic:"}</span>
                <span className="font-bold text-[#49352F] dark:text-[#F4F1E1]">{meeting?.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#7A6862] dark:text-[#C2B3AC] font-medium">{language === "gu" ? "સમય:" : "Scheduled Time:"}</span>
                <span className="font-bold text-[#B26A1B] dark:text-[#F2CAB3]">
                  {meeting?.startTime
                    ? new Date(meeting.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Today"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#B26A1B] dark:text-[#F2CAB3]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{language === "gu" ? "રૂમ સ્થિતિ આપમેળે ચકાસાઈ રહી છે..." : "Checking room status automatically..."}</span>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // View: Pre-Join Check (Camera, Mic, Audio-only settings)
  if (screenState === "prejoin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/25 dark:from-[#1B1614] dark:via-[#1E1916] dark:to-[#26201C] text-[#49352F] dark:text-[#F4F1E1] flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#221C18]/90 backdrop-blur-md border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 px-4 sm:px-8 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size={36} />
              <div className="h-5 w-px bg-[#49352F]/15 dark:bg-[#F2CAB3]/20 hidden sm:block" />
              <span className="font-heading font-bold text-sm text-[#49352F] dark:text-[#F4F1E1] truncate max-w-[240px]">
                {meeting?.title || "Parent-Teacher Meeting"}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector variant="default" />
              <ThemeToggle variant="button" />
            </div>
          </div>
        </header>

        {/* Offline Warning Banner */}
        {isOffline && (
          <div className="max-w-xl mx-auto mt-4 px-4 w-full">
            <div className="bg-[#FBECE9] dark:bg-[#38201D] border border-[#C54738]/30 text-[#A93327] dark:text-[#FA8C7C] p-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>{vt.offlineNotice}</span>
            </div>
          </div>
        )}

        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Preview Box */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div className="w-full aspect-video bg-white dark:bg-[#221C18] border border-[#49352F]/12 dark:border-[#F2CAB3]/18 rounded-[28px] overflow-hidden relative shadow-xl flex items-center justify-center">
                {!audioOnly && cameraEnabled ? (
                  <video
                    ref={prejoinVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#7A6862] dark:text-[#C2B3AC] p-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-[#FAF6E9] dark:bg-[#2E2520] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex items-center justify-center mb-3 text-[#B26A1B] dark:text-[#F2CAB3] shadow-xs">
                      <UserX className="w-10 h-10" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold">{audioOnly ? "Audio-Only Mode Enabled" : "Camera is Turned Off"}</p>
                  </div>
                )}

                {/* Floating Media Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/95 dark:bg-[#26201C]/95 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#49352F]/12 dark:border-[#F2CAB3]/18 shadow-lg">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-3 rounded-full transition-all cursor-pointer ${
                      micEnabled
                        ? "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
                        : "bg-[#FBECE9] text-[#A93327] hover:bg-[#C54738] hover:text-white border border-[#A93327]/30 dark:bg-[#38201D] dark:text-[#FA8C7C]"
                    }`}
                    title={micEnabled ? vt.micOn : vt.micOff}
                  >
                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    disabled={audioOnly}
                    onClick={toggleCamera}
                    className={`p-3 rounded-full transition-all cursor-pointer ${
                      !cameraEnabled || audioOnly
                        ? "bg-[#FBECE9] text-[#A93327] hover:bg-[#C54738] hover:text-white border border-[#A93327]/30 dark:bg-[#38201D] dark:text-[#FA8C7C]"
                        : "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
                    } ${audioOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={cameraEnabled ? vt.camOn : vt.camOff}
                  >
                    {cameraEnabled && !audioOnly ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Privacy Badge */}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#2E7D5E] dark:text-[#3DDBA9] bg-[#EAF4EE] dark:bg-[#1A3326] px-4 py-1.5 rounded-full border border-[#2E7D5E]/20">
                <ShieldCheck className="w-4 h-4" />
                <span>{vt.callNotRecordedBadge}</span>
              </div>
            </div>

            {/* Right Action Box */}
            <div className="md:col-span-5 space-y-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 mb-2.5">
                  {tokenInfo?.isModerator ? vt.moderatorBadge : vt.parentBadge}
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#49352F] dark:text-[#F4F1E1]">
                  {vt.preJoinTitle}
                </h1>
                <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] mt-1">
                  {vt.preJoinSubtitle}
                </p>
              </div>

              {/* Audio Only Mode Card */}
              <div className="bg-white/95 dark:bg-[#221C18]/95 border border-[#49352F]/12 dark:border-[#F2CAB3]/18 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#49352F] dark:text-[#F4F1E1]">{vt.audioOnlyMode}</h4>
                    <p className="text-[11px] text-[#7A6862] dark:text-[#C2B3AC] mt-0.5">{vt.audioOnlyDesc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioOnly}
                    onChange={(e) => {
                      setAudioOnly(e.target.checked);
                      if (e.target.checked) setCameraEnabled(false);
                    }}
                    className="w-5 h-5 text-[#B26A1B] rounded border-[#49352F]/20 focus:ring-[#F2CAB3] cursor-pointer"
                  />
                </div>
              </div>

              {/* LiveKit Cloud Integration Status Notice */}
              {tokenInfo?.simulated && (
                <div className="bg-[#FDF4E7] dark:bg-[#2B231D] border border-[#B26A1B]/25 dark:border-[#F2CAB3]/25 rounded-2xl p-4 text-xs text-[#8D4E10] dark:text-[#F2CAB3] space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#B26A1B] dark:text-[#F2CAB3]" />
                    <span>LiveKit Environment Notice</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Running in <strong>Zero-Setup Interactive Mode</strong> (local camera & microphone device test active).
                    To connect to a live multi-party LiveKit Cloud room, set <code className="bg-black/10 dark:bg-black/40 px-1 py-0.5 rounded font-mono font-bold">LIVEKIT_URL</code>, <code className="bg-black/10 dark:bg-black/40 px-1 py-0.5 rounded font-mono font-bold">LIVEKIT_API_KEY</code>, and <code className="bg-black/10 dark:bg-black/40 px-1 py-0.5 rounded font-mono font-bold">LIVEKIT_API_SECRET</code> in your <code className="bg-black/10 dark:bg-black/40 px-1 py-0.5 rounded font-mono font-bold">.env</code>.
                  </p>
                </div>
              )}

              {/* Join / Start Button */}
              <div className="space-y-3 pt-1">
                {tokenInfo?.isModerator && meeting?.status === "scheduled" ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full py-3.5 text-base shadow-md"
                    onClick={handleStartMeetingByTeacher}
                    leftIcon={<Play className="w-5 h-5 fill-current" />}
                  >
                    {vt.startMeetingModerator}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full py-3.5 text-base shadow-md"
                    onClick={handleEnterCall}
                    leftIcon={<Sparkles className="w-5 h-5" />}
                  >
                    {vt.enterCallBtn}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => router.push(role === "parent" ? "/parent/meetings" : "/meetings")}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  {language === "gu" ? "ડેશબોર્ડ પર પાછા જાઓ" : "Back to Dashboard"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // View: In-Call (StudySaathi AI Video Call Layout)
  return (
    <div className="h-screen w-screen bg-[#F4F1E1] dark:bg-[#1B1614] text-[#49352F] dark:text-[#F4F1E1] flex flex-col overflow-hidden select-none transition-colors duration-200">
      {/* Offline Toast Banner */}
      {isOffline && (
        <div className="bg-[#C54738] text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 shrink-0">
          <WifiOff className="w-4 h-4" />
          <span>{vt.offlineNotice}</span>
        </div>
      )}

      {/* Top Room Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-white/90 dark:bg-[#221C18]/90 backdrop-blur-md border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo size={32} />
          <div className="h-4 w-px bg-[#49352F]/15 dark:bg-[#F2CAB3]/20 hidden sm:block" />
          <div className="min-w-0">
            <h4 className="font-heading text-xs sm:text-sm font-bold text-[#49352F] dark:text-[#F4F1E1] truncate max-w-[200px] sm:max-w-xs">
              {meeting?.title || "PTM Room"}
            </h4>
            <p className="text-[10px] text-[#7A6862] dark:text-[#C2B3AC] truncate font-mono">
              {roomId}
            </p>
          </div>
          <MeetingStatusBadge status="live" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector variant="default" />
          <ThemeToggle variant="button" />
        </div>
      </header>

      {/* Main Video Grid & Side Drawer */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Stage Video Grid */}
        <div className="flex-1 flex flex-col justify-center items-center overflow-hidden relative">
          {/* Screen Share Stage (if active) */}
          {screenSharing ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black rounded-[24px] overflow-hidden relative border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-xl">
              <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-[#26201C]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#49352F]/12 dark:border-[#F2CAB3]/20 text-xs font-semibold flex items-center gap-2 text-[#49352F] dark:text-[#F4F1E1] shadow-xs">
                <Share2 className="w-4 h-4 text-[#2E7D5E] dark:text-[#3DDBA9]" />
                <span>Presenting Screen (Student Report View)</span>
              </div>
            </div>
          ) : (
            /* Participant Grid */
            <div
              className={`w-full h-full grid gap-4 items-center justify-center ${
                participants.length === 1
                  ? "grid-cols-1 max-w-4xl max-h-[80vh]"
                  : "grid-cols-1 md:grid-cols-2 max-w-6xl max-h-[85vh]"
              }`}
            >
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="w-full h-full aspect-video bg-white dark:bg-[#26201C] rounded-[24px] overflow-hidden relative border border-[#49352F]/12 dark:border-[#F2CAB3]/18 shadow-[0_4px_24px_rgba(73,53,47,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-center group"
                >
                  {p.isLocal ? (
                    !p.isVideoMuted ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover -scale-x-100"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-[#F2CAB3] text-[#49352F] font-black text-2xl flex items-center justify-center border border-[#49352F]/20 shadow-xs">
                          {p.name.charAt(0)}
                        </div>
                      </div>
                    )
                  ) : (
                    /* Remote Peer Tile */
                    <div className="w-full h-full bg-[#FAF6E9] dark:bg-[#221C18] flex flex-col items-center justify-center relative">
                      <div className="w-24 h-24 rounded-full bg-[#F2CAB3] text-[#49352F] font-black text-3xl flex items-center justify-center border border-[#49352F]/20 mb-2 shadow-xs">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-[#49352F] dark:text-[#F4F1E1]">{p.name}</span>
                    </div>
                  )}

                  {/* Tile Overlays */}
                  <div className="absolute bottom-3 left-3 bg-[#FAF6E9]/95 dark:bg-[#1E1916]/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-[#49352F] dark:text-[#F4F1E1] shadow-2xs">
                    <span>{p.isLocal ? `${p.name} (${vt.youBadge})` : p.name}</span>
                    {p.role === "teacher" && (
                      <span className="bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Teacher
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {p.handRaised && (
                      <div className="bg-[#B26A1B] text-white p-1.5 rounded-full shadow-md animate-bounce">
                        <Hand className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`p-1.5 rounded-full ${
                        p.isAudioMuted
                          ? "bg-[#FBECE9] text-[#A93327] border border-[#A93327]/30"
                          : "bg-[#FAF6E9]/90 text-[#49352F] dark:bg-[#1E1916]/90 dark:text-[#F4F1E1] border border-[#49352F]/10"
                      }`}
                    >
                      {p.isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Drawer: Chat, Participants or Student Report */}
        <AnimatePresence>
          {activePanel !== "none" && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white/95 dark:bg-[#221C18]/95 backdrop-blur-xl border border-[#49352F]/12 dark:border-[#F2CAB3]/18 rounded-[28px] flex flex-col overflow-hidden h-full shadow-2xl text-[#49352F] dark:text-[#F4F1E1]"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm">
                  {activePanel === "chat"
                    ? vt.chatTitle
                    : activePanel === "participants"
                    ? vt.participantsTitle
                    : vt.studentProgressTab}
                </h3>
                <button
                  type="button"
                  onClick={() => setActivePanel("none")}
                  className="text-[#7A6862] hover:text-[#49352F] dark:hover:text-[#F4F1E1] p-1.5 rounded-xl hover:bg-[#FAF6E9] dark:hover:bg-[#26201C] cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Chat Content */}
              {activePanel === "chat" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`text-xs p-3 rounded-2xl ${
                          msg.senderRole === "system"
                            ? "bg-[#FAF6E9] dark:bg-[#2E2520] text-[#7A6862] dark:text-[#C2B3AC] text-center border border-[#49352F]/10"
                            : msg.senderName.includes(tokenInfo?.participantName || "user")
                            ? "bg-[#F2CAB3]/40 dark:bg-[#3D312A] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/10 ml-4 font-medium"
                            : "bg-[#FAF6E9] dark:bg-[#2E2520] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/10 mr-4 font-medium"
                        }`}
                      >
                        {msg.senderRole !== "system" && (
                          <div className="flex justify-between font-bold mb-1 text-[11px] text-[#7A6862] dark:text-[#C2B3AC]">
                            <span>{msg.senderName}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendChat} className="p-3 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex gap-2">
                    <input
                      type="text"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder={vt.chatPlaceholder}
                      className="flex-1 bg-white dark:bg-[#26201C] border border-[#49352F]/14 dark:border-[#F2CAB3]/20 rounded-2xl px-3.5 py-2.5 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
                    />
                    <Button type="submit" size="sm" variant="primary" className="px-3 rounded-full">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              )}

              {/* Participants Content */}
              {activePanel === "participants" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#F2CAB3] text-[#49352F] font-bold flex items-center justify-center shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#49352F] dark:text-[#F4F1E1] truncate">
                            {p.name} {p.isLocal && `(${vt.youBadge})`}
                          </p>
                          <p className="text-[10px] text-[#7A6862] dark:text-[#C2B3AC] capitalize">
                            {p.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {p.handRaised && <Hand className="w-4 h-4 text-[#B26A1B]" />}
                        {p.isAudioMuted ? (
                          <MicOff className="w-4 h-4 text-[#C54738]" />
                        ) : (
                          <Mic className="w-4 h-4 text-[#2E7D5E]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Student Progress Report Content (Teacher In-Call Reference) */}
              {activePanel === "student_report" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {loadingReport ? (
                    <div className="flex items-center justify-center p-8 text-[#7A6862]">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span>Loading student diagnostics...</span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#EAF4EE] dark:bg-[#1A3326] p-4 rounded-2xl border border-[#2E7D5E]/20 space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-[#2E7D5E] dark:text-[#3DDBA9] text-sm font-heading">
                          <span>Aarav Patel (Class 4-A)</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2E7D5E]/15 border border-[#2E7D5E]/25">
                            Overall: 74%
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6862] dark:text-[#C2B3AC]">
                          Diagnostic snapshot from latest baseline assessment & learning activities.
                        </p>
                      </div>

                      {/* Active Learning Gaps */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-[11px] text-[#B26A1B] dark:text-[#F2CAB3] uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Active Learning Gaps</span>
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-2xl bg-[#FDF4E7] dark:bg-[#2B231D] border border-[#B26A1B]/20 text-[#8D4E10] dark:text-[#F2CAB3]">
                            <p className="font-bold text-xs">Mathematics: 3-Digit Division with Remainder</p>
                            <p className="text-[10px] text-[#8D4E10]/80 dark:text-[#F2CAB3]/80 mt-0.5">Priority: High • Remedial Step 3/5</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-[#49352F] dark:text-[#F4F1E1]">
                            <p className="font-bold text-xs">Gujarati: Complex Vowel Conjuncts</p>
                            <p className="text-[10px] text-[#7A6862] dark:text-[#C2B3AC] mt-0.5">Priority: Medium • Remedial Step 1/5</p>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Talking Points */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-[11px] text-[#B26A1B] dark:text-[#F2CAB3] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Suggested Focus for Discussion</span>
                        </h4>
                        <ul className="space-y-1.5 text-[#49352F] dark:text-[#F4F1E1] text-[11px]">
                          <li className="flex items-start gap-2 p-2 rounded-xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0 mt-0.5" />
                            <span>Encourage 10 min daily practice of single-digit multiplication tables.</span>
                          </li>
                          <li className="flex items-start gap-2 p-2 rounded-xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0 mt-0.5" />
                            <span>Celebrate Aarav&apos;s strong 88% achievement in Geometry & Shapes.</span>
                          </li>
                          <li className="flex items-start gap-2 p-2 rounded-xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0 mt-0.5" />
                            <span>Recommend worksheet on place-value subtraction before next exam.</span>
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* In-Call Bottom Control Bar */}
      <footer className="h-20 bg-white/90 dark:bg-[#221C18]/90 backdrop-blur-xl border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Meeting Info */}
        <div className="hidden sm:flex items-center gap-3 min-w-0">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#49352F] dark:text-[#F4F1E1] truncate max-w-[200px]">
              {meeting?.title}
            </h4>
            <p className="text-[10px] text-[#7A6862] dark:text-[#C2B3AC] font-mono">{roomId}</p>
          </div>
        </div>

        {/* Center: Main AV Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto">
          {/* Mic */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3.5 rounded-full transition-all cursor-pointer shadow-xs ${
              micEnabled
                ? "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
                : "bg-[#FBECE9] text-[#A93327] hover:bg-[#C54738] hover:text-white border border-[#A93327]/30 dark:bg-[#38201D] dark:text-[#FA8C7C]"
            }`}
            title={micEnabled ? vt.micOn : vt.micOff}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleCamera}
            disabled={audioOnly}
            className={`p-3.5 rounded-full transition-all cursor-pointer shadow-xs ${
              cameraEnabled && !audioOnly
                ? "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
                : "bg-[#FBECE9] text-[#A93327] hover:bg-[#C54738] hover:text-white border border-[#A93327]/30 dark:bg-[#38201D] dark:text-[#FA8C7C]"
            } ${audioOnly ? "opacity-40 cursor-not-allowed" : ""}`}
            title={cameraEnabled ? vt.camOn : vt.camOff}
          >
            {cameraEnabled && !audioOnly ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share (Teachers can show student reports) */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition-all cursor-pointer shadow-xs ${
              screenSharing
                ? "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/25 ring-2 ring-[#B26A1B]"
                : "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
            }`}
            title={screenSharing ? vt.stopScreenShare : vt.screenShare}
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={toggleHandRaise}
            className={`p-3.5 rounded-full transition-all cursor-pointer shadow-xs ${
              handRaised
                ? "bg-[#FDF4E7] text-[#8D4E10] border border-[#8D4E10]/30 ring-2 ring-[#B26A1B]"
                : "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
            }`}
            title={handRaised ? vt.handLowered : vt.raiseHand}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* End / Leave Call in site's destructive style */}
          {tokenInfo?.isModerator ? (
            <button
              type="button"
              onClick={() => setConfirmEndOpen(true)}
              className="bg-[#FBECE9] hover:bg-[#C54738] text-[#A93327] hover:text-white border border-[#A93327]/30 dark:bg-[#38201D] dark:hover:bg-[#C54738] dark:text-[#FA8C7C] dark:hover:text-white px-4 py-2.5 rounded-full flex items-center gap-2 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer ml-1 sm:ml-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{vt.endMeetingEveryone}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmLeaveOpen(true)}
              className="bg-[#FBECE9] hover:bg-[#C54738] text-[#A93327] hover:text-white border border-[#A93327]/30 dark:bg-[#38201D] dark:hover:bg-[#C54738] dark:text-[#FA8C7C] dark:hover:text-white px-4 py-2.5 rounded-full flex items-center gap-2 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer ml-1 sm:ml-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{vt.leaveMeeting}</span>
            </button>
          )}
        </div>

        {/* Right: Drawer Toggles */}
        <div className="flex items-center gap-2">
          {/* Teacher Student Progress Snapshot Button */}
          {tokenInfo?.isModerator && (
            <button
              type="button"
              onClick={toggleStudentReport}
              className={`p-3 rounded-full transition-all cursor-pointer shadow-xs ${
                activePanel === "student_report"
                  ? "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/20"
                  : "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
              }`}
              title={vt.studentProgressTab}
            >
              <Sparkles className="w-5 h-5 text-[#B26A1B] dark:text-[#F2CAB3]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "chat" ? "none" : "chat")}
            className={`p-3 rounded-full transition-all cursor-pointer shadow-xs ${
              activePanel === "chat"
                ? "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/20"
                : "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
            }`}
            title={vt.chatTitle}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "participants" ? "none" : "participants")}
            className={`p-3 rounded-full transition-all cursor-pointer shadow-xs ${
              activePanel === "participants"
                ? "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/20"
                : "bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/10 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:hover:bg-[#3D312A] dark:border-[#F2CAB3]/15"
            }`}
            title={vt.participantsTitle}
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Confirmation Modal: End Meeting for Everyone (Teacher) */}
      <Modal
        isOpen={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        title={vt.confirmEndTitle}
      >
        <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] mb-6 leading-relaxed">
          {vt.confirmEndDesc}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setConfirmEndOpen(false)}>
            {vt.cancel}
          </Button>
          <Button variant="coral" size="sm" onClick={handleEndMeetingEveryone}>
            {vt.confirmEndBtn}
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal: Leave Meeting (Parent) */}
      <Modal
        isOpen={confirmLeaveOpen}
        onClose={() => setConfirmLeaveOpen(false)}
        title={vt.confirmLeaveTitle}
      >
        <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] mb-6 leading-relaxed">
          {vt.confirmLeaveDesc}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setConfirmLeaveOpen(false)}>
            {vt.cancel}
          </Button>
          <Button variant="coral" size="sm" onClick={handleLeaveCall}>
            {vt.confirmLeaveBtn}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
