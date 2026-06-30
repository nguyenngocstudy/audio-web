export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="flex gap-5 mb-6">
        <div className="w-32 h-44 rounded-xl bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 w-20 bg-gray-800 rounded-full" />
          <div className="h-6 w-3/4 bg-gray-800 rounded" />
          <div className="h-4 w-1/2 bg-gray-800 rounded" />
          <div className="h-4 w-1/3 bg-gray-800 rounded" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-gray-800 rounded" />
            <div className="h-4 w-16 bg-gray-800 rounded" />
          </div>
          <div className="h-10 w-40 bg-gray-800 rounded-xl" />
        </div>
      </div>
      <div className="h-24 rounded-xl mb-5 bg-gray-800" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
