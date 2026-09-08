import KegiatanForm from "../../components/KegiatanForm";
import { db } from "@/src/db";
import { activities, programs } from "@/src/db/schema";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditKegiatanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);

  if (!activity) {
    notFound();
  }

  const allPrograms = await db
    .select({
      id: programs.id,
      name: programs.name,
      status: programs.status,
    })
    .from(programs)
    .orderBy(asc(programs.name));

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
            Edit Kegiatan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Perbarui informasi kegiatan yang sudah tersimpan.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <KegiatanForm
          programs={allPrograms}
          defaultDate={activity.date.toISOString().slice(0, 10)}
          activity={{
            id: activity.id,
            title: activity.title,
            programId: activity.programId,
            date: activity.date.toISOString().slice(0, 10),
            location: activity.location,
            description: activity.description,
            tiktokUrl: activity.tiktokUrl,
            isPublished: activity.isPublished,
            archivedAt: activity.archivedAt
              ? activity.archivedAt.toISOString()
              : null,
          }}
        />
      </div>
    </div>
  );
}
