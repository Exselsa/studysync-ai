/**
 * Next.js streaming loading UI for the /dashboard segment.
 *
 * Displayed while the dashboard page is loading (Suspense boundary).
 * Uses a skeleton approach consistent with the glass design system.
 */
export default function DashboardLoading() {
  return (
    <div
      className="flex flex-col flex-1 px-8 py-8 max-w-5xl mx-auto w-full"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-col gap-8 w-full animate-pulse">
        {/* Greeting skeleton */}
        <div className="flex flex-col gap-2">
          <div
            className="h-3 w-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-8 w-72 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-3 w-96 rounded-full mt-1"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="card-glass p-6"
              style={{ minHeight: "140px" }}
            >
              <div className="flex justify-between mb-4">
                <div
                  className="h-3 w-24 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <div
                  className="w-9 h-9 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
              </div>
              <div
                className="h-9 w-20 rounded-lg mb-2"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <div
                className="h-2.5 w-28 rounded-full"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            </div>
          ))}
        </div>

        {/* Metrics strip skeleton */}
        <div
          className="glass-panel rounded-2xl px-6 py-5 grid grid-cols-4 gap-6"
          style={{ minHeight: "88px" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div
                className="h-2.5 w-20 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
              <div
                className="h-6 w-14 rounded-md"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
