export default function CategoryLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-10 bg-surface2 rounded" />
        <div className="h-3 w-2 bg-surface2 rounded" />
        <div className="h-3 w-24 bg-surface2 rounded" />
      </div>

      <div className="mb-6">
        <div className="h-3 w-16 bg-surface2 rounded mb-2" />
        <div className="h-8 w-48 bg-surface2 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-borderlt rounded-xl overflow-hidden">
            <div className="h-40 bg-surface2" />
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-surface2 rounded" />
                <div className="h-4 w-14 bg-surface2 rounded" />
              </div>
              <div className="h-px bg-borderlt mt-1" />
              <div className="flex gap-2">
                <div className="h-8 flex-1 bg-surface2 rounded-lg" />
                <div className="h-8 w-16 bg-surface2 rounded-lg opacity-60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
