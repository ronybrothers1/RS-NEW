import {
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import ProgramForm from "../../components/ProgramForm";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function EditProgramPage(
  props: Props,
) {
  const session = await auth();

  if (
    !session?.user?.id ||
    (session.user as any).role !== "ADMIN"
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-rose-500" />

        <h2 className="text-xl font-bold text-slate-900">
          Akses Ditolak
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Hanya Admin yang dapat mengedit
          program.
        </p>
      </div>
    );
  }

  const { id } = await props.params;

  if (!isUuid(id)) {
    notFound();
  }

  const [program] = await db
    .select()
    .from(programs)
    .where(eq(programs.id, id))
    .limit(1);

  if (!program) {
    notFound();
  }

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
            Edit Program
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Perbarui informasi program tanpa
            mengubah riwayat kegiatan maupun
            donasi yang sudah terhubung.
          </p>
        </div>
      </div>

      {program.status === "INACTIVE" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Program ini sedang nonaktif. Anda
          tetap dapat memperbarui datanya,
          kemudian mengaktifkannya kembali
          dari daftar Program.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <ProgramForm
            initialData={{
              id: program.id,
              name: program.name,
              icon: program.icon,
              description:
                program.description,
              targetAmount:
                program.targetAmount,
            }}
          />
        </div>
      </div>
    </div>
  );
}
