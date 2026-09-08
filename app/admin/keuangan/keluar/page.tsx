"use client";

import { useActionState, useState } from "react";
import { createTransaksiKeluar } from "@/app/actions/keuangan";
import { ArrowDownRight, CheckCircle2 } from "lucide-react";

export default function UangKeluarPage() {
  const [state, formAction, isPending] = useActionState(createTransaksiKeluar, { success: false, error: null });
  const [selectedProgram, setSelectedProgram] = useState("");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <ArrowDownRight className="mr-2 h-6 w-6 text-rose-500" />
          Catat Uang Keluar
        </h1>
        <p className="text-slate-500 text-sm mt-1">Masukkan data pengeluaran yayasan sesuai program.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {state.success ? (
          <div className="bg-emerald-50 text-emerald-700 p-6 rounded-lg border border-emerald-100 flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-medium">Pengeluaran Berhasil Disimpan</h3>
            <p className="mt-1 text-sm text-emerald-600">Saldo telah diperbarui.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Catat Pengeluaran Baru
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Program *</label>
              <select
                name="programId"
                required
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white"
              >
                <option value="">Pilih Program</option>
                {/* Normally these would be fetched from DB, but we will use the specific static options requested by the user, except 'Lainnya' which skips program_id or uses a generic one */}
                <option value="Bantuan Sembako">Bantuan Sembako</option>
                <option value="Bantuan Pendidikan">Bantuan Pendidikan</option>
                <option value="Bantuan Penanggulangan Bencana">Bantuan Penanggulangan Bencana</option>
                <option value="Bedah Rumah">Bedah Rumah</option>
                <option value="Program Sosial">Program Sosial</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            {selectedProgram === "other" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Program *</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Jelaskan jenis program pengeluaran"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            )}
            
            {selectedProgram !== "other" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Rincian Pengeluaran *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Misal: Pembelian 100 paket sembako"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                ></textarea>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Menyimpan..." : "Simpan Uang Keluar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
