export const revalidate = 60;
import { db } from "@/src/db";
import { activities } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { CalendarRange, MapPin, ArrowRight } from "lucide-react";


export default async function PublicKegiatanPage() {
  const allActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.isPublished, true))
    .orderBy(desc(activities.date), desc(activities.createdAt));

  return (
    <div className="min-h-screen bg-slate-50">
      
      
      <div className="bg-teal-700 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Kegiatan Kami</h1>
          <p className="text-teal-100 text-lg md:text-xl max-w-2xl mx-auto">
            Jejak langkah dan aksi nyata Yayasan Ruang Sejahtera dalam menebar manfaat untuk masyarakat.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {allActivities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarRange className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">Belum ada kegiatan</h3>
            <p className="text-slate-500">Daftar kegiatan yayasan akan segera diperbarui di halaman ini.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allActivities.map((act) => (
              <div key={act.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all group flex flex-col">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {act.imageUrl ? (
                    <img 
                      src={act.imageUrl} 
                      alt={act.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CalendarRange className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  {act.tiktokUrl && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
                      </svg>
                      Video
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <CalendarRange className="h-3.5 w-3.5 text-teal-600" />
                      {new Date(act.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {act.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-teal-600" />
                        <span className="line-clamp-1">{act.location}</span>
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-teal-700 transition-colors">
                    <Link href={`/kegiatan/${act.slug}`}>
                      <span className="absolute inset-0"></span>
                      {act.title}
                    </Link>
                  </h3>
                  
                  <p className="text-slate-600 line-clamp-3 mb-6 flex-1 text-sm leading-relaxed">
                    {act.description}
                  </p>
                  
                  <div className="text-teal-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all mt-auto pt-4 border-t border-slate-100">
                    Baca Selengkapnya <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
