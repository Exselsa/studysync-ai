"use client";

import { useEffect, useState, useCallback } from "react";
import { m, AnimatePresence, type Variants } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  RefreshCw,
  Inbox,
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
  updateStudyPlanTasks,
  updateStudyPlanStatus,
  resetStudyPlanTasks,
  deleteStudyPlan,
  normalizePlanTasks,
  type StudyPlan,
  type StudyTask,
} from "@/lib/firebase/db";
import MaterialUploader from "@/components/study/MaterialUploader";

/* ------------------------------------------------------------------
   Animation Variants
------------------------------------------------------------------ */
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.42, ease: EASE } },
};

const taskVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } },
};

/* ------------------------------------------------------------------
   Utilities
------------------------------------------------------------------ */
function computeProgress(tasks: StudyTask[]): number {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/* ------------------------------------------------------------------
   Subject colour mapping
------------------------------------------------------------------ */
function subjectAccent(subject: string): { bg: string; border: string; text: string } {
  const s = subject.toLowerCase();
  if (s.includes("calculus") || s.includes("math"))
    return { bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.22)", text: "rgba(56,189,248,0.9)" };
  if (s.includes("machine") || s.includes("ml") || s.includes("ai"))
    return { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)", text: "rgba(245,158,11,0.9)" };
  if (s.includes("algorithm") || s.includes("cs") || s.includes("code"))
    return { bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.22)", text: "rgba(34,197,94,0.9)" };
  if (s.includes("chemistry") || s.includes("organic"))
    return { bg: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.22)", text: "rgba(168,85,247,0.9)" };
  return { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", text: "var(--color-silver-300)" };
}

/* ------------------------------------------------------------------
   Progress Ring
------------------------------------------------------------------ */
function ProgressRing({ pct }: { pct: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={44} height={44} viewBox="0 0 44 44" aria-hidden="true">
      {/* Track */}
      <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      {/* Progress arc */}
      <circle
        cx={22} cy={22} r={r} fill="none"
        stroke={pct === 100 ? "rgba(34,197,94,0.8)" : "rgba(245,158,11,0.8)"}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill={pct === 100 ? "rgba(34,197,94,0.9)" : "var(--color-silver-100)"}
        fontFamily="var(--font-outfit)"
      >
        {pct}%
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------
   Task Row — single task item with checkbox
------------------------------------------------------------------ */
function TaskRow({
  task,
  onToggle,
}: {
  task: StudyTask;
  onToggle: (id: string) => void;
}) {
  const overdue = !task.completed && isOverdue(task.dueDate);

  return (
    <m.div
      layout
      variants={taskVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.75rem 0.875rem",
        borderRadius: "10px",
        background: task.completed ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.025)",
        border: task.completed
          ? "1px solid rgba(34,197,94,0.12)"
          : "1px solid rgba(255,255,255,0.06)",
        transition: "background 200ms ease, border-color 200ms ease",
        cursor: "pointer",
      }}
      onClick={() => onToggle(task.id)}
      whileHover={{ borderColor: "rgba(255,255,255,0.12)", transition: { duration: 0.12 } }}
      whileTap={{ scale: 0.99 }}
      role="checkbox"
      aria-checked={task.completed}
      aria-label={task.title}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(task.id); } }}
    >
      {/* Checkbox icon */}
      <div style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true">
        {task.completed ? (
          <CheckCircle2 size={16} style={{ color: "rgba(34,197,94,0.85)" }} />
        ) : (
          <Circle size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: task.completed ? "var(--color-silver-400)" : "var(--color-silver-100)",
            lineHeight: 1.5,
            textDecoration: task.completed ? "line-through" : "none",
            opacity: task.completed ? 0.65 : 1,
            wordBreak: "break-word",
          }}
        >
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <p
            style={{
              fontSize: "0.6875rem",
              color: task.completed
                ? "var(--color-silver-400)"
                : "rgba(203,213,225,0.75)",
              lineHeight: 1.55,
              marginTop: "0.25rem",
              wordBreak: "break-word",
              opacity: task.completed ? 0.5 : 1,
              fontStyle: task.completed ? "italic" : "normal",
            }}
          >
            {task.description}
          </p>
        )}

        {/* Status badge + due date row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
          {task.status && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.1rem 0.45rem",
                borderRadius: "9999px",
                background: task.completed
                  ? "rgba(34,197,94,0.12)"
                  : task.status === "in_progress"
                  ? "rgba(56,189,248,0.12)"
                  : "rgba(255,255,255,0.06)",
                border: task.completed
                  ? "1px solid rgba(34,197,94,0.22)"
                  : task.status === "in_progress"
                  ? "1px solid rgba(56,189,248,0.22)"
                  : "1px solid rgba(255,255,255,0.10)",
                color: task.completed
                  ? "rgba(34,197,94,0.85)"
                  : task.status === "in_progress"
                  ? "rgba(56,189,248,0.85)"
                  : "var(--color-silver-400)",
              }}
            >
              {task.completed ? "done" : (task.status ?? "pending")}
            </span>
          )}

          {task.dueDate && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Clock size={10} style={{ color: overdue ? "rgba(239,68,68,0.8)" : "var(--color-silver-400)" }} aria-hidden="true" />
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: overdue ? "rgba(239,68,68,0.8)" : "var(--color-silver-400)",
                  fontWeight: overdue ? 600 : 400,
                }}
              >
                {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
              </span>
            </div>
          )}
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

  // Retroactive UI Data Repair: extract tasks dynamically if plan.tasks is empty
  const effectiveTasks =
    Array.isArray(plan.tasks) && plan.tasks.length > 0
      ? plan.tasks
      : normalizePlanTasks(plan);

  const accent = subjectAccent(plan.subject);
  const progress = computeProgress(effectiveTasks);
  const completedCount = effectiveTasks.filter((t) => t.completed).length;
  const isAllCompleted = effectiveTasks.length > 0 && completedCount === effectiveTasks.length;

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
        style={{
          background: isAllCompleted ? "rgba(6,28,46,0.75)" : "rgba(6,16,46,0.6)",
          border: isAllCompleted
            ? "1px solid rgba(34,197,94,0.3)"
            : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: isAllCompleted
            ? "0 8px 32px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.1) inset"
            : "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset",
          transition: "box-shadow 200ms ease, border-color 200ms ease, background 200ms ease",
        }}
        aria-label={`Study plan: ${plan.title}`}
      >
        {/* ---- Card Header ---- */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1.125rem 1.25rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
          onClick={() => setCollapsed((c) => !c)}
          role="button"
          aria-expanded={!collapsed}
          aria-controls={`plan-tasks-${plan.id}`}
        >
          {/* Progress ring */}
          <ProgressRing pct={progress} />

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--color-silver-50)",
                lineHeight: 1.3,
                marginBottom: "0.3rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {plan.title}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
              {/* Subject badge */}
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  background: accent.bg,
                  border: `1px solid ${accent.border}`,
                  color: accent.text,
                }}
              >
                {plan.subject}
              </span>
              {/* Task progress */}
              <span style={{ fontSize: "0.6875rem", color: "var(--color-silver-400)" }}>
                {completedCount} / {effectiveTasks.length} tasks
              </span>
              {/* 100% Completion Badge */}
              {isAllCompleted && (
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "9999px",
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "rgba(34,197,94,0.95)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <Trophy size={11} /> 100% Selesai
                </span>
              )}
              {/* Date */}
              {plan.createdAt && (
                <span style={{ fontSize: "0.6875rem", color: "var(--color-silver-400)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <CalendarDays size={10} aria-hidden="true" />
                  {formatDate(plan.createdAt)}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons: Hapus Plan 🗑️ */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <button
              type="button"
              id={`plan-delete-btn-${plan.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.28)",
                color: "#f87171",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 150ms ease, border-color 150ms ease",
              }}
              title="Hapus Study Plan ini"
            >
              <Trash2 size={13} /> Hapus Plan 🗑️
            </button>

            {/* Collapse chevron */}
            <div aria-hidden="true" style={{ color: "var(--color-silver-400)", flexShrink: 0 }}>
              {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </div>
        </div>

        {/* ---- Task List ---- */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <m.div
              id={`plan-tasks-${plan.id}`}
              key="tasks"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: { duration: 0.3, ease: EASE } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: EASE } }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  padding: "0.75rem 1.25rem 1.125rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {effectiveTasks.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-silver-400)", textAlign: "center", padding: "0.75rem 0" }}>
                    Belum ada tugas di plan ini.
                  </p>
                ) : (
                  <AnimatePresence>
                    {effectiveTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={(taskId) => onToggleTask(plan.id, taskId)}
                      />
                    ))}
                  </AnimatePresence>
                )}

                {/* Progress bar */}
                <div style={{ marginTop: "0.625rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-silver-400)" }}>Progress</span>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: progress === 100 ? "rgba(34,197,94,0.85)" : "var(--color-gold-400)" }}>
                      {progress}%
                    </span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <m.div
                      layout
                      style={{
                        height: "100%",
                        borderRadius: "9999px",
                        background: progress === 100
                          ? "linear-gradient(90deg, rgba(34,197,94,0.7), rgba(34,197,94,0.9))"
                          : "linear-gradient(90deg, var(--color-gold-500), var(--color-gold-300))",
                        width: `${progress}%`,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Completion Banner & Action Controls */}
                {isAllCompleted && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    style={{
                      marginTop: "1rem",
                      padding: "1.125rem",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(16,185,129,0.06))",
                      border: "1px solid rgba(34,197,94,0.28)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.875rem",
                      boxShadow: "0 8px 24px rgba(34,197,94,0.12)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "rgba(34,197,94,0.2)",
                          border: "1px solid rgba(34,197,94,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#4ade80",
                          flexShrink: 0,
                        }}
                      >
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4
                          style={{
                            fontFamily: "var(--font-outfit)",
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            color: "var(--color-silver-50)",
                            lineHeight: 1.3,
                            margin: 0,
                          }}
                        >
                          Selamat! Semua tugas telah selesai 🥳
                        </h4>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-silver-300)",
                            lineHeight: 1.45,
                            marginTop: "0.25rem",
                          }}
                        >
                          Pilih <strong>&ldquo;Selesai&rdquo;</strong> untuk mengarsipkan plan ini, atau <strong>&ldquo;Ulangi&rdquo;</strong> untuk memulai kembali dari 0%.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      {/* Selesai Button */}
                      <button
                        type="button"
                        id={`plan-complete-btn-${plan.id}`}
                        onClick={handleComplete}
                        disabled={actionLoading !== null}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                          padding: "0.625rem 1rem",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #22c55e, #16a34a)",
                          border: "none",
                          color: "#030b22",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.7 : 1,
                          boxShadow: "0 2px 10px rgba(34,197,94,0.3)",
                          transition: "transform 120ms ease, opacity 120ms ease",
                        }}
                      >
                        {actionLoading === "complete" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        Selesai
                      </button>

                      {/* Ulangi Button */}
                      <button
                        type="button"
                        id={`plan-reset-btn-${plan.id}`}
                        onClick={handleReset}
                        disabled={actionLoading !== null}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                          padding: "0.625rem 1rem",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "var(--color-silver-100)",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.7 : 1,
                          transition: "background 120ms ease",
                        }}
                      >
                        {actionLoading === "reset" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={15} />
                        )}
                        Ulangi
                      </button>
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
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3
                  className="text-lg font-black text-slate-100"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
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
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs cursor-pointer shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === "delete" ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
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
    { Icon: BookOpen, label: "Total Plan", value: String(plans.length) },
    { Icon: CheckCircle2, label: "Tugas Selesai", value: `${doneTasks} / ${totalTasks}` },
    { Icon: TrendingUp, label: "Rata-rata Progres", value: `${avgPct}%` },
  ];

  return (
    <m.div
      variants={cardVariants}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {stats.map(({ Icon, label, value }) => (
        <div
          key={label}
          style={{ background: "rgba(6,16,46,0.7)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon size={11} style={{ color: "var(--color-gold-400)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-silver-400)" }}>
              {label}
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-silver-50)" }}>
            {value}
          </span>
        </div>
      ))}
    </m.div>
  );
}

/* ------------------------------------------------------------------
   Plan Page Content
------------------------------------------------------------------ */
function PlanContent() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ----------------------------------------------------------------
     Fetch plans on mount (and on manual refresh)
  ---------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------
     Toggle Task & sync with Firestore
  ---------------------------------------------------------------- */
  const handleToggleTask = useCallback(
    async (planId: string, taskId: string) => {
      if (!user?.uid) return;

      let updatedTasks: StudyTask[] = [];

      setPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;
          const currentTasks =
            Array.isArray(plan.tasks) && plan.tasks.length > 0
              ? plan.tasks
              : normalizePlanTasks(plan);

          updatedTasks = currentTasks.map((t) =>
            t.id !== taskId
              ? t
              : { ...t, completed: !t.completed, status: !t.completed ? "done" : "pending" }
          );
          const progress = computeProgress(updatedTasks);
          return {
            ...plan,
            tasks: updatedTasks,
            progress,
          };
        })
      );

      try {
        await updateStudyPlanTasks(user.uid, planId, updatedTasks);
      } catch (err) {
        console.error("Failed to update task in Firestore:", err);
      }
    },
    [user?.uid]
  );

  /* ----------------------------------------------------------------
     Delete Plan (Hapus Plan -> deleteDoc in Firestore & remove from UI)
  ---------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------
     Complete Plan (Selesai -> archive in Firestore & hide from view)
  ---------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------
     Reset Plan (Ulangi -> reset task checkmarks to 0% in Firestore)
  ---------------------------------------------------------------- */
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
                  progress: 0,
                  status: "active",
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

  /* ----------------------------------------------------------------
     Render states
  ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div
        className="flex flex-col flex-1 animate-pulse overflow-y-auto gap-6"
        style={{ padding: "1.5rem 2rem", maxWidth: "900px", width: "100%", margin: "0 auto" }}
        aria-busy="true"
        aria-label="Loading study plans"
      >
        {/* Header skeleton */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-7 w-48 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-3 w-72 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
          <div className="h-9 w-24 rounded-[10px]" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Stats strip skeleton */}
        <div
          className="grid grid-cols-3 rounded-[14px] overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", gap: "1px" }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2 px-5 py-4" style={{ background: "rgba(6,16,46,0.7)" }}>
              <div className="h-2 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-7 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>
          ))}
        </div>

        {/* Plan card skeletons */}
        {[4, 3, 5].map((taskCount, cardIdx) => (
          <div
            key={cardIdx}
            className="rounded-[18px] overflow-hidden"
            style={{ background: "rgba(6,16,46,0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
          >
            <div className="flex items-center gap-4 px-5 py-[1.125rem]">
              <div className="w-11 h-11 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-48 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="flex gap-2">
                  <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-3 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 px-5 pb-5 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {Array.from({ length: taskCount }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-3.5 py-3 rounded-[10px]"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3 w-3/4 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="h-2.5 w-1/2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "1.5rem 2rem", overflowY: "auto", gap: "1.5rem", maxWidth: "900px", width: "100%", margin: "0 auto" }}>

      {/* ---- Page Header ---- */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: EASE }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem" }}
      >
        <div>
          <h1
            id="plan-heading"
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "var(--color-silver-50)",
              lineHeight: 1.2,
              marginBottom: "0.25rem",
            }}
          >
            Papan Study Plan
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-silver-400)" }}>
            {plans.length === 0
              ? "Belum ada plan nih — yuk ngobrol sama AI Tutor buat bikin plan baru!"
              : `${plans.length} plan aktif · klik tugas buat tandai selesai`}
          </p>
        </div>

        {/* Refresh */}
        <button
          type="button"
          id="plan-refresh"
          onClick={fetchPlans}
          aria-label="Muat ulang study plan"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.875rem",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "var(--color-silver-300)",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 500,
            transition: "background 120ms ease, border-color 120ms ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
        >
          <RefreshCw size={13} aria-hidden="true" />
          Muat Ulang
        </button>
      </m.div>

      {/* ---- Error state ---- */}
      {error && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: "0.875rem 1rem",
            borderRadius: "12px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.18)",
            color: "rgba(239,68,68,0.9)",
            fontSize: "0.8125rem",
          }}
          role="alert"
        >
          {error}
        </m.div>
      )}

      {/* ---- Material Upload & Gemini AI Section ---- */}
      <m.div variants={cardVariants}>
        <MaterialUploader onPlanSaved={fetchPlans} />
      </m.div>

      {/* ---- Stats strip ---- */}
      {plans.length > 0 && (
        <m.div variants={containerVariants} initial="hidden" animate="visible">
          <StatsStrip plans={plans} />
        </m.div>
      )}

      {/* ---- Empty state ---- */}
      {plans.length === 0 && !error && (
        <m.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "3rem",
            borderRadius: "18px",
            background: "rgba(6,16,46,0.4)",
            border: "1px dashed rgba(255,255,255,0.10)",
          }}
        >
          <Inbox size={36} style={{ color: "var(--color-silver-400)" }} aria-hidden="true" />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "1rem", color: "var(--color-silver-200)", marginBottom: "0.35rem" }}>
              Belum ada study plan
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-silver-400)", lineHeight: 1.6 }}>
              Buka menu <strong style={{ color: "var(--color-silver-300)" }}>AI Tutor</strong> dan minta AI buatkan plan buat kamu.<br />
              Plan akan otomatis muncul di sini.
            </p>
          </div>
        </m.div>
      )}

      {/* ---- Plan Cards ---- */}
      {plans.length > 0 && (
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
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
