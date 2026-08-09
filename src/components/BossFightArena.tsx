"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Send,
  Swords,
  Shield,
  Zap,
  Heart,
  Star,
  Loader2,
  Sparkles,
  RefreshCw,
  Trophy,
  Skull,
  Flame,
  User,
  Users,
  BookOpen,
  ArrowLeft,
  Clock,
  Award,
  Flag,
  MessageSquare,
  Smile,
  CheckCircle2,
} from "lucide-react";
import type { EvaluateResponse } from "@/app/api/evaluate/route";
import type { DuelEvaluateResponse } from "@/app/api/evaluate-duel/route";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getStudyPlans } from "@/lib/firebase/db";
import {
  createOrGetMultiplayerMatch,
  subscribeToMultiplayerMatch,
  submitDuelAnswer,
  commitDuelEvaluation,
  updateMatchHeartbeat,
  forfeitMatchDueToDisconnect,
  surrenderMatch,
  sendDuelTaunt,
  type MultiplayerMatch,
  type DuelTaunt,
  setPlayerReadyInMatch,
} from "@/lib/firebase/friends";
import { useSearchParams, useRouter } from "next/navigation";
import FriendsPanel from "@/components/friends/FriendsPanel";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import { cn } from "@/lib/cn";

/* ---------------------------------------------------------------
   Types & Constants
   --------------------------------------------------------------- */
export type GameMode = "select" | "vs_boss" | "vs_player";

export const PRESET_TAUNTS = [
  "nice",
  "mantap jiwa",
  "jangan nangis",
  "pinter banget",
  "kenak mental",
] as const;

export interface StudyTopicItem {
  id: string;
  title: string;
  concepts: string[];
}

export type AnimPhase =
  | "idle"
  | "evaluating"
  | "knight_attack"
  | "boss_attack"
  | "clash";

interface AttackLog {
  id: string;
  concept: string;
  explanation: string;
  damageDealt: number;
  playerDamageTaken: number;
  bossFeedback: string;
  isCorrect: boolean;
  timestamp: Date;
}

const BOSS_MAX_HP = 300;
const PLAYER_MAX_HP = 100;

const DEFAULT_CS_CONCEPTS = [
  "Binary Search Trees",
  "Gradient Descent in ML",
  "HTTP REST APIs",
  "Recursion & Call Stack",
  "Neural Networks & Backpropagation",
  "Database Indexing & B-Trees",
  "Event Loop in JavaScript",
  "Docker Containers vs Virtual Machines",
  "Big O Time Complexity",
  "Garbage Collection & Memory Management",
  "Hash Tables & Collisions",
  "Asynchronous Promises",
];

export function getQuestionDifficultyWeight(question: string): {
  timeLimit: number;
  weightLabel: "Easy" | "Medium" | "Hard";
  badgeColor: string;
} {
  const qLower = (question || "").toLowerCase();
  const len = (question || "").length;

  const hardKeywords = [
    "gradient descent",
    "backpropagation",
    "neural network",
    "persamaan diferensial",
    "dynamic programming",
    "containers vs",
    "b-tree",
    "garbage collection",
    "call stack",
    "substitusi",
    "integrasi",
  ];

  if (hardKeywords.some((k) => qLower.includes(k)) || len > 30) {
    return {
      timeLimit: 60,
      weightLabel: "Hard",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    };
  }

  const mediumKeywords = [
    "binary search",
    "http rest",
    "event loop",
    "recursion",
    "hash table",
    "asynchronous",
    "indexing",
    "big o",
  ];

  if (mediumKeywords.some((k) => qLower.includes(k)) || len > 18) {
    return {
      timeLimit: 45,
      weightLabel: "Medium",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    };
  }

  return {
    timeLimit: 30,
    weightLabel: "Easy",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  };
}

/* ---------------------------------------------------------------
   Floating Damage Numbers
   --------------------------------------------------------------- */
