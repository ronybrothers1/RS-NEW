export const revalidate = 60;
import { db } from "@/src/db";
import { activities } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { CalendarRange, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import TikTokEmbed from "./components/TikTokEmbed";

export default async function KegiatanDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.slug, params.slug));

  if (!activity || !activity.isPublished) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      
      
      <main className="pb-24">
        {activity.imageUrl ? (
          <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-900">
            <img 
              src={activity.imageUrl} 
              alt={activity.title}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
          </div>
        ) : (
          <div className="w-full h-32 md:h-48 bg-teal-50"></div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-32 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-12">
            <Link href="/kegiatan" className="inline-flex items-center gap-2 text-teal-700 font-medium hover:text-teal-800 transition-colors mb-8">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Kegiatan
            </Link>

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                <CalendarRange className="h-4 w-4 text-teal-600" />
                {new Date(activity.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {activity.location && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  {activity.location}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-8 leading-tight">
              {activity.title}
            </h1>

            <div className="prose prose-lg prose-slate max-w-none mb-12">
              {(activity.description || '').split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {activity.tiktokUrl && (
              <div className="mt-12 pt-12 border-t border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Video Kegiatan</h3>
                <div className="flex justify-center">
                  <TikTokEmbed url={activity.tiktokUrl} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
