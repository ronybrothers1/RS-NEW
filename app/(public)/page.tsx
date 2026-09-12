// Rendered on-demand instead of prerendered at build time: this page
// queries the database, which is not reachable from the build machine.
export const dynamic = 'force-dynamic';

import Image from "next/image";
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
    <div className="min-h-screen bg-canvas text-ink">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-950 pb-24 pt-12 sm:pt-14 md:pb-28 md:pt-16 lg:pb-32 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-700/45 via-brand-950 to-brand-950"></div>
        <div className="absolute -right-24 top-20 hidden h-80 w-80 rounded-full bg-brand-400/10 blur-3xl lg:block"></div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:gap-14 lg:px-8">
          <div className="w-full max-w-2xl">
            <h1 className="text-[clamp(2.75rem,11vw,4rem)] font-extrabold leading-[1.05] tracking-tight text-white lg:text-[clamp(3.75rem,5vw,4.75rem)]">
              KEPEDULIAN PERLU SAMPAI
              <span className="mt-1 block text-citrus-300">
                KE TEMPAT YANG TEPAT.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100 sm:text-xl">
              Yayasan Ruang Sejahtera adalah jembatan transparan antara niat baik Anda dan masyarakat yang membutuhkan.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                href="/program"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-citrus-400 px-8 py-3.5 text-base font-semibold text-brand-950 shadow-md transition-all hover:-translate-y-0.5 hover:bg-citrus-300 hover:shadow-lg sm:text-lg"
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

          </div>

          <div className="relative">
            <div className="absolute -inset-5 hidden rounded-[2.25rem] bg-brand-400/10 blur-2xl lg:block"></div>

            {latestArticle ? (
              <Link
                href={`/berita/${latestArticle.slug}`}
                aria-label={`Baca berita terbaru: ${latestArticle.title}`}
                className="group relative block overflow-hidden rounded-2xl border border-white/15 bg-brand-900/90 shadow-xl ring-1 ring-white/5 transition hover:border-brand-300/40 sm:grid sm:grid-cols-[168px_minmax(0,1fr)] lg:block lg:rounded-[2rem] lg:shadow-2xl lg:shadow-black/30"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-900 sm:aspect-auto sm:min-h-[160px] lg:aspect-[16/11] lg:min-h-0">
                  {latestArticle.imageUrl ? (
                    <Image
                      src={latestArticle.imageUrl}
                      alt={latestArticle.imageAlt?.trim() || latestArticle.title}
                      fill
                      priority
                      fetchPriority="high"
                      quality={65}
                      sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 168px, (max-width: 1279px) 42vw, 560px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-950 to-brand-950">
                      <FileText className="h-9 w-9 text-brand-200/70 sm:h-11 sm:w-11 lg:h-16 lg:w-16" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-brand-950/20 lg:hidden"></div>
                  <div className="absolute inset-0 hidden bg-gradient-to-t from-brand-950 via-brand-950/10 to-transparent lg:block"></div>

                  <div className="absolute left-5 top-5 hidden items-center rounded-full border border-white/15 bg-brand-950/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-100 backdrop-blur-md lg:inline-flex">
                    Berita Terbaru
                  </div>
                </div>

                <div className="relative min-w-0 p-4 sm:p-5 lg:p-6 xl:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-200 sm:text-[11px] lg:hidden">
                    Berita Terbaru
                  </p>

                  {latestArticleDate && (
                    <p className="mt-1 text-[10px] font-medium text-brand-100 sm:text-xs lg:mt-0 lg:font-semibold lg:uppercase lg:tracking-[0.12em] lg:text-brand-200">
                      {latestArticleDate}
                    </p>
                  )}

                  <h2 className="mt-2 line-clamp-3 text-base font-bold leading-snug text-white transition-colors group-hover:text-citrus-300 sm:text-lg lg:mt-3 lg:text-2xl">
                    {latestArticle.title}
                  </h2>

                  {latestArticle.excerpt && (
                    <p className="mt-3 hidden text-sm leading-6 text-brand-200 lg:line-clamp-2">
                      {latestArticle.excerpt}
                    </p>
                  )}

                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-citrus-300 transition-colors group-hover:text-citrus-100 sm:text-sm lg:mt-5 lg:gap-2">
                    <span className="lg:hidden">Baca</span>
                    <span className="hidden lg:inline">Baca Selengkapnya</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/15 bg-brand-900/80 p-4 shadow-xl ring-1 ring-white/5 lg:block lg:rounded-[2rem] lg:p-8 lg:shadow-2xl">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-400/15 text-brand-200 lg:h-14 lg:w-14 lg:rounded-2xl">
                  <FileText className="h-6 w-6 lg:h-7 lg:w-7" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-200 lg:mt-6 lg:text-xs lg:tracking-[0.14em]">
                    Kabar Ruang Sejahtera
                  </p>

                  <h2 className="mt-1 text-sm font-semibold leading-5 text-white lg:mt-3 lg:text-2xl lg:font-bold lg:leading-snug">
                    Berita terbaru akan tampil setelah dipublikasikan.
                  </h2>

                  <Link
                    href="/berita"
                    className="mt-6 hidden items-center gap-2 text-sm font-semibold text-citrus-300 hover:text-citrus-100 lg:inline-flex"
                  >
                    Lihat Semua Berita
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Impact Strip */}
      <section className="relative z-20 mx-4 -mt-10 max-w-7xl rounded-2xl border border-frame bg-white py-8 text-ink shadow-xl sm:mx-6 lg:mx-auto">
        {hasRealData ? (
          <div className="grid grid-cols-2 gap-8 divide-x divide-frame px-8 text-center md:grid-cols-4">
            <div>
              <div className="text-3xl font-bold mb-1">{activePrograms.length}</div>
              <div className="text-sm text-ink-muted">Program Sosial</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">Rp {((Number(financialStats?.totalOut || 0)) / 1000000).toFixed(1)} Jt</div>
              <div className="text-sm text-ink-muted">Total Pengeluaran</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">Rp {((Number(financialStats?.totalIn || 0)) / 1000000).toFixed(1)} Jt</div>
              <div className="text-sm text-ink-muted">Total Penerimaan</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">Terbuka</div>
              <div className="text-sm text-ink-muted">Laporan Keuangan</div>
            </div>
          </div>
        ) : (
          <div className="px-8 text-center py-2">
            <p className="font-medium text-brand-800">Data dampak akan diperbarui setelah laporan kegiatan pertama terverifikasi.</p>
          </div>
        )}
      </section>

      {/* Program Section (Lighter Design) */}
      <section className="bg-canvas py-12 sm:py-16 md:py-[72px]">
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
                  <Link href={`/donasi?program=${program.id}`} key={program.id} className="group flex items-start gap-4 rounded-2xl p-3 transition-colors hover:bg-brand-50 sm:gap-5 sm:p-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 shadow-sm transition-colors group-hover:bg-brand-700 group-hover:text-white">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-brand-800">{program.name}</h3>
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
      <section className="bg-brand-50/60 pb-10 pt-16 sm:py-16 md:py-[72px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Cara Bantuan Bekerja</h2>
            <p className="mt-4 text-slate-600">Dari niat baik hingga menjadi manfaat nyata yang terukur.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-slate-200 z-0"></div>
            
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-brand-50 bg-white text-brand-700 shadow-sm">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">1. Pengajuan</h3>
              <p className="text-sm text-slate-500">Menerima informasi dan pengajuan dari masyarakat sekitar.</p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-brand-50 bg-white text-brand-700 shadow-sm">
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
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-brand-50 bg-white text-brand-700 shadow-sm">
                <Activity className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">4. Laporan</h3>
              <p className="text-sm text-slate-500">Seluruh kegiatan dan arus kas dipublikasikan secara real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="relative overflow-hidden bg-brand-900 py-16 text-white md:py-[72px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Transparansi Adalah Janji Kami</h2>
              <p className="mb-8 text-lg leading-relaxed text-brand-100">
                Kami percaya bahwa setiap rupiah yang dipercayakan kepada yayasan adalah amanah. Laporan penerimaan, pengeluaran, dan saldo kas disajikan dari transaksi yang tercatat di sistem dan dapat diakses oleh masyarakat.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-brand-100">
                  <CheckCircle2 className="h-6 w-6 text-citrus-300" /> Penerimaan dan pengeluaran tercatat pada ledger keuangan
                </li>
                <li className="flex items-center gap-3 text-brand-100">
                  <CheckCircle2 className="h-6 w-6 text-citrus-300" /> Transaksi terhubung ke program atau kampanye bila relevan
                </li>
                <li className="flex items-center gap-3 text-brand-100">
                  <CheckCircle2 className="h-6 w-6 text-citrus-300" /> Riwayat transaksi terbaru dapat dilihat oleh masyarakat
                </li>
              </ul>
              <Link href="/transparansi" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition-colors border border-white/10">
                Buka Laporan Keuangan
              </Link>
            </div>
            
            <div className="rounded-3xl border border-brand-700 bg-brand-800 p-8 shadow-2xl">
              <div className="space-y-6">
                <div>
                  <div className="mb-1 text-sm font-medium text-brand-200">Total Penerimaan</div>
                  <div className="text-3xl font-bold text-emerald-400">{formatCurrency(Number(financialStats?.totalIn || 0))}</div>
                </div>
                <div className="h-px bg-brand-700"></div>
                <div>
                  <div className="mb-1 text-sm font-medium text-brand-200">Total Pengeluaran</div>
                  <div className="text-3xl font-bold text-amber-400">{formatCurrency(Number(financialStats?.totalOut || 0))}</div>
                </div>
                <div className="h-px bg-brand-700"></div>
                <div>
                  <div className="mb-1 text-sm font-medium text-brand-200">Saldo Kas Saat Ini</div>
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
