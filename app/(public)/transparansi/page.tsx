import { db } from "@/src/db";
import { financialTransactions, programs } from "@/src/db/schema";
import { desc, eq, sql } from "drizzle-orm";

import { ArrowDownRight, ArrowUpRight, CheckCircle2, TrendingUp, Wallet, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TransparansiPage() {
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
  const currentBalance = totalIn - totalOut;

  // Get recent 10 transactions
  const recentTransactions = await db
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
    .where(sql`financial_transactions.deleted_at IS NULL`)
    .orderBy(
      desc(financialTransactions.date),
      desc(financialTransactions.createdAt),
    )
    .limit(15);

  return (
    <div className="min-h-screen bg-slate-50">
      
      
      <div className="bg-teal-800 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Transparansi Keuangan</h1>
          <p className="text-teal-100 text-lg md:text-xl max-w-2xl mx-auto">
            Laporan terbuka mengenai arus kas donasi dan penyaluran dana. Kami berkomitmen untuk mengelola setiap amanah dengan penuh integritas.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowDownRight className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Uang Masuk</p>
              <h3 className="text-2xl font-bold text-slate-900">Rp {totalIn.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Penyaluran</p>
              <h3 className="text-2xl font-bold text-slate-900">Rp {totalOut.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-teal-100 ring-1 ring-teal-500 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Wallet className="h-24 w-24" />
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0 relative z-10">
              <Wallet className="h-6 w-6 text-teal-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-slate-500">Saldo Kas Saat Ini</p>
              <h3 className="text-2xl font-bold text-teal-700">Rp {currentBalance.toLocaleString('id-ID')}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Riwayat Transaksi Terbaru</h2>
              <p className="text-sm text-slate-500">15 transaksi terakhir yang tercatat di sistem.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4">Program</th>
                  <th className="px-6 py-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      Belum ada data transaksi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(trx.date).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{trx.description}</div>
                        {trx.type === 'IN' && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Donatur: {trx.isAnonymous ? 'Hamba Allah' : (trx.donorName || 'Anonim')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {trx.programName ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {trx.programName}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {trx.type === 'IN' ? (
                          <span className="text-emerald-600 flex items-center justify-end gap-1">
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
          
          <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
             <p className="text-sm text-slate-500">
               Catatan: Data diperbarui secara *real-time* setiap kali admin memasukkan data transaksi.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
