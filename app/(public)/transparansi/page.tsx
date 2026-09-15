import { db } from "@/src/db";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo-metadata";
import { getFinanceSummary } from "@/lib/finance-summary";
import { getFinanceMonthlySummary } from "@/lib/finance-monthly-summary";
import { financialTransactions, programs } from "@/src/db/schema";
import { and, desc, eq, gte, isNull, lt } from "drizzle-orm";

import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, BookOpen } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: "Transparansi Keuangan",
  description:
    "Pantau penerimaan, pengeluaran, saldo kas, dan riwayat transaksi Yayasan Ruang Sejahtera yang dipublikasikan secara terbuka dan terukur.",
  path: "/transparansi",
});



type FinanceCategory =
  | "INCOME"
  | "EXPENSE"
  | "LOAN_OUT"
  | "LOAN_REPAYMENT";

function effectiveTransactionCategory(
  type: "IN" | "OUT",
  category: FinanceCategory | null,
): FinanceCategory {
  return (
    category ??
    (
      type === "IN"
        ? "INCOME"
        : "EXPENSE"
    )
  );
}

function transactionCategoryLabel(
  type: "IN" | "OUT",
  category: FinanceCategory | null,
) {
  switch (
    effectiveTransactionCategory(
      type,
      category,
    )
  ) {
    case "LOAN_OUT":
      return "Pinjaman Keluar";
    case "LOAN_REPAYMENT":
      return "Pengembalian Pinjaman";
    case "EXPENSE":
      return "Pengeluaran";
    default:
      return "Penerimaan";
  }
}

export default async function TransparansiPage() {
  const [
    finance,
    monthlyFinance,
  ] =
    await Promise.all([
      getFinanceSummary(),
      getFinanceMonthlySummary(),
    ]);

  // Seluruh transaksi bulan berjalan menggunakan batas kalender WIB.
  const monthlyTransactions = await db
    .select({
      id: financialTransactions.id,
      type: financialTransactions.type,
      category: financialTransactions.category,
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
        gte(financialTransactions.date, monthlyFinance.periodStart),
        lt(financialTransactions.date, monthlyFinance.periodEndExclusive),
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
        <section className="mb-8 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]" aria-label="Rekonsiliasi saldo kas">
          <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-brand-950 p-6 text-white shadow-lg">
            <div className="absolute -right-5 -top-5 opacity-10">
              <Wallet className="h-36 w-36" />
            </div>

            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-200">
                Saldo Kas Saat Ini
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Rp {monthlyFinance.closingBalance.toLocaleString('id-ID')}
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-brand-100">
                Posisi kas merupakan saldo awal bulan ditambah seluruh penerimaan dan dikurangi seluruh pengeluaran bulan {monthlyFinance.monthLabel}.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-frame bg-white shadow-lg">
            <div className="border-b border-frame px-6 py-4">
              <h2 className="text-lg font-bold text-ink">
                Rekonsiliasi Saldo Kas
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Rekonsiliasi arus kas bulan {monthlyFinance.monthLabel}.
              </p>
            </div>

            <div className="divide-y divide-frame px-6">
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-ink-muted">
                  Saldo awal bulan {monthlyFinance.monthLabel}
                </span>
                <span className="font-bold text-ink">
                  Rp {monthlyFinance.openingBalance.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-ink-muted">
                  Penerimaan bulan {monthlyFinance.monthLabel}
                </span>
                <span className="font-bold text-emerald-700">
                  Rp {monthlyFinance.cashIn.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-ink-muted">
                  Pengeluaran bulan {monthlyFinance.monthLabel}
                </span>
                <span className="font-bold text-rose-700">
                  Rp {monthlyFinance.cashOut.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 bg-brand-50 py-4">
                <span className="font-bold text-brand-900">
                  Sisa saldo bulan {monthlyFinance.monthLabel}
                </span>
                <span className="text-xl font-extrabold text-brand-800">
                  Rp {monthlyFinance.closingBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12 grid gap-4 md:grid-cols-3" aria-label="Ringkasan komponen keuangan">
          <div className="flex items-center gap-4 rounded-2xl border border-frame bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <ArrowDownRight className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-muted">Total Penerimaan</p>
              <p className="text-xl font-bold text-ink">
                Rp {finance.totalIncome.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-frame bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <ArrowUpRight className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-muted">Total Pengeluaran</p>
              <p className="text-xl font-bold text-ink">
                Rp {finance.totalExpense.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-frame bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-muted">Pinjaman Beredar</p>
                <p className="text-xl font-bold text-ink">
                  Rp {finance.loanOutstanding.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <p className="mt-3 border-t border-frame pt-3 text-xs leading-5 text-ink-muted">
              Rp {finance.loanOut.toLocaleString('id-ID')} telah dipinjamkan dan Rp {finance.loanRepayment.toLocaleString('id-ID')} sudah dikembalikan.
            </p>
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-frame bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-frame p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-ink">Riwayat Transaksi Bulan Ini</h2>
              <p className="text-sm text-ink-muted">
                Seluruh transaksi bulan {monthlyFinance.monthLabel} yang tercatat di sistem.
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
                  <th scope="col" className="px-6 py-4">Jenis</th>
                  <th scope="col" className="px-6 py-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-frame">
                {monthlyTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-ink-muted">
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
                        {effectiveTransactionCategory(
                          trx.type,
                          trx.category,
                        ) === "INCOME" && (
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
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">
                          {transactionCategoryLabel(
                            trx.type,
                            trx.category,
                          )}
                        </span>
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
