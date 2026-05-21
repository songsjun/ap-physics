export function DaySkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6 max-w-2xl mx-auto">
      <div className="h-6 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-48 bg-gray-200 rounded" />
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>
    </div>
  )
}
