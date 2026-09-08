import { db } from "@/src/db";
import { financialTransactions, users } from "@/src/db/schema";
import { desc, isNull, eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";

export default async function RiwayatTransaksiPage() {
  const transactions = await db
    .select({
      id: financialTransactions.id,
      date: financialTransactions.date,
      type: financialTransactions.type,
      amount: financialTransactions.amount,
      description: financialTransactions.description,
      donorName: financialTransactions.donorName,
      userName: users.name,
    })
    .from(financialTransactions)
    .leftJoin(users, eq(financialTransactions.userId, users.id))
    .where(isNull(financialTransactions.deletedAt))
    .orderBy(desc(financialTransactions.date), desc(financialTransactions.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar seluruh pemasukan dan pengeluaran keuangan.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari deskripsi atau nama donatur..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-teal-500 focus:border-teal-500">
              <option value="ALL">Semua Jenis</option>
              <option value="IN">Uang Masuk</option>
              <option value="OUT">Uang Keluar</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Tanggal</th>
                <th scope="col" className="px-6 py-3">Jenis</th>
                <th scope="col" className="px-6 py-3">Keterangan</th>
                <th scope="col" className="px-6 py-3 text-right">Nominal</th>
                <th scope="col" className="px-6 py-3">Pencatat</th>
                <th scope="col" className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr key={trx.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(trx.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {trx.type === 'IN' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                          Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                          Keluar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 min-w-[300px]">
                      <div className="font-medium text-slate-900">
                        {trx.type === 'IN' ? trx.donorName : trx.description}
                      </div>
                      {trx.type === 'IN' && trx.description && (
                        <div className="text-slate-500 text-xs mt-1">{trx.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={trx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}>
                        {trx.type === 'IN' ? '+' : '-'}{formatCurrency(Number(trx.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {trx.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-teal-600 hover:text-teal-900 font-medium text-xs mr-3">Detail</button>
                      <button className="text-rose-600 hover:text-rose-900 font-medium text-xs">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-500">Menampilkan {transactions.length} transaksi</span>
        </div>
      </div>
    </div>
  );
}
