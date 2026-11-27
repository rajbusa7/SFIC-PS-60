"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PtmSignalPayload } from "@/lib/types";

export interface RemoteParticipant {
  id: string;
  name: string;
  role: string;
  stream: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
}

export interface UsePtmWebRtcOptions {
  meetingId: string;
  userId: string;
  userName: string;
  role: string;
  token?: string;
  initialAudio?: boolean;
  initialVideo?: boolean;
  onParticipantJoin?: (participant: { id: string; name: string; role: string }) => void;
  onParticipantLeave?: (participantId: string) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

export function usePtmWebRtc(options: UsePtmWebRtcOptions) {
  const {
    meetingId,
    userId,
    userName,
    role,
    token,
    initialAudio = true,
    initialVideo = true,
    onParticipantJoin,
    onParticipantLeave,
  } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [isMicMuted, setIsMicMuted] = useState<boolean>(!initialAudio);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(!initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "initializing" | "connecting" | "connected" | "reconnecting" | "disconnected" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Internal WebRTC refs
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const webcamVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const lastSignalTimestampRef = useRef<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isJoinedRef = useRef<boolean>(false);

  // Send signaling payload to backend
  const sendSignal = useCallback(
    async (type: PtmSignalPayload["type"], data?: any, targetId?: string) => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["x-ptm-token"] = token;

        await fetch(`/api/ptm/meetings/${meetingId}/signal`, {
          method: "POST",
          headers,
          body: JSON.stringify({ type, data, targetId }),
        });
      } catch (err) {
        console.warn("[PTM WebRTC] Signal send error:", err);
      }
    },
    [meetingId, token]
  );

