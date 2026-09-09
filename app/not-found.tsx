import {
  ArrowLeft,
  HeartHandshake,
  Home,
} from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-slate-950 px-4 py-16 text-white sm:px-6">
      <div className="mx-auto w-full max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300 ring-1 ring-inset ring-teal-400/20">
          <HeartHandshake className="h-8 w-8" />
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
          404
        </p>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Halaman tidak ditemukan
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
          Tautan mungkin sudah berubah atau halaman yang Anda cari tidak tersedia.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            <Home className="h-4 w-4" />
            Ke Beranda
          </Link>

          <Link
            href="/bantuan"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Bantu Mereka
          </Link>
        </div>
      </div>
    </main>
  );
}
