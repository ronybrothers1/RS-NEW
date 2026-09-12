import { db } from "@/src/db";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { getFinanceOpeningBalance } from "@/lib/finance-opening-balance";
import { financialTransactions, programs } from "@/src/db/schema";
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";

import { ArrowDownRight, ArrowUpRight, CheckCircle2, TrendingUp, Wallet, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: "Transparansi Keuangan",
  description:
    "Pantau penerimaan, pengeluaran, saldo kas, dan riwayat transaksi Yayasan Ruang Sejahtera yang dipublikasikan secara terbuka dan terukur.",
  path: "/transparansi",
});

function getJakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}


export default async function TransparansiPage() {
  const openingBalance =
    await getFinanceOpeningBalance();

  const today = getJakartaToday();
  const monthStart = new Date(Date.UTC(today.year, today.month - 1, 1));
  const tomorrow = new Date(Date.UTC(today.year, today.month - 1, today.day + 1));
  const periodStartLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(today.year, today.month - 1, 1, 12)));
  const periodEndLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(today.year, today.month - 1, today.day, 12)));

  // Get totals using raw SQL aggregation for simplicity
  const result = await db.execute(sql`
    SELECT 
      SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END) as total_in,
      SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END) as total_out
    FROM financial_transactions
    WHERE deleted_at IS NULL
  `);

  const data = (result as any).rows || (result as any);
  const totalIn = Number(data[0]?.total_in || 0);
  const totalOut = Number(data[0]?.total_out || 0);
  const currentBalance = openingBalance.amount + totalIn - totalOut;

  // Seluruh transaksi pada bulan berjalan sampai hari ini (WIB).
  const monthlyTransactions = await db
    .select({
      id: financialTransactions.id,
      type: financialTransactions.type,
      amount: financialTransactions.amount,
      date: financialTransactions.date,
      description: financialTransactions.description,
      donorName: financialTransactions.donorName,
      isAnonymous: financialTransactions.isAnonymous,
      programName: programs.name,
    })
    .from(financialTransactions)
    .leftJoin(programs, eq(financialTransactions.programId, programs.id))
    .where(
      and(
        isNull(financialTransactions.deletedAt),
        gte(financialTransactions.date, monthStart),
        lt(financialTransactions.date, tomorrow),
      ),
    )
    .orderBy(
      desc(financialTransactions.date),
      desc(financialTransactions.createdAt),
    );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      
      
      <div className="relative overflow-hidden bg-brand-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-700/45 via-brand-950 to-brand-950"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Transparansi Keuangan</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-brand-100 md:text-xl">
            Laporan terbuka mengenai arus kas donasi dan penyaluran dana. Kami berkomitmen untuk mengelola setiap amanah dengan penuh integritas.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center gap-4 rounded-2xl border border-frame bg-white p-6 shadow-lg">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowDownRight className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-muted">Total Uang Masuk</p>
              <p className="text-2xl font-bold text-ink">Rp {totalIn.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-frame bg-white p-6 shadow-lg">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-muted">Total Penyaluran</p>
              <p className="text-2xl font-bold text-ink">Rp {totalOut.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-brand-200 bg-white p-6 shadow-lg ring-1 ring-brand-500">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Wallet className="h-24 w-24" />
            </div>
            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <Wallet className="h-6 w-6 text-brand-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-ink-muted">Saldo Kas Saat Ini</p>
              <p className="text-2xl font-bold text-brand-700">Rp {currentBalance.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-frame bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-frame p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-ink">Riwayat Transaksi Bulan Ini</h2>
              <p className="text-sm text-ink-muted">
                Seluruh transaksi {periodStartLabel} - {periodEndLabel} yang tercatat di sistem.
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-muted">
              <caption className="sr-only">
                Riwayat transaksi keuangan bulan ini
              </caption>
              <thead className="border-b border-frame bg-surface-muted text-xs uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="px-6 py-4">Tanggal</th>
                  <th scope="col" className="px-6 py-4">Keterangan</th>
                  <th scope="col" className="px-6 py-4">Program</th>
                  <th scope="col" className="px-6 py-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-frame">
                {monthlyTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-ink-muted">
                      <BookOpen className="mx-auto mb-3 h-8 w-8 text-brand-200" />
                      Belum ada transaksi pada bulan berjalan.
                    </td>
                  </tr>
                ) : (
                  monthlyTransactions.map((trx) => (
                    <tr key={trx.id} className="transition-colors hover:bg-brand-50/60">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(trx.date).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-ink">{trx.description}</div>
                        {trx.type === 'IN' && (
                          <div className="mt-0.5 text-xs text-ink-muted">
                            Donatur: {trx.isAnonymous ? 'Hamba Allah' : (trx.donorName || 'Anonim')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {trx.programName ? (
                          <span className="inline-flex items-center rounded bg-surface-muted px-2 py-1 text-xs font-medium text-ink-muted">
                            {trx.programName}
                          </span>
                        ) : 'Umum'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {trx.type === 'IN' ? (
                          <span className="flex items-center justify-end gap-1 text-emerald-700">
                            + Rp {Number(trx.amount).toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center justify-end gap-1">
                            - Rp {Number(trx.amount).toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-frame bg-surface-muted p-6 text-center">
             <p className="text-sm text-ink-muted">
               Catatan: Data diperbarui setiap kali pengurus mencatat atau memverifikasi transaksi di sistem.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
