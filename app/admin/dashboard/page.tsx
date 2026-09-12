import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronRight,
  Clock3,
  FileText,
  HeartHandshake,
  Layers3,
  Newspaper,
  Plus,
  Wallet,
} from "lucide-react";
import {
  desc,
  eq,
  isNull,
  sql,
} from "drizzle-orm";

import { db } from "@/src/db";
import {
  activities,
  articles,
  donations,
  financialTransactions,
  programs,
} from "@/src/db/schema";
import { formatCurrency } from "@/lib/utils";
import { getFinanceOpeningBalance } from "@/lib/finance-opening-balance";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function activityStatus(
  item: {
    isPublished: boolean;
    archivedAt: Date | null;
  },
) {
  if (item.archivedAt) {
    return {
      label: "Arsip",
      className:
        "bg-slate-100 text-slate-600",
    };
  }

  if (item.isPublished) {
    return {
      label: "Terbit",
      className:
        "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Draf",
    className:
      "bg-amber-50 text-amber-700",
  };
}

function articleStatus(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Terbit",
        className:
          "bg-emerald-50 text-emerald-700",
      };

    case "SCHEDULED":
      return {
        label: "Terjadwal",
        className:
          "bg-blue-50 text-blue-700",
      };

    case "ARCHIVED":
      return {
        label: "Arsip",
        className:
          "bg-slate-100 text-slate-600",
      };

    default:
      return {
        label: "Draf",
        className:
          "bg-amber-50 text-amber-700",
      };
  }
}

