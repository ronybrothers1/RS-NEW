"use client";

import { useActionState, useState } from "react";
import { createKegiatan } from "@/app/actions/kegiatan";
import { ArrowLeft, CheckCircle2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TambahKegiatanPage() {
  const [state, formAction, isPending] = useActionState(createKegiatan, { success: false, error: null });
  const router = useRouter();

  if (state.success) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-emerald-50 text-emerald-700 p-8 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Kegiatan Berhasil Disimpan</h2>
          <p className="text-emerald-600 mb-8">Data kegiatan baru telah ditambahkan ke sistem.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Tambah Kegiatan Lagi
            </button>
            <Link 
              href="/admin/kegiatan"
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/kegiatan" className="p-2 bg-white text-slate-500 hover:text-slate-900 rounded-full border border-slate-200 shadow-sm transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tambah Kegiatan Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Lengkapi form di bawah ini untuk mencatat kegiatan yayasan.</p>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Kegiatan *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Misal: Penyaluran Sembako di Desa A"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Kegiatan *</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
              <input
                type="text"
                name="location"
                placeholder="Nama lokasi / alamat"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat *</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Ceritakan detail kegiatan..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Foto (Cover)</label>
              <div className="flex gap-4 items-center">
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Masukkan URL gambar (contoh dari Google Drive / Storage) untuk saat ini.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Embed Video TikTok (Opsional)</label>
              <input
                type="url"
                name="tiktokUrl"
                placeholder="https://www.tiktok.com/@username/video/..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">Masukkan link video TikTok untuk ditampilkan di halaman detail.</p>
            </div>
            
            <div className="md:col-span-2">
               <label className="flex items-center">
                <input type="checkbox" name="isPublished" value="true" defaultChecked className="h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                <span className="ml-2 text-sm text-slate-700">Langsung publikasikan ke website</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link 
              href="/admin/kegiatan"
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 transition-colors"
            >
              {isPending ? "Menyimpan..." : "Simpan Kegiatan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
