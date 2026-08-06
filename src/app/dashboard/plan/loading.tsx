/**
 * Next.js App Router streaming loading UI for /dashboard/plan.
 *
 * Shown instantly on navigation (zero blocking) while the plan page
 * chunk hydrates. Skeleton mirrors: stats strip → plan cards with tasks.
 */

function SkeletonPulse({
  w,
  h,
  rounded = "rounded-lg",
  opacity = "06",
}: {
  w: string;
  h: string;
  rounded?: string;
  opacity?: string;
}) {
  return (
    <div
      className={`${w} ${h} ${rounded} flex-shrink-0`}
      style={{ background: `rgba(255,255,255,0.${opacity})` }}
    />
  );
}

function SkeletonTaskRow() {
  return (
    <div className="flex items-start gap-3 px-3.5 py-3 rounded-[10px]"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <SkeletonPulse w="w-4" h="h-4" rounded="rounded-full" opacity="08" />
      <div className="flex flex-col gap-1.5 flex-1">
        <SkeletonPulse w="w-3/4" h="h-3" opacity="08" />
        <SkeletonPulse w="w-1/2" h="h-2.5" opacity="05" />
        <div className="flex gap-2 mt-0.5">
          <SkeletonPulse w="w-12" h="h-2" rounded="rounded-full" opacity="05" />
          <SkeletonPulse w="w-16" h="h-2" rounded="rounded-full" opacity="04" />
        </div>
      </div>
    </div>
  );
}

function SkeletonPlanCard({ taskCount }: { taskCount: number }) {
  return (
    <div
      className="rounded-[18px] overflow-hidden"
      style={{
        background: "rgba(6,16,46,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-[1.125rem]">
        {/* Progress ring placeholder */}
        <div
          className="w-11 h-11 rounded-full flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.08)" }}
        />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonPulse w="w-48" h="h-4" opacity="08" />
          <div className="flex gap-2">
            <SkeletonPulse w="w-20" h="h-3" rounded="rounded-full" opacity="06" />
            <SkeletonPulse w="w-16" h="h-3" rounded="rounded-full" opacity="04" />
          </div>
        </div>
        <SkeletonPulse w="w-4" h="h-4" rounded="rounded" opacity="05" />
      </div>

      {/* Task rows */}
      <div
        className="flex flex-col gap-2 px-5 pb-5 pt-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {Array.from({ length: taskCount }).map((_, i) => (
          <SkeletonTaskRow key={i} />
        ))}
        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between mb-1.5">
            <SkeletonPulse w="w-14" h="h-2" rounded="rounded-full" opacity="05" />
            <SkeletonPulse w="w-8" h="h-2" rounded="rounded-full" opacity="05" />
          </div>
          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full w-1/3"
              style={{ background: "rgba(245,158,11,0.25)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanLoading() {
  return (
    <div
      className="flex flex-col flex-1 animate-pulse overflow-y-auto gap-6"
      style={{
        padding: "1.5rem 2rem",
        maxWidth: "900px",
        width: "100%",
        margin: "0 auto",
      }}
      aria-busy="true"
      aria-label="Loading study plans"
    >
      {/* Page header skeleton */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonPulse w="w-48" h="h-7" opacity="08" />
          <SkeletonPulse w="w-72" h="h-3" rounded="rounded-full" opacity="05" />
        </div>
        <SkeletonPulse w="w-24" h="h-9" opacity="06" />
      </div>

      {/* Stats strip skeleton */}
      <div
        className="grid grid-cols-3 rounded-[14px] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", gap: "1px" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 px-5 py-4"
            style={{ background: "rgba(6,16,46,0.7)" }}
          >
            <div className="flex items-center gap-1.5">
              <SkeletonPulse w="w-2.5" h="h-2.5" rounded="rounded-full" opacity="06" />
              <SkeletonPulse w="w-20" h="h-2" rounded="rounded-full" opacity="06" />
            </div>
            <SkeletonPulse w="w-16" h="h-7" opacity="08" />
          </div>
        ))}
      </div>

      {/* Plan card skeletons — varied task counts for visual realism */}
      <SkeletonPlanCard taskCount={4} />
      <SkeletonPlanCard taskCount={3} />
      <SkeletonPlanCard taskCount={5} />
    </div>
  );
}
