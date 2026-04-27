export default function PackageDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-10 bg-surface2 rounded" />
        <div className="h-3 w-2 bg-surface2 rounded" />
        <div className="h-3 w-16 bg-surface2 rounded" />
        <div className="h-3 w-2 bg-surface2 rounded" />
        <div className="h-3 w-24 bg-surface2 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-borderlt rounded-xl overflow-hidden">
            <div className="h-64 bg-surface2" />
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between">
                <div className="h-7 w-48 bg-surface2 rounded" />
                <div className="h-7 w-20 bg-surface2 rounded" />
              </div>
              <div className="h-3 w-full bg-surface2 rounded" />
              <div className="h-3 w-5/6 bg-surface2 rounded" />
              <div className="h-3 w-4/6 bg-surface2 rounded" />
              <div className="h-3 w-full bg-surface2 rounded" />
              <div className="h-3 w-3/4 bg-surface2 rounded" />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-borderlt rounded-xl p-5">
            <div className="h-4 w-20 bg-surface2 rounded mb-4" />
            <div className="h-px bg-borderlt mb-4" />
            <div className="flex justify-between mb-5">
              <div className="h-4 w-12 bg-surface2 rounded" />
              <div className="h-4 w-16 bg-surface2 rounded" />
            </div>
            <div className="h-11 bg-surface2 rounded-lg mb-2" />
            <div className="h-11 bg-surface2 rounded-lg opacity-50" />
          </div>
        </div>
      </div>
    </div>
  )
}