function FloatingDamage({
  value,
  isPlayer,
}: {
  value: number;
  isPlayer?: boolean;
}) {
  return (
    <m.div
      className={cn(
        "absolute pointer-events-none select-none z-30",
        isPlayer ? "left-8 top-12" : "right-8 top-12"
      )}
      initial={{ opacity: 1, y: 0, scale: 1.5 }}
      animate={{ opacity: 0, y: -65, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
    >
      <span
        className={cn(
          "text-3xl font-black font-display tracking-wider",
          isPlayer ? "text-cyan-400" : "text-rose-500"
        )}
        style={{
          textShadow: isPlayer
            ? "0 0 16px rgba(6,182,212,0.8), 0 0 30px rgba(6,182,212,0.4)"
            : "0 0 18px rgba(244,63,94,0.8), 0 0 40px rgba(225,29,72,0.4)",
        }}
      >
        -{value} HP
      </span>
    </m.div>
  );
}

/* ---------------------------------------------------------------
   Health Bar Component
   --------------------------------------------------------------- */
function HealthBar({
  label,
  current,
  max,
  color,
  glowColor,
  icon: Icon,
}: {
  label: string;
  current: number;
  max: number;
  color: string;
  glowColor: string;
  icon: React.ElementType;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const isLowHp = pct <= 30;
  const isMedHp = pct > 30 && pct <= 55;

  // Dynamic HP Bar Gradient
  let barGradient = color;
  let currentGlow = glowColor;

  if (isLowHp) {
    barGradient = "linear-gradient(90deg, #dc2626, #f43f5e)";
    currentGlow = "rgba(244, 63, 94, 0.85)";
  } else if (isMedHp) {
    barGradient = "linear-gradient(90deg, #0284c7, #38bdf8)";
    currentGlow = "rgba(6, 182, 212, 0.75)";
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon
            size={14}
            className={isLowHp ? "animate-bounce text-rose-400" : ""}
            style={{ color: isLowHp ? "#f43f5e" : isMedHp ? "#38bdf8" : undefined }}
            aria-hidden="true"
          />
          <span
            className={cn(
              "text-[11px] font-black font-display tracking-[0.16em] uppercase",
              isLowHp ? "text-rose-400" : "text-slate-300"
            )}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLowHp && (
            <span className="text-[10px] font-black font-display px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              ⚠️ LOW HP
            </span>
          )}
          <span
            className={cn(
              "text-[12px] font-extrabold font-display tabular-nums",
              isLowHp ? "text-rose-400" : isMedHp ? "text-cyan-300" : "text-slate-200"
            )}
          >
            {current}/{max}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "h-3.5 w-full rounded-full overflow-hidden p-0.5 transition-all duration-300",
          isLowHp
            ? "border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
            : "border border-white/10 shadow-inner"
        )}
        style={{
          background: "rgba(3, 7, 18, 0.95)",
        }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label} health points`}
      >
        <m.div
          className={cn("h-full rounded-full", isLowHp && "animate-pulse")}
          style={{
            background: barGradient,
            boxShadow: `0 0 16px ${currentGlow}`,
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Main Component: BossFightArena
   --------------------------------------------------------------- */
export default function BossFightArena() {
  const { user } = useAuth();
  useStudyTimer(user?.uid);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get("topic");
  const matchId = searchParams.get("matchId") || searchParams.get("duelId");

  // Mode & Match State
  const [gameMode, setGameMode] = useState<GameMode>(
    matchId ? "vs_player" : "select"
  );
  const [multiplayerMatch, setMultiplayerMatch] =
    useState<MultiplayerMatch | null>(null);

  const [userTopics, setUserTopics] = useState<StudyTopicItem[]>([]);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>(
    urlTopic || "Computer Science"
  );

  // Core Game State
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    urlTopic || "Data Structures & Algorithms"
  );
  const [, setStudyPlanConcepts] = useState<string[]>([]);
  const [attackText, setAttackText] = useState("");
  const [battleLog, setBattleLog] = useState<AttackLog[]>([]);
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");
  const [combo, setCombo] = useState(0);
  const [phase, setPhase] = useState<"battle" | "victory" | "defeat">("battle");
  const [latestBossDamage, setLatestBossDamage] = useState<number | null>(null);
  const [latestPlayerDamage, setLatestPlayerDamage] = useState<number | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [isSlashActive, setIsSlashActive] = useState(false);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(30);
  const [opponentInactive, setOpponentInactive] = useState(false);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  // 3-2-1 Match Start Countdown State
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const hasRunCountdownRef = useRef<string | null>(null);

  // Dynamic Question Weight & Turn Timer State
  const diffInfo = getQuestionDifficultyWeight(currentQuestion);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(diffInfo.timeLimit);
  const [isTimingOut, setIsTimingOut] = useState<boolean>(false);

  // Trigger 3-2-1 Countdown Animation when match status becomes in_progress
  useEffect(() => {
    if (
      gameMode === "vs_player" &&
      multiplayerMatch?.status === "in_progress" &&
      matchId &&
      hasRunCountdownRef.current !== matchId
    ) {
      hasRunCountdownRef.current = matchId;
      setStartCountdown(3);
    }
  }, [gameMode, multiplayerMatch?.status, matchId]);

  useEffect(() => {
    if (startCountdown === null) return;
    if (startCountdown <= 0) {
      const timer = setTimeout(() => {
        setStartCountdown(null);
      }, 800);
      return () => clearTimeout(timer);
    }
    const timer = setInterval(() => {
      setStartCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [startCountdown]);

  // Taunt System State
  const [showTauntMenu, setShowTauntMenu] = useState(false);
  const [activeTaunt, setActiveTaunt] = useState<DuelTaunt | null>(null);

  // Realtime Taunt Listener Effect (Fades out speech bubble after 3 seconds)
  useEffect(() => {
    if (!multiplayerMatch?.lastTaunt) return;
    const taunt = multiplayerMatch.lastTaunt;
    if (Date.now() - taunt.timestamp < 5000) {
      setActiveTaunt(taunt);
      const timer = setTimeout(() => {
        setActiveTaunt(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [multiplayerMatch?.lastTaunt]);

  // Reset turn countdown timer when currentQuestion changes or game resets
  useEffect(() => {
    const info = getQuestionDifficultyWeight(currentQuestion);
    setTurnTimeLeft(info.timeLimit);
    setIsTimingOut(false);
  }, [currentQuestion, phase]);

  const handleBackToSelect = useCallback(() => {
    setGameMode("select");
    setMultiplayerMatch(null);
    setBossHp(BOSS_MAX_HP);
    setPlayerHp(PLAYER_MAX_HP);
    setBattleLog([]);
    setCombo(0);
    setPhase("battle");
    setAnimPhase("idle");
    setAttackText("");
    setIsWaitingForOpponent(false);
    setOpponentInactive(false);
    setShowSurrenderModal(false);
    router.push("/dashboard/game");
  }, [router]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const isBusy = animPhase !== "idle" || isWaitingForOpponent || startCountdown !== null;

  // Pulse Heartbeat loop for 1v1 match
  useEffect(() => {
    if (gameMode !== "vs_player" || !matchId || !user || phase !== "battle") return;

    updateMatchHeartbeat(matchId, user.uid);
    const interval = setInterval(() => {
      updateMatchHeartbeat(matchId, user.uid);
    }, 10000);

    return () => clearInterval(interval);
  }, [gameMode, matchId, user, phase]);

  // Timeout / Inactive Opponent Detection when waiting
  useEffect(() => {
    if (!isWaitingForOpponent) {
      setWaitingSeconds(30);
      setOpponentInactive(false);
      return;
    }

    const timer = setInterval(() => {
      setWaitingSeconds((prev) => {
        if (prev <= 1) {
          setOpponentInactive(true);
          return 0;
        }
        return prev - 1;
      });

      if (multiplayerMatch && user) {
        const isChallenger = user.uid === multiplayerMatch.challengerId;
        const oppLastActive = isChallenger
          ? multiplayerMatch.opponentLastActive
          : multiplayerMatch.challengerLastActive;

        if (oppLastActive) {
          const lastActiveMs = new Date(oppLastActive).getTime();
          if (Date.now() - lastActiveMs > 30000) {
            setOpponentInactive(true);
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isWaitingForOpponent, multiplayerMatch, user]);

  // Handle URL parameters & initialize Multiplayer Session if matchId exists
  useEffect(() => {
    if (urlTopic && urlTopic.trim()) {
      setCurrentQuestion(urlTopic.trim());
    }

    if (matchId && user) {
      setGameMode("vs_player");
      createOrGetMultiplayerMatch(matchId, user, urlTopic || "Computer Science")
        .then((mDoc) => {
          setMultiplayerMatch(mDoc);
          if (mDoc.topic) setCurrentQuestion(mDoc.topic);
          if (mDoc.status === "finished" || mDoc.status === "abandoned" || mDoc.status === "expired") {
            setIsWaitingForOpponent(false);
            if (mDoc.winnerId === user.uid) setPhase("victory");
            else setPhase("defeat");
          }
        })
        .catch((err) =>
          console.error("Failed to initialize multiplayer match:", err)
        );

      const unsub = subscribeToMultiplayerMatch(matchId, (mDoc) => {
        if (!mDoc) return;
        setMultiplayerMatch(mDoc);
        if (mDoc.topic) setCurrentQuestion(mDoc.topic);

        const isChallenger = user.uid === mDoc.challengerId;
        const localHp = isChallenger ? mDoc.challengerHp : mDoc.opponentHp;
        const oppHp = isChallenger ? mDoc.opponentHp : mDoc.challengerHp;

        setPlayerHp(localHp);
        setBossHp(oppHp);

        const myAnswer = isChallenger ? mDoc.challengerAnswer : mDoc.opponentAnswer;
        const oppAnswer = isChallenger ? mDoc.opponentAnswer : mDoc.challengerAnswer;

        if (myAnswer && !oppAnswer) {
          setIsWaitingForOpponent(true);
        } else {
          setIsWaitingForOpponent(false);
        }

        // Trigger referee evaluation animation when refereeCommentary lands
        if (mDoc.refereeCommentary) {
          setBattleLog((prev) => {
            const exists = prev.some(
              (e) => e.bossFeedback === mDoc.refereeCommentary
            );
            if (exists) return prev;
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                concept: mDoc.topic,
                explanation: myAnswer || "Dual 1v1 explanation submitted",
                damageDealt: oppHp,
                playerDamageTaken: localHp,
                bossFeedback: mDoc.refereeCommentary || "",
                isCorrect:
                  mDoc.lastRoundWinner !==
                  (isChallenger ? "playerB" : "playerA"),
                timestamp: new Date(),
              },
            ];
          });

          if (mDoc.lastRoundWinner) {
            const iWon =
              (isChallenger && mDoc.lastRoundWinner === "playerA") ||
              (!isChallenger && mDoc.lastRoundWinner === "playerB");
            const isDraw = mDoc.lastRoundWinner === "draw";

            let nextPhase: "knight_attack" | "boss_attack" | "clash";
            if (isDraw) nextPhase = "clash";
            else if (iWon) nextPhase = "knight_attack";
            else nextPhase = "boss_attack";

            setAnimPhase(nextPhase);

            setTimeout(() => {
              setIsScreenShaking(true);
              setIsSlashActive(true);
            }, 350);

            setTimeout(() => {
              setIsScreenShaking(false);
              setIsSlashActive(false);
              setAnimPhase("idle");
            }, 1350);
          }
        }

        if (mDoc.status === "finished" || mDoc.status === "abandoned" || mDoc.status === "expired") {
          setIsWaitingForOpponent(false);
          if (mDoc.winnerId === user.uid) setPhase("victory");
          else setPhase("defeat");
        }
      });

      return unsub;
    }
  }, [matchId, urlTopic, user]);

  // Fetch Study Plan topics & concepts if logged in
  useEffect(() => {
    if (urlTopic && urlTopic.trim()) {
      setSelectedTopicTitle(urlTopic.trim());
      return;
    }
    if (!user) {
      const defaultTopics: StudyTopicItem[] = [
        { id: "cs", title: "Computer Science", concepts: DEFAULT_CS_CONCEPTS },
        {
          id: "alg",
          title: "Algoritma & Pemrograman",
          concepts: [
            "Binary Search Trees",
            "Dynamic Programming",
            "Recursion & Call Stack",
            "Big O Time Complexity",
          ],
        },
      ];
      setUserTopics(defaultTopics);
      if (!matchId) {
        setSelectedTopicTitle("Computer Science");
        setCurrentQuestion(DEFAULT_CS_CONCEPTS[Math.floor(Math.random() * DEFAULT_CS_CONCEPTS.length)]);
      }
      return;
    }

    const userId = user.uid;
    async function fetchPlans() {
      try {
        const plans = await getStudyPlans(userId);
        if (plans.length > 0) {
          const topicsList: StudyTopicItem[] = plans.map((plan) => {
            const title = plan.subject || plan.title || "Study Plan";
            const taskTitles = (plan.tasks || [])
              .map((t) => t.title)
              .filter(Boolean);
            const concepts = Array.from(new Set([title, ...taskTitles]));
            return {
              id: plan.id,
              title,
              concepts: concepts.length > 0 ? concepts : [title],
            };
          });

          setUserTopics(topicsList);
          const allExtractedConcepts = topicsList.flatMap((t) => t.concepts);
          setStudyPlanConcepts(Array.from(new Set(allExtractedConcepts)));

          if (!urlTopic && !matchId) {
            const initialTopic = topicsList[0];
            setSelectedTopicTitle(initialTopic.title);
            const initialConcept =
              initialTopic.concepts[
                Math.floor(Math.random() * initialTopic.concepts.length)
              ];
            setCurrentQuestion(initialConcept);
          }
        } else {
          const defaultTopics: StudyTopicItem[] = [
            { id: "cs", title: "Computer Science", concepts: DEFAULT_CS_CONCEPTS },
            {
              id: "alg",
              title: "Algoritma & Pemrograman",
              concepts: [
                "Binary Search Trees",
                "Dynamic Programming",
                "Recursion & Call Stack",
                "Big O Time Complexity",
              ],
            },
            {
              id: "web",
              title: "Web Development",
              concepts: [
                "HTTP REST APIs",
                "Event Loop in JavaScript",
                "Asynchronous Promises",
              ],
            },
          ];
          setUserTopics(defaultTopics);
          if (!urlTopic && !matchId) {
            setSelectedTopicTitle("Computer Science");
            setCurrentQuestion(
              DEFAULT_CS_CONCEPTS[Math.floor(Math.random() * DEFAULT_CS_CONCEPTS.length)]
            );
          }
        }
      } catch (err) {
        console.warn("Could not fetch user study plans for boss fight:", err);
      }
    }

    fetchPlans();
  }, [matchId, urlTopic, user]);

  // Handle switching active Study Topic from Dropdown
  const handleTopicChange = useCallback((newTopicTitle: string) => {
    setSelectedTopicTitle(newTopicTitle);
    const matchedTopic = userTopics.find((t) => t.title === newTopicTitle);
    const pool =
      matchedTopic && matchedTopic.concepts.length > 0
        ? matchedTopic.concepts
        : DEFAULT_CS_CONCEPTS;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(picked);
  }, [userTopics]);

  // Handle Reroll Question within currently selected topic
  const handleRerollQuestion = useCallback(() => {
    if (isBusy || phase !== "battle" || gameMode === "vs_player") return;
    const matchedTopic = userTopics.find((t) => t.title === selectedTopicTitle);
    const pool =
      matchedTopic && matchedTopic.concepts.length > 0
        ? matchedTopic.concepts
        : DEFAULT_CS_CONCEPTS;
    const filtered = pool.filter((q) => q !== currentQuestion);
    const nextQ =
      filtered.length > 0
        ? filtered[Math.floor(Math.random() * filtered.length)]
        : pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(nextQ);
  }, [currentQuestion, isBusy, phase, gameMode, selectedTopicTitle, userTopics]);

  // Auto-scroll battle log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleLog]);

  // Win / Defeat monitor
  useEffect(() => {
    if (bossHp <= 0) {
      setPhase("victory");
    } else if (playerHp <= 0) {
      setPhase("defeat");
    }
  }, [bossHp, playerHp]);

  /* ---------------------------------------------------------------
     Combat Sequence Handler with Strict 3-Phase Rule Execution
     --------------------------------------------------------------- */
  const handleAttack = useCallback(async () => {
    const userInput = attackText.trim();
    if (!userInput || isBusy || phase !== "battle") return;

    setAnimPhase("evaluating");
    const submittedText = userInput;
    setAttackText("");

    try {
      if (gameMode === "vs_player" && matchId && user) {
        // ── 1v1 DUAL SUBMISSION VIA FIRESTORE & REFEREE EVALUATION ──
        const { bothSubmitted, matchData } = await submitDuelAnswer(
          matchId,
          user.uid,
          submittedText
        );

        if (!bothSubmitted) {
          // Waiting for opponent to submit answer
          setIsWaitingForOpponent(true);
          setAnimPhase("idle");
          return;
        }

        // BOTH players have submitted! Call AI Referee via /api/evaluate-duel
        setIsWaitingForOpponent(false);
        const res = await fetch("/api/evaluate-duel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: currentQuestion,
            playerAExplanation: matchData.challengerAnswer || "",
            playerBExplanation: matchData.opponentAnswer || "",
            playerAName: matchData.challengerName,
            playerBName: matchData.opponentName,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const duelData: DuelEvaluateResponse = await res.json();

        // Commit Referee Evaluation to Firestore for both players
        await commitDuelEvaluation(
          matchId,
          duelData.playerADamageDealt,
          duelData.playerBDamageDealt,
          duelData.refereeCommentary,
          duelData.winnerOfRound
        );
      } else {
        // ── SOLO VS AI BOSS EVALUATION VIA /api/evaluate ──
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            explanation: submittedText,
            currentConcept: currentQuestion,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data: EvaluateResponse = await res.json();
        const {
          damageDealt,
          playerDamageTaken,
          isCorrect,
          bossFeedback,
          nextConceptQuestion,
        } = data;

        let nextPhase: "knight_attack" | "boss_attack" | "clash";
        if (isCorrect && damageDealt >= 20) {
          nextPhase = "knight_attack";
        } else if (!isCorrect || damageDealt === 0) {
          nextPhase = "boss_attack";
        } else {
          nextPhase = "clash";
        }

        setAnimPhase(nextPhase);

        setTimeout(() => {
          if (damageDealt > 0) setLatestBossDamage(damageDealt);
          if (playerDamageTaken > 0) setLatestPlayerDamage(playerDamageTaken);
          setIsScreenShaking(true);
          setIsSlashActive(true);

          setBossHp((prev) => Math.max(0, prev - damageDealt));
          setPlayerHp((prev) => Math.max(0, prev - playerDamageTaken));
        }, 350);

        setTimeout(() => {
          setIsScreenShaking(false);
          setIsSlashActive(false);
        }, 800);

        setTimeout(() => {
          const newCombo = isCorrect && damageDealt > 10 ? combo + 1 : 0;
          setCombo(newCombo);

          setBattleLog((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              concept: currentQuestion,
              explanation: submittedText,
              damageDealt,
              playerDamageTaken,
              bossFeedback,
              isCorrect,
              timestamp: new Date(),
            },
          ]);

          if (nextConceptQuestion && nextConceptQuestion.trim()) {
            setCurrentQuestion(nextConceptQuestion);
          }

          setLatestBossDamage(null);
          setLatestPlayerDamage(null);
          setAnimPhase("idle");
          inputRef.current?.focus();
        }, 1350);
      }
    } catch (err) {
      console.error("Attack evaluation failed:", err);
      setAnimPhase("idle");
    }
  }, [attackText, isBusy, phase, gameMode, matchId, user, currentQuestion, combo]);

  // Timeout Execution Handler when Turn Countdown hits 0
  const handleTimeout = useCallback(async () => {
    if (isBusy || phase !== "battle" || isTimingOut) return;
    setIsTimingOut(true);

    if (attackText.trim()) {
      await handleAttack();
      setIsTimingOut(false);
      return;
    }

    setAnimPhase("boss_attack");
    const timeoutDmg = 20;

    setTimeout(() => {
      setLatestPlayerDamage(timeoutDmg);
      setIsScreenShaking(true);
      setIsSlashActive(true);
      setPlayerHp((prev) => Math.max(0, prev - timeoutDmg));
    }, 350);

    setTimeout(() => {
      setIsScreenShaking(false);
      setIsSlashActive(false);
    }, 800);

    setTimeout(() => {
      setCombo(0);
      setBattleLog((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          concept: currentQuestion,
          explanation: "⏱️ (Waktu Habis / Timeout)",
          damageDealt: 0,
          playerDamageTaken: timeoutDmg,
          bossFeedback:
            "Waktu berpikir kamu habis! Lawan mengambil giliran untuk menyerang.",
          isCorrect: false,
          timestamp: new Date(),
        },
      ]);

      const matchedTopic = userTopics.find((t) => t.title === selectedTopicTitle);
      const pool =
        matchedTopic && matchedTopic.concepts.length > 0
          ? matchedTopic.concepts
          : DEFAULT_CS_CONCEPTS;
      const filtered = pool.filter((q) => q !== currentQuestion);
      const nextQ =
        filtered.length > 0
          ? filtered[Math.floor(Math.random() * filtered.length)]
          : pool[0];
      setCurrentQuestion(nextQ);

      setLatestPlayerDamage(null);
      setAnimPhase("idle");
      setIsTimingOut(false);
    }, 1350);
  }, [
    attackText,
    currentQuestion,
    isBusy,
    phase,
    isTimingOut,
    selectedTopicTitle,
    userTopics,
    handleAttack,
  ]);

  // Turn Countdown Timer Effect (Ticks every 1s during battle)
  useEffect(() => {
    if (phase !== "battle" || animPhase !== "idle" || isWaitingForOpponent) {
      return;
    }

    if (turnTimeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTurnTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [turnTimeLeft, phase, animPhase, isWaitingForOpponent, handleTimeout]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAttack();
    }
  }

  function handleReset() {
    setBossHp(BOSS_MAX_HP);
    setPlayerHp(PLAYER_MAX_HP);
    setBattleLog([]);
    setCombo(0);
    setPhase("battle");
    setAnimPhase("idle");
    setAttackText("");
    setIsWaitingForOpponent(false);
    const matchedTopic = userTopics.find((t) => t.title === selectedTopicTitle);
    const pool =
      matchedTopic && matchedTopic.concepts.length > 0
        ? matchedTopic.concepts
        : DEFAULT_CS_CONCEPTS;
    setCurrentQuestion(pool[Math.floor(Math.random() * pool.length)]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const isVictory = phase === "victory";

  /* ---------------------------------------------------------------
     Directional Animation Variants
     --------------------------------------------------------------- */
  const getKnightAnimation = () => {
    switch (animPhase) {
      case "evaluating":
        return { x: 0, y: [0, -3, 0], scale: [1, 1.02, 1] };
      case "knight_attack":
        return { x: [0, 150, 0], scale: [1, 1.15, 1], rotate: [0, 12, 0] };
      case "boss_attack":
        return { x: [0, -25, 0], scale: [1, 0.85, 1], rotate: [0, -8, 0] };
      case "clash":
        return { x: [0, 85, 0], scale: [1, 1.08, 1], rotate: [0, 8, 0] };
      default:
        return { x: 0, y: [0, -6, 0], scale: [1, 1.02, 1] };
    }
  };

  const getBossAnimation = () => {
    switch (animPhase) {
      case "evaluating":
        return { x: 0, y: [0, -4, 0], scale: [1, 1.03, 1] };
      case "knight_attack":
        return { x: [0, 25, 0], scale: [1, 0.85, 1], rotate: [0, 10, 0] };
      case "boss_attack":
        return { x: [0, -150, 0], scale: [1, 1.2, 1], rotate: [0, -14, 0] };
      case "clash":
        return { x: [0, -85, 0], scale: [1, 1.08, 1], rotate: [0, -8, 0] };
      default:
        return { x: 0, y: [0, -8, 0], scale: [1, 1.03, 1] };
    }
  };

  /* ---------------------------------------------------------------
     1. MODE SELECTION SCREEN UI
     --------------------------------------------------------------- */
  if (gameMode === "select" && !matchId) {
    return (
      <section
        id="boss-fight-mode-select"
        className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto px-4 py-10"
      >
        <m.div
          className="flex flex-col items-center text-center gap-2"
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="size-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] mb-1 backdrop-blur-xl">
            <Swords size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight bg-gradient-to-r from-white via-slate-100 to-violet-400 bg-clip-text text-transparent">
            Boss Fight & 1v1 Duel Arena ⚔️
          </h1>
          <p className="text-sm font-sans text-slate-300 max-w-lg leading-relaxed">
            Kuasai materi lewat penjelasan sederhana. Latihan solo lawan AI Boss atau tantang teman kamu di 1v1 Feynman Duel bersama abang ganteng!
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Mode Option A: VS AI Boss */}
          <m.div
            className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden group border transition-all duration-300 glass-panel shadow-[0_10px_40px_rgba(239,68,68,0.15)]"
            style={{
              background:
                "radial-gradient(ellipse at 20% 20%, rgba(239,68,68,0.16) 0%, rgba(3,7,18,0.95) 80%)",
              borderColor: "rgba(239,68,68,0.35)",
            }}
            whileHover={{ y: -5, borderColor: "rgba(239,68,68,0.7)", boxShadow: "0 15px 50px rgba(239,68,68,0.3)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={() => setGameMode("vs_boss")}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black font-display tracking-widest uppercase px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                  LATIHAN SOLO PVE
                </span>
                <Skull size={22} className="text-rose-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black font-display text-slate-50 group-hover:text-rose-400 transition-colors">
                VS AI Boss
              </h2>
              <p className="text-xs font-sans text-slate-300 leading-relaxed">
                Kalahkan Knowledge Devourer secara solo. Jelaskan konsep dengan jelas untuk memberi damage, dapatkan combo, dan uji pemahaman kamu bersama abang ganteng!
              </p>
            </div>

            <m.button
              whileTap={{ scale: 0.97 }}
              type="button"
              className="text-xs py-3.5 rounded-2xl font-extrabold font-display flex items-center justify-center gap-2 cursor-pointer w-full text-white shadow-xl transition-all"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                border: "1px solid rgba(248,113,113,0.4)",
              }}
            >
              <Swords size={15} /> Mulai AI Boss Fight ⚔️
            </m.button>
          </m.div>

          {/* Mode Option B: VS Player Duel */}
          <m.div
            className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden group border transition-all duration-300 glass-panel shadow-[0_10px_40px_rgba(6,182,212,0.15)]"
            style={{
              background:
                "radial-gradient(ellipse at 20% 20%, rgba(6,182,212,0.16) 0%, rgba(3,7,18,0.95) 80%)",
              borderColor: "rgba(56,189,248,0.35)",
            }}
            whileHover={{ y: -5, borderColor: "rgba(56,189,248,0.7)", boxShadow: "0 15px 50px rgba(6,182,212,0.3)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={() => setGameMode("vs_player")}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black font-display tracking-widest uppercase px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  DUEL TEMAN PVP
                </span>
                <Users size={22} className="text-cyan-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black font-display text-slate-50 group-hover:text-cyan-300 transition-colors">
                VS Pemain (1v1 Duel)
              </h2>
              <p className="text-xs font-sans text-slate-300 leading-relaxed">
                Tantang teman kamu ke 1v1 Feynman Duel langsung pada topik dari Study Plan kamu. Dinilai langsung oleh Wasit abang ganteng!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <FriendsPanel />
            </div>
          </m.div>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------
     1.5 PRE-MATCH READY SCREEN UI (1v1 Duel Ready Check)
     --------------------------------------------------------------- */
  if (gameMode === "vs_player" && matchId && multiplayerMatch?.status === "waiting_ready") {
    const isChallenger = user?.uid === multiplayerMatch.challengerId;
    const isSelfReady = isChallenger
      ? Boolean(multiplayerMatch.challengerReady || multiplayerMatch.player1Ready)
      : Boolean(multiplayerMatch.opponentReady || multiplayerMatch.player2Ready);

    const isOpponentReady = isChallenger
      ? Boolean(multiplayerMatch.opponentReady || multiplayerMatch.player2Ready)
      : Boolean(multiplayerMatch.challengerReady || multiplayerMatch.player1Ready);

    const selfName = isChallenger ? multiplayerMatch.challengerName : multiplayerMatch.opponentName;
    const oppName = isChallenger ? multiplayerMatch.opponentName : multiplayerMatch.challengerName;

    return (
      <section
        id="boss-fight-pre-match"
        className="flex flex-col items-center gap-8 w-full max-w-3xl mx-auto px-4 py-12"
      >
        <m.div
          className="flex flex-col items-center text-center gap-2"
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleBackToSelect}
            className="self-start text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 mb-2 shadow-sm"
          >
            <ArrowLeft size={14} /> Back to Mode Select
          </m.button>
          <div className="size-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] mb-1 backdrop-blur-xl">
            <Swords size={34} className="animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight bg-gradient-to-r from-white via-slate-100 to-violet-400 bg-clip-text text-transparent">
            Persiapan Feynman Duel ⚔️
          </h1>
          <p className="text-sm font-sans text-slate-300">
            Topik: <strong className="text-cyan-300 font-bold font-display">&ldquo;{multiplayerMatch.topic}&rdquo;</strong>
          </p>
        </m.div>

        {/* Player Versus Cards & Ready Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Self Player Card */}
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-3xl glass-panel border-cyan-500/40 backdrop-blur-xl flex flex-col items-center gap-4 text-center shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            <div className="size-20 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-2xl font-black font-display text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.5)]">
              {selfName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold font-display text-slate-100 text-lg">{selfName} (Kamu)</h3>
              <p className="text-xs text-slate-400">Challenger / Duelist</p>
            </div>
            {isSelfReady ? (
              <span className="px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-black font-display flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                <CheckCircle2 size={15} className="text-emerald-400" /> SIAP ✅
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-xs font-extrabold font-display flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
                <Clock size={15} className="animate-spin text-cyan-400" /> Belum Siap ⏳
              </span>
            )}
          </m.div>

          {/* Opponent Player Card */}
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-3xl glass-panel border-rose-500/40 backdrop-blur-xl flex flex-col items-center gap-4 text-center shadow-[0_0_30px_rgba(244,63,94,0.15)]"
          >
            <div className="size-20 rounded-full bg-rose-950 border-2 border-rose-400 flex items-center justify-center text-2xl font-black font-display text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.5)]">
              {oppName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold font-display text-slate-100 text-lg">{oppName}</h3>
              <p className="text-xs text-slate-400">Lawan Duel</p>
            </div>
            {isOpponentReady ? (
              <span className="px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-black font-display flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                <CheckCircle2 size={15} className="text-emerald-400" /> SIAP ✅
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-xs font-extrabold font-display flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
                <Clock size={15} className="animate-spin text-cyan-400" /> Belum Siap ⏳
              </span>
            )}
          </m.div>
        </div>

        {/* Status Indicator Banner */}
        <div className="w-full max-w-md p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-xl animate-pulse">
          <Loader2 size={16} className="animate-spin text-cyan-400 shrink-0" />
          <span>
            {!isOpponentReady
              ? "Menunggu lawan bergabung & menekan SIAP / READY..."
              : "Lawan sudah SIAP! Menunggu kamu menekan SIAP / READY untuk memulai..."}
          </span>
        </div>

        {/* Ready Button Trigger */}
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          {!isSelfReady ? (
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              id="boss-fight-ready-btn"
              onClick={async () => {
                if (user && matchId) {
                  await setPlayerReadyInMatch(matchId, user.uid);
                }
              }}
              className="w-full py-4 px-8 rounded-2xl text-base font-black font-display text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
                border: "1px solid rgba(56,189,248,0.6)",
              }}
            >
              <Swords size={20} /> SIAP / READY ⚔️
            </m.button>
          ) : (
            <div className="p-4 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs font-bold text-center animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              Kamu sudah siap! Menunggu lawan menekan SIAP / READY ⚔️ untuk memulai pertandingan...
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------
     2. ARENA GAMEPLAY UI (VS BOSS & VS PLAYER)
     --------------------------------------------------------------- */
  const isMultiplayer = gameMode === "vs_player" && multiplayerMatch !== null;
  const opponentName = isMultiplayer
    ? user?.uid === multiplayerMatch?.challengerId
      ? multiplayerMatch?.opponentName
      : multiplayerMatch?.challengerName
    : "Knowledge Devourer";

  return (
    <>
      {/* 3-2-1 Match Start Countdown Overlay */}
      <AnimatePresence>
        {startCountdown !== null && (
          <m.div
            key={`countdown-overlay-${startCountdown}`}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <m.div
              className="flex flex-col items-center gap-4 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="size-20 rounded-3xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.4)] mb-2">
                <Swords size={40} className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-black font-display tracking-tight text-slate-100">
                KEDUA PEMAIN SIAP! ⚔️
              </h2>
              <p className="text-xs text-slate-300 font-sans">
                Pertandingan 1v1 Feynman Duel segera dimulai bersama abang ganteng...
              </p>

              <m.div
                key={startCountdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="my-4 text-7xl font-black font-display tracking-widest bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.8)]"
              >
                {startCountdown > 0 ? startCountdown : "MULAI! ⚔️"}
              </m.div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <section
        id="boss-fight-arena"
        aria-label="Feynman Boss Fight Arena"
        className={cn(
          "flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 py-6 transition-all duration-100",
          isScreenShaking && "animate-shake"
        )}
      >
      {/* Mode Bar Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          id="boss-fight-back-to-select"
          onClick={handleBackToSelect}
          className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft size={14} /> Back to Mode Select
        </button>

        <div className="flex items-center gap-2">
          {gameMode === "vs_player" && phase === "battle" && (
            <>
              <div className="relative">
                <button
                  type="button"
                  id="boss-fight-taunt-menu-btn"
                  onClick={() => setShowTauntMenu((prev) => !prev)}
                  className="text-xs font-black font-display text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                  title="Kirim Pesan Taunt / Emote"
                >
                  <MessageSquare size={13} className="text-cyan-400" />
                  <span>Taunt</span>
                </button>

                <AnimatePresence>
                  {showTauntMenu && (
                    <m.div
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 8 }}
                      className="absolute right-0 top-full mt-2 z-40 p-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl flex flex-col gap-1.5 w-48"
                    >
                      <div className="flex items-center justify-between text-[10px] font-black font-display tracking-wider uppercase text-cyan-400 px-2 pt-1 pb-0.5 border-b border-cyan-500/20">
                        <span>KIRIM TAUNT:</span>
                        <Smile size={12} className="text-cyan-400" />
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        {PRESET_TAUNTS.map((tauntText) => (
                          <button
                            key={tauntText}
                            type="button"
                            onClick={async () => {
                              setShowTauntMenu(false);
                              if (matchId && user) {
                                const senderName =
                                  user.displayName || "Scholar";
                                await sendDuelTaunt(
                                  matchId,
                                  user.uid,
                                  senderName,
                                  tauntText
                                );
                              }
                            }}
                            className="text-left text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-200 text-slate-200 border border-slate-700/60 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-between active:scale-95"
                          >
                            <span>💬 &ldquo;{tauntText}&rdquo;</span>
                          </button>
                        ))}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                id="boss-fight-surrender-btn"
                onClick={() => setShowSurrenderModal(true)}
                className="text-xs font-black font-display text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                title="Menyerah dari pertandingan duel ini"
              >
                <Flag size={13} className="text-rose-400" /> Menyerah
              </button>
            </>
          )}

          <span className="text-[11px] font-bold font-display px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            {gameMode === "vs_player" ? (
              <>
                <Users size={13} className="text-cyan-400" /> 1v1 PvP Friend Duel
              </>
            ) : (
              <>
                <Skull size={13} className="text-rose-400" /> Solo AI Boss
              </>
            )}
          </span>
        </div>
      </div>

      {/* Cybernetic VS Matchmaking Header */}
      <m.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-11 rounded-2xl flex items-center justify-center flex-shrink-0 border",
              isMultiplayer
                ? "bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                : "bg-rose-500/10 border-rose-400/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
            )}
            aria-hidden="true"
          >
            <Swords
              size={22}
              className={isMultiplayer ? "text-cyan-400" : "text-rose-500"}
              strokeWidth={2}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-violet-400 bg-clip-text text-transparent">
              {isMultiplayer ? `1v1 Duel vs ${opponentName}` : "Boss Fight & Duel Arena"}
            </h1>
            <p className="text-[12px] font-sans mt-1 text-slate-400">
              {isMultiplayer
                ? "Pertandingan 1v1 simultan — Wasit abang ganteng menilai penjelasan kamu!"
                : "Kuasai materi dengan menjelaskannya secara sederhana untuk memberi damage!"}
            </p>
          </div>
        </div>

        {/* Study Plan Topic Switcher Dropdown */}
        {!isMultiplayer ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-xs text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)] backdrop-blur-md">
            <BookOpen size={13} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] font-bold font-display text-slate-300 hidden sm:inline">Pilih Topik:</span>
            <select
              id="boss-fight-topic-select"
              value={selectedTopicTitle}
              onChange={(e) => handleTopicChange(e.target.value)}
              disabled={isBusy || phase !== "battle"}
              className="bg-transparent text-xs font-black font-display text-cyan-200 outline-none cursor-pointer border-none py-0 pr-2 focus:ring-0 disabled:opacity-50"
              aria-label="Pilih Topik Belajar"
            >
              {userTopics.map((topic) => (
                <option key={topic.id} value={topic.title} className="bg-slate-900 text-slate-100 font-sans">
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/35 text-[11px] text-cyan-300 font-bold font-display shadow-sm backdrop-blur-md">
            <BookOpen size={13} className="text-cyan-400" />
            <span>Topik Match: {multiplayerMatch?.topic || selectedTopicTitle}</span>
          </div>
        )}
      </m.div>

      {/* Duel Waiting Banner (Multiplayer Mode) */}
      {isMultiplayer && (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-3.5 rounded-2xl text-xs font-extrabold font-display flex items-center justify-between border backdrop-blur-xl",
            isWaitingForOpponent
              ? "bg-cyan-950/85 border-cyan-500/50 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)] animate-pulse"
              : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
          )}
        >
          <div className="flex items-center gap-2">
            {isWaitingForOpponent ? (
              <>
                <Clock size={16} className="animate-spin text-cyan-400" />
                <span>Menunggu {opponentName} mengirimkan jawaban...</span>
              </>
            ) : (
              <>
                <Zap size={16} className="text-emerald-400 animate-bounce" />
                <span>TULIS PENJELASAN FEYNMAN KAMU & SERANG!</span>
              </>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
            Synced via Firestore
          </span>
        </m.div>
      )}

      {/* Health Meters & Combat HUD Cards */}
      <m.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Scholar (Player) HUD */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden glass-panel"
          style={{
            background:
              "radial-gradient(ellipse at top left, rgba(6,182,212,0.14) 0%, rgba(3,7,18,0.92) 80%)",
            border: "1px solid rgba(56,189,248,0.35)",
            boxShadow: "0 10px 30px rgba(6,182,212,0.12)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <User size={14} className="text-cyan-300" />
              </div>
              <span className="text-[11px] font-black font-display tracking-[0.18em] uppercase text-cyan-300">
                {user?.displayName || "You"}
              </span>
            </div>

            {combo > 1 && (
              <m.span
                key={combo}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[11px] font-black font-display px-3 py-0.5 rounded-full flex items-center gap-1 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                style={{
                  background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.2) 100%)",
                  border: "1px solid rgba(6,182,212,0.4)",
                }}
              >
                <Flame size={13} className="text-cyan-400 fill-cyan-400 animate-pulse" /> ×
                {combo} Combo
              </m.span>
            )}
          </div>

          <HealthBar
            label="Your HP"
            current={playerHp}
            max={PLAYER_MAX_HP}
            color="linear-gradient(90deg, #06b6d4, #8b5cf6)"
            glowColor="rgba(6, 182, 212, 0.7)"
            icon={Heart}
          />
        </div>

        {/* Opponent / Boss HUD */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden glass-panel"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(239,68,68,0.14) 0%, rgba(3,7,18,0.92) 80%)",
            border: "1px solid rgba(239,68,68,0.35)",
            boxShadow: "0 10px 30px rgba(239,68,68,0.12)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                {isMultiplayer ? (
                  <User size={14} className="text-rose-400" />
                ) : (
                  <Skull size={14} className="text-rose-400" />
                )}
              </div>
              <span className="text-[11px] font-black font-display tracking-[0.18em] uppercase text-rose-400 truncate max-w-[150px]">
                {opponentName}
              </span>
            </div>

            <span className="text-[11px] font-extrabold font-display px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 tabular-nums shadow-sm">
              {Math.max(
                0,
                Math.round(
                  (bossHp / (isMultiplayer ? PLAYER_MAX_HP : BOSS_MAX_HP)) *
                    100
                )
              )}
              % HP
            </span>
          </div>

          <HealthBar
            label={isMultiplayer ? `${opponentName}'s HP` : "Boss HP"}
            current={bossHp}
            max={isMultiplayer ? PLAYER_MAX_HP : BOSS_MAX_HP}
            color="linear-gradient(90deg, #ec4899, #f43f5e)"
            glowColor="rgba(244, 63, 94, 0.7)"
            icon={Zap}
          />
        </div>
      </m.div>

      {/* Main Game Battle Stage */}
      <m.div
        className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-between p-6 sm:p-8 backdrop-blur-2xl border border-white/10 shadow-[0_0_90px_rgba(239,68,68,0.15)_inset,0_20px_60px_rgba(0,0,0,0.7)]"
        style={{
          minHeight: "380px",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(153,27,27,0.22) 0%, rgba(3,7,18,0.97) 75%)",
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Animated Cyber Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.8) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
          aria-hidden="true"
        />

        {/* Phase 1: Evaluating Indicator Banner */}
        <AnimatePresence>
          {animPhase === "evaluating" && (
            <m.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-3 z-30 px-5 py-2.5 rounded-full bg-cyan-950/95 border border-cyan-400/60 text-cyan-200 text-xs font-bold font-display flex items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md"
            >
              <Loader2 size={15} className="animate-spin text-cyan-400" />
              <span>
                {isMultiplayer
                  ? "Wasit abang ganteng sedang menilai kedua jawaban 1v1..."
                  : "abang ganteng sedang menilai jawaban kamu..."}
              </span>
            </m.div>
          )}
        </AnimatePresence>

        {/* Floating Damage Numbers */}
        <AnimatePresence>
          {latestBossDamage !== null && (
            <FloatingDamage
              key={`boss-dmg-${Date.now()}`}
              value={latestBossDamage}
            />
          )}
          {latestPlayerDamage !== null && (
            <FloatingDamage
              key={`player-dmg-${Date.now()}`}
              value={latestPlayerDamage}
              isPlayer
            />
          )}
        </AnimatePresence>

        {/* Attack Slash Flash Effect Overlay */}
        <AnimatePresence>
          {isSlashActive && (
            <m.div
              className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {animPhase === "knight_attack" && (
                <div
                  className="w-[200%] h-12 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 left-[-50%] -rotate-45 blur-sm"
                  style={{ boxShadow: "0 0 40px #38bdf8" }}
                />
              )}
              {animPhase === "boss_attack" && (
                <div
                  className="w-[200%] h-12 bg-gradient-to-r from-transparent via-rose-500 to-transparent absolute top-1/2 left-[-50%] rotate-45 blur-sm"
                  style={{ boxShadow: "0 0 40px #f43f5e" }}
                />
              )}
              {animPhase === "clash" && (
                <>
                  <div
                    className="w-[200%] h-10 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 left-[-50%] -rotate-45 blur-sm"
                    style={{ boxShadow: "0 0 35px #38bdf8" }}
                  />
                  <div
                    className="w-[200%] h-10 bg-gradient-to-r from-transparent via-rose-500 to-transparent absolute top-1/2 left-[-50%] rotate-45 blur-sm"
                    style={{ boxShadow: "0 0 35px #f43f5e" }}
                  />
                </>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Top: Question Combat Card */}
        <div className="z-10 w-full flex flex-col items-center gap-2 mb-4">
          <m.div
            className="relative max-w-lg w-full px-5 py-4 rounded-2xl text-center shadow-2xl backdrop-blur-xl border border-rose-500/40 shadow-[0_10px_35px_rgba(239,68,68,0.25)]"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(153,27,27,0.45) 0%, rgba(3,7,18,0.95) 80%)",
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentQuestion}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="text-[10px] font-black font-display uppercase tracking-widest text-rose-400 flex items-center gap-1.5 truncate">
                <Sparkles size={13} className="text-cyan-400 shrink-0 animate-pulse" /> Konsep Duel ({selectedTopicTitle}):
              </span>
              {!isMultiplayer && (
                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  id="boss-fight-reroll-question"
                  onClick={handleRerollQuestion}
                  disabled={isBusy || phase !== "battle"}
                  className="text-[10px] font-extrabold font-display text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 cursor-pointer shrink-0 shadow-sm"
                  title="Ganti soal dalam topik ini"
                >
                  <RefreshCw size={11} className="text-cyan-400" /> Ganti Soal
                </m.button>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-extrabold font-display text-slate-50 leading-snug">
              &ldquo;Jelaskan{" "}
              <span className="text-cyan-300 underline underline-offset-4 decoration-cyan-400/60 font-black">
                {currentQuestion}
              </span>{" "}
              secara singkat dan jelas!&rdquo;
            </h3>
            <div
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px]"
              style={{ borderTopColor: "rgba(239, 68, 68, 0.45)" }}
            />
          </m.div>
        </div>

        {/* Center: Face-off Arena Characters */}
        <div className="relative z-10 w-full flex items-center justify-around my-4 sm:my-6">
          {/* 1. Player Knight Avatar (Blue Scholar) */}
          <div className="flex flex-col items-center gap-2 relative">
            {/* Realtime Animated Floating Speech Bubble (Player) */}
            <AnimatePresence>
              {activeTaunt && activeTaunt.senderId === user?.uid && (
                <m.div
                  initial={{ opacity: 0, scale: 0.5, y: 15 }}
                  animate={{ opacity: 1, scale: 1.05, y: -12 }}
                  exit={{ opacity: 0, scale: 0.7, y: -25 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="absolute -top-14 z-30 px-3.5 py-1.5 rounded-2xl bg-cyan-950/95 border border-cyan-400/80 text-cyan-200 text-xs font-black font-display shadow-[0_0_20px_rgba(6,182,212,0.6)] backdrop-blur-md whitespace-nowrap"
                >
                  <span>💬 &ldquo;{activeTaunt.text}&rdquo;</span>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-cyan-400/80" />
                </m.div>
              )}
            </AnimatePresence>

            <m.div
              className="relative size-28 sm:size-36 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 45%, #0369a1 80%, #030712 100%)",
                border: "2px solid rgba(56, 189, 248, 0.6)",
                boxShadow:
                  "0 0 35px rgba(6, 182, 212, 0.45), 0 0 70px rgba(14, 165, 233, 0.25)",
              }}
              animate={getKnightAnimation()}
              transition={
                animPhase === "idle"
                  ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.8, ease: "easeInOut" }
              }
            >
              <div className="size-20 sm:size-24 rounded-full border border-cyan-300/40 bg-cyan-950/40 flex items-center justify-center">
                <Swords
                  size={42}
                  className="text-cyan-100 drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]"
                />
              </div>
              <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-[10px] font-extrabold font-display text-cyan-300 uppercase tracking-widest shadow-md">
                You
              </div>
            </m.div>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center opacity-60">
            <span className="text-xl sm:text-2xl font-black font-display text-rose-500 italic tracking-widest">
              VS
            </span>
          </div>

          {/* 2. Opponent Player Knight Avatar (Red/Crimson Scholar) */}
          <div className="flex flex-col items-center gap-2 relative">
            {/* Realtime Animated Floating Speech Bubble (Opponent) */}
            <AnimatePresence>
              {activeTaunt && activeTaunt.senderId !== user?.uid && (
                <m.div
                  initial={{ opacity: 0, scale: 0.5, y: 15 }}
                  animate={{ opacity: 1, scale: 1.05, y: -12 }}
                  exit={{ opacity: 0, scale: 0.7, y: -25 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="absolute -top-14 z-30 px-3.5 py-1.5 rounded-2xl bg-rose-950/95 border border-rose-400/80 text-rose-200 text-xs font-black font-display shadow-[0_0_20px_rgba(244,63,94,0.6)] backdrop-blur-md whitespace-nowrap"
                >
                  <span>💬 &ldquo;{activeTaunt.text}&rdquo;</span>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-rose-400/80" />
                </m.div>
              )}
            </AnimatePresence>

            <m.div
              className="relative size-32 sm:size-40 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, #ef4444 0%, #991b1b 45%, #450a0a 80%, #030712 100%)",
                border: "2px solid rgba(248, 113, 113, 0.5)",
                boxShadow:
                  animPhase !== "idle"
                    ? "0 0 65px rgba(239, 68, 68, 0.85), 0 0 110px rgba(220, 38, 38, 0.55)"
                    : "0 0 50px rgba(239, 68, 68, 0.5), 0 0 95px rgba(153, 27, 27, 0.3)",
              }}
              animate={getBossAnimation()}
              transition={
                animPhase === "idle"
                  ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.8, ease: "easeInOut" }
              }
            >
              <div className="size-24 sm:size-28 rounded-full border border-rose-400/40 bg-rose-950/50 flex items-center justify-center">
                {isMultiplayer ? (
                  <Swords
                    size={44}
                    className="text-rose-100 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]"
                  />
                ) : (
                  <Skull
                    size={48}
                    className="text-rose-100 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]"
                  />
                )}
              </div>

              <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-500 text-[10px] font-extrabold font-display text-rose-300 uppercase tracking-widest shadow-md flex items-center gap-1 max-w-[140px] truncate">
                <User size={11} /> {opponentName}
              </div>
            </m.div>
          </div>
        </div>
      </m.div>

      {/* Victory / Defeat Overlay Modals */}
      <AnimatePresence>
        {phase !== "battle" && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <m.div
              className="flex flex-col items-center gap-6 p-8 sm:p-10 rounded-3xl text-center max-w-md w-full backdrop-blur-2xl glass-panel"
              style={{
                background: isVictory
                  ? "linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(3,11,34,0.97) 100%)"
                  : "linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(3,11,34,0.97) 100%)",
                border: isVictory
                  ? "1px solid rgba(34,197,94,0.4)"
                  : "1px solid rgba(239,68,68,0.4)",
                boxShadow: isVictory
                  ? "0 30px 90px rgba(34,197,94,0.3)"
                  : "0 30px 90px rgba(239,68,68,0.3)",
              }}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <div
                className="size-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl"
                style={{
                  background: isVictory
                    ? "rgba(34,197,94,0.18)"
                    : "rgba(239,68,68,0.18)",
                  border: isVictory
                    ? "1px solid rgba(34,197,94,0.4)"
                    : "1px solid rgba(239,68,68,0.4)",
                }}
              >
                {isVictory ? (
                  <Trophy size={40} className="text-emerald-400" />
                ) : (
                  <Skull size={40} className="text-rose-500" />
                )}
              </div>

              <div>
                <h2
                  className="text-3xl font-black font-display"
                  style={{
                    color: isVictory
                      ? "rgba(34,197,94,0.95)"
                      : "rgba(239,68,68,0.95)",
                  }}
                >
                  {isVictory
                    ? isMultiplayer
                      ? "Juara Duel 1v1! 🏆"
                      : "Kemenangan Telak! 🎉"
                    : isMultiplayer
                    ? "Terkalahkan di Duel! ⚔️"
                    : "Belum Berhasil Kalahkan Boss!"}
                </h2>
                <p className="text-[13px] font-sans mt-2 leading-relaxed text-slate-300">
                  {isVictory
                    ? `Kamu berhasil mengalahkan ${opponentName} dengan penjelasan Feynman super simpel!`
                    : `${opponentName} berhasil menang di duel Feynman ini. Yuk pelajari lagi materi kamu dan tanding lagi bersama abang ganteng!`}
                </p>
              </div>

              {/* Victory Badge & Rewards */}
              {isVictory && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    {[...Array(3)].map((_, i) => (
                      <m.div
                        key={i}
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                      >
                        <Star
                          size={26}
                          className="text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        />
                      </m.div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-display">
                    <Award size={14} className="text-emerald-400" />
                    <span>+150 XP · Victory Badge Awarded 🎖️</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  id="boss-fight-play-again"
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-bold font-display transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  style={{
                    background: isVictory
                      ? "linear-gradient(135deg, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0.10) 100%)"
                      : "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(6,182,212,0.10) 100%)",
                    border: isVictory
                      ? "1px solid rgba(34,197,94,0.4)"
                      : "1px solid rgba(139,92,246,0.4)",
                    color: isVictory
                      ? "rgba(34,197,94,0.95)"
                      : "#c084fc",
                  }}
                >
                  {isVictory ? (
                    <>
                      <Swords size={16} /> Play Next Match
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} /> Try Again
                    </>
                  )}
                </m.button>

                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleBackToSelect}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-bold font-display transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <ArrowLeft size={16} /> Menu Game
                </m.button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Surrender Confirmation Modal */}
      <AnimatePresence>
        {showSurrenderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 text-center border shadow-2xl backdrop-blur-2xl glass-panel"
              style={{
                background:
                  "linear-gradient(135deg, rgba(153,27,27,0.35) 0%, rgba(3,11,34,0.96) 100%)",
                borderColor: "rgba(239,68,68,0.45)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              }}
            >
              <div className="size-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
                <Flag size={28} />
              </div>

              <div>
                <h3 className="text-xl font-black font-display text-slate-50">
                  Yakin mau menyerah? 🏳️
                </h3>
                <p className="text-xs font-sans text-slate-300 leading-relaxed mt-2">
                  Pertandingan 1v1 duel ini akan langsung selesai dan lawan kamu akan dinyatakan sebagai pemenang.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSurrenderModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  id="boss-fight-confirm-surrender"
                  onClick={async () => {
                    setShowSurrenderModal(false);
                    if (matchId && user) {
                      await surrenderMatch(matchId, user.uid);
                    }
                    setPlayerHp(0);
                    setPhase("defeat");
                    setIsWaitingForOpponent(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold font-display text-xs cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Flag size={14} /> Ya, Menyerah
                </m.button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Question & Answer Combat Arena (Input Box) */}
      <m.div
        className={cn(
          "relative rounded-2xl overflow-hidden backdrop-blur-xl glass-panel transition-all duration-300",
          isBusy
            ? "border-cyan-400/60 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
            : "border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        )}
        style={{
          background:
            "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(3,7,18,0.92) 100%)",
        }}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Waiting for Opponent Animated Overlay */}
        <AnimatePresence>
          {isWaitingForOpponent && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center p-6 text-center gap-3 backdrop-blur-md"
              style={{
                background:
                  "linear-gradient(135deg, rgba(3,11,34,0.96) 0%, rgba(6,182,212,0.25) 100%)",
                border: "1px solid rgba(56,189,248,0.35)",
                boxShadow: "0 15px 45px rgba(0,0,0,0.6)",
              }}
            >
              <div className="relative flex items-center justify-center">
                <div className="size-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg">
                  <Clock size={24} className="text-cyan-300 animate-spin" />
                </div>
                <Swords size={14} className="absolute -bottom-1 -right-1 text-cyan-400 animate-bounce" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-sm font-extrabold font-display text-slate-100 tracking-tight">
                  Jawaban Terkirim!
                </span>
                <span className="text-xs font-sans text-slate-300 leading-relaxed">
                  {opponentInactive
                    ? "Lawan kamu belum merespons (Offline atau meninggalkan pertandingan)."
                    : `Menunggu jawaban lawan kamu... (${waitingSeconds}s)`}
                </span>
              </div>

              {opponentInactive ? (
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={async () => {
                    if (!matchId || !user) return;
                    await forfeitMatchDueToDisconnect(
                      matchId,
                      user.uid,
                      "Lawan tidak merespons (Offline / Abandoned). Kemenangan diberikan secara WO!"
                    );
                    setPhase("victory");
                    setIsWaitingForOpponent(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold font-display text-xs shadow-lg transition-all cursor-pointer mt-1 flex items-center gap-1.5"
                >
                  <Trophy size={14} /> Klaim Kemenangan (WO)
                </m.button>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-[11px] font-semibold text-cyan-300 animate-pulse">
                  <Loader2 size={12} className="animate-spin text-cyan-400" />
                  <span>Menyingkronkan Jawaban Kedua Pemain...</span>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Dynamic Turn Countdown Timer Bar */}
        <div className="w-full px-4 pt-3 pb-2 border-b border-white/10 flex flex-col gap-1.5 bg-slate-950/70">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Clock
                size={13}
                className={
                  turnTimeLeft <= 10
                    ? "text-rose-400 animate-pulse"
                    : "text-cyan-400"
                }
              />
              <span className="font-display">Sisa Waktu Turn:</span>
              <span
                className={cn(
                  "font-mono text-xs",
                  turnTimeLeft <= 10
                    ? "text-rose-400 font-extrabold"
                    : "text-cyan-300 font-bold"
                )}
              >
                {turnTimeLeft}s
              </span>
            </div>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-display uppercase border",
                diffInfo.badgeColor
              )}
            >
              Bobot Soal: {diffInfo.weightLabel} ({diffInfo.timeLimit}s)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-white/10">
            <div
              className={cn(
                "h-full transition-all duration-1000",
                turnTimeLeft <= 10
                  ? "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
                  : turnTimeLeft <= 20
                  ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                  : "bg-gradient-to-r from-cyan-500 to-violet-500 shadow-[0_0_10px_#38bdf8]"
              )}
              style={{
                width: `${Math.max(
                  0,
                  (turnTimeLeft / diffInfo.timeLimit) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Label Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Swords
              size={13}
              className="text-cyan-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <label
              htmlFor="boss-fight-attack-input"
              className="text-[11px] font-extrabold font-display tracking-[0.14em] uppercase text-cyan-300"
            >
              Serangan Jawaban Singkat
            </label>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">
            {attackText.trim().split(/\s+/).filter(Boolean).length} kata
          </span>
        </div>

        {/* Textarea */}
        <textarea
          id="boss-fight-attack-input"
          ref={inputRef}
          value={attackText}
          onChange={(e) => setAttackText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Jelaskan '${currentQuestion}' (${selectedTopicTitle}) secara singkat dan jelas...`}
          disabled={isBusy || phase !== "battle"}
          rows={3}
          className="w-full resize-none outline-none text-[13px] leading-relaxed px-4 py-3 placeholder:italic disabled:opacity-50 bg-transparent text-slate-100 font-sans hover:border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-950/20 transition-all"
          aria-label="Tulis penjelasan konsep kamu untuk menyerang lawan"
        />

        {/* Action Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
          <p className="text-[11px] font-sans text-slate-400 hidden sm:block">
            {!isWaitingForOpponent ? (
              <>
                Tekan{" "}
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 border border-white/15 text-slate-200">
                  Enter
                </kbd>{" "}
                untuk menyerang · abang ganteng menilai kesederhanaan & akurasi
              </>
            ) : (
              <span>Menunggu lawan menyerahkan jawaban...</span>
            )}
          </p>

          <m.button
            id="boss-fight-send-attack"
            type="button"
            onClick={handleAttack}
            disabled={!attackText.trim() || isBusy || phase !== "battle"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="text-xs px-5 py-2.5 rounded-xl ml-auto font-bold font-display flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
          >
            {animPhase === "evaluating" ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Menilai...
              </>
            ) : isWaitingForOpponent ? (
              <>
                <Clock size={14} className="animate-spin" /> Menunggu Lawan...
              </>
            ) : isBusy ? (
              <>
                <Swords size={14} className="animate-bounce" /> Menyerang...
              </>
            ) : (
              <>
                <Send size={14} /> Serang!
              </>
            )}
          </m.button>
        </div>
      </m.div>

      {/* Battle Log History */}
      {battleLog.length > 0 && (
        <m.div
          className="rounded-2xl overflow-hidden flex flex-col glass-panel"
          style={{
            background: "rgba(3,11,34,0.65)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <Shield size={13} className="text-slate-300" aria-hidden="true" />
              <span className="text-[11px] font-extrabold font-display tracking-[0.14em] uppercase text-slate-300">
                Battle History
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              {battleLog.length} turns recorded
            </span>
          </div>

          <div
            className="flex flex-col gap-0 max-h-56 overflow-y-auto"
            role="log"
            aria-label="Attack history"
            aria-live="polite"
          >
            {battleLog.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 px-4 py-3 border-b border-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono font-bold flex-shrink-0">
                      {entry.concept}
                    </span>
                    <p className="text-[12px] font-sans leading-relaxed text-slate-200">
                      {entry.explanation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold font-display text-rose-400 tabular-nums">
                      -{entry.damageDealt} HP
                    </span>
                    {entry.playerDamageTaken > 0 && (
                      <span className="text-[11px] font-bold font-display text-cyan-400 tabular-nums">
                        -{entry.playerDamageTaken} Self HP
                      </span>
                    )}
                  </div>
                </div>

                {entry.bossFeedback && (
                  <div
                    className={cn(
                      "ml-4 px-3.5 py-2 rounded-xl flex items-start gap-2.5 border",
                      entry.isCorrect
                        ? "bg-emerald-950/30 border-emerald-500/30"
                        : "bg-rose-950/30 border-rose-500/30"
                    )}
                  >
                    <Skull
                      size={14}
                      className={cn(
                        "flex-shrink-0 mt-0.5",
                        entry.isCorrect ? "text-emerald-400" : "text-rose-400"
                      )}
                    />
                    <p
                      className={cn(
                        "text-[11px] italic font-sans leading-relaxed",
                        entry.isCorrect ? "text-slate-200" : "text-rose-300"
                      )}
                    >
                      &ldquo;{entry.bossFeedback}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </m.div>
      )}
    </section>
  </>
);
}
