export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-5 h-9 w-44 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="aspect-square animate-pulse bg-slate-100" />
              <div className="space-y-3 p-4">
                <div className="h-5 animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
