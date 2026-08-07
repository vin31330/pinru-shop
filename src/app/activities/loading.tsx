export default function ActivitiesLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-5 h-9 w-40 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="aspect-square animate-pulse bg-slate-100 sm:aspect-[16/7]" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-6 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
