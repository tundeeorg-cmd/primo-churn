function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-line bg-paper animate-pulse ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>
      <Block className="h-48" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <Block className="h-96" />
        <Block className="h-96" />
      </div>
      <Block className="h-40" />
    </div>
  );
}
