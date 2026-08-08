import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./clientApp";
import type { UserStats } from "../types";

/**
 * Returns YYYY-MM-DD string in local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns YYYY-MM-DD string for yesterday in local timezone.
 */
export function getYesterdayDateString(d: Date = new Date()): string {
  const yesterday = new Date(d);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * Reads user stats from Firestore with safe default values.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const todayStr = getLocalDateString();
  const currentMonth = new Date().getMonth();

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return {
      currentStreak: 1,
      lastActiveDate: todayStr,
      totalStudyMinutesThisMonth: 0,
      lastResetMonth: currentMonth,
    };
  }

  const data = snap.data();
  const lastResetMonth =
    typeof data.lastResetMonth === "number" ? data.lastResetMonth : currentMonth;
  const isNewMonth = lastResetMonth !== currentMonth;

  return {
    currentStreak: typeof data.currentStreak === "number" && data.currentStreak > 0 ? data.currentStreak : 1,
    lastActiveDate: typeof data.lastActiveDate === "string" ? data.lastActiveDate : todayStr,
    totalStudyMinutesThisMonth: isNewMonth
      ? 0
      : typeof data.totalStudyMinutesThisMonth === "number"
      ? data.totalStudyMinutesThisMonth
      : 0,
    lastResetMonth: currentMonth,
  };
}

/**
 * Records daily login/activity for a user and calculates daily streaks & monthly resets.
 *
 * Rules:
 * - If lastActiveDate === todayStr: streak stays currentStreak.
 * - If lastActiveDate === yesterdayStr: currentStreak = currentStreak + 1, lastActiveDate = todayStr.
 * - If lastActiveDate < yesterdayStr or missing: currentStreak = 1, lastActiveDate = todayStr.
 * - If lastResetMonth !== currentMonth: totalStudyMinutesThisMonth = 0, lastResetMonth = currentMonth.
 */
export async function recordDailyActivity(userId: string): Promise<UserStats> {
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();
  const currentMonth = new Date().getMonth();

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  let currentStreak = 1;
  let totalMinutes = 0;
  let lastActiveDate = "";
  let lastResetMonth = currentMonth;

  if (snap.exists()) {
    const data = snap.data();
    lastActiveDate = typeof data.lastActiveDate === "string" ? data.lastActiveDate : "";
    lastResetMonth = typeof data.lastResetMonth === "number" ? data.lastResetMonth : currentMonth;
    const existingStreak = typeof data.currentStreak === "number" && data.currentStreak > 0 ? data.currentStreak : 1;

    // 1. Monthly Reset Check
    if (lastResetMonth !== currentMonth) {
      totalMinutes = 0;
    } else {
      totalMinutes = typeof data.totalStudyMinutesThisMonth === "number" ? data.totalStudyMinutesThisMonth : 0;
    }

    // 2. Daily Streak Check
    if (lastActiveDate === todayStr) {
      currentStreak = existingStreak;
    } else if (lastActiveDate === yesterdayStr) {
      currentStreak = existingStreak + 1;
    } else {
      currentStreak = 1;
    }
  }

  const updatedStats: UserStats = {
    currentStreak,
    lastActiveDate: todayStr,
    totalStudyMinutesThisMonth: totalMinutes,
    lastResetMonth: currentMonth,
  };

  await setDoc(userRef, updatedStats, { merge: true });
  return updatedStats;
}

/**
 * Adds active study minutes to totalStudyMinutesThisMonth for the user.
 * Automatically handles monthly resets.
 */
export async function addStudyMinutes(
  userId: string,
  minutesToAdd: number
): Promise<void> {
  if (!userId || minutesToAdd <= 0) return;

  const currentStats = await recordDailyActivity(userId);
  const newTotal = currentStats.totalStudyMinutesThisMonth + Math.round(minutesToAdd);

  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      totalStudyMinutesThisMonth: newTotal,
    },
    { merge: true }
  );
}
