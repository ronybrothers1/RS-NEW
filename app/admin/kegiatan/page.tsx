import { db } from "@/src/db";
import { activities } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { CalendarRange, Plus, ExternalLink, Image as ImageIcon } from "lucide-react";
import TogglePublishButton from "./components/TogglePublishButton";
import DeleteKegiatanButton from "./components/DeleteKegiatanButton";

export default async function KegiatanPage() {
  const allActivities = await db
    .select()
    .from(activities)
    .orderBy(desc(activities.date), desc(activities.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kegiatan Yayasan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data kegiatan lapangan dan penyaluran program.</p>
        </div>
        <Link 
          href="/admin/kegiatan/tambah" 
          className="inline-flex items-center justify-center px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kegiatan
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Kegiatan</th>
                <th scope="col" className="px-6 py-3">Tanggal & Lokasi</th>
                <th scope="col" className="px-6 py-3 text-center">Status</th>
                <th scope="col" className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allActivities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data kegiatan.
                  </td>
                </tr>
              ) : (
                allActivities.map((act) => (
                  <tr key={act.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {act.imageUrl ? (
                            <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{act.title}</div>
                          {act.tiktokUrl && (
                            <div className="text-xs text-blue-600 mt-1 inline-flex items-center">
                              TikTok Embedded
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-medium">
                        {new Date(act.date).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{act.location || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        act.isPublished 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {act.isPublished ? 'Dipublikasi' : 'Draf'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <TogglePublishButton id={act.id} isPublished={act.isPublished ?? false} />
                        <Link href={`/kegiatan/${act.slug}`} target="_blank" className="text-slate-400 hover:text-teal-600 transition-colors" title="Lihat di Web">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <DeleteKegiatanButton id={act.id} />
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
