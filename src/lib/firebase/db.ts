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
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
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
  dueDate?: string; // ISO date string
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
   Sanitizer Helpers — prevent undefined values from breaking Firestore
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

export function sanitizeStudyPlan(
  planData: Partial<StudyPlan>
): Omit<StudyPlan, "id" | "createdAt"> & { status: "active" | "completed" | "archived" } {
  const rawTasks = Array.isArray(planData.tasks) ? planData.tasks : [];
  const tasks = rawTasks.map((t) => sanitizeTask(t));
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

      // Convert Firestore Timestamp → ISO string (gracefully handle null for
      // optimistic writes that haven't resolved serverTimestamp yet)
      let createdAt = "";
      if (data.createdAt instanceof Timestamp) {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        createdAt = data.createdAt;
      }

      const rawTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const tasks = rawTasks.map((t: unknown) =>
        sanitizeTask((t && typeof t === "object" ? t : {}) as Partial<StudyTask>)
      );

      const completedCount = tasks.filter((t) => t.completed).length;
      const computedProgress = tasks.length
        ? Math.round((completedCount / tasks.length) * 100)
        : 0;

      return {
        id: docSnap.id,
        title: data.title ?? "",
        subject: data.subject ?? "",
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
   resetStudyPlanTasks
   Resets all task checkboxes to uncompleted (0% progress) in Firestore
---------------------------------------------------------------- */
export async function resetStudyPlanTasks(
  userId: string,
  planId: string,
  tasks: StudyTask[]
): Promise<StudyTask[]> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  const resetTasks = tasks.map((t) => sanitizeTask({
    ...t,
    completed: false,
    status: "pending",
  }));

  await updateDoc(planRef, {
    tasks: resetTasks,
    progress: 0,
    status: "active",
  });

  return resetTasks;
}
