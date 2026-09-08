import { db } from "@/src/db";
import { financialTransactions, activities, articles, donations } from "@/src/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { ArrowDownRight, ArrowUpRight, Wallet, Activity, CalendarRange, FileText, HeartHandshake } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Make sure to install standard UI components if needed, or implement simple versions here.

export default async function DashboardPage() {
  // Execute queries in parallel
  const [
    financialStats,
    activitiesCount,
    articlesCount,
    donationsCount
  ] = await Promise.all([
    db.select({
      totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'IN' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
      totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'OUT' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
      count: sql<number>`COUNT(*)`,
    }).from(financialTransactions).where(sql`${financialTransactions.deletedAt} IS NULL`),
    
    db.select({ count: sql<number>`COUNT(*)` }).from(activities),
    
    db.select({ count: sql<number>`COUNT(*)` }).from(articles),
    
    db.select({ 
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${donations.amount}), 0)`
    }).from(donations).where(eq(donations.status, 'SUCCESS'))
  ]);

  const { totalIn = 0, totalOut = 0, count: trxCount = 0 } = financialStats[0] || {};
  const saldo = Number(totalIn) - Number(totalOut);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan aktivitas dan keuangan yayasan.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Saldo Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Saldo Saat Ini</h3>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(saldo)}</div>
          </div>
        </div>

        {/* Uang Masuk Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Uang Masuk</h3>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(Number(totalIn))}</div>
          </div>
        </div>

        {/* Uang Keluar Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Uang Keluar</h3>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(Number(totalOut))}</div>
          </div>
        </div>

        {/* Transaksi Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Transaksi</h3>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900">{Number(trxCount)}</div>
          </div>
        </div>
        
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Jumlah Kegiatan</h3>
            <div className="text-2xl font-bold text-slate-900 mt-1">{Number(activitiesCount[0]?.count || 0)}</div>
          </div>
          <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <CalendarRange className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Jumlah Berita</h3>
            <div className="text-2xl font-bold text-slate-900 mt-1">{Number(articlesCount[0]?.count || 0)}</div>
          </div>
          <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Donasi Terkumpul</h3>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(Number(donationsCount[0]?.totalAmount || 0))}</div>
          </div>
          <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
            <HeartHandshake className="h-5 w-5" />
          </div>
        </div>
      </div>

    </div>
  );
}
