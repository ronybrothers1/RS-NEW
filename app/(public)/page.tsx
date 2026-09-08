// Rendered on-demand instead of prerendered at build time: this page
// queries the database, which is not reachable from the build machine.
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { HeartHandshake, ArrowRight, Activity, Users, FileText, CheckCircle2, BookOpen, Stethoscope, Leaf } from "lucide-react";
import { db } from "@/src/db";
import { financialTransactions, programs, activities } from "@/src/db/schema";
import { sql, eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  'BookOpen': BookOpen,
  'Stethoscope': Stethoscope,
  'Leaf': Leaf,
  'Users': Users,
  'HeartHandshake': HeartHandshake,
  'Activity': Activity,
  'FileText': FileText,
};

export default async function HomePage() {
  const [financialStats] = await db.select({
    totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'IN' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
    totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'OUT' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
  }).from(financialTransactions).where(sql`${financialTransactions.deletedAt} IS NULL`);

  const saldo = Number(financialStats?.totalIn || 0) - Number(financialStats?.totalOut || 0);

  const activePrograms = await db
    .select()
    .from(programs)
    .where(eq(programs.status, 'ACTIVE'))
    .orderBy(programs.createdAt)
    .limit(6);
    
  const hasRealData = Number(financialStats?.totalIn) > 0 || activePrograms.length > 0;

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-32 md:pt-40 md:pb-48 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-12">
          
          <div className="text-left max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              KEPEDULIAN PERLU SAMPAI <br />
              <span className="text-teal-400">KE TEMPAT YANG TEPAT.</span>
            </h1>
            <p className="mt-6 text-xl text-slate-400 leading-relaxed max-w-xl">
              Yayasan Ruang Sejahtera adalah jembatan transparan antara niat baik Anda dan masyarakat yang membutuhkan.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/program" className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-3.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg">
                Lihat Program
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/donasi" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 text-lg">
                Donasi Sekarang
              </Link>
            </div>
          </div>
          
        </div>
      </section>

      {/* Impact Strip */}
      <section className="bg-teal-800 py-8 text-white relative z-20 -mt-10 mx-4 sm:mx-6 lg:mx-auto max-w-7xl rounded-2xl shadow-xl">
        {hasRealData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8 text-center divide-x divide-teal-700/50">
            <div>
              <div className="text-3xl font-bold mb-1">{activePrograms.length}</div>
              <div className="text-teal-200 text-sm">Program Sosial</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">Rp {((Number(financialStats?.totalOut || 0)) / 1000000).toFixed(1)}Jt+</div>
              <div className="text-teal-200 text-sm">Tersalurkan</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">Rp {((Number(financialStats?.totalIn || 0)) / 1000000).toFixed(1)}Jt+</div>
              <div className="text-teal-200 text-sm">Total Donasi</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-teal-200 text-sm">Transparan</div>
            </div>
          </div>
        ) : (
          <div className="px-8 text-center py-2">
            <p className="text-teal-100 font-medium">Data dampak akan diperbarui setelah laporan kegiatan pertama terverifikasi.</p>
          </div>
        )}
      </section>

      {/* Program Section (Lighter Design) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Program Utama Kami</h2>
            <p className="mt-4 text-slate-600">Salurkan donasi Anda melalui program-program yang tepat sasaran dan terverifikasi.</p>
          </div>
          
          {activePrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePrograms.map((program: any) => {
                const IconComponent = iconMap[program.icon] || HeartHandshake;
                return (
                  <Link href={`/donasi?program=${program.id}`} key={program.id} className="group flex items-start gap-5 p-6 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">{program.name}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                        {program.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <HeartHandshake className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Program utama sedang dalam tahap penyusunan oleh pengurus yayasan.</p>
            </div>
          )}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Cara Bantuan Bekerja</h2>
            <p className="mt-4 text-slate-600">Dari niat baik hingga menjadi manfaat nyata yang terukur.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-slate-200 z-0"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-sm text-teal-600 mb-6">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">1. Pengajuan</h3>
              <p className="text-sm text-slate-500">Menerima informasi dan pengajuan dari masyarakat sekitar.</p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-sm text-teal-600 mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">2. Verifikasi</h3>
              <p className="text-sm text-slate-500">Tim relawan memverifikasi kondisi lapangan secara langsung.</p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-sm text-amber-500 mb-6">
                <HeartHandshake className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">3. Penyaluran</h3>
              <p className="text-sm text-slate-500">Dana donasi disalurkan tepat kepada penerima manfaat.</p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-sm text-teal-600 mb-6">
                <Activity className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">4. Laporan</h3>
              <p className="text-sm text-slate-500">Seluruh kegiatan dan arus kas dipublikasikan secara real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Transparansi Adalah Janji Kami</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Kami percaya bahwa setiap rupiah yang didonasikan adalah amanah. Laporan keuangan dan penyaluran dana kami publikasikan secara real-time dan dapat diakses oleh siapa saja.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-teal-400" /> Pencatatan dana masuk & keluar real-time
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-teal-400" /> Transaksi terkait langsung dengan program
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-teal-400" /> Publikasi terbuka untuk masyarakat umum
                </li>
              </ul>
              <Link href="/transparansi" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition-colors border border-white/10">
                Buka Laporan Keuangan
              </Link>
            </div>
            
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
              <div className="space-y-6">
                <div>
                  <div className="text-slate-400 text-sm font-medium mb-1">Total Penerimaan Dana</div>
                  <div className="text-3xl font-bold text-emerald-400">{formatCurrency(Number(financialStats?.totalIn || 0))}</div>
                </div>
                <div className="h-px bg-slate-700"></div>
                <div>
                  <div className="text-slate-400 text-sm font-medium mb-1">Total Penyaluran Program</div>
                  <div className="text-3xl font-bold text-amber-400">{formatCurrency(Number(financialStats?.totalOut || 0))}</div>
                </div>
                <div className="h-px bg-slate-700"></div>
                <div>
                  <div className="text-slate-400 text-sm font-medium mb-1">Saldo Tersedia</div>
                  <div className="text-3xl font-bold text-white">{formatCurrency(saldo)}</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

    </div>
  );
}
