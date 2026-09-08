import KegiatanForm from "../components/KegiatanForm";
import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TambahKegiatanPage() {
  const availablePrograms = await db
    .select({
      id: programs.id,
      name: programs.name,
      status: programs.status,
    })
    .from(programs)
    .where(eq(programs.status, "ACTIVE"))
    .orderBy(asc(programs.name));

  const defaultDate = new Date()
    .toISOString()
    .slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/kegiatan"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tambah Kegiatan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Catat kegiatan Yayasan Ruang Sejahtera dan hubungkan dengan program terkait.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <KegiatanForm
          programs={availablePrograms}
          defaultDate={defaultDate}
        />
      </div>
    </div>
  );
}
