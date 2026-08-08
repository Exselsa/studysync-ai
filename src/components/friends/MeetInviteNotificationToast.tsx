"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Video, X, Loader2, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  subscribeToIncomingMeetInvites,
  respondToMeetInvite,
  type MeetInvite,
} from "@/lib/firebase/meet";
import { useRouter } from "next/navigation";

export default function MeetInviteNotificationToast() {
  const { user } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<MeetInvite[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setInvites([]);
      return;
    }

    const unsubscribe = subscribeToIncomingMeetInvites(user.uid, (list) => {
      setInvites(list);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user || invites.length === 0) return null;

  const currentInvite = invites[0];

  const handleRespond = async (action: "accept" | "decline") => {
    if (processingId || !currentInvite) return;
    setProcessingId(currentInvite.id);

    try {
      await respondToMeetInvite(currentInvite.id, action);

      if (action === "accept") {
        router.push(`/dashboard/meet?roomId=${currentInvite.roomId}`);
      }
    } catch (err) {
      console.error("Failed to respond to meet invite:", err);
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
            "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(3,11,34,0.96) 100%)",
          border: "1px solid rgba(56,189,248,0.4)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 50px rgba(6,182,212,0.25)",
        }}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />

        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <Video size={16} className="animate-pulse" />
              <span>Undangan Study Meet Masuk!</span>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 flex items-center gap-1">
              <Users size={11} /> Belajar Bersama
            </span>
          </div>

          {/* Body content */}
          <div className="text-xs leading-relaxed text-slate-100">
            <span className="font-extrabold text-cyan-300">
              {currentInvite.hostName}
            </span>{" "}
            mengundang kamu untuk bergabung di Ruang Study Meet:
            <div className="mt-2 px-3 py-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 font-bold text-sm text-center">
              &ldquo;{currentInvite.roomTitle}&rdquo;
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
              <X size={14} /> Tolak ❌
            </button>

            <button
              type="button"
              onClick={() => handleRespond("accept")}
              disabled={processingId !== null}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {processingId === currentInvite.id ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Menerima...
                </>
              ) : (
                <>
                  <Video size={14} /> Gabung Room 🚀
                </>
              )}
            </button>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
