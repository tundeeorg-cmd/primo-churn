interface Kpi {
  label: string;
  value: string;
  caption?: string;
}

function KpiCard({ label, value, caption }: Kpi) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1.5">{label}</p>
      <p className="font-display text-3xl font-semibold text-navy tabular-figures leading-none">{value}</p>
      {caption && <p className="mt-1.5 text-xs text-ink-muted">{caption}</p>}
    </div>
  );
}

export default function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
