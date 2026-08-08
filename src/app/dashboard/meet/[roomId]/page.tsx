"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudyMeetPage from "../page";

export default function StudyMeetRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams.roomId) {
      // Ensure url query parameter aligns with roomId for unified page logic
      const currentQuery = new URLSearchParams(window.location.search);
      if (currentQuery.get("roomId") !== resolvedParams.roomId) {
        router.replace(`/dashboard/meet?roomId=${resolvedParams.roomId}`);
      }
    }
  }, [resolvedParams.roomId, router]);

  return <StudyMeetPage />;
}
