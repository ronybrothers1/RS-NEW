// Rendered on-demand because this page reads directly from the database.
export const dynamic = "force-dynamic";

import { db } from "@/src/db";
import { activities, programs } from "@/src/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  MapPin,
  Tag,
  Video,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Dokumentasi Kegiatan",
  description:
    "Dokumentasi kegiatan, penyaluran bantuan, lokasi, dan program sosial yang telah dilaksanakan Yayasan Ruang Sejahtera di Kabupaten Sampang.",
  path: "/kegiatan",
});

export default async function PublicKegiatanPage() {
  const allActivities = await db
    .select({
      activity: activities,
      programName: programs.name,
    })
    .from(activities)
    .leftJoin(
      programs,
      eq(activities.programId, programs.id),
    )
    .where(
      and(
        eq(activities.isPublished, true),
        isNull(activities.archivedAt),
      ),
    )
    .orderBy(
      desc(activities.date),
      desc(activities.createdAt),
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950"></div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
          <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
            Jejak Kegiatan
          </span>

          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Kegiatan Yayasan Ruang Sejahtera
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Dokumentasi kegiatan sosial, penyaluran bantuan, dan pelaksanaan program Yayasan Ruang Sejahtera di masyarakat.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {allActivities.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <CalendarRange className="h-7 w-7 text-slate-400" />
            </div>

            <h2 className="text-xl font-semibold text-slate-900">
              Belum ada kegiatan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Dokumentasi kegiatan Yayasan Ruang Sejahtera akan ditampilkan di halaman ini setelah dipublikasikan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {allActivities.map(
              ({ activity, programName }) => (
                <article
                  key={activity.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Video className="h-5 w-5" />
                      </div>

                      {activity.tiktokUrl && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Video className="h-3.5 w-3.5" />
                          TikTok
                        </span>
                      )}
                    </div>

                    {programName && (
                      <div className="mb-3 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-teal-700">
                        <Tag className="h-3.5 w-3.5" />
                        {programName}
                      </div>
                    )}

                    <h2 className="text-xl font-bold leading-7 text-slate-900 transition group-hover:text-teal-700">
                      <Link href={`/kegiatan/${activity.slug}`}>
                        {activity.title}
                      </Link>
                    </h2>

                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />

                        <span>
                          {new Date(
                            activity.date,
                          ).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      {activity.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />

                          <span className="line-clamp-2 leading-6">
                            {activity.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {activity.description && (
                      <p className="mt-5 line-clamp-3 text-sm leading-7 text-slate-600">
                        {activity.description}
                      </p>
                    )}

                    <div className="mt-auto pt-6">
                      <Link
                        href={`/kegiatan/${activity.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 transition group-hover:gap-2.5"
                      >
                        Lihat Kegiatan
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </main>
    </div>
  );
}
