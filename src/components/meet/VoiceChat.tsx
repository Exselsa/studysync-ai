"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useWebRTCVoiceChat } from "@/hooks/useWebRTCVoiceChat";
import { Mic, MicOff, Volume2, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

interface VoiceChatProps {
  roomId: string;
  onMuteStateChange?: (isMuted: boolean) => void;
  showFloatingControlsOnly?: boolean;
}

/**
 * VoiceChat UI Component for Study Meet.
 *
 * Renders hidden DOM <audio> elements bound to WebRTC streams,
 * connection status indicator, Mute/Unmute button, and explicit
 * Audio Permission Gesture Overlay to bypass browser autoplay restrictions.
 */
export default function VoiceChat({ roomId, onMuteStateChange }: VoiceChatProps) {
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

  useEffect(() => {
    if (isAudioBlocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAudioBlocked]);

  const handleToggleMute = () => {
    toggleMute();
    if (onMuteStateChange) {
      onMuteStateChange(!isMuted);
    }
  };

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

      {/* Voice Connection Status Badge in Obsidian Glass */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl bg-[#080C14]/90 border border-white/10 shadow-xl text-slate-300">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Radio
              size={13}
              className={connectedPeerCount > 0 ? "animate-pulse text-cyan-400" : "text-slate-400"}
            />
            {connectedPeerCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-[11px] font-extrabold tracking-wide">
            {voiceParticipants.length > 1
              ? `${connectedPeerCount + 1}/${voiceParticipants.length} Suara Aktif`
              : "Voice Chat Ready"}
          </span>
        </div>
      </div>

      {/* Mute / Unmute Quick Button */}
      <m.button
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        type="button"
        id="voice-chat-toggle-mute"
        onClick={handleToggleMute}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-lg backdrop-blur-xl border ${
          isMuted
            ? "bg-rose-950/80 text-rose-300 border-rose-500/40 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
            : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
        }`}
        aria-label={isMuted ? "Aktifkan Mikrofon" : "Bisukan Mikrofon"}
      >
        {isMuted ? (
          <>
            <MicOff size={14} className="text-rose-400" />
            <span>Terbisu</span>
          </>
        ) : (
          <>
            <Mic size={14} className="text-emerald-400 animate-pulse" />
            <span>Mic Aktif</span>
          </>
        )}
      </m.button>

      {/* Explicit Enable Audio / Resume Autoplay Button */}
      {(isAudioBlocked || remoteCount > 0 || voiceParticipants.length > 1) && (
        <m.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          type="button"
          id="voice-chat-resume-audio"
          onClick={() => resumeAudio()}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-xl backdrop-blur-xl border ${
            isAudioBlocked
              ? "bg-cyan-950/90 text-cyan-200 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse"
              : "bg-cyan-950/80 text-cyan-200 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          }`}
          title="Klik jika suara peserta lain belum terdengar (Autoplay browser)"
          aria-label="Aktifkan Suara Audio"
        >
          <Volume2 size={14} className={isAudioBlocked ? "text-cyan-300 animate-bounce" : "text-cyan-400"} />
          <span>🔊 Aktifkan Suara</span>
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

      {/* Cybernetic Audio Permission Gesture Overlay Modal */}
      <AnimatePresence>
        {isAudioBlocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/85 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
              className="max-w-md w-full rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-5 border bg-[#080C14]/95 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] backdrop-blur-2xl relative overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute -top-20 -left-20 size-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 size-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="size-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] relative">
                <Volume2 size={30} className="animate-bounce text-cyan-300" />
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-cyan-400 animate-ping" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-black tracking-wider uppercase mx-auto">
                  <ShieldCheck size={12} /> BROWSER AUDIO GESTURE
                </div>
                <h3 className="text-xl font-black text-slate-50 font-display mt-1">
                  Izin Suara Browser Diperlukan 🎙️
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                  Browser memerlukan konfirmasi gesture langsung dari kamu untuk mulai memutar obrolan suara Study Meet secara real-time.
                </p>
              </div>

              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                id="voice-chat-overlay-activate-btn"
                onClick={() => resumeAudio()}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs tracking-wide shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={16} className="fill-white" />
                Aktifkan Suara Audio Sekarang
              </m.button>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
