function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card-bg, #1a1a2e)" }}>
      <div className="relative aspect-[3/4] bg-gray-800 animate-pulse" />
      <div className="p-2.5 space-y-2">
        <div className="h-4 bg-gray-800 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden rounded-2xl mb-8 bg-gray-900 animate-pulse h-64" />
      <div className="flex gap-2 pb-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-800 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
