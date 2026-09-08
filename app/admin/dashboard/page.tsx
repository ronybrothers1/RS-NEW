import Link from "next/link";
import { db } from "@/src/db";
import { financialTransactions, activities, articles, donations } from "@/src/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronRight,
  FileText,
  HeartHandshake,
  Newspaper,
  Plus,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [
    financialStats,
    activitiesCount,
    publishedActivitiesCount,
    publishedArticlesCount,
    draftArticlesCount,
    donationStats,
    latestActivities,
    latestArticles,
  ] = await Promise.all([
    db
      .select({
        totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'IN' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
        totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'OUT' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(financialTransactions)
      .where(sql`${financialTransactions.deletedAt} IS NULL`),

    db.select({ count: sql<number>`COUNT(*)` }).from(activities),

    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(activities)
      .where(eq(activities.isPublished, true)),

    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(articles)
      .where(eq(articles.status, "PUBLISHED")),

    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(articles)
      .where(eq(articles.status, "DRAFT")),

    db
      .select({
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`COALESCE(SUM(${donations.amount}), 0)`,
      })
      .from(donations)
      .where(eq(donations.status, "SUCCESS")),

    db
      .select({
        id: activities.id,
        title: activities.title,
        date: activities.date,
        location: activities.location,
        isPublished: activities.isPublished,
        slug: activities.slug,
      })
      .from(activities)
      .orderBy(desc(activities.date), desc(activities.createdAt))
      .limit(4),

    db
      .select({
        id: articles.id,
        title: articles.title,
        status: articles.status,
        createdAt: articles.createdAt,
        slug: articles.slug,
      })
      .from(articles)
      .orderBy(desc(articles.createdAt))
      .limit(4),
  ]);

  const { totalIn = 0, totalOut = 0, count: trxCount = 0 } = financialStats[0] || {};
  const saldo = Number(totalIn) - Number(totalOut);
  const activityTotal = Number(activitiesCount[0]?.count || 0);
  const activityPublished = Number(publishedActivitiesCount[0]?.count || 0);
  const articlePublished = Number(publishedArticlesCount[0]?.count || 0);
  const articleDraft = Number(draftArticlesCount[0]?.count || 0);
  const articleTotal = articlePublished + articleDraft;
  const donationCount = Number(donationStats[0]?.count || 0);
  const donationTotal = Number(donationStats[0]?.totalAmount || 0);

  const quickActions = [
    {
      label: "Catat Uang Masuk",
      description: "Donasi atau penerimaan dana",
      href: "/admin/keuangan/masuk",
      icon: ArrowUpRight,
    },
    {
      label: "Catat Uang Keluar",
      description: "Pengeluaran kegiatan atau program",
      href: "/admin/keuangan/keluar",
      icon: ArrowDownRight,
    },
    {
      label: "Tambah Kegiatan",
      description: "Dokumentasikan kegiatan lapangan",
      href: "/admin/kegiatan/tambah",
      icon: CalendarRange,
    },
    {
      label: "Tulis Berita",
      description: "Buat artikel atau kabar terbaru",
      href: "/admin/berita/tulis",
      icon: Newspaper,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-100">
            Data operasional yayasan
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan keuangan, publikasi, kegiatan, dan donasi yang tercatat di sistem.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-400">Ringkasan seluruh periode</div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan keuangan">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">Saldo Saat Ini</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{formatCurrency(saldo)}</p>
          <p className="mt-1 text-xs text-slate-400">Pemasukan dikurangi pengeluaran aktif</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">Total Uang Masuk</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{formatCurrency(Number(totalIn))}</p>
          <Link href="/admin/keuangan/masuk" className="mt-2 inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-800">
            Tambah pemasukan <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">Total Uang Keluar</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{formatCurrency(Number(totalOut))}</p>
          <Link href="/admin/keuangan/keluar" className="mt-2 inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-800">
            Catat pengeluaran <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">Total Transaksi</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{Number(trxCount)}</p>
          <Link href="/admin/keuangan/riwayat" className="mt-2 inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-800">
            Lihat riwayat <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Aksi Cepat</h2>
            <p className="mt-0.5 text-xs text-slate-500">Pekerjaan yang paling sering digunakan.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-700 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                    <Plus className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{action.label}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Ringkasan operasional">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Kegiatan</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{activityTotal}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarRange className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">Dipublikasikan</span>
            <span className="font-semibold text-slate-800">{activityPublished}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Berita & Artikel</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{articleTotal}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
            <div>
              <span className="text-slate-500">Terbit</span>
              <span className="ml-2 font-semibold text-emerald-700">{articlePublished}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Draf</span>
              <span className="ml-2 font-semibold text-slate-700">{articleDraft}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Donasi Terverifikasi</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{formatCurrency(donationTotal)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">Jumlah donasi sukses</span>
            <span className="font-semibold text-slate-800">{donationCount}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kegiatan Terbaru</h2>
              <p className="mt-0.5 text-xs text-slate-500">Empat kegiatan paling baru.</p>
            </div>
            <Link href="/admin/kegiatan" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
              Lihat semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {latestActivities.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Belum ada kegiatan.</div>
            ) : (
              latestActivities.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {item.location ? ` Â· ${item.location}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      item.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.isPublished ? "Terbit" : "Draf"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Berita Terbaru</h2>
              <p className="mt-0.5 text-xs text-slate-500">Empat artikel paling baru.</p>
            </div>
            <Link href="/admin/berita" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
              Lihat semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {latestArticles.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Belum ada berita.</div>
            ) : (
              latestArticles.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      item.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status === "PUBLISHED" ? "Terbit" : "Draf"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
