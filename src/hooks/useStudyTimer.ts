"use client";

import { useEffect, useRef } from "react";
import { addStudyMinutes } from "@/lib/firebase/userStats";

/**
 * Custom hook to track active study session time in real-time.
 * Automatically increments user's monthly study minutes in Firestore
 * every 60 seconds while active on a learning page (AI Tutor, Boss Fight, Study Meet).
 */
export function useStudyTimer(
  userId: string | undefined,
  isActive: boolean = true
) {
  const accumulatedSecondsRef = useRef<number>(0);

  useEffect(() => {
    if (!userId || !isActive) return;

    // Reset counter on mount or status change
    accumulatedSecondsRef.current = 0;

    const secondInterval = setInterval(() => {
      accumulatedSecondsRef.current += 1;

      // Every 60 seconds (1 minute), persist to Firestore
      if (accumulatedSecondsRef.current >= 60) {
        accumulatedSecondsRef.current -= 60;
        addStudyMinutes(userId, 1).catch((err) =>
          console.error("Failed to add study minute:", err)
        );
      }
    }, 1000);

    return () => {
      clearInterval(secondInterval);

      // Flush remaining seconds if >= 30 seconds
      if (accumulatedSecondsRef.current >= 30 && userId) {
        addStudyMinutes(userId, 1).catch((err) =>
          console.error("Failed to add final study minute on exit:", err)
        );
      }
      accumulatedSecondsRef.current = 0;
    };
  }, [userId, isActive]);
}
