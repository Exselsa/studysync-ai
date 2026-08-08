/**
 * Firestore Database Utilities — StudySync AI
 *
 * Strictly-typed helper functions for reading/writing Firestore
 * using the modular Firebase v12 SDK.
 *
 * All functions are client-safe (no Node-only APIs).
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "./clientApp";

/* ----------------------------------------------------------------
   Domain Types
---------------------------------------------------------------- */

export interface StudyTask {
  id: string;
  title: string;
  /** One-sentence explanation of what to do — populated by Gemini */
  description?: string;
  /** "pending" | "in_progress" | "done" */
  status?: string;
  completed: boolean;
  dueDate?: string; // ISO date string or relative label
}

export interface StudyPlan {
  /** Firestore document ID — populated only when reading from Firestore */
  id: string;
  title: string;
  subject: string;
  tasks: StudyTask[];
  /** 0–100 */
  progress: number;
  /** "active" | "completed" | "archived" */
  status?: "active" | "completed" | "archived";
  /** ISO string derived from Firestore Timestamp on read */
  createdAt: string;
}

/* ----------------------------------------------------------------
   Internal: Firestore document shape (what we actually store)
---------------------------------------------------------------- */
interface StudyPlanDoc {
  title: string;
  subject: string;
  tasks: StudyTask[];
  progress: number;
  status: string;
  createdAt: ReturnType<typeof serverTimestamp>;
}

/* ----------------------------------------------------------------
   Collection path helper
---------------------------------------------------------------- */
function userPlansCollection(userId: string) {
  return collection(db, "users", userId, "studyPlans");
}

/* ----------------------------------------------------------------
   Sanitizer & Normalizer Helpers — prevent undefined & schema mismatch
---------------------------------------------------------------- */
export function sanitizeTask(task: Partial<StudyTask>): StudyTask {
  return {
    id: task.id || crypto.randomUUID(),
    title: task.title || "",
    description: task.description || "",
    status: task.status || (task.completed ? "done" : "pending"),
    completed: Boolean(task.completed),
    dueDate: task.dueDate || "",
  };
}

/**
 * Normalizes and flattens tasks from any raw plan object (including nested AI modules).
 */
export function normalizePlanTasks(rawPlan: any): StudyTask[] {
  if (!rawPlan || typeof rawPlan !== "object") return [];

  const tasks: StudyTask[] = [];

  const pushTask = (
    title: string,
    description: string = "",
    completed: boolean = false,
    status?: string,
    dueDate?: string,
    id?: string
  ) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    if (tasks.some((t) => t.title.toLowerCase() === cleanTitle.toLowerCase())) {
      return;
    }

    tasks.push(
      sanitizeTask({
        id: id || crypto.randomUUID(),
        title: cleanTitle,
        description: description.trim(),
        completed: Boolean(completed),
        status: status || (completed ? "done" : "pending"),
        dueDate: dueDate || "",
      })
    );
  };

  // 1. Direct top-level `tasks` array
  if (Array.isArray(rawPlan.tasks) && rawPlan.tasks.length > 0) {
    for (const t of rawPlan.tasks) {
      if (t && typeof t === "object") {
        pushTask(
          t.title || t.name || "",
          t.description || "",
          Boolean(t.completed),
          t.status,
          t.dueDate,
          t.id
        );
      } else if (typeof t === "string") {
        pushTask(t);
      }
    }
  }

  // 2. Direct top-level `studyPlan.tasks` array if wrapped
  if (
    rawPlan.studyPlan &&
    typeof rawPlan.studyPlan === "object" &&
    Array.isArray(rawPlan.studyPlan.tasks) &&
    rawPlan.studyPlan.tasks.length > 0
  ) {
    for (const t of rawPlan.studyPlan.tasks) {
      if (t && typeof t === "object") {
        pushTask(
          t.title || t.name || "",
          t.description || "",
          Boolean(t.completed),
          t.status,
          t.dueDate,
          t.id
        );
      } else if (typeof t === "string") {
        pushTask(t);
      }
    }
  }

  // 3. Extract tasks wrapped inside `modules`, `dailyModules`, or `days` arrays
  const modules = Array.isArray(rawPlan.modules)
    ? rawPlan.modules
    : Array.isArray(rawPlan.dailyModules)
    ? rawPlan.dailyModules
    : Array.isArray(rawPlan.days)
    ? rawPlan.days
    : [];

  if (modules.length > 0) {
    modules.forEach((mod: any, modIdx: number) => {
      const dayNum = mod.dayNumber || mod.day || modIdx + 1;
      const modTasks = Array.isArray(mod.tasks)
        ? mod.tasks
        : Array.isArray(mod.dailyTasks)
        ? mod.dailyTasks
        : Array.isArray(mod.items)
        ? mod.items
        : [];

      if (modTasks.length > 0) {
        modTasks.forEach((mt: any, tIdx: number) => {
          if (mt && typeof mt === "object") {
            pushTask(
              mt.title || mt.name || `Tugas Hari ${dayNum}-${tIdx + 1}`,
              mt.description || mod.goal || mod.title || "",
              Boolean(mt.completed),
              mt.status,
              mt.dueDate || `Hari ke-${dayNum}`,
              mt.id
            );
          } else if (typeof mt === "string") {
            pushTask(mt, mod.goal || "", false, "pending", `Hari ke-${dayNum}`);
          }
        });
      } else if (mod.goal || mod.title) {
        pushTask(
          mod.goal || mod.title || `Modul Hari ${dayNum}`,
          mod.description || (Array.isArray(mod.topics) ? mod.topics.join(", ") : ""),
          false,
          "pending",
          `Hari ke-${dayNum}`
        );
      }
    });
  }

  return tasks;
}

