"use client";

import { createBerita, updateBerita } from "@/app/actions/berita";
import { ArrowLeft, CheckCircle2, Eye } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useActionState, useState } from "react";
import "react-quill-new/dist/quill.snow.css";
import FeaturedImageUploader from "./FeaturedImageUploader";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

type ArticleStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

type InitialArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageCaption: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: ArticleStatus;
  scheduledAt: string | null;
};

type Props = {
  article?: InitialArticle;
};

function toLocalInputValue(isoValue: string) {
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

export default function ArticleForm({ article }: Props) {
  const isEdit = Boolean(article);

  const action = article
    ? updateBerita.bind(null, article.id)
    : createBerita;

  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: null,
  });

  const [content, setContent] = useState(article?.content ?? "");
  const [status, setStatus] = useState<ArticleStatus>(
    article?.status ?? "PUBLISHED",
  );
  const [scheduledLocal, setScheduledLocal] = useState(
    () =>
      article?.scheduledAt
        ? toLocalInputValue(article.scheduledAt)
        : "",
  );

  if (state.success) {
    return (
      <div className="mx-auto mt-8 max-w-2xl">
        <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-emerald-50 p-8 text-center text-emerald-700">
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-600" />

          <h2 className="mb-2 text-2xl font-bold">
            {isEdit
              ? "Berita Berhasil Diperbarui"
              : "Berita Berhasil Disimpan"}
          </h2>

          <p className="mb-8 text-emerald-600">
            {isEdit
              ? "Perubahan artikel telah disimpan."
              : "Artikel baru telah ditambahkan ke sistem."}
          </p>

          <Link
            href="/admin/berita"
            className="rounded-lg border border-emerald-200 bg-white px-5 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Kembali ke Daftar Berita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/berita"
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Edit Berita" : "Tulis Berita"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {isEdit
              ? "Perbarui isi, media, SEO, atau status publikasi."
              : "Buat artikel, cerita, atau update terbaru."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <form action={formAction} className="space-y-8">
          {state.error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {state.error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Judul Berita *
              </label>

              <input
                type="text"
                name="title"
                required
                defaultValue={article?.title ?? ""}
                placeholder="Masukkan judul berita"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-lg font-medium text-slate-900 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Custom Slug URL
              </label>

              <input
                type="text"
                name="slug"
                defaultValue={article?.slug ?? ""}
                placeholder="Biarkan kosong untuk dibuat otomatis"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-teal-500 focus:ring-teal-500"
              />

              <p className="mt-1 text-xs text-slate-500">
                Slug akan dinormalisasi dan dibuat unik secara otomatis.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Konten / Isi Berita *
              </label>

              <div className="overflow-hidden rounded-lg border border-slate-300 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-base [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-300 [&_.ql-toolbar]:bg-slate-50">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ align: [] }],
                      ["blockquote"],
                      ["link", "image", "video"],
                      ["clean"],
                    ],
                  }}
                />
              </div>

              <input type="hidden" name="content" value={content} />
            </div>

            <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Pengaturan Gambar
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Gambar Unggulan
                </label>

                <FeaturedImageUploader
                  initialUrl={article?.imageUrl}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Alt Text Gambar
                </label>

                <input
                  type="text"
                  name="imageAlt"
                  defaultValue={article?.imageAlt ?? ""}
                  placeholder="Deskripsi gambar untuk aksesibilitas dan SEO"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-teal-500 focus:ring-teal-500"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Jelaskan isi gambar secara singkat untuk pembaca layar. Alt text tidak ditampilkan sebagai caption.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Caption Gambar
                </label>

                <textarea
                  name="imageCaption"
                  rows={2}
                  maxLength={300}
                  defaultValue={article?.imageCaption ?? ""}
                  placeholder="Contoh: Kondisi rumah sebelum direnovasi di Desa Karanggayam, Sampang."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-teal-500 focus:ring-teal-500"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Caption tampil di bawah gambar unggulan. Maksimal 300 karakter.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-6">
              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Pengaturan SEO
                </h3>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Meta Title
                </label>

                <input
                  type="text"
                  name="metaTitle"
                  defaultValue={article?.metaTitle ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Meta Description
                </label>

                <textarea
                  name="metaDescription"
                  rows={2}
                  defaultValue={article?.metaDescription ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Kutipan / Excerpt
                </label>

                <textarea
                  name="excerpt"
                  rows={3}
                  defaultValue={article?.excerpt ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6">
              <label className="block text-sm font-medium text-slate-700">
                Status Publikasi
              </label>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="PUBLISHED"
                    checked={status === "PUBLISHED"}
                    onChange={() => setStatus("PUBLISHED")}
                    className="h-4 w-4 border-slate-300 text-teal-600"
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Publikasikan Sekarang
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="SCHEDULED"
                    checked={status === "SCHEDULED"}
                    onChange={() => setStatus("SCHEDULED")}
                    className="h-4 w-4 border-slate-300 text-teal-600"
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Jadwalkan
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="DRAFT"
                    checked={status === "DRAFT"}
                    onChange={() => setStatus("DRAFT")}
                    className="h-4 w-4 border-slate-300 text-teal-600"
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Simpan sebagai Draf
                  </span>
                </label>

                {isEdit && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="ARCHIVED"
                      checked={status === "ARCHIVED"}
                      onChange={() => setStatus("ARCHIVED")}
                      className="h-4 w-4 border-slate-300 text-teal-600"
                    />
                    <span className="ml-2 text-sm text-slate-700">
                      Arsipkan
                    </span>
                  </label>
                )}
              </div>

              {status === "SCHEDULED" && (
                <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tanggal & Waktu Publikasi *
                  </label>

                  <input
                    type="datetime-local"
                    value={scheduledLocal}
                    onChange={(event) =>
                      setScheduledLocal(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900"
                  />

                  <input
                    type="hidden"
                    name="scheduledAt"
                    value={
                      scheduledLocal
                        ? new Date(scheduledLocal).toISOString()
                        : ""
                    }
                  />
                </div>
              )}

              {status !== "SCHEDULED" && (
                <input
                  type="hidden"
                  name="scheduledAt"
                  value=""
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
            {article && (
              <Link
                href={`/admin/berita/${article.id}/preview`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-100"
              >
                <Eye className="h-4 w-4" />
                Pratinjau
              </Link>
            )}
            <Link
              href="/admin/berita"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-teal-700 px-8 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-70"
            >
              {isPending
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Simpan Berita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