  // Start active speaker / mic volume analyzer
  const setupAudioAnalyzer = useCallback((stream: MediaStream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      if (audioLevelIntervalRef.current) clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || audioTrack.muted || !audioTrack.enabled) {
          setAudioLevel(0);
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]!;
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
      }, 150);
    } catch (e) {
      console.warn("[PTM WebRTC] Audio analyzer initialization skipped:", e);
    }
  }, []);

  // Initialize local microphone and webcam
  const startLocalMedia = useCallback(
    async (preferAudio = initialAudio, preferVideo = initialVideo) => {
      try {
        setConnectionStatus("initializing");
        setError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Your browser does not support WebRTC camera and microphone access.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });

        // Set initial track states
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = preferAudio;
          setIsMicMuted(!preferAudio);
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = preferVideo;
          setIsVideoOff(!preferVideo);
          webcamVideoTrackRef.current = videoTrack;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setupAudioAnalyzer(stream);

        return stream;
      } catch (err: any) {
        console.error("[PTM WebRTC] getUserMedia failed:", err);
        let msg = "Could not access camera or microphone.";
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Camera and microphone permissions were denied. Please allow device access in your browser bar.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No camera or microphone found on your device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          msg = "Your camera or microphone is already in use by another application.";
        }
        setError(msg);
        setConnectionStatus("failed");
        throw err;
      }
    },
    [initialAudio, initialVideo, setupAudioAnalyzer]
  );

  // Setup Peer Connection for a remote peer
  const getOrCreatePeerConnection = useCallback(
    (remotePeerId: string, remotePeerName: string, remotePeerRole: string) => {
      let pc = peerConnectionsRef.current.get(remotePeerId);
      if (pc && pc.signalingState !== "closed") {
        return pc;
      }

      pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(remotePeerId, pc);

      // Add local tracks to new connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc?.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal("ice-candidate", event.candidate, remotePeerId);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (!pc) return;
        if (pc.connectionState === "connected") {
          setConnectionStatus("connected");
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "connecting") {
          setConnectionStatus("reconnecting");
        } else if (pc.connectionState === "failed") {
          setConnectionStatus("failed");
        }
      };

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        const [remoteMediaStream] = event.streams;
        if (remoteMediaStream) {
          setRemoteParticipants((prev) => {
            const next = new Map(prev);
            next.set(remotePeerId, {
              id: remotePeerId,
              name: remotePeerName || "Participant",
              role: remotePeerRole || "participant",
              stream: remoteMediaStream,
            });
            return next;
          });
        }
      };

      return pc;
    },
    [sendSignal]
  );

  // Handle incoming signals from backend polling
  const handleIncomingSignal = useCallback(
    async (signal: PtmSignalPayload) => {
      const { senderId, type, data } = signal;

      if (type === "join") {
        // A peer announced their presence
        const peerName = data?.name || "Participant";
        const peerRole = data?.role || "participant";
        if (onParticipantJoin) onParticipantJoin({ id: senderId, name: peerName, role: peerRole });

        // If we are a teacher or already present, initiate an offer to the newcomer
        const pc = getOrCreatePeerConnection(senderId, peerName, peerRole);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal("offer", offer, senderId);
      } else if (type === "offer") {
        // Received an offer from a peer
        const peerName = data?.name || "Participant";
        const peerRole = data?.role || "participant";
        const pc = getOrCreatePeerConnection(senderId, peerName, peerRole);
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal("answer", answer, senderId);
      } else if (type === "answer") {
        // Received an answer to our offer
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.signalingState !== "closed" && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        }
      } else if (type === "ice-candidate") {
        // Received ICE candidate
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.remoteDescription && data) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data));
          } catch (e) {
            console.warn("[PTM WebRTC] Candidate error:", e);
          }
        }
      } else if (type === "leave") {
        // Remote peer left
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(senderId);
        }
        setRemoteParticipants((prev) => {
          const next = new Map(prev);
          next.delete(senderId);
          return next;
        });
        if (onParticipantLeave) onParticipantLeave(senderId);
      } else if (type === "status") {
        // Remote mute/video status update
        setRemoteParticipants((prev) => {
          const next = new Map(prev);
          const p = next.get(senderId);
          if (p) {
            next.set(senderId, {
              ...p,
              isMuted: data?.isMuted ?? p.isMuted,
              isVideoOff: data?.isVideoOff ?? p.isVideoOff,
            });
          }
          return next;
        });
      }
    },
    [getOrCreatePeerConnection, onParticipantJoin, onParticipantLeave, sendSignal]
  );

  // Poll signaling messages every 1 second
  const startSignalPolling = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers["x-ptm-token"] = token;

        const res = await fetch(
          `/api/ptm/meetings/${meetingId}/signal?since=${lastSignalTimestampRef.current}`,
          { headers }
        );
        if (!res.ok) return;

        const json = await res.json();
        if (json.success && Array.isArray(json.signals)) {
          if (json.timestamp) lastSignalTimestampRef.current = json.timestamp;
          for (const s of json.signals) {
            await handleIncomingSignal(s);
          }
        }
      } catch (err) {
        console.warn("[PTM WebRTC] Polling error:", err);
      }
    }, 1200);
  }, [handleIncomingSignal, meetingId, token]);

  // Connect to the room and announce self
  const connectRoom = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      isJoinedRef.current = true;

      // Start local stream if not already active
      let stream = localStreamRef.current;
      if (!stream) {
        stream = await startLocalMedia();
      }

      startSignalPolling();

      // Broadcast presence in room
      await sendSignal("join", { name: userName, role });
      setConnectionStatus("connected");
    } catch (e: any) {
      console.error("[PTM WebRTC] connectRoom error:", e);
      setError(e.message || "Failed to establish video connection.");
      setConnectionStatus("failed");
    }
  }, [role, sendSignal, startLocalMedia, startSignalPolling, userName]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      setIsMicMuted(!nextState);
      sendSignal("status", { isMuted: !nextState, isVideoOff });
    }
  }, [isVideoOff, sendSignal]);

  // Toggle webcam
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      setIsVideoOff(!nextState);
      sendSignal("status", { isMuted: isMicMuted, isVideoOff: !nextState });
    }
  }, [isMicMuted, sendSignal]);

  // Real Screen Sharing
  const startScreenShare = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing is not supported by your current browser.");
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);

      // Replace video track on all peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      // Handle user stopping screen share via browser native UI banner
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (e: any) {
      if (e.name !== "NotAllowedError") {
        console.error("[PTM WebRTC] Screen share error:", e);
        setError("Could not start screen sharing.");
      }
    }
  }, []);

  // Stop screen sharing and restore webcam
  const stopScreenShare = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore webcam track on all peer connections
    const webcamTrack = webcamVideoTrackRef.current;
    if (webcamTrack) {
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(webcamTrack);
        }
      });
    }
  }, []);

  // Leave meeting and cleanup all resources
  const leaveMeeting = useCallback(async () => {
    isJoinedRef.current = false;
    await sendSignal("leave");

    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (audioLevelIntervalRef.current) clearInterval(audioLevelIntervalRef.current);

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setLocalStream(null);
    setRemoteParticipants(new Map());
    setConnectionStatus("disconnected");
  }, [sendSignal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isJoinedRef.current) {
        leaveMeeting();
      }
    };
  }, [leaveMeeting]);

  return {
    localStream,
    remoteParticipants: Array.from(remoteParticipants.values()),
    isMicMuted,
    isVideoOff,
    isScreenSharing,
    connectionStatus,
    audioLevel,
    error,
    startLocalMedia,
    connectRoom,
    toggleMic,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveMeeting,
  };
}
