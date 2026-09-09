export default function AdminLoading() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">
        Memuat data admin…
      </span>

      <div>
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-64 max-w-full rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="mt-6 h-7 w-36 rounded bg-slate-200" />
            </div>
          ),
        )}
      </div>

      <div className="h-72 rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
