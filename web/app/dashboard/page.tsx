import Dashboard from "@/components/Dashboard";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getActiveMemberCount, getAtRiskMembers, getMetrics, getSegments } from "@/lib/queries";
import { getServerLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

// Fresh data on every request — this reads live from Supabase, not a
// build-time snapshot (PROJECT_BRIEF.md Prompt 11).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [atRiskMembers, segments, metrics, activeMemberCount, locale] = await Promise.all([
    getAtRiskMembers(),
    getSegments(),
    getMetrics(),
    getActiveMemberCount(),
    getServerLocale(),
  ]);

  return (
    <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium uppercase tracking-wide text-navy">{t(locale, "brand.overline")}</p>
            <span className="text-xs text-ink-muted">· {t(locale, "dashboard.updatedDaily")}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy">
            {t(locale, "brand.dashboardTitle")}
          </h1>
          <p className="text-sm text-ink-muted mt-1">{t(locale, "dashboard.subtitle")}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <Dashboard
        atRiskMembers={atRiskMembers}
        segments={segments}
        metrics={metrics}
        activeMemberCount={activeMemberCount}
      />

      <footer className="mt-10 pt-6 border-t border-line text-xs text-ink-muted">
        {t(locale, "footer.syntheticNote")}
      </footer>
    </main>
  );
}
