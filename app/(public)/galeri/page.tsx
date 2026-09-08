export const revalidate = 60;
import { db } from "@/src/db";
import { gallery } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";

import { ImageIcon } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function GaleriPublicPage() {
  const items = await db
    .select()
    .from(gallery)
    .where(eq(gallery.isPublished, true))
    .orderBy(desc(gallery.createdAt));

  return (
    <div className="min-h-screen bg-slate-50">
      
      
      <div className="bg-teal-800 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Galeri Kegiatan</h1>
          <p className="text-teal-100 text-lg md:text-xl max-w-2xl mx-auto">
            Dokumentasi langkah-langkah kebaikan yang telah kita wujudkan bersama.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">Belum ada dokumentasi</h3>
            <p className="text-slate-500">Galeri kegiatan akan segera kami perbarui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all group">
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.imageUrl} 
                      alt={item.title || 'Dokumentasi Yayasan'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  {item.videoUrl && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                      Video Tersedia
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                    {item.title || 'Dokumentasi Kegiatan'}
                  </h3>
                  {item.description && (
                    <p className="text-slate-600 line-clamp-3 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>
                  )}
                  {item.videoUrl && (
                    <a 
                      href={item.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-teal-600 font-medium hover:text-teal-700 text-sm"
                    >
                      Lihat Video &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
