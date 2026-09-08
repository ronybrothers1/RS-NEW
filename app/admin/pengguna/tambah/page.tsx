"use client";

import { useActionState } from "react";
import { createUser } from "@/app/actions/pengguna";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TambahPenggunaPage() {
  const [state, formAction, isPending] = useActionState(createUser, { success: false, error: null });

  if (state.success) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-emerald-50 text-emerald-700 p-8 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pengguna Berhasil Ditambahkan</h2>
          <p className="text-emerald-600 mb-8">Pengguna baru sudah dapat login menggunakan email dan password yang didaftarkan.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Tambah Pengguna Lagi
            </button>
            <Link 
              href="/admin/pengguna"
              className="px-5 py-2.5 bg-white text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              Kembali ke Daftar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/pengguna" className="p-2 bg-white text-slate-500 hover:text-slate-900 rounded-full border border-slate-200 shadow-sm transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tambah Pengguna Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Buat akun untuk pengurus atau relawan yayasan.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form action={formAction} className="space-y-6">
          {state.error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Masukkan nama pengguna"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="nama@ruangsejahtera.org"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peran (Role) *</label>
              <select
                name="role"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white"
              >
                <option value="OPERATOR">OPERATOR (Input Data)</option>
                <option value="ADMIN">ADMIN (Akses Penuh)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Admin dapat mengakses menu pengguna & pengaturan.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link 
              href="/admin/pengguna"
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 transition-colors"
            >
              {isPending ? "Menyimpan..." : "Simpan Pengguna"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
