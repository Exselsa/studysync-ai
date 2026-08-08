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
  runTransaction,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "./clientApp";
import { normalizeStudyPlanData } from "../normalizeStudyPlan";
import type { StudyPlanTask, StudyPlan } from "../types";

export type { StudyPlanTask, StudyPlan };

/* ----------------------------------------------------------------
   Collection path helper
---------------------------------------------------------------- */
function userPlansCollection(userId: string) {
  return collection(db, "users", userId, "studyPlans");
}

/* ----------------------------------------------------------------
   saveStudyPlan
   Always runs input data through normalizeStudyPlanData before executing
   addDoc. Enforces that Firestore ONLY receives the flat canonical tasks array.
---------------------------------------------------------------- */
export async function saveStudyPlan(
  userId: string,
  rawPlanData: any
): Promise<string> {
  const tasks = normalizeStudyPlanData(rawPlanData.tasks ?? rawPlanData);

  const docData = {
    userId,
    title: rawPlanData.title || "Study Plan Baru",
    subject: rawPlanData.subject || "Umum",
    durationDays:
      typeof rawPlanData.durationDays === "number"
        ? rawPlanData.durationDays
        : typeof rawPlanData.totalDays === "number"
        ? rawPlanData.totalDays
        : 7,
    tasks,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(userPlansCollection(userId), docData);
  return ref.id;
}

/* ----------------------------------------------------------------
   getStudyPlans
   Fetches study plans for a user and runs document data through
   normalizeStudyPlanData(docData.tasks ?? docData) so legacy/corrupted
   Firestore documents automatically repair and display their tasks on read.
---------------------------------------------------------------- */
export async function getStudyPlans(userId: string): Promise<StudyPlan[]> {
  const q = query(userPlansCollection(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data();

    let createdAt = "";
    if (data.createdAt instanceof Timestamp) {
      createdAt = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === "string") {
      createdAt = data.createdAt;
    } else if (data.createdAt && typeof data.createdAt.toDate === "function") {
      createdAt = data.createdAt.toDate().toISOString();
    }

    const tasks = normalizeStudyPlanData(data.tasks ?? data);

    return {
      id: docSnap.id,
      userId: data.userId || userId,
      title: data.title ?? "Study Plan",
      subject: data.subject ?? "Umum",
      durationDays:
        typeof data.durationDays === "number"
          ? data.durationDays
          : typeof data.totalDays === "number"
          ? data.totalDays
          : 7,
      tasks,
      createdAt,
    } satisfies StudyPlan;
  });
}

/* ----------------------------------------------------------------
   toggleTaskCompletion
   Uses runTransaction to read the server document, map the specific task's
   completed state, and update the tasks array atomically without touching
   metadata fields.
---------------------------------------------------------------- */
export async function toggleTaskCompletion(
  userId: string,
  planId: string,
  taskId: string
): Promise<StudyPlanTask[]> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);

  return await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(planRef);
    if (!docSnap.exists()) {
      throw new Error("Study plan document not found.");
    }

    const data = docSnap.data();
    const tasks = normalizeStudyPlanData(data.tasks ?? data);

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    transaction.update(planRef, { tasks: updatedTasks });
    return updatedTasks;
  });
}

/* ----------------------------------------------------------------
   Legacy / Helper Utilities
---------------------------------------------------------------- */

export async function updateStudyPlanTasks(
  userId: string,
  planId: string,
  tasks: StudyPlanTask[]
): Promise<void> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  const normalized = normalizeStudyPlanData(tasks);
  await updateDoc(planRef, {
    tasks: normalized,
  });
}

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

export async function deleteStudyPlan(
  userId: string,
  planId: string
): Promise<void> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  await deleteDoc(planRef);
}

export async function resetStudyPlanTasks(
  userId: string,
  planId: string,
  tasks: StudyPlanTask[]
): Promise<StudyPlanTask[]> {
  const planRef = doc(db, "users", userId, "studyPlans", planId);
  const resetTasks = tasks.map((t) => ({
    ...t,
    completed: false,
  }));

  await updateDoc(planRef, {
    tasks: resetTasks,
  });

  return resetTasks;
}
