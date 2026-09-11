import { db } from "@/src/db";
import { gallery } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Image as ImageIcon, Video } from "lucide-react";
import GaleriActionButtons from "./components/GaleriActionButtons";

export const dynamic = 'force-dynamic';

export default async function AdminGaleriPage() {
  const items = await db.select().from(gallery).orderBy(desc(gallery.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Galeri</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola foto dan video dokumentasi kegiatan yayasan.</p>
        </div>
        <Link 
          href="/admin/galeri/tambah" 
          className="inline-flex items-center justify-center px-4 py-2.5 bg-teal-700 text-white font-medium rounded-lg hover:bg-teal-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Media
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Belum ada media</h3>
          <p className="text-slate-500 mt-1">Tambahkan foto atau video kegiatan pertama Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col group">
              <div className="aspect-video relative bg-slate-100 border-b border-slate-200">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.title || 'Galeri'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {item.isPublished ? 'Publik' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 line-clamp-1" title={item.title || 'Tanpa Judul'}>
                  {item.title || 'Tanpa Judul'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 mb-4">
                  {item.description || 'Tidak ada deskripsi'}
                </p>
                <div className="mt-auto flex justify-end pt-4 border-t border-slate-100">
                   <GaleriActionButtons id={item.id} isPublished={item.isPublished} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
