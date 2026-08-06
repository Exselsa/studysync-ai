import { Suspense } from "react";
import BossFightArena from "@/components/BossFightArena";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Boss Fight | StudySync AI",
  description:
    "Use the Feynman Technique to battle the Knowledge Devourer. Explain concepts clearly to deal damage and level up your understanding.",
};

function GameLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-cyan-300">
      <Loader2 size={32} className="animate-spin" />
      <span className="text-sm font-semibold tracking-wide">
        Loading Feynman Arena...
      </span>
    </div>
  );
}

export default function GamePage() {
  return (
    <ProtectedRoute>
      <main
        id="boss-fight-page"
        className="flex flex-col flex-1 overflow-y-auto"
        aria-label="Feynman Boss Fight page"
      >
        <Suspense fallback={<GameLoading />}>
          <BossFightArena />
        </Suspense>
      </main>
    </ProtectedRoute>
  );
}
