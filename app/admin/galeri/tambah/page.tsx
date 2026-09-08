"use client";

import { useActionState } from "react";
import { createGaleri } from "@/app/actions/galeri";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Link as LinkIcon, Youtube } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TambahGaleriPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createGaleri, { success: false, error: null });

  if (state.success) {
    router.push('/admin/galeri');
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/galeri" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tambah Media Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Unggah foto atau tautan video kegiatan.</p>
        </div>
      </div>

      <form action={formAction} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {state.error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {state.error}
          </div>
        )}
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Media</label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="Contoh: Penyaluran Bantuan Air Bersih di Desa X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat (Opsional)</label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="Tuliskan keterangan mengenai foto/video ini..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                URL Gambar
              </label>
              <input
                type="url"
                name="imageUrl"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="https://..."
              />
              <p className="text-xs text-slate-500 mt-1">Masukkan link gambar (JPG/PNG).</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Youtube className="h-4 w-4 text-slate-400" />
                URL Video (Opsional)
              </label>
              <input
                type="url"
                name="videoUrl"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="https://youtube.com/..."
              />
              <p className="text-xs text-slate-500 mt-1">Masukkan link video YouTube/TikTok.</p>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label className="flex items-center">
              <input type="checkbox" name="isPublished" value="true" defaultChecked className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
              <span className="ml-2 text-sm font-medium text-slate-700">Langsung publikasikan ke halaman publik</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <Link
            href="/admin/galeri"
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-teal-700 text-white font-medium rounded-lg hover:bg-teal-800 disabled:opacity-70 transition-colors"
          >
            {isPending ? "Menyimpan..." : "Simpan Media"}
          </button>
        </div>
      </form>
    </div>
  );
}
