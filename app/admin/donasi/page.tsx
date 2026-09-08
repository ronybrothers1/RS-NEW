import { db } from "@/src/db";
import { donations, programs } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import VerifyDonationButton from "./components/VerifyDonationButton";
import { FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDonasiPage() {
  const donationList = await db
    .select({
      id: donations.id,
      donorName: donations.donorName,
      amount: donations.amount,
      status: donations.status,
      paymentMethod: donations.paymentMethod,
      createdAt: donations.createdAt,
      programName: programs.name,
    })
    .from(donations)
    .leftJoin(programs, eq(donations.programId, programs.id))
    .orderBy(desc(donations.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Donasi</h1>
          <p className="text-slate-500 text-sm mt-1">Verifikasi donasi masuk dari publik.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Donatur</th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donationList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    Belum ada data donasi.
                  </td>
                </tr>
              ) : (
                donationList.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{d.donorName}</td>
                    <td className="px-6 py-4">{d.programName || '-'}</td>
                    <td className="px-6 py-4">{d.paymentMethod || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(Number(d.amount))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        d.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status === 'SUCCESS' ? 'Berhasil' : d.status === 'FAILED' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {d.status === 'PENDING' ? (
                        <VerifyDonationButton donationId={d.id} />
                      ) : (
                        <span className="text-xs text-slate-400">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
