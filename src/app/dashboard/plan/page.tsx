"use client";

import { useEffect, useState, useCallback } from "react";
import { m, AnimatePresence, type Variants } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  RefreshCw,
  BookOpen,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trophy,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  getStudyPlans,
  toggleTaskCompletion,
  updateStudyPlanStatus,
  resetStudyPlanTasks,
  deleteStudyPlan,
  type StudyPlan,
  type StudyPlanTask,
} from "@/lib/firebase/db";
import MaterialUploader from "@/components/study/MaterialUploader";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------
   Animation Variants (Emil Kowalski Design Principles)
------------------------------------------------------------------ */
const EMIL_EASE_ARR: [number, number, number, number] = [0.23, 1, 0.32, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.42, ease: EMIL_EASE_ARR } },
};

const taskVariants: Variants = {
  hidden: { opacity: 0, x: -12, scale: 0.97 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.28, ease: EMIL_EASE_ARR } },
};

/* ------------------------------------------------------------------
   Utilities
------------------------------------------------------------------ */
function computeProgress(tasks: StudyPlanTask[]): number {
  if (!tasks || !tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
}

function subjectAccent(subject: string): { bg: string; border: string; text: string } {
  const s = (subject || "").toLowerCase();
  if (s.includes("calculus") || s.includes("math") || s.includes("matematika"))
    return { bg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.35)", text: "#22d3ee" };
  if (s.includes("machine") || s.includes("ml") || s.includes("ai"))
    return { bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.35)", text: "#c084fc" };
  if (s.includes("algorithm") || s.includes("cs") || s.includes("code") || s.includes("koding"))
    return { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.35)", text: "#4ade80" };
  if (s.includes("chemistry") || s.includes("organic") || s.includes("kimia"))
    return { bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.35)", text: "#38bdf8" };
  return { bg: "rgba(255, 255, 255, 0.06)", border: "rgba(255, 255, 255, 0.14)", text: "#e2e8f0" };
}

/* ------------------------------------------------------------------
   Progress Ring Component
------------------------------------------------------------------ */
function ProgressRing({ pct }: { pct: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center size-11 shrink-0">
      <svg width={44} height={44} viewBox="0 0 44 44" aria-hidden="true" className="-rotate-90">
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke={pct === 100 ? "#10b981" : "#06b6d4"}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <span className={cn("absolute text-[10px] font-bold", pct === 100 ? "text-emerald-400" : "text-cyan-300")}>
        {pct}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------
   Task Row — single task item with interactive checklist
------------------------------------------------------------------ */
function TaskRow({
  task,
  onToggle,
}: {
  task: StudyPlanTask;
  onToggle: (id: string) => void;
}) {
  return (
    <m.div
      layout
      variants={taskVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
      onClick={() => onToggle(task.id)}
      whileHover={{ x: 4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      role="checkbox"
      aria-checked={task.completed}
      aria-label={task.title}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(task.id); } }}
      className={cn(
        "p-4 rounded-xl flex items-start gap-3.5 border transition-all duration-200 cursor-pointer select-none",
        task.completed
          ? "bg-emerald-950/20 border-emerald-500/25 opacity-75"
          : "bg-slate-900/60 border-white/10 hover:border-cyan-500/35 hover:bg-slate-850/80 shadow-sm"
      )}
    >
      <div className="mt-0.5 shrink-0" aria-hidden="true">
        {task.completed ? (
          <CheckCircle2 size={18} className="text-emerald-400" />
        ) : (
          <Circle size={18} className="text-slate-500 hover:text-cyan-400 transition-colors" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs sm:text-sm font-semibold leading-relaxed transition-all",
          task.completed ? "line-through text-muted-foreground" : "text-white"
        )}>
          {task.title}
        </p>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn(
            "text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border",
            task.completed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
          )}>
            Hari ke-{task.day}
          </span>
        </div>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Plan Card — collapsible glassmorphic card per study plan
------------------------------------------------------------------ */
function PlanCard({
  plan,
  onToggleTask,
  onCompletePlan,
  onResetPlan,
  onDeletePlan,
}: {
  plan: StudyPlan;
  onToggleTask: (planId: string, taskId: string) => void;
  onCompletePlan: (planId: string) => Promise<void>;
  onResetPlan: (planId: string) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<"complete" | "reset" | "delete" | null>(null);

  const sortedTasks = (plan.tasks || []).slice().sort((a, b) => a.day - b.day);
  const accent = subjectAccent(plan.subject);
  const progress = computeProgress(sortedTasks);
  const completedCount = sortedTasks.filter((t) => t.completed).length;
  const isAllCompleted = sortedTasks.length > 0 && completedCount === sortedTasks.length;

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading) return;
    setActionLoading("complete");
    try {
      await onCompletePlan(plan.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading) return;
    setActionLoading("reset");
    try {
      await onResetPlan(plan.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading) return;
    setActionLoading("delete");
    setShowDeleteModal(false);
    try {
      await onDeletePlan(plan.id);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <m.article
        layout
        variants={cardVariants}
        whileHover={{ y: -2, transition: { duration: 0.18 } }}
        className={cn(
          "rounded-3xl overflow-hidden backdrop-blur-2xl transition-all duration-300 border",
          isAllCompleted
            ? "bg-[#080C14]/90 border-emerald-500/40 border-l-4 border-l-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.15)]"
            : "bg-[#080C14]/80 border-white/10 hover:border-cyan-500/40 border-l-4 border-l-cyan-400 shadow-2xl hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
        )}
        aria-label={`Study plan: ${plan.title}`}
      >
        {/* Card Header */}
        <div
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer select-none"
          onClick={() => setCollapsed((c) => !c)}
          role="button"
          aria-expanded={!collapsed}
          aria-controls={`plan-tasks-${plan.id}`}
        >
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <ProgressRing pct={progress} />

            <div className="flex flex-col min-w-0 flex-1">
              <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">
                {plan.title}
              </h3>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <span
                  className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border"
                  style={{ background: accent.bg, borderColor: accent.border, color: accent.text }}
                >
                  {plan.subject}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {completedCount} / {sortedTasks.length} tugas
                </span>
                {isAllCompleted && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <Trophy size={11} /> 100% Selesai
                  </span>
                )}
                {plan.createdAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays size={12} />
                    {formatDate(plan.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              id={`plan-delete-btn-${plan.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Hapus Study Plan ini"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Hapus Plan</span>
            </button>

            <div className="text-slate-400 shrink-0">
              {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>
          </div>
        </div>

        {/* Task Timeline & List */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <m.div
              id={`plan-tasks-${plan.id}`}
              key="tasks"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: { duration: 0.3, ease: EMIL_EASE_ARR } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: EMIL_EASE_ARR } }}
              className="overflow-hidden border-t border-white/10 bg-[#030712]/40"
            >
              <div className="p-5 sm:p-6 space-y-4">
                {sortedTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Belum ada tugas di plan ini.
                  </p>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-2.5">
                      {sortedTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onToggle={(taskId) => onToggleTask(plan.id, taskId)}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">Progres Pembelajaran</span>
                    <span className={cn("font-bold", progress === 100 ? "text-emerald-400" : "text-cyan-400")}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <m.div
                      layout
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress === 100
                          ? "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          : "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Completion Banner & Action Controls */}
                {isAllCompleted && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EMIL_EASE_ARR }}
                    className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/60 border border-emerald-500/40 shadow-xl flex flex-col gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="size-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        <Sparkles size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-white">
                          Selamat! Semua tugas telah selesai 🥳
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Pilih <strong>&ldquo;Selesai&rdquo;</strong> untuk mengarsipkan plan ini, atau <strong>&ldquo;Ulangi&rdquo;</strong> untuk memulai kembali dari 0%.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        id={`plan-complete-btn-${plan.id}`}
                        onClick={handleComplete}
                        disabled={actionLoading !== null}
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
                      >
                        {actionLoading === "complete" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        <span>Selesai & Arsipkan</span>
                      </m.button>

                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        id={`plan-reset-btn-${plan.id}`}
                        onClick={handleReset}
                        disabled={actionLoading !== null}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 disabled:opacity-40 active:scale-95"
                      >
                        {actionLoading === "reset" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={15} />
                        )}
                        <span>Ulangi Plan</span>
                      </m.button>
                    </div>
                  </m.div>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.article>

      {/* CONFIRMATION MODAL: Delete Study Plan */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-slate-900/95 border-rose-500/40 shadow-2xl text-center"
            >
              <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Hapus Study Plan? 🗑️
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Yakin mau menghapus plan &ldquo;<strong>{plan.title}</strong>&rdquo;? Semua data tugas dan progres di plan ini akan dihapus permanen.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors active:scale-95"
                >
                  Batal
                </button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {actionLoading === "delete" ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus"
                  )}
                </m.button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------
   Summary Stats Strip
------------------------------------------------------------------ */
function StatsStrip({ plans }: { plans: StudyPlan[] }) {
  const totalTasks = plans.reduce((s, p) => s + (p.tasks?.length || 0), 0);
  const doneTasks = plans.reduce(
    (s, p) => s + (p.tasks?.filter((t) => t.completed).length || 0),
    0
  );
  const avgPct = plans.length
    ? Math.round(
        plans.reduce((s, p) => s + computeProgress(p.tasks || []), 0) /
          plans.length
      )
    : 0;

  const stats = [
    { Icon: BookOpen, label: "Total Plan", value: String(plans.length), color: "text-cyan-400" },
    { Icon: CheckCircle2, label: "Tugas Selesai", value: `${doneTasks} / ${totalTasks}`, color: "text-emerald-400" },
    { Icon: TrendingUp, label: "Rata-rata Progres", value: `${avgPct}%`, color: "text-violet-400" },
  ];

  return (
    <m.div
      variants={cardVariants}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      {stats.map(({ Icon, label, value, color }) => (
        <div
          key={label}
          className="p-5 flex flex-col gap-2 border border-white/10 bg-[#080C14]/80 backdrop-blur-xl rounded-3xl shadow-xl hover:border-cyan-500/30 transition-all"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon size={15} className={color} aria-hidden="true" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground">
              {label}
            </span>
          </div>
          <span className="font-display text-2xl font-black text-white">
            {value}
          </span>
        </div>
      ))}
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Plan Content Main View
------------------------------------------------------------------ */
function PlanContent() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getStudyPlans(user.uid);
      setPlans(data);
    } catch {
      setError("Gagal memuat study plan. Coba cek koneksi kamu ya.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleToggleTask = useCallback(
    async (planId: string, taskId: string) => {
      if (!user?.uid) return;

      let previousPlans: StudyPlan[] = [];

      setPlans((prev) => {
        previousPlans = prev;
        return prev.map((plan) => {
          if (plan.id !== planId) return plan;
          const updatedTasks = plan.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          return {
            ...plan,
            tasks: updatedTasks,
          };
        });
      });

      try {
        const serverTasks = await toggleTaskCompletion(user.uid, planId, taskId);
        setPlans((prev) =>
          prev.map((plan) => (plan.id === planId ? { ...plan, tasks: serverTasks } : plan))
        );
      } catch (err) {
        console.error("Failed to toggle task in Firestore:", err);
        setError("Gagal memperbarui status tugas di database. Silakan muat ulang.");
        setPlans(previousPlans);
      }
    },
    [user?.uid]
  );

  const handleDeletePlan = useCallback(
    async (planId: string) => {
      if (!user?.uid) return;
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      try {
        await deleteStudyPlan(user.uid, planId);
      } catch (err) {
        console.error("Failed to delete plan in Firestore:", err);
        setError("Gagal menghapus plan di database. Silakan muat ulang.");
      }
    },
    [user?.uid]
  );

  const handleCompletePlan = useCallback(
    async (planId: string) => {
      if (!user?.uid) return;
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      try {
        await updateStudyPlanStatus(user.uid, planId, "completed");
      } catch (err) {
        console.error("Failed to complete plan in Firestore:", err);
        setError("Gagal menyelesaikan plan di database. Silakan muat ulang.");
      }
    },
    [user?.uid]
  );

  const handleResetPlan = useCallback(
    async (planId: string) => {
      if (!user?.uid) return;
      const targetPlan = plans.find((p) => p.id === planId);
      if (!targetPlan) return;

      try {
        const resetTasks = await resetStudyPlanTasks(user.uid, planId, targetPlan.tasks);
        setPlans((prev) =>
          prev.map((p) =>
            p.id !== planId
              ? p
              : {
                  ...p,
                  tasks: resetTasks,
                }
          )
        );
      } catch (err) {
        console.error("Failed to reset plan in Firestore:", err);
        setError("Gagal mengulang plan di database. Silakan coba lagi.");
      }
    },
    [user?.uid, plans]
  );

  if (loading) {
    return (
      <div className="flex flex-col flex-1 animate-pulse overflow-y-auto gap-6 p-6 sm:p-8 max-w-5xl w-full mx-auto">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-56 rounded-xl bg-white/10" />
            <div className="h-4 w-72 rounded-lg bg-white/5" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-5 flex flex-col gap-2 border border-white/10 bg-[#080C14]/80 rounded-3xl">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="h-8 w-16 rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-4 sm:px-8 py-8 max-w-5xl mx-auto w-full gap-6">
      {/* Header Section */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: EMIL_EASE_ARR }}
        className="flex items-end justify-between gap-4"
      >
        <div>
          <h1
            id="plan-heading"
            className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight"
          >
            Papan Study Plan <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {plans.length === 0
              ? "Belum ada plan nih — yuk ngobrol sama abang ganteng atau unggah PDF materi!"
              : `${plans.length} plan aktif · klik tugas untuk menandai selesai`}
          </p>
        </div>

        <m.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          id="plan-refresh"
          onClick={fetchPlans}
          aria-label="Muat ulang study plan"
          className="text-xs font-bold px-4 py-2.5 gap-2 border border-white/10 hover:border-cyan-500/50 bg-[#080C14]/80 hover:bg-slate-900 text-slate-200 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] rounded-xl flex items-center transition-all group backdrop-blur-md active:scale-95"
        >
          <RefreshCw size={14} className="text-cyan-400 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
          <span>Muat Ulang</span>
        </m.button>
      </m.div>

      {error && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-semibold shadow-md"
          role="alert"
        >
          {error}
        </m.div>
      )}

      {/* Material Upload Section */}
      <m.div variants={cardVariants}>
        <MaterialUploader onPlanSaved={fetchPlans} />
      </m.div>

      {/* Stats strip */}
      {plans.length > 0 && (
        <m.div variants={containerVariants} initial="hidden" animate="visible">
          <StatsStrip plans={plans} />
        </m.div>
      )}

      {/* Empty State Panel */}
      {plans.length === 0 && !error && (
        <m.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EMIL_EASE_ARR }}
          className="rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center gap-5 border border-dashed border-cyan-500/30 backdrop-blur-xl relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.12) 0%, rgba(3,7,18,0.92) 80%)",
            boxShadow: "0 10px 40px rgba(6,182,212,0.1)",
          }}
        >
          <div className="size-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <BookOpen size={32} className="animate-pulse text-cyan-400" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-display text-xl font-black text-white">
              Belum ada study plan aktif 🚀
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Buka menu <strong className="text-cyan-300 font-bold">AI Tutor</strong> atau unggah slide PDF di atas untuk menyusun jadwal belajar pintar secara otomatis bersama abang ganteng.
            </p>
          </div>
          <a
            href="/dashboard/tutor"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Sparkles size={14} /> Tanya AI Tutor abang ganteng
          </a>
        </m.div>
      )}

      {/* Plan Cards List */}
      {plans.length > 0 && (
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
          aria-label="Study plans"
        >
          <AnimatePresence>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onToggleTask={handleToggleTask}
                onCompletePlan={handleCompletePlan}
                onResetPlan={handleResetPlan}
                onDeletePlan={handleDeletePlan}
              />
            ))}
          </AnimatePresence>
        </m.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Page Export — wrapped in ProtectedRoute
------------------------------------------------------------------ */
export default function PlanPage() {
  return (
    <ProtectedRoute>
      <PlanContent />
    </ProtectedRoute>
  );
}
