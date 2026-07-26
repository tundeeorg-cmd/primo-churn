import Dashboard from "@/components/Dashboard";
import { getActiveMemberCount, getAtRiskMembers, getMetrics, getSegments } from "@/lib/queries";

// Fresh data on every request — this reads live from Supabase, not a
// build-time snapshot (PROJECT_BRIEF.md Prompt 11).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [atRiskMembers, segments, metrics, activeMemberCount] = await Promise.all([
    getAtRiskMembers(),
    getSegments(),
    getMetrics(),
    getActiveMemberCount(),
  ]);

  return (
    <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-teal mb-1">PRIMO Churn Radar</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy">
          Oberry Member Retention Radar
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Members who need attention today, ranked by how much is riding on getting to them first.
        </p>
      </header>

      <Dashboard
        atRiskMembers={atRiskMembers}
        segments={segments}
        metrics={metrics}
        activeMemberCount={activeMemberCount}
      />

      <footer className="mt-10 pt-6 border-t border-line text-xs text-ink-muted">
        Illustrative figures · synthetic data. Oberry is a fictional café chain used to
        demonstrate PRIMO&apos;s churn-prediction engine.
      </footer>
    </main>
  );
}