export function sanitizeStudyPlan(
  planData: Partial<StudyPlan> & Record<string, any>
): Omit<StudyPlan, "id" | "createdAt"> & { status: "active" | "completed" | "archived" } {
  const tasks = normalizePlanTasks(planData);
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const validStatus: "active" | "completed" | "archived" =
    planData.status === "completed" || planData.status === "archived"
      ? planData.status
      : "active";

  return {
    title: planData.title || "Study Plan Baru",
    subject: planData.subject || "Umum",
    tasks,
    progress: typeof planData.progress === "number" ? planData.progress : progress,
    status: validStatus,
  };
}

/* ----------------------------------------------------------------
   saveStudyPlan
   Adds a new study plan document under /users/{userId}/studyPlans
---------------------------------------------------------------- */
export async function saveStudyPlan(
  userId: string,
  planData: Omit<StudyPlan, "id" | "createdAt">
): Promise<string> {
  const sanitized = sanitizeStudyPlan(planData);
  const doc: StudyPlanDoc = {
    ...sanitized,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(userPlansCollection(userId), doc);
  return ref.id;
}

/* ----------------------------------------------------------------
   getStudyPlans
   Fetches active study plans for a user, ordered by creation date (desc).
---------------------------------------------------------------- */
export async function getStudyPlans(userId: string): Promise<StudyPlan[]> {
  const q = query(userPlansCollection(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();

      let createdAt = "";
      if (data.createdAt instanceof Timestamp) {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        createdAt = data.createdAt;
      }

      const tasks = normalizePlanTasks(data);
      const completedCount = tasks.filter((t) => t.completed).length;
      const computedProgress = tasks.length
        ? Math.round((completedCount / tasks.length) * 100)
        : 0;

      return {
        id: docSnap.id,
        title: data.title ?? "Study Plan",
        subject: data.subject ?? "Umum",
        tasks,
        progress: typeof data.progress === "number" ? data.progress : computedProgress,
        status: (data.status as "active" | "completed" | "archived") ?? "active",
        createdAt,
      } satisfies StudyPlan;
    })
    .filter((plan) => !plan.status || plan.status === "active");
}

/* ----------------------------------------------------------------
   updateStudyPlanTasks
   Updates tasks array & recalculates progress in Firestore
---------------------------------------------------------------- */
export async function updateStudyPlanTasks(
  userId: string,
  planId: string,
  tasks: StudyTask[]
): Promise<void> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  const sanitizedTasks = tasks.map((t) => sanitizeTask(t));
  const completedCount = sanitizedTasks.filter((t) => t.completed).length;
  const progress = sanitizedTasks.length
    ? Math.round((completedCount / sanitizedTasks.length) * 100)
    : 0;

  await updateDoc(planRef, {
    tasks: sanitizedTasks,
    progress,
  });
}

/* ----------------------------------------------------------------
   updateStudyPlanStatus
   Updates status ('active' | 'completed' | 'archived') in Firestore
---------------------------------------------------------------- */
export async function updateStudyPlanStatus(
  userId: string,
  planId: string,
  status: "active" | "completed" | "archived"
): Promise<void> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  await updateDoc(planRef, {
    status,
  });
}

/* ----------------------------------------------------------------
   deleteStudyPlan
   Permanently deletes a study plan document from Firestore
---------------------------------------------------------------- */
export async function deleteStudyPlan(
  userId: string,
  planId: string
): Promise<void> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  await deleteDoc(planRef);
}

/* ----------------------------------------------------------------
   resetStudyPlanTasks
   Resets all task checkboxes to uncompleted (0% progress) in Firestore
---------------------------------------------------------------- */
export async function resetStudyPlanTasks(
  userId: string,
  planId: string,
  tasks: StudyTask[]
): Promise<StudyTask[]> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  const resetTasks = tasks.map((t) =>
    sanitizeTask({
      ...t,
      completed: false,
      status: "pending",
    })
  );

  await updateDoc(planRef, {
    tasks: resetTasks,
    progress: 0,
    status: "active",
  });

  return resetTasks;
}
