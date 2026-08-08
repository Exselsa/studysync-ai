"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/lib/contexts/AuthContext";
import { m, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import LiquidMetalButton from "@/components/ui/liquid-metal-button";
import {
  Flame,
  Clock,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Target,
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  getStudyPlans,
  toggleTaskCompletion,
  type StudyPlan,
  type StudyPlanTask,
} from "@/lib/firebase/db";
import { recordDailyActivity } from "@/lib/firebase/userStats";
import type { UserStats } from "@/lib/types";

/* ---------------------------------------------------------------
   Types
--------------------------------------------------------------- */
interface StatCard {
  id: string;
  Icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  delta: string;
  deltaPositive: boolean;
  accent: string;
  accentBorder: string;
  iconColor: string;
}

const quickStats = [
  { Icon: TrendingUp, label: "Skor Kesiapan",  value: "87%"    },
  { Icon: Target,     label: "Target On-Track", value: "6 / 7"  },
  { Icon: BookOpen,   label: "Topik Dikuasai", value: "23"     },
  { Icon: BarChart3,  label: "Skor Fokus Rata-rata", value: "91 / 100" },
];

/* ---------------------------------------------------------------
   Animation Variants
--------------------------------------------------------------- */
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE },
  },
};

/* ---------------------------------------------------------------
   Stat Card Component
--------------------------------------------------------------- */
function StatCardComponent({ card }: { card: StatCard }) {
  const { Icon, label, value, unit, delta, deltaPositive, accent, accentBorder, iconColor, id } = card;
  return (
    <m.article
      id={id}
      className="card-glass p-6 flex flex-col gap-4"
      variants={itemVariants}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      aria-label={`${label}: ${value} ${unit}`}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold tracking-[0.1em] uppercase"
          style={{ color: "var(--color-silver-400)" }}
        >
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: accent,
            border: `1px solid ${accentBorder}`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 2px 8px rgba(0,0,0,0.35)",
          }}
          aria-hidden="true"
        >
          <Icon size={16} style={{ color: iconColor }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Value */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[2.25rem] font-bold leading-none tracking-tight"
            style={{
              fontFamily: "var(--font-outfit)",
              color: "var(--color-silver-50)",
            }}
          >
            {value}
          </span>
          <span
            className="text-[12px] font-medium"
            style={{ color: "var(--color-silver-400)" }}
          >
            {unit}
          </span>
        </div>

        {/* Delta indicator */}
        <p
          className="text-[11px] font-medium mt-1"
          style={{
            color: deltaPositive ? "rgba(34, 197, 94, 0.85)" : "rgba(239, 68, 68, 0.85)",
          }}
        >
          {delta}
        </p>
      </div>

      {/* Subtle progress bar */}
      <div
        className="h-px w-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${iconColor}, transparent)`, opacity: 0.35 }}
        aria-hidden="true"
      />
    </m.article>
  );
}

