"use client";

import { useActionState } from "react";
import { createTransaksiMasuk } from "@/app/actions/keuangan";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function UangMasukPage() {
  const [state, formAction, isPending] = useActionState(createTransaksiMasuk, { success: false, error: null });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <ArrowUpRight className="mr-2 h-6 w-6 text-emerald-500" />
          Catat Uang Masuk
        </h1>
        <p className="text-slate-500 text-sm mt-1">Masukkan data donasi atau penerimaan dana baru.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {state.success ? (
          <div className="bg-emerald-50 text-emerald-700 p-6 rounded-lg border border-emerald-100 flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-medium">Transaksi Berhasil Disimpan</h3>
            <p className="mt-1 text-sm text-emerald-600">Saldo telah diperbarui. Anda bisa mencatat transaksi lainnya.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Catat Transaksi Baru
            </button>
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            {state.error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {state.error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  placeholder="100000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Donatur / Sumber Dana *</label>
              <input
                type="text"
                name="donorName"
                required
                placeholder="Misal: Hamba Allah / Bantuan CSR"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Tambahan</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Opsional"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Menyimpan..." : "Simpan Uang Masuk"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
