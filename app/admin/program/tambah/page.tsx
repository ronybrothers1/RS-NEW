import {
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import ProgramForm from "../components/ProgramForm";

export default function TambahProgramPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-4">
        <Link
          href="/admin/program"
          className="mt-0.5 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Kembali ke daftar program"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tambah Program
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tambahkan program sosial baru
            Yayasan Ruang Sejahtera.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <ProgramForm />
        </div>
      </div>
    </div>
  );
}
