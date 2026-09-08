import { db } from "@/src/db";
import { articles, users } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { FileText, Plus, ExternalLink, Image as ImageIcon, Pencil } from "lucide-react";
import DeleteBeritaButton from "./components/DeleteBeritaButton";
import { publishDueArticles } from "@/lib/article-publication";

export default async function BeritaPage() {
  await publishDueArticles();
  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      createdAt: articles.createdAt,
      imageUrl: articles.imageUrl,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .orderBy(desc(articles.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Berita & Artikel</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola publikasi berita, cerita inspiratif, dan artikel yayasan.</p>
        </div>
        <Link 
          href="/admin/berita/tulis" 
          className="inline-flex items-center justify-center px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tulis Berita
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Judul Berita</th>
                <th scope="col" className="px-6 py-3">Tanggal & Penulis</th>
                <th scope="col" className="px-6 py-3 text-center">Status</th>
                <th scope="col" className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allArticles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada berita yang ditulis.
                  </td>
                </tr>
              ) : (
                allArticles.map((art) => (
                  <tr key={art.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {art.imageUrl ? (
                            <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="font-medium text-slate-900 line-clamp-2">{art.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium">
                        {new Date(art.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{art.authorName}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        art.status === 'PUBLISHED' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {art.status === 'PUBLISHED'
                          ? 'Dipublikasi'
                          : art.status === 'SCHEDULED'
                            ? 'Terjadwal'
                            : art.status === 'ARCHIVED'
                              ? 'Arsip'
                              : 'Draf'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/berita/${art.id}/edit`}
                          className="text-slate-400 hover:text-teal-600 transition-colors"
                          title="Edit Berita"
                          aria-label={`Edit ${art.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        {art.status === 'PUBLISHED' && (
                          <Link href={`/berita/${art.slug}`} target="_blank" className="text-slate-400 hover:text-teal-600 transition-colors" title="Lihat di Web">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <DeleteBeritaButton id={art.id} />
                      </div>
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
