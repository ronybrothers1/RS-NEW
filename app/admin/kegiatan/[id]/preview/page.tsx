import TikTokPreview from "../../components/TikTokPreview";
import { db } from "@/src/db";
import { activities, programs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PreviewKegiatanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [data] = await db
    .select({
      activity: activities,
      programName: programs.name,
    })
    .from(activities)
    .leftJoin(
      programs,
      eq(activities.programId, programs.id),
    )
    .where(eq(activities.id, id))
    .limit(1);

  if (!data) {
    notFound();
  }

  const { activity, programName } = data;

  const status = activity.archivedAt
    ? "ARSIP"
    : activity.isPublished
      ? "DIPUBLIKASI"
      : "DRAF";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/admin/kegiatan/${activity.id}/edit`}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Editor
        </Link>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          <Eye className="h-4 w-4" />
          MODE PRATINJAU
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {status}
          </span>

          <h1 className="mt-5 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl md:text-4xl">
            {activity.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-b border-slate-100 pb-6 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-teal-600" />

              {new Date(
                activity.date,
              ).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>

            {activity.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-teal-600" />
                {activity.location}
              </span>
            )}

            {programName && (
              <span className="inline-flex items-center gap-2">
                <Tag className="h-4 w-4 shrink-0 text-teal-600" />
                {programName}
              </span>
            )}
          </div>

          {activity.description && (
            <div className="mt-8 space-y-5 text-base leading-8 text-slate-700 sm:text-lg">
              {activity.description
                .split(/\r?\n/)
                .filter(
                  (paragraph) =>
                    paragraph.trim().length > 0,
                )
                .map((paragraph, index) => (
                  <p key={index}>
                    {paragraph}
                  </p>
                ))}
            </div>
          )}

          {activity.tiktokUrl && (
            <section className="mt-10 border-t border-slate-100 pt-8">
              <h2 className="mb-6 text-center text-xl font-bold text-slate-900">
                Video Kegiatan
              </h2>

              <TikTokPreview
                url={activity.tiktokUrl}
              />
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