export default async function DashboardPage() {
  const openingBalance =
    await getFinanceOpeningBalance();

  const [
    financialStats,
    activityStats,
    articleStats,
    donationStats,
    programStats,
    latestTransactions,
    latestActivities,
    latestArticles,
  ] = await Promise.all([
    db
      .select({
        totalIn: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${financialTransactions.type} = 'IN'
                THEN ${financialTransactions.amount}
                ELSE 0
              END
            ),
            0
          )
        `,
        totalOut: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${financialTransactions.type} = 'OUT'
                THEN ${financialTransactions.amount}
                ELSE 0
              END
            ),
            0
          )
        `,
        count: sql<number>`COUNT(*)`,
      })
      .from(financialTransactions)
      .where(
        isNull(
          financialTransactions.deletedAt,
        ),
      ),

    db
      .select({
        total: sql<number>`COUNT(*)`,
        published: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${activities.isPublished} = true
                  AND ${activities.archivedAt} IS NULL
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        draft: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${activities.isPublished} = false
                  AND ${activities.archivedAt} IS NULL
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        archived: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${activities.archivedAt} IS NOT NULL
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
      })
      .from(activities),

    db
      .select({
        total: sql<number>`COUNT(*)`,
        published: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${articles.status} = 'PUBLISHED'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        draft: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${articles.status} = 'DRAFT'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        scheduled: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${articles.status} = 'SCHEDULED'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        archived: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${articles.status} = 'ARCHIVED'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
      })
      .from(articles),

    db
      .select({
        successCount: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${donations.status} = 'SUCCESS'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        successAmount: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${donations.status} = 'SUCCESS'
                THEN ${donations.amount}
                ELSE 0
              END
            ),
            0
          )
        `,
        pendingCount: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${donations.status} = 'PENDING'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        pendingAmount: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${donations.status} = 'PENDING'
                THEN ${donations.amount}
                ELSE 0
              END
            ),
            0
          )
        `,
        failedCount: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${donations.status} = 'FAILED'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
      })
      .from(donations),

    db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${programs.status} = 'ACTIVE'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
        inactive: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${programs.status} = 'INACTIVE'
                THEN 1
                ELSE 0
              END
            ),
            0
          )
        `,
      })
      .from(programs),

    db
      .select({
        id: financialTransactions.id,
        type: financialTransactions.type,
        amount: financialTransactions.amount,
        date: financialTransactions.date,
        description:
          financialTransactions.description,
        donorName:
          financialTransactions.donorName,
      })
      .from(financialTransactions)
      .where(
        isNull(
          financialTransactions.deletedAt,
        ),
      )
      .orderBy(
        desc(financialTransactions.date),
        desc(
          financialTransactions.createdAt,
        ),
      )
      .limit(4),

    db
      .select({
        id: activities.id,
        title: activities.title,
        date: activities.date,
        location: activities.location,
        isPublished:
          activities.isPublished,
        archivedAt:
          activities.archivedAt,
      })
      .from(activities)
      .orderBy(
        desc(activities.date),
        desc(activities.createdAt),
      )
      .limit(4),

    db
      .select({
        id: articles.id,
        title: articles.title,
        status: articles.status,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .orderBy(
        desc(articles.createdAt),
      )
      .limit(4),
  ]);

  const finance =
    financialStats[0] ?? {
      totalIn: 0,
      totalOut: 0,
      count: 0,
    };

  const activity =
    activityStats[0] ?? {
      total: 0,
      published: 0,
      draft: 0,
      archived: 0,
    };

  const article =
    articleStats[0] ?? {
      total: 0,
      published: 0,
      draft: 0,
      scheduled: 0,
      archived: 0,
    };

  const donation =
    donationStats[0] ?? {
      successCount: 0,
      successAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      failedCount: 0,
    };

  const program =
    programStats[0] ?? {
      total: 0,
      active: 0,
      inactive: 0,
    };

  const totalIn = Number(
    finance.totalIn || 0,
  );

  const totalOut = Number(
    finance.totalOut || 0,
  );

  const saldo = openingBalance.amount + totalIn - totalOut;

  const transactionCount = Number(
    finance.count || 0,
  );

  const pendingDonationCount = Number(
    donation.pendingCount || 0,
  );

  const pendingDonationAmount = Number(
    donation.pendingAmount || 0,
  );

  const quickActions = [
    {
      label: "Catat Uang Masuk",
      description:
        "Tambahkan penerimaan dana",
      href: "/admin/keuangan/masuk",
      icon: ArrowUpRight,
    },
    {
      label: "Catat Uang Keluar",
      description:
        "Tambahkan pengeluaran",
      href: "/admin/keuangan/keluar",
      icon: ArrowDownRight,
    },
    {
      label: "Tambah Kegiatan",
      description:
        "Dokumentasikan kegiatan",
      href: "/admin/kegiatan/tambah",
      icon: CalendarRange,
    },
    {
      label: "Tulis Berita",
      description:
        "Buat berita atau publikasi",
      href: "/admin/berita/tulis",
      icon: Newspaper,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-inset ring-brand-100">
            Ringkasan operasional
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Pantau keuangan, donasi,
            program, kegiatan, dan
            publikasi Yayasan Ruang
            Sejahtera dalam satu halaman.
          </p>
        </div>

        <span className="text-xs font-medium text-slate-400">
          Data seluruh periode
        </span>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan utama"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Saldo Saat Ini
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {formatCurrency(saldo)}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {transactionCount} transaksi
            aktif
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Total Uang Masuk
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {formatCurrency(totalIn)}
          </p>

          <Link
            href="/admin/keuangan/masuk"
            className="mt-2 inline-flex items-center text-xs font-semibold text-brand-800 hover:text-brand-900"
          >
            Catat pemasukan
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Total Uang Keluar
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {formatCurrency(totalOut)}
          </p>

          <Link
            href="/admin/keuangan/keluar"
            className="mt-2 inline-flex items-center text-xs font-semibold text-brand-800 hover:text-brand-900"
          >
            Catat pengeluaran
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-sm ${
            pendingDonationCount > 0
              ? "border-amber-200 bg-amber-50/50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Donasi Menunggu
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {pendingDonationCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatCurrency(
              pendingDonationAmount,
            )}{" "}
            menunggu verifikasi
          </p>

          <Link
            href="/admin/donasi"
            className="mt-2 inline-flex items-center text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            Periksa donasi
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900">
            Aksi Cepat
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Pekerjaan yang paling sering
            digunakan.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-frame bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800 transition group-hover:bg-brand-700 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                    <Plus className="h-3.5 w-3.5 text-slate-400" />

                    <span className="truncate">
                      {action.label}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan operasional"
      >
        <Link
          href="/admin/program"
            className="rounded-xl border border-frame bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Program
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {Number(program.total || 0)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
              <Layers3 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-emerald-700">
              Aktif{" "}
              <strong>
                {Number(
                  program.active || 0,
                )}
              </strong>
            </span>

            <span className="text-slate-500">
              Nonaktif{" "}
              <strong>
                {Number(
                  program.inactive || 0,
                )}
              </strong>
            </span>
          </div>
        </Link>

        <Link
          href="/admin/kegiatan"
          className="rounded-xl border border-frame bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Kegiatan
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {Number(activity.total || 0)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarRange className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
            <div>
              <span className="block text-emerald-700">
                {Number(
                  activity.published || 0,
                )}
              </span>
              <span className="text-slate-400">
                Terbit
              </span>
            </div>

            <div>
              <span className="block text-amber-700">
                {Number(
                  activity.draft || 0,
                )}
              </span>
              <span className="text-slate-400">
                Draf
              </span>
            </div>

            <div>
              <span className="block text-slate-600">
                {Number(
                  activity.archived || 0,
                )}
              </span>
              <span className="text-slate-400">
                Arsip
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/berita"
          className="rounded-xl border border-frame bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Berita
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {Number(article.total || 0)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-1 border-t border-slate-100 pt-3 text-center text-[11px]">
            <div>
              <span className="block font-semibold text-emerald-700">
                {Number(
                  article.published || 0,
                )}
              </span>
              <span className="text-slate-400">
                Terbit
              </span>
            </div>

            <div>
              <span className="block font-semibold text-amber-700">
                {Number(
                  article.draft || 0,
                )}
              </span>
              <span className="text-slate-400">
                Draf
              </span>
            </div>

            <div>
              <span className="block font-semibold text-blue-700">
                {Number(
                  article.scheduled || 0,
                )}
              </span>
              <span className="text-slate-400">
                Jadwal
              </span>
            </div>

            <div>
              <span className="block font-semibold text-slate-600">
                {Number(
                  article.archived || 0,
                )}
              </span>
              <span className="text-slate-400">
                Arsip
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/donasi"
          className="rounded-xl border border-frame bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Donasi Terverifikasi
              </p>

              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatCurrency(
                  Number(
                    donation.successAmount ||
                      0,
                  ),
                )}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">
              Berhasil{" "}
              <strong>
                {Number(
                  donation.successCount ||
                    0,
                )}
              </strong>
            </span>

            <span className="text-rose-600">
              Ditolak{" "}
              <strong>
                {Number(
                  donation.failedCount ||
                    0,
                )}
              </strong>
            </span>
          </div>
        </Link>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Transaksi Terbaru
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Empat transaksi kas terbaru.
              </p>
            </div>

            <Link
              href="/admin/keuangan/riwayat"
              className="text-xs font-semibold text-brand-800 hover:text-brand-900"
            >
              Lihat semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {latestTransactions.length ===
            0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                Belum ada transaksi.
              </div>
            ) : (
              latestTransactions.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.description}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {formatDate(
                          item.date,
                        )}
                        {item.donorName
                          ? ` - ${item.donorName}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-bold ${
                        item.type === "IN"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {item.type === "IN"
                        ? "+"
                        : "-"}
                      {formatCurrency(
                        Number(
                          item.amount,
                        ),
                      )}
                    </span>
                  </div>
                ),
              )
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kegiatan Terbaru
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Empat kegiatan paling baru.
              </p>
            </div>

            <Link
              href="/admin/kegiatan"
              className="text-xs font-semibold text-brand-800 hover:text-brand-900"
            >
              Lihat semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {latestActivities.length ===
            0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                Belum ada kegiatan.
              </div>
            ) : (
              latestActivities.map(
                (item) => {
                  const status =
                    activityStatus(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {formatDate(
                            item.date,
                          )}
                          {item.location
                            ? ` - ${item.location}`
                            : ""}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                },
              )
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Berita Terbaru
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Empat artikel paling baru.
              </p>
            </div>

            <Link
              href="/admin/berita"
              className="text-xs font-semibold text-brand-800 hover:text-brand-900"
            >
              Lihat semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {latestArticles.length ===
            0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                Belum ada berita.
              </div>
            ) : (
              latestArticles.map(
                (item) => {
                  const status =
                    articleStatus(
                      item.status,
                    );

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            item.createdAt,
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                },
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
