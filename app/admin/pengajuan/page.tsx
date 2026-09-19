import {
  ClipboardCheck,
  Filter,
  Search,
} from "lucide-react";
import {
  and,
  desc,
  eq,
  ilike,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import Link from "next/link";

import {
  ASSISTANCE_STATUS_META,
  formatRupiah,
  type AssistanceApplicationStatus,
} from "@/lib/assistance";
import {
  db,
} from "@/src/db";
import {
  assistanceApplications,
  programs,
  users,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

const reviewStatuses:
  AssistanceApplicationStatus[] = [
    "SUBMITTED",
    "NEEDS_REVISION",
    "APPROVED",
    "REJECTED",
  ];

const PAGE_SIZE = 50;

function parsePositiveInteger(
  value:
    | string
    | string[]
    | undefined,
) {
  const raw =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number.parseInt(
      raw ?? "1",
      10,
    );

  return Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : 1;
}

function asCount(
  value: unknown,
) {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatDate(
  value:
    | Date
    | null,
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    },
  ).format(value);
}

export default async function AdminAssistancePage({
  searchParams,
}: {
  searchParams:
    Promise<{
      q?: string;
      status?: string;
      program?: string;
      page?: string | string[];
    }>;
}) {
  const params =
    await searchParams;

  const q =
    String(
      params.q || "",
    ).trim();

  const status =
    reviewStatuses.includes(
      params.status as
        AssistanceApplicationStatus,
    )
      ? (
          params.status as
            AssistanceApplicationStatus
        )
      : "";

  const programId =
    String(
      params.program ||
        "",
    ).trim();

  const filters:
    SQL[] = [
      ne(
        assistanceApplications.status,
        "DRAFT",
      ),
    ];

  if (status) {
    filters.push(
      eq(
        assistanceApplications.status,
        status,
      ),
    );
  }

  if (programId) {
    filters.push(
      eq(
        assistanceApplications.programId,
        programId,
      ),
    );
  }

  if (q) {
    const search =
      `%${q}%`;

    const condition =
      or(
        ilike(
          assistanceApplications.title,
          search,
        ),
        ilike(
          assistanceApplications.beneficiaryName,
          search,
        ),
        ilike(
          assistanceApplications.village,
          search,
        ),
        ilike(
          assistanceApplications.subdistrict,
          search,
        ),
        ilike(
          users.name,
          search,
        ),
        ilike(
          programs.name,
          search,
        ),
      );

    if (condition) {
      filters.push(
        condition,
      );
    }
  }

  const requestedPage =
    parsePositiveInteger(
      params.page,
    );

  const loadApplications = (
    page: number,
  ) =>
    db
      .select({
        id:
          assistanceApplications.id,
        title:
          assistanceApplications.title,
        beneficiaryName:
          assistanceApplications.beneficiaryName,
        village:
          assistanceApplications.village,
        subdistrict:
          assistanceApplications.subdistrict,
        regency:
          assistanceApplications.regency,
        targetAmount:
          assistanceApplications.targetAmount,
        status:
          assistanceApplications.status,
        submittedAt:
          assistanceApplications.submittedAt,
        updatedAt:
          assistanceApplications.updatedAt,
        applicantName:
          users.name,
        programName:
          programs.name,
        filteredTotal:
          sql<number>`COUNT(*) OVER ()`,
      })
      .from(
        assistanceApplications,
      )
      .innerJoin(
        users,
        eq(
          assistanceApplications.applicantId,
          users.id,
        ),
      )
      .innerJoin(
        programs,
        eq(
          assistanceApplications.programId,
          programs.id,
        ),
      )
      .where(
        and(
          ...filters,
        ),
      )
      .orderBy(
        desc(
          assistanceApplications.updatedAt,
        ),
        desc(
          assistanceApplications.id,
        ),
      )
      .limit(
        PAGE_SIZE,
      )
      .offset(
        (page - 1) *
          PAGE_SIZE,
      );

  const [
    requestedApplications,
    statusRows,
    programOptions,
  ] = await Promise.all([
    loadApplications(
      requestedPage,
    ),

    db
      .select({
        submitted:
          sql<number>`
            COALESCE(
              SUM(
                CASE
                  WHEN ${assistanceApplications.status} = 'SUBMITTED'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            )
          `,
        needsRevision:
          sql<number>`
            COALESCE(
              SUM(
                CASE
                  WHEN ${assistanceApplications.status} = 'NEEDS_REVISION'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            )
          `,
        approved:
          sql<number>`
            COALESCE(
              SUM(
                CASE
                  WHEN ${assistanceApplications.status} = 'APPROVED'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            )
          `,
        rejected:
          sql<number>`
            COALESCE(
              SUM(
                CASE
                  WHEN ${assistanceApplications.status} = 'REJECTED'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            )
          `,
      })
      .from(
        assistanceApplications,
      )
      .where(
        ne(
          assistanceApplications.status,
          "DRAFT",
        ),
      ),

    db
      .select({
        id:
          programs.id,
        name:
          programs.name,
      })
      .from(programs)
      .orderBy(
        programs.name,
      ),
  ]);

  let totalApplications =
    requestedApplications.length > 0
      ? asCount(
          requestedApplications[0]
            ?.filteredTotal,
        )
      : 0;

  if (
    requestedApplications.length === 0 &&
    requestedPage > 1
  ) {
    const [
      totalRow,
    ] =
      await db
        .select({
          total:
            sql<number>`COUNT(*)`,
        })
        .from(
          assistanceApplications,
        )
        .innerJoin(
          users,
          eq(
            assistanceApplications.applicantId,
            users.id,
          ),
        )
        .innerJoin(
          programs,
          eq(
            assistanceApplications.programId,
            programs.id,
          ),
        )
        .where(
          and(
            ...filters,
          ),
        );

    totalApplications =
      asCount(
        totalRow?.total,
      );
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalApplications /
          PAGE_SIZE,
      ),
    );

  const currentPage =
    Math.min(
      requestedPage,
      totalPages,
    );

  const applications =
    currentPage ===
      requestedPage ||
    totalApplications === 0
      ? requestedApplications
      : await loadApplications(
          currentPage,
        );

  const statusSummary =
    statusRows[0];

  const counts:
    Record<
      AssistanceApplicationStatus,
      number
    > = {
      DRAFT: 0,
      SUBMITTED:
        asCount(
          statusSummary?.submitted,
        ),
      NEEDS_REVISION:
        asCount(
          statusSummary?.needsRevision,
        ),
      APPROVED:
        asCount(
          statusSummary?.approved,
        ),
      REJECTED:
        asCount(
          statusSummary?.rejected,
        ),
    };

  const pageHref = (
    page: number,
  ) => {
    const query =
      new URLSearchParams();

    if (q) {
      query.set(
        "q",
        q,
      );
    }

    if (status) {
      query.set(
        "status",
        status,
      );
    }

    if (programId) {
      query.set(
        "program",
        programId,
      );
    }

    query.set(
      "page",
      String(page),
    );

    return `/admin/pengajuan?${query.toString()}`;
  };


  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-teal-700">
          Control Plane
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Pengajuan Bantuan
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Verifikasi pengajuan yang telah dikirim pengguna. Draf pribadi pengguna tidak ditampilkan kepada pengurus.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {reviewStatuses.map(
          (item) => {
            const meta =
              ASSISTANCE_STATUS_META[
                item
              ];

            return (
              <Link
                key={item}
                href={`/admin/pengajuan?status=${item}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {meta.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {counts[item]}
                </p>
              </Link>
            );
          },
        )}
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_220px_240px_auto]"
      >
        <label className="relative">
          <span className="sr-only">
            Cari pengajuan
          </span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Judul, penerima, pemohon, lokasi..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
          />
        </label>

        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
        >
          <option value="">
            Semua status
          </option>
          {reviewStatuses.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {
                  ASSISTANCE_STATUS_META[
                    item
                  ].label
                }
              </option>
            ),
          )}
        </select>

        <select
          name="program"
          defaultValue={
            programId
          }
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
        >
          <option value="">
            Semua program
          </option>
          {programOptions.map(
            (program) => (
              <option
                key={
                  program.id
                }
                value={
                  program.id
                }
              >
                {
                  program.name
                }
              </option>
            ),
          )}
        </select>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-black"
        >
          <Filter className="h-4 w-4" />
          Terapkan
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">
            {totalApplications} pengajuan ditemukan
          </p>
        </div>

        {applications.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <ClipboardCheck className="mx-auto h-11 w-11 text-slate-300" />
            <h2 className="mt-4 font-semibold text-slate-900">
              Tidak ada pengajuan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tidak ada data yang sesuai dengan pencarian atau filter saat ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map(
              (
                application,
              ) => {
                const itemStatus =
                  application.status as
                    AssistanceApplicationStatus;

                const meta =
                  ASSISTANCE_STATUS_META[
                    itemStatus
                  ];

                return (
                  <Link
                    key={
                      application.id
                    }
                    href={`/admin/pengajuan/${application.id}`}
                    className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_180px_190px] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                        >
                          {
                            meta.label
                          }
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {
                            application.programName
                          }
                        </span>
                      </div>

                      <h2 className="mt-2 truncate font-bold text-slate-950">
                        {
                          application.title
                        }
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Calon penerima:{" "}
                        <span className="font-medium text-slate-700">
                          {
                            application.beneficiaryName
                          }
                        </span>
                      </p>
                    </div>

                    <div className="text-sm">
                      <p className="font-medium text-slate-700">
                        {
                          application.applicantName
                        }
                      </p>
                      <p className="mt-1 text-slate-500">
                        {
                          application.village
                        }
                        {application.subdistrict
                          ? `, ${application.subdistrict}`
                          : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Target
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatRupiah(
                          application.targetAmount,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Dikirim
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatDate(
                          application.submittedAt,
                        )}
                      </p>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Halaman{" "}
              <span className="font-semibold text-slate-700">
                {currentPage}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-700">
                {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={pageHref(
                    currentPage - 1,
                  )}
                  className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Sebelumnya
                </Link>
              ) : (
                <span className="inline-flex min-h-10 cursor-not-allowed items-center rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-300">
                  Sebelumnya
                </span>
              )}

              {currentPage <
              totalPages ? (
                <Link
                  href={pageHref(
                    currentPage + 1,
                  )}
                  className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Berikutnya
                </Link>
              ) : (
                <span className="inline-flex min-h-10 cursor-not-allowed items-center rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-300">
                  Berikutnya
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
