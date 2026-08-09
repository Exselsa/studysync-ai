"use client";

import { useEffect, useState, useRef } from "react";
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
  Calendar,
  CheckCircle2,
  Circle,
  Sparkles,
  Swords,
  Video,
  BrainCircuit,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  getStudyPlans,
  toggleTaskCompletion,
  type StudyPlan,
} from "@/lib/firebase/db";
import { recordDailyActivity } from "@/lib/firebase/userStats";
import type { UserStats } from "@/lib/types";

/* ---------------------------------------------------------------
   Emil Kowalski & Apple Design Principles
   Easings: cubic-bezier(0.23, 1, 0.32, 1)
   Springs: stiffness 380, damping 30
--------------------------------------------------------------- */
const EMIL_EASE_ARR: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EMIL_SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EMIL_EASE_ARR },
  },
};

/* ---------------------------------------------------------------
   Animated Circular Progress Ring Component
--------------------------------------------------------------- */
function ProgressRing({
  progress,
  color = "#06b6d4",
  size = 48,
  strokeWidth = 4,
}: {
  progress: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: EMIL_EASE_ARR }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-extrabold text-white tracking-tight">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   Interactive Bento Stat Card Component with Liquid Glow
--------------------------------------------------------------- */
interface BentoStatProps {
  id: string;
  Icon: React.ElementType;
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  accentColor: string;
  glowColor: string;
  progressPercent?: number;
  isLoading?: boolean;
  colSpan?: string;
}

function BentoStatCard({
  id,
  Icon,
  title,
  value,
  unit,
  subtitle,
  accentColor,
  glowColor,
  progressPercent,
  isLoading = false,
  colSpan = "col-span-1",
}: BentoStatProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (isLoading) {
    return (
      <div
        className={`card-glass p-6 flex flex-col justify-between relative overflow-hidden border border-white/10 rounded-3xl bg-[#080C14]/70 animate-pulse ${colSpan}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-24 h-3 rounded bg-white/10" />
          <div className="size-10 rounded-2xl bg-white/10" />
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="w-20 h-8 rounded bg-white/10" />
            <div className="w-32 h-3 rounded bg-white/10" />
          </div>
          <div className="size-12 rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <m.article
      ref={cardRef}
      id={id}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2, ease: EMIL_EASE_ARR } }}
      whileTap={{ scale: 0.97 }}
      className={`card-glass p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border border-white/10 hover:border-cyan-500/40 shadow-xl group rounded-3xl bg-[#080C14]/80 backdrop-blur-xl ${colSpan}`}
    >
      {/* Liquid Spotlight Glow */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
        }}
      />

      <div className="flex items-center justify-between relative z-10 mb-4">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        <div
          className="size-10 rounded-2xl flex items-center justify-center border border-white/15 bg-slate-950/80 shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0"
          style={{ borderColor: `${accentColor}40` }}
        >
          <Icon size={18} style={{ color: accentColor }} strokeWidth={1.75} />
        </div>
      </div>

      <div className="flex items-end justify-between relative z-10">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold tracking-tight text-white">
              {value}
            </span>
            <span className="text-xs font-semibold text-slate-400">{unit}</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-medium">{subtitle}</p>
        </div>

        {progressPercent !== undefined && (
          <ProgressRing progress={progressPercent} color={accentColor} size={48} strokeWidth={4} />
        )}
      </div>
    </m.article>
  );
}

/* ---------------------------------------------------------------
   Dashboard Content Component
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

  const today = new Date();
  const dateString = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hoursThisMonth = (userStats.totalStudyMinutesThisMonth / 60).toFixed(1);
  const streakPercent = Math.min(100, Math.round((userStats.currentStreak / 30) * 100));
  const hoursPercent = Math.min(100, Math.round((userStats.totalStudyMinutesThisMonth / 1200) * 100));

  return (
    <div className="flex flex-col flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full">
      <m.div
        className="flex flex-col gap-8 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ---- Header & Hero Section ---- */}
        <m.div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          variants={itemVariants}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {dateString}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Selamat datang kembali,{" "}
              <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                {displayName}!
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-normal">
              {loadingPlans
                ? "Memuat data study plan adaptif..."
                : plans.length === 0
                ? "Kamu belum memiliki study plan aktif. Mari buat plan baru bersama abang ganteng!"
                : allPendingTasks.length === 0
                ? "Luar biasa! Semua tugas di study plan aktif kamu telah selesai."
                : `Study plan adaptif kamu aktif. Ada ${allPendingTasks.length} tugas prioritas yang perlu kamu selesaikan.`}
            </p>
          </div>

          <m.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={EMIL_SPRING}
            className="shrink-0"
          >
            <LiquidMetalButton
              label="Mulai Sesi AI Tutor"
              viewMode="label"
              id="dashboard-start-ai-session"
              aria-label="Mulai sesi belajar dengan abang ganteng AI Tutor"
              onClick={() => router.push("/dashboard/tutor")}
            />
          </m.div>
        </m.div>

        {/* ---- Floating Glass Quick-Action Dock ---- */}
        <m.nav
          className="rounded-3xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 border border-white/10 bg-[#080C14]/80 backdrop-blur-2xl shadow-2xl"
          variants={itemVariants}
          aria-label="Quick Actions Dock"
        >
          {[
            { label: "AI Tutor", icon: BrainCircuit, href: "/dashboard/tutor", color: "#06b6d4" },
            { label: "Study Plan", icon: BookOpen, href: "/dashboard/plan", color: "#38bdf8" },
            { label: "Duel 1v1 Arena", icon: Swords, href: "/dashboard/game", color: "#8b5cf6" },
            { label: "Study Meet", icon: Video, href: "/dashboard/meet", color: "#c084fc" },
          ].map(({ label, icon: Icon, href, color }) => (
            <m.button
              key={label}
              type="button"
              onClick={() => router.push(href)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={EMIL_SPRING}
              className="flex items-center justify-between py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/40 hover:bg-white/10 text-white font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-lg group backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} style={{ color }} className="group-hover:scale-110 transition-transform duration-300" />
                <span>{label}</span>
              </div>
              <ChevronRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cyan-400" />
            </m.button>
          ))}
        </m.nav>

        {/* ---- High-Density Bento Grid Analytics ---- */}
        <m.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={containerVariants}
        >
          <BentoStatCard
            id="stat-streak"
            Icon={Flame}
            title="Streak Belajar"
            value={loadingStats ? "..." : userStats.currentStreak.toString()}
            unit="hari"
            subtitle={
              loadingStats
                ? "Memuat..."
                : userStats.currentStreak > 1
                ? `${userStats.currentStreak} hari beruntun! 🔥`
                : "Pertahankan konsistensi harian!"
            }
            accentColor="#38bdf8"
            glowColor="rgba(56, 189, 248, 0.25)"
            progressPercent={streakPercent}
            isLoading={loadingStats}
          />

          <BentoStatCard
            id="stat-hours"
            Icon={Clock}
            title="Jam Belajar"
            value={loadingStats ? "..." : hoursThisMonth}
            unit="jam"
            subtitle={`${userStats.totalStudyMinutesThisMonth} menit tercatat bulan ini`}
            accentColor="#06b6d4"
            glowColor="rgba(6, 182, 212, 0.25)"
            progressPercent={hoursPercent}
            isLoading={loadingStats}
          />

          <BentoStatCard
            id="stat-tasks"
            Icon={CheckSquare}
            title="Tugas Pending"
            value={loadingPlans ? "..." : allPendingTasks.length.toString()}
            unit="tugas"
            subtitle={
              allPendingTasks.length === 0
                ? "Semua tugas tuntas!"
                : `${allPendingTasks.length} tugas prioritas aktif`
            }
            accentColor="#10b981"
            glowColor="rgba(16, 185, 129, 0.25)"
            progressPercent={allPendingTasks.length === 0 ? 100 : Math.max(10, 100 - allPendingTasks.length * 15)}
            isLoading={loadingPlans}
          />

          <BentoStatCard
            id="stat-cognitive"
            Icon={TrendingUp}
            title="Cognitive Index"
            value="91"
            unit="/ 100"
            subtitle="Tingkat penguasaan materi tinggi"
            accentColor="#8b5cf6"
            glowColor="rgba(139, 92, 246, 0.25)"
            progressPercent={91}
            isLoading={false}
          />
        </m.div>

        {/* ---- Recent Activity & Priority Tasks Grid ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Priority Tasks Feed */}
          <m.section variants={itemVariants} className="lg:col-span-2 space-y-4" aria-labelledby="tasks-heading">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-cyan-400" />
                <h2 id="tasks-heading" className="font-display text-lg font-bold text-white">
                  Tugas Prioritas Hari Ini
                </h2>
              </div>
              <button
                type="button"
                id="dashboard-view-plan"
                onClick={() => router.push("/dashboard/plan")}
                className="btn-ghost text-xs px-3.5 py-1.5 gap-1.5 cursor-pointer hover:border-cyan-500/40 flex items-center transition-all duration-200"
                aria-label="Lihat study plan lengkap"
              >
                <span>Lihat Plan Lengkap</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {loadingPlans ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-glass p-5 flex items-center gap-4 animate-pulse rounded-2xl bg-[#080C14]/70 border border-white/10">
                    <div className="size-5 rounded-full bg-white/10 shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="w-28 h-3.5 rounded bg-white/10" />
                      <div className="w-3/4 h-4 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="card-glass p-10 flex flex-col items-center justify-center text-center gap-4 border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-transparent rounded-3xl">
                <div className="size-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <BookOpen size={28} />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h3 className="font-display text-base font-bold text-white">Belum Ada Study Plan Aktif</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unggah silabus atau materi kamu untuk membuat study plan adaptif bersama abang ganteng.
                  </p>
                </div>
                <m.button
                  type="button"
                  id="dashboard-create-plan-cta"
                  onClick={() => router.push("/dashboard/plan")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={EMIL_SPRING}
                  className="btn-primary text-xs px-6 py-3 gap-2 mt-2 shadow-lg cursor-pointer flex items-center rounded-2xl"
                >
                  <Sparkles size={15} />
                  Buat Study Plan Sekarang
                </m.button>
              </div>
            ) : allPendingTasks.length === 0 ? (
              <div className="card-glass p-10 flex flex-col items-center justify-center text-center gap-4 border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-transparent rounded-3xl">
                <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={28} />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h3 className="font-display text-base font-bold text-white">Semua Tugas Hari Ini Selesai! 🎉</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Kerja bagus! Seluruh item tugas dalam study plan kamu sudah tuntas.
                  </p>
                </div>
                <m.button
                  type="button"
                  id="dashboard-view-plan-completed-cta"
                  onClick={() => router.push("/dashboard/plan")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={EMIL_SPRING}
                  className="btn-ghost text-xs px-5 py-2.5 gap-2 mt-1 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer flex items-center rounded-2xl"
                >
                  <BookOpen size={14} />
                  Lihat Detail Plan
                </m.button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allPendingTasks.map(({ planId, planSubject, task }) => (
                  <m.div
                    key={task.id}
                    id={`dashboard-task-${task.id}`}
                    whileHover={{ x: 3, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.98 }}
                    className="card-glass p-5 flex items-center justify-between gap-4 border-l-4 border-l-cyan-400 border-white/10 hover:border-cyan-500/40 transition-all duration-200 rounded-2xl bg-[#080C14]/80 backdrop-blur-xl"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(planId, task.id)}
                        className="mt-0.5 shrink-0 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        aria-label={`Tandai ${task.title} sebagai selesai`}
                      >
                        <Circle size={20} className="text-slate-400 hover:text-cyan-400" />
                      </button>

                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">
                            {planSubject}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-violet-300 bg-violet-950/60 border border-violet-500/30">
                            Hari ke-{task.day}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-400 truncate">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/plan")}
                      className="btn-ghost text-xs px-3 py-1.5 gap-1 text-slate-300 hover:text-white shrink-0 cursor-pointer flex items-center"
                      aria-label="Buka plan"
                    >
                      <span>Plan</span>
                      <ArrowRight size={12} />
                    </button>
                  </m.div>
                ))}
              </div>
            )}
          </m.section>

          {/* Right 1 Col: AI Tutor Recommendation Feed */}
          <m.section variants={itemVariants} className="space-y-4" aria-labelledby="ai-feed-heading">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-violet-400" />
              <h2 id="ai-feed-heading" className="font-display text-lg font-bold text-white">
                Rekomendasi abang ganteng
              </h2>
            </div>

            <div className="card-glass p-6 space-y-5 border border-white/10 bg-[#080C14]/80 backdrop-blur-xl rounded-3xl">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-2xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300 shrink-0">
                  <BrainCircuit size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    Fokus Belajar Adaptif
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Berdasarkan aktivitas kamu, abang ganteng menyarankan latihan duel Feynman 1v1 untuk mempertajam daya ingat topik tersulit.
                  </p>
                </div>
              </div>

              <div className="divider-glass" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Topik Disarankan:</span>
                  <span className="text-cyan-400 font-bold">Struktur Data & Algoritma</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Estimasi Durasi:</span>
                  <span className="text-violet-300 font-bold">25 Menit</span>
                </div>
              </div>

              <m.button
                type="button"
                id="dashboard-recommendation-cta"
                onClick={() => router.push("/dashboard/tutor")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={EMIL_SPRING}
                className="w-full btn-primary text-xs py-3 gap-2 flex items-center justify-center cursor-pointer rounded-2xl"
              >
                <Sparkles size={14} />
                Konsultasi abang ganteng
              </m.button>
            </div>
          </m.section>
        </div>
      </m.div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
