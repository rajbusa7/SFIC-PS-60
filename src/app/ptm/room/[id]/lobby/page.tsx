"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

export default function PtmLobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: meetingCode } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token") || "";

  const [meeting, setMeeting] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Local device preview state
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Waiting room state (for parents)
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [waitingStatus, setWaitingStatus] = useState<string>("idle");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const waitingPollRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch meeting & participant info
  useEffect(() => {
    setIsLoading(true);
    const headers: Record<string, string> = {};
    if (queryToken) headers["x-ptm-token"] = queryToken;

    fetch(`/api/ptm/meetings/${meetingCode}/lobby${queryToken ? `?token=${encodeURIComponent(queryToken)}` : ""}`, {
      headers,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error || "Unable to join meeting lobby.");
        }
        setMeeting(data.meeting);
        setParticipant(data.participant);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [meetingCode, queryToken]);

  // 2. Start Camera & Mic Preview
  useEffect(() => {
    let active = true;

    async function initPreview() {
      try {
        setPermissionError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera and microphone access is not supported by your browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup simple audio level monitor
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const analyser = ctx.createAnalyser();
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);
            const data = new Uint8Array(analyser.frequencyBinCount);
            const interval = setInterval(() => {
              if (!active) {
                clearInterval(interval);
                ctx.close().catch(() => {});
                return;
              }
              analyser.getByteFrequencyData(data);
              let sum = 0;
              for (let i = 0; i < data.length; i++) sum += data[i]!;
              setAudioLevel(Math.min(100, Math.round((sum / data.length / 128) * 100)));
            }, 200);
          }
        } catch {}
      } catch (err: any) {
        if (!active) return;
        let msg = "Camera or microphone permission was denied. Please allow access in your browser.";
        if (err.name === "NotFoundError") msg = "No camera or microphone found on your device.";
        if (err.name === "NotReadableError") msg = "Camera or microphone is already in use by another app.";
        setPermissionError(msg);
      }
    }

    initPreview();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    } else {
      setIsVideoOn((prev) => !prev);
    }
  };

  // Join meeting handler
  const handleJoinClick = async () => {
    const isTeacherOrAdmin = participant?.role === "teacher" || participant?.role === "admin";

    if (isTeacherOrAdmin) {
      // Teachers enter room directly
      // Release lobby stream before room takes over
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      router.push(`/ptm/room/${meetingCode}${queryToken ? `?token=${encodeURIComponent(queryToken)}` : ""}`);
      return;
    }

    // Parents enter waiting room
    setIsWaiting(true);
    setWaitingStatus("waiting");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (queryToken) headers["x-ptm-token"] = queryToken;

      await fetch(`/api/ptm/meetings/${meetingCode}/waiting-room`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "request_join" }),
      });

      // Poll waiting room admission status
      if (waitingPollRef.current) clearInterval(waitingPollRef.current);
      waitingPollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/ptm/meetings/${meetingCode}/waiting-room`, {
            method: "POST",
            headers,
            body: JSON.stringify({ action: "check_status" }),
          });
          const json = await res.json();
          if (json.success && json.status === "admitted") {
            clearInterval(waitingPollRef.current!);
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            router.push(`/ptm/room/${meetingCode}${queryToken ? `?token=${encodeURIComponent(queryToken)}` : ""}`);
          }
        } catch {}
      }, 2000);
    } catch (e) {
      console.error("Waiting room request failed", e);
    }
  };

  useEffect(() => {
    return () => {
      if (waitingPollRef.current) clearInterval(waitingPollRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6E9] flex flex-col items-center justify-center p-6 text-[#49352F]">
        <div className="w-10 h-10 border-3 border-[#B26A1B] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Connecting to Meeting Lobby...</h2>
        <p className="text-xs text-[#7A6862] mt-1">Checking secure session credentials</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-[#FAF6E9] flex flex-col items-center justify-center p-6 text-[#49352F]">
        <div className="max-w-md w-full bg-white border border-[#49352F]/15 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#49352F]">Unable to Join Meeting</h2>
          <p className="text-xs text-[#7A6862] leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link
              href="/ptm"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#261B16] text-[#FAF6E9] text-xs font-bold hover:bg-[#49352F]"
            >
              <ChevronLeft className="w-4 h-4" />
              Return to PTM Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6E9] text-[#49352F] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Navbar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#49352F]/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#B26A1B]/15 text-[#B26A1B] flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B26A1B] block">StudySaathi AI Meet</span>
            <h1 className="text-base font-extrabold text-[#49352F] leading-tight">{meeting.title}</h1>
          </div>
        </div>

        <Link
          href="/ptm"
          className="text-xs font-semibold text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Exit Lobby
        </Link>
      </div>

      {/* Main Center Area */}
      <div className="max-w-5xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Camera Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#261B16] border border-[#49352F]/20 shadow-xl flex items-center justify-center">
            {/* Video Preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover mirror ${!isVideoOn ? "hidden" : ""}`}
            />

            {/* Video Off Fallback */}
            {!isVideoOn && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-20 h-20 rounded-full bg-[#B26A1B]/20 border border-[#B26A1B]/40 flex items-center justify-center text-[#FAF6E9] text-2xl font-black">
                  {(participant?.name || "User").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#FAF6E9]">{participant?.name || "Participant"}</h4>
                  <p className="text-xs text-[#FAF6E9]/60">Camera is turned off</p>
                </div>
              </div>
            )}

            {/* Mic Level Indicator in Corner */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs text-white text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${isMicOn ? "bg-[#2E7D5E]" : "bg-red-500"}`} />
              <span>{isMicOn ? "Mic On" : "Muted"}</span>
              {isMicOn && (
                <div className="w-12 h-1.5 rounded-full bg-white/20 overflow-hidden ml-1">
                  <div
                    className="h-full bg-[#2E7D5E] transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              )}
            </div>

            {/* Floating Controls at Bottom of Video */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-3.5 rounded-full shadow-lg transition-all ${
                  isMicOn
                    ? "bg-white/90 hover:bg-white text-[#49352F]"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3.5 rounded-full shadow-lg transition-all ${
                  isVideoOn
                    ? "bg-white/90 hover:bg-white text-[#49352F]"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
                title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Device Error Alert */}
          {permissionError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>{permissionError}</span>
            </div>
          )}
        </div>

        {/* Right Column: Meeting Info & Join Action (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#49352F]/12 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold text-[#B26A1B] uppercase tracking-wider">
              {meeting.meetingCode}
            </span>
            <h2 className="text-xl font-extrabold text-[#49352F] leading-snug">
              Ready to Join?
            </h2>
            <p className="text-xs text-[#7A6862]">
              Configure your audio and video before entering the consultation room.
            </p>
          </div>

          {/* Participant Persona Badge */}
          <div className="p-3.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#261B16] text-[#FAF6E9] flex items-center justify-center font-bold text-sm">
              {participant?.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#49352F]">{participant?.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B26A1B]/15 text-[#B26A1B]">
                  {participant?.role}
                </span>
              </div>
              <span className="text-[11px] text-[#7A6862] block mt-0.5">
                Joining as authorized {participant?.role}
              </span>
            </div>
          </div>

          {/* Meeting Details Table */}
          <div className="space-y-2 text-xs border-t border-b border-[#49352F]/10 py-3 text-[#7A6862]">
            <div className="flex justify-between">
              <span>Student:</span>
              <strong className="text-[#49352F]">{meeting.studentName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Teacher:</span>
              <strong className="text-[#49352F]">{meeting.teacherName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Parent / Guardian:</span>
              <strong className="text-[#49352F]">{meeting.parentName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Scheduled Date:</span>
              <strong className="text-[#49352F]">{meeting.scheduledDate}</strong>
            </div>
            <div className="flex justify-between">
              <span>Time & Duration:</span>
              <strong className="text-[#49352F]">{meeting.startTime} IST ({meeting.durationMinutes}m)</strong>
            </div>
          </div>

          {/* Join / Waiting Room Action */}
          {isWaiting ? (
            <div className="p-4 rounded-xl bg-[#FAF6E9] border border-[#B26A1B]/30 text-center space-y-3 animate-in fade-in">
              <div className="w-8 h-8 border-3 border-[#B26A1B] border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-[#49352F]">Waiting Room</h4>
                <p className="text-xs text-[#7A6862] mt-1">
                  You are in the queue. The teacher ({meeting.teacherName}) has been notified and will admit you shortly.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleJoinClick}
                className="w-full py-3.5 px-6 rounded-xl bg-[#261B16] text-[#FAF6E9] text-sm font-bold hover:bg-[#49352F] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Join Meeting Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-[#7A6862]">
                Your microphone is {isMicOn ? "on" : "muted"} and camera is {isVideoOn ? "on" : "off"}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-5xl w-full mx-auto text-center text-[11px] text-[#7A6862] pt-4 border-t border-[#49352F]/10">
        StudySaathi AI WebRTC Video Infrastructure • End-to-End Real-Time Pedagogical Consultation
      </div>
    </div>
  );
}
