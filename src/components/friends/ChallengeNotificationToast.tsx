"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Swords, Check, X, Sparkles, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  subscribeToIncomingChallenges,
  respondToChallenge,
  type MatchChallenge,
} from "@/lib/firebase/friends";
import { useRouter } from "next/navigation";

export default function ChallengeNotificationToast() {
  const { user } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<MatchChallenge[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setChallenges([]);
      return;
    }

    // Subscribe to realtime pending challenges targeting user.uid
    const unsubscribe = subscribeToIncomingChallenges(user.uid, (list) => {
      setChallenges(list);
    });

    return unsubscribe;
  }, [user]);

  if (!user || challenges.length === 0) return null;

  const currentChallenge = challenges[0];

  const handleRespond = async (action: "accept" | "decline") => {
    if (processingId) return;
    setProcessingId(currentChallenge.id);

    try {
      await respondToChallenge(currentChallenge.id, action);

      if (action === "accept") {
        // Redirect both to duel arena with topic & matchId
        router.push(
          `/dashboard/game?topic=${encodeURIComponent(
            currentChallenge.topic
          )}&matchId=${currentChallenge.id}`
        );
      }
    } catch (err) {
      console.error("Failed to respond to challenge:", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      <m.div
        className="fixed top-20 right-6 z-50 max-w-md w-full p-4 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        style={{
          background:
            "linear-gradient(135deg, rgba(225,29,72,0.18) 0%, rgba(3,11,34,0.96) 100%)",
          border: "1px solid rgba(244,63,94,0.4)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 50px rgba(225,29,72,0.25)",
        }}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400" />

        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-wider">
              <Swords size={16} className="animate-pulse" />
              <span>Incoming Feynman Duel Challenge!</span>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-300">
              ⚔️ Duel Match
            </span>
          </div>

          {/* Body content */}
          <div className="text-xs leading-relaxed text-slate-100">
            <span className="font-extrabold text-cyan-300">
              {currentChallenge.challengerName}
            </span>{" "}
            has challenged you to a Feynman Duel on topic:
            <div className="mt-2 px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 font-bold text-sm text-center">
              &ldquo;{currentChallenge.topic}&rdquo;
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleRespond("decline")}
              disabled={processingId !== null}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X size={14} /> Decline ❌
            </button>

            <button
              type="button"
              onClick={() => handleRespond("accept")}
              disabled={processingId !== null}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {processingId === currentChallenge.id ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Accepting...
                </>
              ) : (
                <>
                  <Swords size={14} /> Accept ⚔️
                </>
              )}
            </button>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
