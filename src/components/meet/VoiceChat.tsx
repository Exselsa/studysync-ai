"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useWebRTCVoiceChat } from "@/hooks/useWebRTCVoiceChat";
import { Mic, MicOff, Volume2, Users, Radio } from "lucide-react";
import { m } from "framer-motion";

interface VoiceChatProps {
  roomId: string;
}

/**
 * VoiceChat UI Component for Study Meet.
 *
 * Renders hidden DOM <audio> elements bound to WebRTC streams,
 * connection status indicator, Mute/Unmute button, and an explicit
 * "🔊 Enable Audio" button to bypass browser autoplay restrictions.
 */
export default function VoiceChat({ roomId }: VoiceChatProps) {
  const { user } = useAuth();
  const {
    remoteStreams,
    connectionStates,
    voiceParticipants,
    isMuted,
    isAudioBlocked,
    firestoreError,
    toggleMute,
    resumeAudio,
    attachAudioElement,
  } = useWebRTCVoiceChat(roomId, user?.uid, user?.displayName || undefined);

  const remoteCount = remoteStreams.size;
  const connectedPeerCount = Array.from(connectionStates.values()).filter(
    (st) => st === "connected"
  ).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Hidden container with dynamic HTML <audio> elements for each remote participant */}
      <div style={{ display: "none" }} aria-hidden="true">
        {Array.from(remoteStreams.keys()).map((remoteUserId) => (
          <audio
            key={remoteUserId}
            ref={(element) => attachAudioElement(remoteUserId, element)}
            autoPlay
            playsInline
          />
        ))}
      </div>

      {/* Voice Connection Status Badge */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
        style={{
          background: "rgba(3, 11, 34, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "var(--color-silver-300)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Radio
            size={13}
            className={connectedPeerCount > 0 ? "animate-pulse text-emerald-400" : "text-amber-400"}
          />
          <span className="text-[11px] font-medium">
            {voiceParticipants.length > 1
              ? `${connectedPeerCount + 1}/${voiceParticipants.length} Suara Aktif`
              : "Suara Terhubung"}
          </span>
        </div>
      </div>

      {/* Mute / Unmute Button */}
      <button
        type="button"
        id="voice-chat-toggle-mute"
        onClick={toggleMute}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isMuted
            ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
        }`}
        aria-label={isMuted ? "Aktifkan Mikrofon" : "Bisukan Mikrofon"}
      >
        {isMuted ? (
          <>
            <MicOff size={14} className="text-red-400" />
            <span>Terbisu</span>
          </>
        ) : (
          <>
            <Mic size={14} className="text-emerald-400" />
            <span>Mikrofon Aktif</span>
          </>
        )}
      </button>

      {/* Explicit Enable Audio / Resume Autoplay Button next to Mikrofon Aktif */}
      {(isAudioBlocked || remoteCount > 0 || voiceParticipants.length > 1) && (
        <m.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          id="voice-chat-resume-audio"
          onClick={() => resumeAudio()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isAudioBlocked
              ? "bg-amber-500/30 text-amber-200 border border-amber-400/50 animate-bounce"
              : "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/60"
          }`}
          title="Klik jika suara peserta lain belum terdengar (Autoplay browser)"
          aria-label="Aktifkan Suara Audio"
        >
          <Volume2 size={14} className={isAudioBlocked ? "text-amber-300" : "text-cyan-400"} />
          <span>🔊 Aktifkan Suara Audio</span>
        </m.button>
      )}

      {/* Readable Error Toast if Firestore Security Rules Reject Writes */}
      {firestoreError && (
        <div
          className="w-full p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-fadeIn mt-1"
          role="alert"
        >
          <span>⚠️ Toast Akses Firestore: {firestoreError}</span>
        </div>
      )}
    </div>
  );
}
