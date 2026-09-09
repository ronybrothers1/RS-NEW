export default function PublicLoading() {
  return (
    <div
      className="min-h-[60vh] bg-slate-50"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">
        Memuat halaman…
      </span>

      <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="h-4 w-28 rounded-full bg-slate-200" />
        <div className="mt-5 h-10 max-w-2xl rounded-xl bg-slate-200" />
        <div className="mt-4 h-5 max-w-xl rounded-lg bg-slate-200" />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({
            length: 6,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="h-32 rounded-xl bg-slate-100" />
                <div className="mt-5 h-5 w-3/4 rounded bg-slate-200" />
                <div className="mt-3 h-4 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
