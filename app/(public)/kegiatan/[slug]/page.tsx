// Rendered on-demand because this page reads directly from the database.
export const dynamic = "force-dynamic";

import { db } from "@/src/db";
import { activities, programs } from "@/src/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TikTokEmbed from "./components/TikTokEmbed";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: Props,
): Promise<Metadata> {
  const { slug } = await props.params;

  const [activity] = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.slug, slug),
        eq(activities.isPublished, true),
        isNull(activities.archivedAt),
      ),
    )
    .limit(1);

  if (!activity) {
    return {
      title: "Kegiatan Tidak Ditemukan",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    activity.description
      ?.replace(/\s+/g, " ")
      .trim()
      .slice(0, 160) ||
    "Dokumentasi kegiatan Yayasan Ruang Sejahtera.";

  return {
    title: `${activity.title} | Ruang Sejahtera`,
    description,
  };
}

export default async function KegiatanDetailPage(
  props: Props,
) {
  const { slug } = await props.params;

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
    .where(
      and(
        eq(activities.slug, slug),
        eq(activities.isPublished, true),
        isNull(activities.archivedAt),
      ),
    )
    .limit(1);

  if (!data) {
    notFound();
  }

  const { activity, programName } = data;

  const paragraphs = (activity.description ?? "")
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <main className="py-8 sm:py-12 md:py-16">
        <article className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/kegiatan"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Kembali ke Kegiatan
          </Link>

          {programName && (
            <div className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
              <Tag className="h-3.5 w-3.5" />
              {programName}
            </div>
          )}

          <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
            {activity.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-b border-slate-200 pb-7 text-sm text-slate-500">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />

              <span>
                {new Date(
                  activity.date,
                ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {activity.location && (
              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />

                <span className="leading-6">
                  {activity.location}
                </span>
              </div>
            )}
          </div>

          {paragraphs.length > 0 && (
            <div className="mt-8 space-y-5 text-base leading-8 text-slate-700 sm:text-lg sm:leading-8">
              {paragraphs.map(
                (paragraph, index) => (
                  <p key={index}>
                    {paragraph}
                  </p>
                ),
              )}
            </div>
          )}

          {activity.tiktokUrl && (
            <section className="mt-10 border-t border-slate-200 pt-9 sm:mt-12 sm:pt-10">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Video Kegiatan
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Dokumentasi kegiatan melalui TikTok.
                </p>
              </div>

              <TikTokEmbed
                url={activity.tiktokUrl}
              />
            </section>
          )}
        </article>
      </main>
    </div>
  );
}
