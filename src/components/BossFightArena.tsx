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
  getMatchStatus,
  type MultiplayerMatch,
} from "@/lib/firebase/friends";
import { useSearchParams, useRouter } from "next/navigation";
import FriendsPanel from "@/components/friends/FriendsPanel";

/* ---------------------------------------------------------------
   Types & Constants
   --------------------------------------------------------------- */
export type GameMode = "select" | "vs_boss" | "vs_player";

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
      className={`absolute ${
        isPlayer ? "left-8 top-12" : "right-8 top-12"
      } pointer-events-none select-none z-30`}
      initial={{ opacity: 1, y: 0, scale: 1.5 }}
      animate={{ opacity: 0, y: -65, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <span
        className={`text-3xl font-black tracking-wider ${
          isPlayer ? "text-amber-400" : "text-rose-500"
        }`}
        style={{
          fontFamily: "var(--font-outfit)",
          textShadow: isPlayer
            ? "0 0 16px rgba(251,191,36,0.8), 0 0 30px rgba(245,158,11,0.4)"
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
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={14} style={{ color }} aria-hidden="true" />
          <span
            className="text-[11px] font-extrabold tracking-[0.14em] uppercase"
            style={{ color: "var(--color-silver-300)" }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{ fontFamily: "var(--font-outfit)", color }}
        >
          {current}/{max}
        </span>
      </div>
      <div
        className="h-3 w-full rounded-full overflow-hidden"
        style={{
          background: "rgba(2, 7, 26, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6) inset",
        }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label} health points`}
      >
        <m.div
          className="h-full rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 12px ${glowColor}`,
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get("topic");
  const matchId = searchParams.get("matchId");

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
  const [studyPlanConcepts, setStudyPlanConcepts] = useState<string[]>([]);
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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const isBusy = animPhase !== "idle" || isWaitingForOpponent;

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
  async function handleAttack() {
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

        // BOTH players have submitted! Call Gemini Referee via /api/evaluate-duel
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
  }

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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg mb-1">
            <Swords size={26} />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-slate-50 tracking-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Feynman Arena — Pilih Mode
          </h1>
          <p className="text-sm text-slate-400 max-w-lg">
            Kuasai materi lewat penjelasan sederhana. Latihan solo lawan AI Boss atau tantang teman kamu di 1v1 Feynman Duel!
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Mode Option A: VS AI Boss */}
          <m.div
            className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden group border transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(3,11,34,0.92) 100%)",
              borderColor: "rgba(239,68,68,0.3)",
              boxShadow: "0 10px 40px rgba(239,68,68,0.15)",
            }}
            whileHover={{ y: -4, borderColor: "rgba(239,68,68,0.6)" }}
            onClick={() => setGameMode("vs_boss")}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400">
                  LATIHAN SOLO PVE
                </span>
                <Skull size={20} className="text-rose-500" />
              </div>
              <h2
                className="text-2xl font-black text-slate-50 group-hover:text-rose-400 transition-colors"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                VS AI Boss
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kalahkan Knowledge Devourer secara solo. Jelaskan konsep dengan jelas untuk memberi damage, dapatkan combo, dan uji pemahaman kamu bersama abang ganteng!
              </p>
            </div>

            <button
              type="button"
              className="skeuo-btn text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer w-full"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              }}
            >
              <Swords size={15} /> Mulai AI Boss Fight
            </button>
          </m.div>

          {/* Mode Option B: VS Player Duel */}
          <m.div
            className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden group border transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(3,11,34,0.92) 100%)",
              borderColor: "rgba(56,189,248,0.3)",
              boxShadow: "0 10px 40px rgba(6,182,212,0.15)",
            }}
            whileHover={{ y: -4, borderColor: "rgba(56,189,248,0.6)" }}
            onClick={() => setGameMode("vs_player")}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  DUEL TEMAN PVP
                </span>
                <Users size={20} className="text-cyan-400" />
              </div>
              <h2
                className="text-2xl font-black text-slate-50 group-hover:text-cyan-300 transition-colors"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                VS Pemain (Duel)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
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
     2. ARENA GAMEPLAY UI (VS BOSS & VS PLAYER)
     --------------------------------------------------------------- */
  const isMultiplayer = gameMode === "vs_player" && multiplayerMatch !== null;
  const opponentName = isMultiplayer
    ? user?.uid === multiplayerMatch?.challengerId
      ? multiplayerMatch?.opponentName
      : multiplayerMatch?.challengerName
    : "Knowledge Devourer";

  return (
    <section
      id="boss-fight-arena"
      aria-label="Feynman Boss Fight Arena"
      className={`flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 py-6 transition-all duration-100 ${
        isScreenShaking ? "animate-shake" : ""
      }`}
    >
      {/* Mode Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setGameMode("select")}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Mode Select
        </button>

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
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

      {/* Title Header */}
      <m.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isMultiplayer
                ? "linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(6,182,212,0.08) 100%)"
                : "linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.08) 100%)",
              border: isMultiplayer
                ? "1px solid rgba(6,182,212,0.35)"
                : "1px solid rgba(239,68,68,0.35)",
              boxShadow: isMultiplayer
                ? "0 0 20px rgba(6,182,212,0.2)"
                : "0 0 20px rgba(239,68,68,0.2)",
            }}
            aria-hidden="true"
          >
            <Swords
              size={22}
              className={isMultiplayer ? "text-cyan-400" : "text-rose-500"}
              strokeWidth={2}
            />
          </div>
          <div>
            <h1
              className="text-2xl font-black tracking-tight leading-none text-slate-50"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              {isMultiplayer ? `1v1 Duel vs ${opponentName}` : "Feynman Boss Fight"}
            </h1>
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--color-silver-400)" }}
            >
              {isMultiplayer
                ? "Simultaneous 1v1 duel — Referee abang ganteng evaluates both answers!"
                : "Master topics by explaining them simply to deal damage!"}
            </p>
          </div>
        </div>

        {/* Study Plan Topic Switcher Dropdown */}
        {!isMultiplayer ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-xs text-cyan-300 shadow-md">
            <BookOpen size={13} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">Pilih Topik:</span>
            <select
              id="boss-fight-topic-select"
              value={selectedTopicTitle}
              onChange={(e) => handleTopicChange(e.target.value)}
              disabled={isBusy || phase !== "battle"}
              className="bg-transparent text-xs font-extrabold text-cyan-200 outline-none cursor-pointer border-none py-0 pr-2 focus:ring-0 disabled:opacity-50"
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold">
            <BookOpen size={13} className="text-cyan-400" />
            <span>Topik Match: {multiplayerMatch?.topic || selectedTopicTitle}</span>
          </div>
        )}
      </m.div>

      {/* Duel Waiting Banner (Multiplayer Mode) */}
      {isMultiplayer && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            isWaitingForOpponent
              ? "bg-amber-950/80 border-amber-500/40 text-amber-300 shadow-md"
              : "bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-md"
          }`}
        >
          <div className="flex items-center gap-2">
            {isWaitingForOpponent ? (
              <>
                <Clock size={15} className="animate-spin text-amber-400" />
                <span>Waiting for {opponentName} to submit answer...</span>
              </>
            ) : (
              <>
                <Zap size={15} className="text-emerald-400 animate-bounce" />
                <span>TYPE YOUR FEYNMAN EXPLANATION & STRIKE!</span>
              </>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
            Synced via Firestore
          </span>
        </div>
      )}

      {/* Combat HUD Bars */}
      <m.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        {/* Scholar (Player) HUD */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(3,11,34,0.85) 100%)",
            border: "1px solid rgba(6,182,212,0.25)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 25px rgba(6,182,212,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                <User size={13} className="text-cyan-300" />
              </div>
              <span
                className="text-[11px] font-black tracking-[0.18em] uppercase"
                style={{ color: "rgba(56,189,248,0.95)" }}
              >
                {user?.displayName || "You"}
              </span>
            </div>

            {combo > 1 && (
              <m.span
                key={combo}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1"
                style={{
                  background: "rgba(245,158,11,0.2)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  color: "var(--color-gold-300)",
                }}
              >
                <Flame size={12} className="text-amber-400 fill-amber-400" /> ×
                {combo} Combo
              </m.span>
            )}
          </div>

          <HealthBar
            label="Your HP"
            current={playerHp}
            max={PLAYER_MAX_HP}
            color="linear-gradient(90deg, #06b6d4, #38bdf8)"
            glowColor="rgba(6, 182, 212, 0.6)"
            icon={Heart}
          />
        </div>

        {/* Opponent / Boss HUD */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(3,11,34,0.85) 100%)",
            border: "1px solid rgba(239,68,68,0.25)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 25px rgba(239,68,68,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center">
                {isMultiplayer ? (
                  <User size={13} className="text-rose-400" />
                ) : (
                  <Skull size={13} className="text-rose-400" />
                )}
              </div>
              <span className="text-[11px] font-black tracking-[0.18em] uppercase text-rose-500 truncate max-w-[150px]">
                {opponentName}
              </span>
            </div>

            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 tabular-nums"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
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
            color="linear-gradient(90deg, #dc2626, #f43f5e)"
            glowColor="rgba(239, 68, 68, 0.6)"
            icon={Zap}
          />
        </div>
      </m.div>

      {/* Main Game Battle Stage */}
      <m.div
        className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-between p-6 sm:p-8"
        style={{
          minHeight: "380px",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(153,27,27,0.18) 0%, rgba(3,11,34,0.96) 75%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 0 80px rgba(239,68,68,0.12) inset, 0 20px 60px rgba(0,0,0,0.6)",
        }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Animated Cyber Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
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
              className="absolute top-3 z-30 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md"
            >
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              <span>
                {isMultiplayer
                  ? "Referee abang ganteng evaluating both 1v1 explanations..."
                  : "abang ganteng evaluating explanation..."}
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

        {/* Top: Speech Bubble */}
        <div className="z-10 w-full flex flex-col items-center gap-2 mb-4">
          <m.div
            className="relative max-w-lg w-full px-5 py-3.5 rounded-2xl text-center shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(153,27,27,0.40) 0%, rgba(3,7,18,0.92) 100%)",
              border: "1px solid rgba(239,68,68,0.4)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(239,68,68,0.25)",
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentQuestion}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5 truncate">
                <Sparkles size={13} className="text-amber-400 shrink-0" /> Konsep Duel ({selectedTopicTitle}):
              </span>
              {!isMultiplayer && (
                <button
                  type="button"
                  id="boss-fight-reroll-question"
                  onClick={handleRerollQuestion}
                  disabled={isBusy || phase !== "battle"}
                  className="text-[10px] font-bold text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/70 hover:border-cyan-500/40 cursor-pointer shrink-0"
                  title="Ganti soal dalam topik ini"
                >
                  <RefreshCw size={11} className="text-cyan-400" /> Ganti Soal
                </button>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
              &ldquo;Jelaskan{" "}
              <span className="text-cyan-300 underline underline-offset-4 decoration-cyan-400/50 font-black">
                {currentQuestion}
              </span>{" "}
              seolah-olah saya anak umur 5 tahun!&rdquo;
            </h3>
            <div
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px]"
              style={{ borderTopColor: "rgba(239, 68, 68, 0.4)" }}
            />
          </m.div>
        </div>

        {/* Center: Face-off Arena Characters */}
        <div className="relative z-10 w-full flex items-center justify-around my-4 sm:my-6">
          {/* 1. Player Knight Avatar (Blue Scholar) */}
          <div className="flex flex-col items-center gap-2">
            <m.div
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center"
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
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-cyan-300/40 bg-cyan-950/40 flex items-center justify-center">
                <Swords
                  size={42}
                  className="text-cyan-100 drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]"
                />
              </div>
              <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-[10px] font-extrabold text-cyan-300 uppercase tracking-widest shadow-md">
                You
              </div>
            </m.div>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center opacity-60">
            <span
              className="text-xl sm:text-2xl font-black text-rose-500 italic tracking-widest"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              VS
            </span>
          </div>

          {/* 2. Opponent Player Knight Avatar (Red/Crimson Scholar) */}
          <div className="flex flex-col items-center gap-2">
            <m.div
              className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center"
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
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-rose-400/40 bg-rose-950/50 flex items-center justify-center">
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

              <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-500 text-[10px] font-extrabold text-rose-300 uppercase tracking-widest shadow-md flex items-center gap-1 max-w-[140px] truncate">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(2,7,26,0.88)",
              backdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <m.div
              className="flex flex-col items-center gap-6 p-8 sm:p-10 rounded-3xl text-center max-w-md w-full"
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
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl"
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
                  className="text-3xl font-black"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    color: isVictory
                      ? "rgba(34,197,94,0.95)"
                      : "rgba(239,68,68,0.95)",
                  }}
                >
                  {isVictory
                    ? isMultiplayer
                      ? "1v1 Duel Champion!"
                      : "Victory Achieved!"
                    : isMultiplayer
                    ? "Defeated in Duel!"
                    : "Devoured by Ignorance!"}
                </h2>
                <p
                  className="text-[13px] mt-2 leading-relaxed"
                  style={{ color: "var(--color-silver-300)" }}
                >
                  {isVictory
                    ? `You vanquished ${opponentName} with superior Feynman explanations!`
                    : `${opponentName} out-explained you in this Feynman duel. Review your concepts and strike back!`}
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
                          className="text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        />
                      </m.div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <Award size={14} className="text-emerald-400" />
                    <span>+150 XP · Victory Badge Awarded 🎖️</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  id="boss-fight-play-again"
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  style={{
                    background: isVictory
                      ? "linear-gradient(135deg, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0.10) 100%)"
                      : "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.10) 100%)",
                    border: isVictory
                      ? "1px solid rgba(34,197,94,0.4)"
                      : "1px solid rgba(245,158,11,0.4)",
                    color: isVictory
                      ? "rgba(34,197,94,0.95)"
                      : "var(--color-gold-300)",
                    fontFamily: "var(--font-outfit)",
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
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  <ArrowLeft size={16} /> Dashboard
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Attack Input Controls */}
      <m.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(3,11,34,0.85) 100%)",
          border: isBusy
            ? "1px solid rgba(56,189,248,0.50)"
            : "1px solid rgba(255,255,255,0.09)",
          boxShadow: isBusy ? "0 0 25px rgba(56,189,248,0.20)" : "none",
          backdropFilter: "blur(16px)",
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        {/* Waiting for Opponent Animated Overlay */}
        <AnimatePresence>
          {isWaitingForOpponent && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center p-6 text-center gap-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(3,11,34,0.95) 0%, rgba(6,182,212,0.22) 100%)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(56,189,248,0.35)",
                boxShadow: "0 15px 45px rgba(0,0,0,0.6)",
              }}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg">
                  <Clock size={24} className="text-cyan-300 animate-spin" />
                </div>
                <Swords size={14} className="absolute -bottom-1 -right-1 text-amber-400 animate-bounce" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-sm font-extrabold text-slate-100 tracking-tight">
                  Jawaban Terkirim!
                </span>
                <span className="text-xs text-slate-300 leading-relaxed">
                  {opponentInactive
                    ? "Lawan kamu belum merespons (Offline atau meninggalkan pertandingan)."
                    : `Menunggu jawaban lawan kamu... (${waitingSeconds}s)`}
                </span>
              </div>

              {opponentInactive ? (
                <button
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
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer mt-1 flex items-center gap-1.5"
                >
                  <Trophy size={14} /> Klaim Kemenangan (WO)
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-[11px] font-semibold text-cyan-300 animate-pulse">
                  <Loader2 size={12} className="animate-spin text-cyan-400" />
                  <span>Menyingkronkan Jawaban Kedua Pemain...</span>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
        {/* Label Header */}
        <div
          className="px-4 pt-3 pb-2 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <Swords
              size={13}
              className="text-cyan-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <label
              htmlFor="boss-fight-attack-input"
              className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-cyan-300"
            >
              Serangan Penjelasan Feynman
            </label>
          </div>
          <span
            className="text-[10px]"
            style={{ color: "var(--color-silver-400)" }}
          >
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
          placeholder={`Jelaskan '${currentQuestion}' (${selectedTopicTitle}) seolah ke anak umur 5 tahun (gunakan analogi sederhana seperti balok mainan, ember, atau resep makanan...)`}
          disabled={isBusy || phase !== "battle"}
          rows={3}
          className="w-full resize-none outline-none text-[13px] leading-relaxed px-4 py-3 placeholder:italic disabled:opacity-50"
          style={{
            background: "transparent",
            color: "var(--color-silver-100)",
            fontFamily: "var(--font-inter)",
          }}
          aria-label="Tulis penjelasan konsep kamu untuk menyerang lawan"
        />

        {/* Action Footer */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-[11px] hidden sm:block"
            style={{ color: "var(--color-silver-400)" }}
          >
            {!isWaitingForOpponent ? (
              <>
                Tekan{" "}
                <kbd
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--color-silver-200)",
                  }}
                >
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
            className="skeuo-btn text-xs px-5 py-2.5 rounded-xl ml-auto font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "rgba(3,11,34,0.65)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <Shield
                size={13}
                style={{ color: "var(--color-silver-300)" }}
                aria-hidden="true"
              />
              <span
                className="text-[11px] font-extrabold tracking-[0.14em] uppercase"
                style={{ color: "var(--color-silver-300)" }}
              >
                Battle History
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
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
                className="flex flex-col gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono font-bold flex-shrink-0">
                      {entry.concept}
                    </span>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: "var(--color-silver-200)" }}
                    >
                      {entry.explanation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold text-rose-400 tabular-nums">
                      -{entry.damageDealt} HP
                    </span>
                    {entry.playerDamageTaken > 0 && (
                      <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                        -{entry.playerDamageTaken} Self HP
                      </span>
                    )}
                  </div>
                </div>

                {entry.bossFeedback && (
                  <div
                    className="ml-4 px-3.5 py-2 rounded-xl flex items-start gap-2.5"
                    style={{
                      background: entry.isCorrect
                        ? "rgba(34,197,94,0.07)"
                        : "rgba(239,68,68,0.10)",
                      border: entry.isCorrect
                        ? "1px solid rgba(34,197,94,0.2)"
                        : "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    <Skull
                      size={14}
                      className={
                        entry.isCorrect
                          ? "text-emerald-400 flex-shrink-0 mt-0.5"
                          : "text-rose-400 flex-shrink-0 mt-0.5"
                      }
                    />
                    <p
                      className="text-[11px] italic leading-relaxed"
                      style={{
                        color: entry.isCorrect
                          ? "var(--color-silver-200)"
                          : "rgba(248,113,113,0.95)",
                      }}
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
  );
}
