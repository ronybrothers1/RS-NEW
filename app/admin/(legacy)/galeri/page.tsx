import {
  db,
} from "@/src/db";
import {
  gallery,
} from "@/src/db/schema";
import {
  desc,
} from "drizzle-orm";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export const dynamic =
  "force-dynamic";

export default async function AdminGaleriPage() {
  const items =
    await db
      .select()
      .from(gallery)
      .orderBy(
        desc(
          gallery.createdAt,
        ),
      );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Arsip Galeri
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Data Galeri lama dipertahankan sebagai arsip dan tidak lagi digunakan untuk publikasi baru.
          </p>
        </div>

        <Link
          href="/admin/kegiatan"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition-colors hover:bg-teal-800"
        >
          Kelola Kegiatan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Archive className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-amber-950">
              Galeri lama telah dinonaktifkan
            </h2>

            <p className="mt-1 text-sm leading-6 text-amber-900">
              Konten yang sudah tersimpan tetap dipertahankan sebagai arsip.
              Penambahan, perubahan status publikasi, dan penghapusan Galeri
              telah dinonaktifkan. Dokumentasi baru dikelola melalui modul Kegiatan.
            </p>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-20 text-center">
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-slate-300" />

          <h3 className="text-lg font-medium text-slate-900">
            Tidak ada data Galeri lama
          </h3>

          <p className="mt-1 text-slate-500">
            Dokumentasi baru dikelola melalui modul Kegiatan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(
            (item) => (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-video border-b border-slate-200 bg-slate-100">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={
                        item.title ||
                        "Galeri"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Video className="h-8 w-8 text-slate-400" />
                    </div>
                  )}

                  <div className="absolute right-2 top-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        item.isPublished
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.isPublished
                        ? "Status lama: Publik"
                        : "Status lama: Draft"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3
                    className="line-clamp-1 font-bold text-slate-900"
                    title={
                      item.title ||
                      "Tanpa Judul"
                    }
                  >
                    {item.title ||
                      "Tanpa Judul"}
                  </h3>

                  <p className="mt-1 line-clamp-3 text-xs text-slate-500">
                    {item.description ||
                      "Tidak ada deskripsi"}
                  </p>

                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">
                    Arsip read-only
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}