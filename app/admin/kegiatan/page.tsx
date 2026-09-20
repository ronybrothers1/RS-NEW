import { db } from "@/src/db";
import { activities, programs } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  CalendarRange,
  Eye,
  Pencil,
  Plus,
  Video,
} from "lucide-react";
import Link from "next/link";
import ArchiveKegiatanButton from "./components/ArchiveKegiatanButton";
import DeleteKegiatanButton from "./components/DeleteKegiatanButton";
import TogglePublishButton from "./components/TogglePublishButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function parsePositiveInteger(
  value: string | string[] | undefined,
) {
  const firstValue =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number.parseInt(
      firstValue ?? "1",
      10,
    );

  return Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : 1;
}

export default async function KegiatanPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}) {
  const rawSearchParams =
    await searchParams;

  const currentPage =
    parsePositiveInteger(
      rawSearchParams.page,
    );

  const offset =
    (currentPage - 1) *
    PAGE_SIZE;
  const activityRows = await db
    .select({
      activity: {
        id: activities.id,
        title: activities.title,
        date: activities.date,
        location: activities.location,
        tiktokUrl: activities.tiktokUrl,
        isPublished:
          activities.isPublished,
        archivedAt:
          activities.archivedAt,
      },
      programName: programs.name,
    })
    .from(activities)
    .leftJoin(
      programs,
      eq(activities.programId, programs.id),
    )
    .orderBy(
      desc(activities.date),
      desc(activities.createdAt),
      desc(activities.id),
    )
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasPrevious =
    currentPage > 1;

  const hasNext =
    activityRows.length >
    PAGE_SIZE;

  const allActivities =
    activityRows.slice(
      0,
      PAGE_SIZE,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kegiatan Yayasan
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola dokumentasi kegiatan dan penyaluran program Yayasan Ruang Sejahtera.
          </p>
        </div>

        <Link
          href="/admin/kegiatan/tambah"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" />
          Tambah Kegiatan
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">
                  Kegiatan
                </th>

                <th className="px-5 py-3">
                  Program
                </th>

                <th className="px-5 py-3">
                  Tanggal & Lokasi
                </th>

                <th className="px-5 py-3 text-center">
                  Status
                </th>

                <th className="px-5 py-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {allActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center"
                  >
                    <CalendarRange className="mx-auto mb-3 h-9 w-9 text-slate-300" />

                    <p className="font-medium text-slate-700">
                      Belum ada kegiatan
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Tambahkan kegiatan pertama melalui tombol di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                allActivities.map(
                  ({ activity, programName }) => {
                    const isArchived =
                      Boolean(activity.archivedAt);

                    const statusLabel = isArchived
                      ? "Arsip"
                      : activity.isPublished
                        ? "Dipublikasi"
                        : "Draf";

                    const statusClass = isArchived
                      ? "bg-slate-100 text-slate-700"
                      : activity.isPublished
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800";

                    return (
                      <tr
                        key={activity.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                              <Video className="h-5 w-5 text-slate-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-md font-semibold leading-6 text-slate-900">
                                {activity.title}
                              </p>

                              {activity.tiktokUrl && (
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  Video TikTok tersedia
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {programName ?? "—"}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {new Date(
                              activity.date,
                            ).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>

                          <p className="mt-1 max-w-xs text-xs text-slate-500">
                            {activity.location ||
                              "Lokasi belum diisi"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/kegiatan/${activity.id}/edit`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
                              title="Edit"
                              aria-label={`Edit ${activity.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/admin/kegiatan/${activity.id}/preview`}
                              target="_blank"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                              title="Pratinjau"
                              aria-label={`Pratinjau ${activity.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {!isArchived &&
                              !activity.isPublished && (
                                <TogglePublishButton
                                  id={activity.id}
                                  isPublished={false}
                                />
                              )}

                            {!isArchived &&
                              activity.isPublished && (
                                <ArchiveKegiatanButton
                                  id={activity.id}
                                  title={activity.title}
                                />
                              )}

                            {!activity.isPublished && (
                              <DeleteKegiatanButton
                                id={activity.id}
                                title={activity.title}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(hasPrevious || hasNext) && (
        <nav
          aria-label="Navigasi halaman kegiatan admin"
          className="flex items-center justify-between gap-4"
        >
          <div className="text-sm text-slate-500">
            Halaman {currentPage}
          </div>

          <div className="flex items-center gap-2">
            {hasPrevious ? (
              <Link
                href={`/admin/kegiatan?page=${currentPage - 1}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Sebelumnya
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-400"
              >
                Sebelumnya
              </span>
            )}

            {hasNext ? (
              <Link
                href={`/admin/kegiatan?page=${currentPage + 1}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Berikutnya
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-400"
              >
                Berikutnya
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
