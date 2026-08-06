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
  createdAt: ReturnType<typeof serverTimestamp>;
}

/* ----------------------------------------------------------------
   Collection path helper
---------------------------------------------------------------- */
function userPlansCollection(userId: string) {
  return collection(db, "users", userId, "studyPlans");
}

/* ----------------------------------------------------------------
   saveStudyPlan
   Adds a new study plan document under /users/{userId}/studyPlans
---------------------------------------------------------------- */
export async function saveStudyPlan(
  userId: string,
  planData: Omit<StudyPlan, "id" | "createdAt">
): Promise<string> {
  const doc: StudyPlanDoc = {
    title: planData.title,
    subject: planData.subject,
    tasks: planData.tasks,
    progress: planData.progress,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(userPlansCollection(userId), doc);
  return ref.id;
}

/* ----------------------------------------------------------------
   getStudyPlans
   Fetches all study plans for a user, ordered by creation date (desc).
---------------------------------------------------------------- */
export async function getStudyPlans(userId: string): Promise<StudyPlan[]> {
  const q = query(userPlansCollection(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data();

    // Convert Firestore Timestamp → ISO string (gracefully handle null for
    // optimistic writes that haven't resolved serverTimestamp yet)
    let createdAt = "";
    if (data.createdAt instanceof Timestamp) {
      createdAt = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === "string") {
      createdAt = data.createdAt;
    }

    return {
      id: doc.id,
      title: data.title ?? "",
      subject: data.subject ?? "",
      tasks: (data.tasks ?? []) as StudyTask[],
      progress: typeof data.progress === "number" ? data.progress : 0,
      createdAt,
    } satisfies StudyPlan;
  });
}
