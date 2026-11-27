"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  MessageSquare,
  Users,
  FileText,
  PhoneOff,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
  ShieldAlert,
} from "lucide-react";
import { usePtmWebRtc, type RemoteParticipant } from "@/lib/ptm/usePtmWebRtc";
import type { PtmChatMessage, PtmMeetingNote, PtmWaitingParticipant } from "@/lib/types";

// Helper video component to bind MediaStream reliably to <video> element
function VideoStreamTile({
  stream,
  isMuted = false,
  isMirror = false,
  className = "",
}: {
  stream: MediaStream | null;
  isMuted?: boolean;
  isMirror?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className={`w-full h-full object-cover ${isMirror ? "mirror" : ""} ${className}`}
    />
  );
}

export default function PtmVideoRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: meetingCode } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token") || "";

  const [meeting, setMeeting] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>(queryToken);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // UI Panels
  const [activeDrawer, setActiveDrawer] = useState<"chat" | "participants" | "notes" | null>(null);
  const [chatMessages, setChatMessages] = useState<PtmChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Waiting Room state for teacher
  const [waitingList, setWaitingList] = useState<PtmWaitingParticipant[]>([]);

  // Meeting Notes state for teacher
  const [discussionSummary, setDiscussionSummary] = useState<string>("");
  const [learningConcerns, setLearningConcerns] = useState<string>("");
  const [studentStrengths, setStudentStrengths] = useState<string>("");
  const [agreedActions, setAgreedActions] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [sharedWithParent, setSharedWithParent] = useState<boolean>(true);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState<string | null>(null);

  // Meeting duration timer
  const [meetingSeconds, setMeetingSeconds] = useState<number>(0);

  // 1. Authenticate and obtain token
  useEffect(() => {
    async function loadAuth() {
      try {
        setIsInitializing(true);
        const headers: Record<string, string> = {};
        if (queryToken) headers["x-ptm-token"] = queryToken;

        const res = await fetch(`/api/ptm/meetings/${meetingCode}/token`, {
          method: "POST",
          headers,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to authenticate into meeting room.");
        }

        setMeeting(json.meeting);
        setCurrentUser(json.participant);
        setAuthToken(json.token);
      } catch (err: any) {
        setInitError(err.message || "Unable to join meeting.");
      } finally {
        setIsInitializing(false);
      }
    }

    loadAuth();
  }, [meetingCode, queryToken]);

  // 2. Initialize WebRTC Hook
  const {
    localStream,
    remoteParticipants,
    isMicMuted,
    isVideoOff,
    isScreenSharing,
    connectionStatus,
    audioLevel,
    connectRoom,
    toggleMic,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveMeeting,
  } = usePtmWebRtc({
    meetingId: meeting?.id || meetingCode,
    userId: currentUser?.id || "anon",
    userName: currentUser?.name || "Participant",
    role: currentUser?.role || "parent",
    token: authToken,
  });

  // Connect to room once auth token is ready
  useEffect(() => {
    if (authToken && meeting?.id && currentUser?.id) {
      connectRoom();
    }
  }, [authToken, meeting?.id, currentUser?.id, connectRoom]);

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 3. Poll Chat Messages (every 2.5s)
  useEffect(() => {
    if (!meeting?.id) return;
    const fetchChat = async () => {
      try {
        const headers: Record<string, string> = {};
        if (authToken) headers["x-ptm-token"] = authToken;
        const res = await fetch(`/api/ptm/meetings/${meeting.id}/chat`, { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.messages)) {
          setChatMessages(json.messages);
          if (activeDrawer !== "chat" && json.messages.length > chatMessages.length) {
            setUnreadChatCount((prev) => prev + (json.messages.length - chatMessages.length));
          }
        }
      } catch {}
    };

    fetchChat();
    const interval = setInterval(fetchChat, 2500);
    return () => clearInterval(interval);
  }, [meeting?.id, authToken, activeDrawer, chatMessages.length]);

  // 4. Poll Waiting Room (for Teachers/Admins every 3s)
  useEffect(() => {
    if (!meeting?.id) return;
    if (currentUser?.role !== "teacher" && currentUser?.role !== "admin") return;

    const fetchWaiting = async () => {
      try {
        const headers: Record<string, string> = {};
        if (authToken) headers["x-ptm-token"] = authToken;
        const res = await fetch(`/api/ptm/meetings/${meeting.id}/waiting-room`, { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.waiting)) {
          setWaitingList(json.waiting);
        }
      } catch {}
    };

    fetchWaiting();
    const interval = setInterval(fetchWaiting, 3000);
    return () => clearInterval(interval);
  }, [meeting?.id, authToken, currentUser?.role]);

  // 5. Load Initial Notes (if teacher)
  useEffect(() => {
    if (!meeting?.id) return;
    const headers: Record<string, string> = {};
    if (authToken) headers["x-ptm-token"] = authToken;

    fetch(`/api/ptm/meetings/${meeting.id}/notes`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notes) && data.notes.length > 0) {
          const n = data.notes[0];
          setDiscussionSummary(n.discussionSummary || "");
          setLearningConcerns(n.learningConcerns || "");
          setStudentStrengths(n.studentStrengths || "");
          setAgreedActions(n.agreedActions || "");
          setFollowUpDate(n.followUpDate || "");
          setSharedWithParent(Boolean(n.sharedWithParent));
        }
      })
      .catch(() => {});
  }, [meeting?.id, authToken]);

  // Handle admit / reject waiting parent
  const handleWaitingDecision = async (participantId: string, action: "admit" | "reject") => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["x-ptm-token"] = authToken;

      await fetch(`/api/ptm/meetings/${meeting.id}/waiting-room`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, participantId }),
      });

      setWaitingList((prev) => prev.filter((p) => p.participantId !== participantId));
    } catch (e) {
      console.error("Waiting decision failed", e);
    }
  };

  // Handle Chat Send
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !meeting?.id) return;

    const text = chatInput.trim();
    setChatInput("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["x-ptm-token"] = authToken;

      const res = await fetch(`/api/ptm/meetings/${meeting.id}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text }),
      });

      const json = await res.json();
      if (json.success && json.message) {
        setChatMessages((prev) => [...prev, json.message]);
      }
    } catch (e) {
      console.error("Chat send failed", e);
    }
  };

  // Handle Save Notes
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting?.id) return;
    setIsSavingNotes(true);
    setNotesSaveStatus(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["x-ptm-token"] = authToken;

      const res = await fetch(`/api/ptm/meetings/${meeting.id}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          discussionSummary,
          learningConcerns,
          studentStrengths,
          agreedActions,
          followUpDate: followUpDate || undefined,
          sharedWithParent,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNotesSaveStatus("Notes saved successfully.");
        setTimeout(() => setNotesSaveStatus(null), 3000);
      }
    } catch (e) {
      setNotesSaveStatus("Failed to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Handle Hangup / Leave
  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave this meeting?")) {
      await leaveMeeting();
      if (currentUser?.role === "parent") {
        router.push("/parent/dashboard");
      } else {
        router.push("/ptm");
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#261B16] text-[#FAF6E9] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-[#B26A1B] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Connecting to Video Consultation...</h2>
        <p className="text-xs text-[#FAF6E9]/60 mt-1">Establishing WebRTC audio and video mesh</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-[#261B16] text-[#FAF6E9] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#34241E] border border-[#FAF6E9]/15 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Meeting Access Denied</h2>
          <p className="text-xs text-[#FAF6E9]/70 leading-relaxed">{initError}</p>
          <div className="pt-2">
            <Link
              href="/ptm"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAF6E9] text-[#261B16] text-xs font-bold hover:bg-white"
            >
              Back to Safety
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1E1511] text-[#FAF6E9] flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Top Bar */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-[#261B16]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#B26A1B]/20 text-[#B26A1B] flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-[#FAF6E9] tracking-tight truncate max-w-[200px] sm:max-w-md">
                {meeting?.title || "Parent-Teacher Meeting"}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#FAF6E9]/80">
                {meeting?.meetingCode}
              </span>
            </div>
            <p className="text-[10px] text-[#FAF6E9]/60">
              Student: {meeting?.studentName} • Teacher: {meeting?.teacherName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 text-[11px] font-mono text-[#FAF6E9]/90 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-[#B26A1B]" />
            <span>{formatTimer(meetingSeconds)}</span>
          </div>

          <span
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              connectionStatus === "connected"
                ? "bg-[#2E7D5E]/20 text-[#2E7D5E] border-[#2E7D5E]/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === "connected" ? "bg-[#2E7D5E] animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="capitalize">{connectionStatus}</span>
          </span>
        </div>
      </div>

      {/* 2. Teacher Waiting Room Alert Banner */}
      {waitingList.length > 0 && (
        <div className="bg-[#B26A1B] text-[#FAF6E9] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md z-30 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>
              <strong>{waitingList[0].participantName}</strong> is waiting to join this consultation room.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleWaitingDecision(waitingList[0].participantId, "admit")}
              className="px-3 py-1 bg-white text-[#261B16] font-bold rounded-lg hover:bg-[#FAF6E9] shadow-xs text-xs"
            >
              Admit
            </button>
            <button
              onClick={() => handleWaitingDecision(waitingList[0].participantId, "reject")}
              className="px-3 py-1 bg-black/30 hover:bg-black/50 text-white font-semibold rounded-lg text-xs"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Stage: Video Grid & Side Drawer */}
      <div className="flex-1 flex overflow-hidden relative p-3 sm:p-4 gap-4">
        {/* Video Area Grid */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex flex-col justify-center items-center">
          {remoteParticipants.length === 0 ? (
            // No remote peer connected yet
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#FAF6E9]/50">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#FAF6E9]">Waiting for participant to join...</h3>
              <p className="text-xs text-[#FAF6E9]/60 max-w-sm mx-auto">
                {currentUser?.role === "teacher"
                  ? "Your camera and microphone are live. The parent will appear here once they enter the room."
                  : "Your camera and microphone are live. Please wait for the teacher to enter."}
              </p>
            </div>
          ) : (
            // Grid of remote participants
            <div
              className={`w-full h-full grid gap-3 p-2 ${
                remoteParticipants.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {remoteParticipants.map((p) => (
                <div
                  key={p.id}
                  className="relative w-full h-full rounded-2xl overflow-hidden bg-[#261B16] border border-white/10 flex items-center justify-center group"
                >
                  <VideoStreamTile stream={p.stream} />

                  {/* Remote Video Off Banner */}
                  {p.isVideoOff && (
                    <div className="absolute inset-0 bg-[#261B16] flex flex-col items-center justify-center text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-[#B26A1B]/20 border border-[#B26A1B]/40 flex items-center justify-center text-xl font-bold mb-2">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-[#FAF6E9]">{p.name}</span>
                      <span className="text-xs text-[#FAF6E9]/50">Camera turned off</span>
                    </div>
                  )}

                  {/* Participant Name Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs text-xs font-semibold">
                    <span>{p.name}</span>
                    {p.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Local User Tile (Floating PiP in corner) */}
          <div
            className={`absolute bottom-4 right-4 w-36 sm:w-56 aspect-video rounded-xl overflow-hidden bg-[#261B16] border-2 shadow-2xl z-10 transition-all ${
              audioLevel > 15 ? "border-[#2E7D5E] ring-2 ring-[#2E7D5E]/50" : "border-white/20"
            }`}
          >
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#261B16] text-center p-2">
                <div className="w-8 h-8 rounded-full bg-[#B26A1B]/30 flex items-center justify-center text-xs font-bold">
                  {(currentUser?.name || "Me").charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] text-[#FAF6E9]/70 mt-1">Camera off</span>
              </div>
            ) : (
              <VideoStreamTile stream={localStream} isMuted={true} isMirror={!isScreenSharing} />
            )}

            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-semibold">
              <span>You ({currentUser?.role})</span>
              {isMicMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
            </div>
          </div>
        </div>

        {/* 4. Side Drawer (Chat / Participants / Notes) */}
        {activeDrawer && (
          <div className="w-80 sm:w-96 rounded-2xl bg-[#261B16] border border-white/10 flex flex-col justify-between shadow-2xl z-20 animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold capitalize flex items-center gap-2">
                {activeDrawer === "chat" && <MessageSquare className="w-4 h-4 text-[#B26A1B]" />}
                {activeDrawer === "participants" && <Users className="w-4 h-4 text-[#B26A1B]" />}
                {activeDrawer === "notes" && <FileText className="w-4 h-4 text-[#B26A1B]" />}
                <span>
                  {activeDrawer === "chat" && "In-Meeting Chat"}
                  {activeDrawer === "participants" && `Participants (${remoteParticipants.length + 1})`}
                  {activeDrawer === "notes" && "Consultation Notes"}
                </span>
              </h3>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* CHAT DRAWER */}
              {activeDrawer === "chat" && (
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-[#FAF6E9]/50 text-center py-8">
                      No messages yet. Send a message to chat with meeting participants.
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 ${
                          msg.senderId === currentUser?.id
                            ? "bg-[#B26A1B]/20 border border-[#B26A1B]/30 ml-4"
                            : "bg-white/5 border border-white/10 mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#FAF6E9]/60">
                          <span className="font-bold text-[#FAF6E9]">{msg.senderName}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-[#FAF6E9] whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PARTICIPANTS DRAWER */}
              {activeDrawer === "participants" && (
                <div className="space-y-2">
                  {/* Current User */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#B26A1B]/30 flex items-center justify-center text-xs font-bold">
                        {(currentUser?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{currentUser?.name} (You)</span>
                        <span className="text-[10px] text-[#FAF6E9]/60 capitalize">{currentUser?.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/70">
                      {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-[#2E7D5E]" />}
                      {isVideoOff ? <VideoOff className="w-3.5 h-3.5 text-red-400" /> : <Video className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Remote Peers */}
                  {remoteParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold block">{p.name}</span>
                          <span className="text-[10px] text-[#FAF6E9]/60 capitalize">{p.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/70">
                        {p.isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
                        {p.isVideoOff ? <VideoOff className="w-3.5 h-3.5 text-red-400" /> : <Video className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* NOTES DRAWER */}
              {activeDrawer === "notes" && (
                <form onSubmit={handleSaveNotes} className="space-y-3 text-xs">
                  {notesSaveStatus && (
                    <div className="p-2 rounded-lg bg-[#2E7D5E]/20 text-[#2E7D5E] border border-[#2E7D5E]/30 text-[11px]">
                      {notesSaveStatus}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#FAF6E9]/70 mb-1">
                      Discussion Summary
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={discussionSummary}
                      onChange={(e) => setDiscussionSummary(e.target.value)}
                      placeholder="Outline topics covered and feedback..."
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/20 text-[#FAF6E9] focus:outline-hidden focus:border-[#B26A1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#FAF6E9]/70 mb-1">
                      Learning Concerns
                    </label>
                    <textarea
                      rows={2}
                      value={learningConcerns}
                      onChange={(e) => setLearningConcerns(e.target.value)}
                      placeholder="Observed hurdles or gaps..."
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/20 text-[#FAF6E9] focus:outline-hidden focus:border-[#B26A1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#FAF6E9]/70 mb-1">
                      Observed Strengths
                    </label>
                    <textarea
                      rows={2}
                      value={studentStrengths}
                      onChange={(e) => setStudentStrengths(e.target.value)}
                      placeholder="Strong competencies..."
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/20 text-[#FAF6E9] focus:outline-hidden focus:border-[#B26A1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#FAF6E9]/70 mb-1">
                      Agreed Action Items
                    </label>
                    <textarea
                      rows={2}
                      value={agreedActions}
                      onChange={(e) => setAgreedActions(e.target.value)}
                      placeholder="Targeted home activities..."
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/20 text-[#FAF6E9] focus:outline-hidden focus:border-[#B26A1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#FAF6E9]/70 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/20 text-[#FAF6E9] focus:outline-hidden focus:border-[#B26A1B]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="drawerShare"
                      checked={sharedWithParent}
                      onChange={(e) => setSharedWithParent(e.target.checked)}
                      className="rounded text-[#B26A1B]"
                    />
                    <label htmlFor="drawerShare" className="text-[11px] text-[#FAF6E9]/80">
                      Share notes on Parent Bridge
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingNotes}
                    className="w-full py-2 bg-[#FAF6E9] text-[#261B16] font-bold rounded-lg hover:bg-white text-xs transition-colors mt-2"
                  >
                    {isSavingNotes ? "Saving..." : "Save Consultation Notes"}
                  </button>
                </form>
              )}
            </div>

            {/* Chat Input Bar */}
            {activeDrawer === "chat" && (
              <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 p-2 rounded-xl bg-black/40 border border-white/20 text-xs text-[#FAF6E9] focus:outline-hidden focus:border-[#B26A1B]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-xl bg-[#FAF6E9] text-[#261B16] hover:bg-white transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 5. Bottom Controls Toolbar */}
      <div className="h-20 px-4 sm:px-8 flex items-center justify-between border-t border-white/10 bg-[#261B16]/95 backdrop-blur-md z-20">
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#FAF6E9]/70">
          <span className="font-semibold">{meeting?.studentName}</span>
          <span>&bull;</span>
          <span>{meeting?.title}</span>
        </div>

        {/* Center Control Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
          {/* Microphone */}
          <button
            onClick={toggleMic}
            className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
              isMicMuted
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-white/10 hover:bg-white/20 text-[#FAF6E9]"
            }`}
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
              isVideoOff
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-white/10 hover:bg-white/20 text-[#FAF6E9]"
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
              isScreenSharing
                ? "bg-[#2E7D5E] hover:bg-[#2E7D5E]/80 text-white"
                : "bg-white/10 hover:bg-white/20 text-[#FAF6E9]"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            {isScreenSharing ? <ScreenShareOff className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => {
              setActiveDrawer(activeDrawer === "chat" ? null : "chat");
              setUnreadChatCount(0);
            }}
            className={`relative p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
              activeDrawer === "chat"
                ? "bg-[#FAF6E9] text-[#261B16]"
                : "bg-white/10 hover:bg-white/20 text-[#FAF6E9]"
            }`}
            title="In-meeting Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#B26A1B] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "participants" ? null : "participants")}
            className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
              activeDrawer === "participants"
                ? "bg-[#FAF6E9] text-[#261B16]"
                : "bg-white/10 hover:bg-white/20 text-[#FAF6E9]"
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Notes Toggle (Visible to Teacher / Admin) */}
          {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
            <button
              onClick={() => setActiveDrawer(activeDrawer === "notes" ? null : "notes")}
              className={`p-3 sm:p-3.5 rounded-full transition-all shadow-md ${
                activeDrawer === "notes"
                  ? "bg-[#FAF6E9] text-[#261B16]"
                  : "bg-white/10 hover:bg-white/20 text-[#FAF6E9]"
              }`}
              title="Consultation Notes"
            >
              <FileText className="w-5 h-5" />
            </button>
          )}

          {/* Leave Meeting Button */}
          <button
            onClick={handleLeave}
            className="p-3 sm:p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-105 ml-2"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right Info */}
        <div className="hidden sm:block text-right text-[11px] text-[#FAF6E9]/50">
          Encrypted WebRTC Session
        </div>
      </div>
    </div>
  );
}
