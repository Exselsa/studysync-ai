import { Suspense } from "react";
import BossFightArena from "@/components/BossFightArena";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Loader2, Swords } from "lucide-react";

export const metadata = {
  title: "Boss Fight & 1v1 Duel Arena | StudySync AI",
  description:
    "Gunakan Teknik Feynman untuk bertarung di Boss Fight atau 1v1 Duel Arena. Jelaskan konsep dengan sederhana untuk memberikan damage dan tingkatkan pemahaman materi kamu bersama abang ganteng.",
};

function GameLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] gap-4 text-cyan-300">
      <div className="relative flex items-center justify-center">
        <div className="size-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-xl">
          <Loader2 size={32} className="animate-spin text-cyan-400" />
        </div>
        <Swords size={18} className="absolute -bottom-1 -right-1 text-violet-400 animate-bounce" />
      </div>
      <div className="flex flex-col items-center text-center gap-1">
        <span className="text-base font-extrabold font-display tracking-wide text-slate-100">
          Memuat Feynman Arena...
        </span>
        <span className="text-xs text-slate-400 font-sans">
          Persiapkan penjelasan terbaik kamu bersama abang ganteng!
        </span>
      </div>
    </div>
  );
}

export default function BossFightPage() {
  return (
    <ProtectedRoute>
      <main
        id="boss-fight-page"
        className="flex flex-col flex-1 overflow-y-auto px-4 py-6"
        aria-label="Feynman Boss Fight & 1v1 Duel Arena page"
      >
        <Suspense fallback={<GameLoading />}>
          <BossFightArena />
        </Suspense>
      </main>
    </ProtectedRoute>
  );
}
