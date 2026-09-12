export const revalidate = 60;

import type { Metadata } from "next";
import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { HeartHandshake, BookOpen, Stethoscope, Leaf, Users, Activity, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: {
    canonical: "/program",
  },
};

const iconMap: Record<string, React.ElementType> = {
  'BookOpen': BookOpen,
  'Stethoscope': Stethoscope,
  'Leaf': Leaf,
  'Users': Users,
  'HeartHandshake': HeartHandshake,
};

export const dynamic = 'force-dynamic';

export default async function ProgramPage() {
  const activePrograms = await db
    .select()
    .from(programs)
    .where(eq(programs.status, 'ACTIVE'))
    .orderBy(desc(programs.createdAt));

  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="bg-slate-950 py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Program Kebaikan</h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Salurkan kepedulian Anda melalui berbagai program pemberdayaan dan bantuan sosial kami yang tepat sasaran dan terverifikasi.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {activePrograms.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <HeartHandshake className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Program Belum Tersedia</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Saat ini pengurus yayasan sedang menyusun program utama. Silakan kembali lagi nanti untuk melihat daftar program kebaikan kami.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePrograms.map((program) => {
              const IconComponent = iconMap[program.icon] || HeartHandshake;
              return (
                <div key={program.id} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all group flex flex-col">
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <IconComponent className="h-8 w-8 text-teal-600" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                    {program.name}
                  </h3>
                  
                  <p className="text-slate-600 leading-relaxed mb-8 flex-1">
                    {program.description || 'Program bantuan sosial untuk masyarakat yang membutuhkan.'}
                  </p>
                  
                  <Link 
                    href={`/donasi?program=${program.id}`} 
                    className="inline-flex items-center justify-center w-full py-3 px-4 bg-teal-50 text-teal-700 font-medium rounded-xl hover:bg-teal-600 hover:text-white transition-colors group/btn"
                  >
                    Donasi Sekarang
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="bg-white py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Punya Pertanyaan Seputar Program Kami?</h2>
          <p className="text-slate-600 mb-8">Tim kami siap membantu menjelaskan detail program dan penyaluran donasi Anda.</p>
          <Link href="/kontak" className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-200 text-slate-700 font-medium rounded-full hover:border-teal-600 hover:text-teal-700 transition-colors">
            Hubungi Kami
          </Link>
        </div>
      </div>
    </div>
  );
}
