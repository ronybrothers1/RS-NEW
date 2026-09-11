// Rendered on-demand instead of prerendered at build time: this page
// queries the database, which is not reachable from the build machine.
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { HeartHandshake, ArrowRight, Activity, Users, FileText, CheckCircle2, BookOpen, Stethoscope, Leaf } from "lucide-react";
import { db } from "@/src/db";
import { financialTransactions, programs, articles } from "@/src/db/schema";
import { sql, eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { getFinanceOpeningBalance } from "@/lib/finance-opening-balance";

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
  const openingBalance =
    await getFinanceOpeningBalance();

  const [financialStats] = await db.select({
    totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'IN' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
    totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'OUT' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
  }).from(financialTransactions).where(sql`${financialTransactions.deletedAt} IS NULL`);

  const saldo =
    openingBalance.amount +
    Number(financialStats?.totalIn || 0) -
    Number(financialStats?.totalOut || 0);

  const activePrograms = await db
    .select()
    .from(programs)
    .where(eq(programs.status, 'ACTIVE'))
    .orderBy(programs.createdAt)
    .limit(6);
    
  let latestArticle: {
    title: string;
    slug: string;
    excerpt: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  } | undefined;

  try {
    [latestArticle] = await db
      .select({
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        imageUrl: articles.imageUrl,
        imageAlt: articles.imageAlt,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .where(eq(articles.status, "PUBLISHED"))
      .orderBy(
        sql`${articles.publishedAt} DESC NULLS LAST, ${articles.createdAt} DESC`,
      )
      .limit(1);
  } catch (error) {
    console.error(
      "home: failed to fetch latest published article",
      error,
    );
  }

  const latestArticleDate = latestArticle
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(
        latestArticle.publishedAt ?? latestArticle.createdAt,
      )
    : null;

  const hasRealData = Number(financialStats?.totalIn) > 0 || activePrograms.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-12 sm:pt-14 md:pb-28 md:pt-16 lg:pb-32 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950"></div>
        <div className="absolute -right-24 top-20 hidden h-80 w-80 rounded-full bg-teal-500/10 blur-3xl lg:block"></div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:gap-14 lg:px-8">
          <div className="w-full max-w-2xl">
            <h1 className="text-[clamp(2.75rem,11vw,4rem)] font-extrabold leading-[1.05] tracking-tight text-white lg:text-[clamp(3.75rem,5vw,4.75rem)]">
              KEPEDULIAN PERLU SAMPAI
              <span className="mt-1 block text-teal-400">
                KE TEMPAT YANG TEPAT.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              Yayasan Ruang Sejahtera adalah jembatan transparan antara niat baik Anda dan masyarakat yang membutuhkan.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                href="/program"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-teal-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-teal-500 hover:shadow-lg sm:text-lg"
              >
                Lihat Program
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/donasi"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-8 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 sm:text-lg"
              >
                Donasi Sekarang
              </Link>
            </div>

            {/* Latest news — compact mobile/tablet presentation */}
            {latestArticle ? (
              <Link
                href={`/berita/${latestArticle.slug}`}
                aria-label={`Baca berita terbaru: ${latestArticle.title}`}
                className="group mt-8 block overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-xl ring-1 ring-white/5 transition hover:border-teal-400/20 sm:grid sm:grid-cols-[168px_minmax(0,1fr)] lg:hidden"
              >
                <div
                  className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800 bg-cover bg-center sm:aspect-auto sm:min-h-[160px]"
                  style={
                    latestArticle.imageUrl
                      ? {
                          backgroundImage: `url("${latestArticle.imageUrl}")`,
                        }
                      : undefined
                  }
                >
                  {!latestArticle.imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950">
                      <FileText className="h-9 w-9 text-teal-300/70 sm:h-11 sm:w-11" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950/20"></div>
                </div>

                <div className="min-w-0 p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-300 sm:text-[11px]">
                    Berita Terbaru
                  </p>

                  {latestArticleDate && (
                    <p className="mt-1 text-[10px] font-medium text-slate-500 sm:text-xs">
                      {latestArticleDate}
                    </p>
                  )}

                  <h2 className="mt-2 line-clamp-3 text-base font-bold leading-snug text-white transition-colors group-hover:text-teal-300 sm:text-lg">
                    {latestArticle.title}
                  </h2>

                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 group-hover:text-teal-200 sm:text-sm">
                    Baca
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/berita"
                className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl ring-1 ring-white/5 lg:hidden"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-300">
                    Kabar Ruang Sejahtera
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white">
                    Berita terbaru akan tampil setelah dipublikasikan.
                  </p>
                </div>
              </Link>
            )}
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-5 rounded-[2.25rem] bg-teal-500/10 blur-2xl"></div>

            {latestArticle ? (
              <Link
                href={`/berita/${latestArticle.slug}`}
                aria-label={`Baca berita terbaru: ${latestArticle.title}`}
                className="group relative block overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/30 ring-1 ring-white/5"
              >
                <div
                  className="relative aspect-[16/11] overflow-hidden bg-slate-800 bg-cover bg-center"
                  style={
                    latestArticle.imageUrl
                      ? {
                          backgroundImage: `url("${latestArticle.imageUrl}")`,
                        }
                      : undefined
                  }
                >
                  {!latestArticle.imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950">
                      <FileText className="h-16 w-16 text-teal-300/70" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent"></div>

                  <div className="absolute left-5 top-5 inline-flex items-center rounded-full border border-white/15 bg-slate-950/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-200 backdrop-blur-md">
                    Berita Terbaru
                  </div>
                </div>

                <div className="relative p-6 xl:p-7">
                  {latestArticleDate && (
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {latestArticleDate}
                    </p>
                  )}

                  <h2 className="mt-3 line-clamp-3 text-2xl font-bold leading-snug text-white transition-colors group-hover:text-teal-300">
                    {latestArticle.title}
                  </h2>

                  {latestArticle.excerpt && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                      {latestArticle.excerpt}
                    </p>
                  )}

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-300 transition-colors group-hover:text-teal-200">
                    Baca Selengkapnya
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl ring-1 ring-white/5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300">
                  <FileText className="h-7 w-7" />
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-teal-300">
                  Kabar Ruang Sejahtera
                </p>

                <h2 className="mt-3 text-2xl font-bold leading-snug text-white">
                  Berita terbaru akan tampil di sini setelah dipublikasikan.
                </h2>

                <Link
                  href="/berita"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200"
                >
                  Lihat Semua Berita
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
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
              <div className="text-3xl font-bold mb-1">Rp {((Number(financialStats?.totalOut || 0)) / 1000000).toFixed(1)} Jt</div>
              <div className="text-teal-200 text-sm">Total Pengeluaran</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">Rp {((Number(financialStats?.totalIn || 0)) / 1000000).toFixed(1)} Jt</div>
              <div className="text-teal-200 text-sm">Total Penerimaan</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">Terbuka</div>
              <div className="text-teal-200 text-sm">Laporan Keuangan</div>
            </div>
          </div>
        ) : (
          <div className="px-8 text-center py-2">
            <p className="text-teal-100 font-medium">Data dampak akan diperbarui setelah laporan kegiatan pertama terverifikasi.</p>
          </div>
        )}
      </section>

      {/* Program Section (Lighter Design) */}
      <section className="py-12 sm:py-16 md:py-[72px] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-10 md:mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Program Utama Kami</h2>
            <p className="mt-4 text-slate-600">Salurkan donasi Anda melalui program-program yang tepat sasaran dan terverifikasi.</p>
          </div>
          
          {activePrograms.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activePrograms.map((program: any) => {
                const IconComponent = iconMap[program.icon] || HeartHandshake;
                return (
                  <Link href={`/donasi?program=${program.id}`} key={program.id} className="group flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors sm:gap-5 sm:p-6">
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
      <section className="py-16 md:py-[72px] bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
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
      <section className="py-16 md:py-[72px] bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Transparansi Adalah Janji Kami</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Kami percaya bahwa setiap rupiah yang dipercayakan kepada yayasan adalah amanah. Laporan penerimaan, pengeluaran, dan saldo kas disajikan dari transaksi yang tercatat di sistem dan dapat diakses oleh masyarakat.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-teal-400" /> Penerimaan dan pengeluaran tercatat pada ledger keuangan
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-teal-400" /> Transaksi terhubung ke program atau kampanye bila relevan
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-teal-400" /> Riwayat transaksi terbaru dapat dilihat oleh masyarakat
                </li>
              </ul>
              <Link href="/transparansi" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition-colors border border-white/10">
                Buka Laporan Keuangan
              </Link>
            </div>
            
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
              <div className="space-y-6">
                <div>
                  <div className="text-slate-400 text-sm font-medium mb-1">Total Penerimaan</div>
                  <div className="text-3xl font-bold text-emerald-400">{formatCurrency(Number(financialStats?.totalIn || 0))}</div>
                </div>
                <div className="h-px bg-slate-700"></div>
                <div>
                  <div className="text-slate-400 text-sm font-medium mb-1">Total Pengeluaran</div>
                  <div className="text-3xl font-bold text-amber-400">{formatCurrency(Number(financialStats?.totalOut || 0))}</div>
                </div>
                <div className="h-px bg-slate-700"></div>
                <div>
                  <div className="text-slate-400 text-sm font-medium mb-1">Saldo Kas Saat Ini</div>
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
