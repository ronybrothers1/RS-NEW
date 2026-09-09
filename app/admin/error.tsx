"use client";

import {
  AlertTriangle,
  LayoutDashboard,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

export default function AdminError({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
          Data operasional belum dapat dimuat
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Permintaan tidak berhasil ditampilkan. Sistem tidak menganggap proses gagal ini sebagai transaksi baru. Coba muat kembali halaman sebelum mengulangi tindakan operasional.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>

          <Link
            href="/admin/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
