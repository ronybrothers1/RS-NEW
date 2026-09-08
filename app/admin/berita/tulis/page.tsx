"use client";

import { useActionState, useState } from "react";
import { createBerita } from "@/app/actions/berita";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamic import for react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function TulisBeritaPage() {
  const [state, formAction, isPending] = useActionState(createBerita, { success: false, error: null });
  const [content, setContent] = useState("");

  if (state.success) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-emerald-50 text-emerald-700 p-8 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-50 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Berita Berhasil Disimpan</h2>
          <p className="text-emerald-600 mb-8">Artikel baru telah ditambahkan ke sistem.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Tulis Berita Lagi
            </button>
            <Link 
              href="/admin/berita"
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/berita" className="p-2 bg-white text-slate-500 hover:text-slate-900 rounded-full border border-slate-200 shadow-sm transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tulis Berita</h1>
          <p className="text-slate-500 text-sm mt-1">Buat artikel, cerita, atau update terbaru.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form action={formAction} className="space-y-8">
          {state.error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
              {state.error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Berita *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Masukkan judul berita yang menarik"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Custom Slug URL (Opsional)</label>
              <input
                type="text"
                name="slug"
                placeholder="Biarkan kosong untuk generate otomatis dari judul"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">Hanya gunakan huruf kecil, angka, dan tanda hubung (-).</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Konten / Isi Berita *</label>
              <div className="border border-slate-300 rounded-lg overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-300 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-base">
                <ReactQuill 
                  theme="snow" 
                  value={content} 
                  onChange={setContent} 
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['link', 'image', 'video'],
                      ['clean']
                    ],
                  }}
                />
              </div>
              <input type="hidden" name="content" value={content} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Pengaturan Gambar</h3>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Featured Image (Cover)</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alt Text Gambar</label>
                <input
                  type="text"
                  name="imageAlt"
                  placeholder="Deskripsi singkat gambar untuk aksesibilitas (SEO)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Pengaturan SEO (Search Engine Optimization)</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  placeholder="Judul untuk mesin pencari (opsional)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                <textarea
                  name="metaDescription"
                  rows={2}
                  placeholder="Deskripsi singkat untuk mesin pencari (opsional)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kutipan / Excerpt (Opsional)</label>
                <textarea
                  name="excerpt"
                  rows={3}
                  placeholder="Ringkasan singkat artikel untuk ditampilkan di halaman daftar berita..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                ></textarea>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">Status Publikasi</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input type="radio" name="status" value="PUBLISHED" defaultChecked className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300" />
                  <span className="ml-2 text-sm text-slate-700">Publikasikan (Live)</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="status" value="DRAFT" className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300" />
                  <span className="ml-2 text-sm text-slate-700">Simpan sebagai Draf</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link 
              href="/admin/berita"
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 transition-colors"
            >
              {isPending ? "Menyimpan..." : "Simpan Berita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

