"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center bg-slate-50 px-4 py-16 sm:px-6">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
          Terjadi Kendala
        </p>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Halaman belum dapat ditampilkan
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
          Sistem mengalami kendala sementara saat memuat halaman ini.
          Silakan coba kembali. Tindakan yang gagal tidak dianggap sebagai
          proses baru.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Coba Lagi
          </button>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}