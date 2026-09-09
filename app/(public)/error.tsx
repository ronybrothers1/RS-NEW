"use client";

import {
  AlertTriangle,
  Home,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

export default function PublicError({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
          Halaman belum dapat ditampilkan
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Terjadi kendala sementara saat memuat data. Anda dapat mencoba kembali tanpa perlu mengisi ulang apa pun pada halaman ini.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Home className="h-4 w-4" />
            Beranda
          </Link>
        </div>
      </div>
    </section>
  );
}