/* ---------------------------------------------------------------
   Dashboard Page Content
--------------------------------------------------------------- */
function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const displayName = user?.displayName?.split(" ")[0] ?? "Scholar";

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);

  const [userStats, setUserStats] = useState<UserStats>({
    currentStreak: 1,
    lastActiveDate: "",
    totalStudyMinutesThisMonth: 0,
    lastResetMonth: new Date().getMonth(),
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Fetch active study plans & record daily activity stats from Firestore
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getStudyPlans(user.uid)
      .then((data) => {
        if (isMounted) {
          setPlans(data);
          setLoadingPlans(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching study plans for dashboard:", err);
        if (isMounted) setLoadingPlans(false);
      });

    recordDailyActivity(user.uid)
      .then((stats) => {
        if (isMounted) {
          setUserStats(stats);
          setLoadingStats(false);
        }
      })
      .catch((err) => {
        console.error("Error recording daily activity:", err);
        if (isMounted) setLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Toggle task completion state and sync with Firestore
  const handleToggleTask = async (planId: string, taskId: string) => {
    if (!user) return;
    const targetPlan = plans.find((p) => p.id === planId);
    if (!targetPlan) return;

    const updatedTasks = targetPlan.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: !t.completed,
          }
        : t
    );

    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, tasks: updatedTasks } : p))
    );

    try {
      const serverTasks = await toggleTaskCompletion(user.uid, planId, taskId);
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, tasks: serverTasks } : p))
      );
      // Re-fetch user stats to update study hours if task completion awarded minutes
      const updatedStats = await recordDailyActivity(user.uid);
      setUserStats(updatedStats);
    } catch (err) {
      console.error("Failed to update task in Firestore:", err);
    }
  };

  // Extract pending tasks from active study plans
  const allPendingTasks = plans.flatMap((plan) =>
    plan.tasks
      .filter((t) => !t.completed)
      .map((t) => ({
        planId: plan.id,
        planSubject: plan.subject || plan.title || "Study Plan",
        task: t,
      }))
  );

  // Dynamic stat cards reflecting real Firestore data
  const dynamicStatCards: StatCard[] = [
    {
      id: "stat-streak",
      Icon: Flame,
      label: "Streak Belajar",
      value: loadingStats ? "..." : userStats.currentStreak.toString(),
      unit: "hari",
      delta: loadingStats
        ? "Memuat streak..."
        : userStats.currentStreak > 1
        ? `${userStats.currentStreak} hari beruntun! 🔥`
        : "Pertahankan streak kamu!",
      deltaPositive: true,
      accent: "rgba(245, 158, 11, 0.10)",
      accentBorder: "rgba(245, 158, 11, 0.22)",
      iconColor: "var(--color-gold-400)",
    },
    {
      id: "stat-hours",
      Icon: Clock,
      label: "Jam Belajar",
      value: loadingStats
        ? "..."
        : (userStats.totalStudyMinutesThisMonth / 60).toFixed(1),
      unit: "jam bulan ini",
      delta: loadingStats
        ? "Memuat jam..."
        : `${userStats.totalStudyMinutesThisMonth} menit tercatat`,
      deltaPositive: true,
      accent: "rgba(56, 189, 248, 0.08)",
      accentBorder: "rgba(56, 189, 248, 0.18)",
      iconColor: "rgba(56, 189, 248, 0.9)",
    },
    {
      id: "stat-tasks",
      Icon: CheckSquare,
      label: "Tugas Pending",
      value: loadingPlans ? "..." : allPendingTasks.length.toString(),
      unit: "perlu selesai",
      delta: loadingPlans
        ? "Memuat data..."
        : allPendingTasks.length === 0
        ? "Semua tugas tuntas!"
        : `${allPendingTasks.length} tugas belum selesai`,
      deltaPositive: allPendingTasks.length === 0,
      accent: "rgba(34, 197, 94, 0.08)",
      accentBorder: "rgba(34, 197, 94, 0.18)",
      iconColor: "rgba(34, 197, 94, 0.9)",
    },
  ];

  // Current date for the greeting
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col flex-1 px-8 py-8 max-w-5xl mx-auto w-full">
      <m.div
        className="flex flex-col gap-8 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ---- Header: Greeting ---- */}
        <m.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={itemVariants}
        >
          <div className="flex flex-col gap-1">
            {/* Date + badge row */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar
                size={12}
                style={{ color: "var(--color-silver-400)" }}
                aria-hidden="true"
              />
              <span
                className="text-[11px] font-medium tracking-wide"
                style={{ color: "var(--color-silver-400)" }}
              >
                {dateString}
              </span>
            </div>

            <h1
              id="dashboard-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight"
              style={{
                fontFamily: "var(--font-outfit)",
                color: "var(--color-silver-50)",
              }}
            >
              Selamat datang kembali,{" "}
              <span className="text-gradient-gold">{displayName}!</span>
            </h1>
            <p
              className="text-[13px] leading-relaxed mt-0.5"
              style={{ color: "var(--color-silver-300)" }}
            >
              {loadingPlans
                ? "Memuat data study plan adaptif..."
                : plans.length === 0
                ? "Kamu belum memiliki study plan aktif. Mari buat plan baru!"
                : allPendingTasks.length === 0
                ? "Luar biasa! Semua tugas di study plan aktif kamu telah selesai."
                : `Study plan adaptif kamu aktif. Ada ${allPendingTasks.length} tugas prioritas yang perlu kamu selesaikan.`}
            </p>
          </div>

          {/* Primary CTA — Liquid Metal Button */}
          <m.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          >
            <LiquidMetalButton
              label="Mulai Sesi AI"
              viewMode="label"
              id="dashboard-start-ai-session"
              aria-label="Mulai sesi belajar dengan AI"
              onClick={() => router.push("/dashboard/tutor")}
            />
          </m.div>
        </m.div>

        {/* ---- Stat Cards ---- */}
        <m.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {dynamicStatCards.map((card) => (
            <StatCardComponent key={card.id} card={card} />
          ))}
        </m.div>

        {/* ---- Divider ---- */}
        <m.div className="divider-glass" variants={itemVariants} aria-hidden="true" />

        {/* ---- Quick Metrics Strip ---- */}
        <m.section
          variants={itemVariants}
          aria-labelledby="quick-metrics-heading"
        >
          <h2
            id="quick-metrics-heading"
            className="text-[11px] font-bold tracking-[0.12em] uppercase mb-4"
            style={{ color: "var(--color-silver-400)" }}
          >
            Ringkasan Performa
          </h2>

          <div className="glass-panel rounded-2xl px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {quickStats.map(({ Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-2"
                role="group"
                aria-label={`${label}: ${value}`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    size={12}
                    style={{ color: "var(--color-gold-400)" }}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[10px] font-semibold tracking-[0.1em] uppercase"
                    style={{ color: "var(--color-silver-400)" }}
                  >
                    {label}
                  </span>
                </div>
                <span
                  className="text-xl font-bold leading-none"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    color: "var(--color-silver-50)",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </m.section>

        {/* ---- Today's Priority Tasks ---- */}
        <m.section variants={itemVariants} aria-labelledby="tasks-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="tasks-heading"
              className="text-[11px] font-bold tracking-[0.12em] uppercase"
              style={{ color: "var(--color-silver-400)" }}
            >
              Tugas Prioritas — Hari Ini
            </h2>
            <button
              type="button"
              id="dashboard-view-plan"
              className="btn-ghost text-[11px] px-3 py-1.5 gap-1 cursor-pointer"
              aria-label="Lihat study plan lengkap"
              onClick={() => router.push("/dashboard/plan")}
            >
              Lihat Plan
              <ArrowRight size={11} aria-hidden="true" />
            </button>
          </div>

          {loadingPlans ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-panel-light rounded-xl px-5 py-4 flex items-center gap-4 animate-pulse"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-800 shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="w-24 h-3 rounded bg-slate-800" />
                    <div className="w-3/4 h-4 rounded bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-transparent">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                <BookOpen size={24} />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h3 className="text-sm font-bold text-slate-100">Belum Ada Study Plan Aktif</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Buat study plan adaptif berbasis AI untuk menyusun daftar tugas harian kamu.
                </p>
              </div>
              <button
                type="button"
                id="dashboard-create-plan-cta"
                onClick={() => router.push("/dashboard/plan")}
                className="btn-primary text-xs px-5 py-2.5 gap-2 mt-1 shadow-lg cursor-pointer flex items-center"
              >
                <Sparkles size={14} />
                Buat Study Plan Sekarang
              </button>
            </div>
          ) : allPendingTasks.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-transparent">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h3 className="text-sm font-bold text-slate-100">Semua Tugas Hari Ini Selesai! 🎉</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kerja bagus! Seluruh item tugas dalam study plan kamu sudah tuntas.
                </p>
              </div>
              <button
                type="button"
                id="dashboard-view-plan-completed-cta"
                onClick={() => router.push("/dashboard/plan")}
                className="btn-ghost text-xs px-5 py-2.5 gap-2 mt-1 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer flex items-center"
              >
                <BookOpen size={14} />
                Lihat Study Plan
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allPendingTasks.map(({ planId, planSubject, task }) => (
                <m.div
                  key={task.id}
                  id={`dashboard-task-${task.id}`}
                  className="glass-panel-light rounded-xl px-5 py-4 flex items-center justify-between gap-4 transition-all duration-200"
                  whileHover={{
                    borderColor: "rgba(255,255,255,0.14)",
                    transition: { duration: 0.15 },
                  }}
                  role="article"
                  aria-label={`${planSubject}: ${task.title}`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(planId, task.id)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      aria-label={`Tandai ${task.title} sebagai selesai`}
                    >
                      <Circle size={18} className="text-slate-400 hover:text-cyan-400" />
                    </button>

                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold tracking-[0.1em] uppercase"
                          style={{ color: "var(--color-gold-400)" }}
                        >
                          {planSubject}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-amber-300 bg-amber-950/40 border border-amber-500/20">
                          Hari ke-{task.day}
                        </span>
                      </div>
                      <p
                        className="text-[13px] font-medium text-slate-100 truncate"
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/plan")}
                    className="btn-ghost text-[11px] px-2.5 py-1 gap-1 text-slate-400 hover:text-slate-200 shrink-0 cursor-pointer"
                    aria-label="Lihat detail plan"
                  >
                    <span>Plan</span>
                    <ArrowRight size={11} />
                  </button>
                </m.div>
              ))}
            </div>
          )}
        </m.section>
      </m.div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <div
      className="flex-shrink-0 self-center"
      aria-hidden="true"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: "rgba(255,255,255,0.18)" }}
      >
        <path
          d="M5 3L9 7L5 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------
   Page Export — wrapped in ProtectedRoute
--------------------------------------------------------------- */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
