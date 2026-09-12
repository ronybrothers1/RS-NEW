// Rendered on-demand instead of prerendered at build time: this page
// queries the database, which is not reachable from the build machine.
export const dynamic = 'force-dynamic';

import Image from "next/image";
import Link from "next/link";
import {
  HeartHandshake,
  ArrowRight,
  Activity,
  Users,
  FileText,
  CheckCircle2,
  BookOpen,
  Stethoscope,
  Leaf,
  WalletCards,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/src/db";
import { financialTransactions, programs, articles } from "@/src/db/schema";
import { sql, eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { getFinanceOpeningBalance } from "@/lib/finance-opening-balance";
import { createPageMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo-metadata";

export const metadata = createPageMetadata({
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

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
  const impactItems = [
    { label: "Program Sosial", value: activePrograms.length, icon: Users },
    {
      label: "Total Pengeluaran",
      value: `Rp ${(Number(financialStats?.totalOut || 0) / 1000000).toFixed(1)} Jt`,
      icon: WalletCards,
    },
    {
      label: "Total Penerimaan",
      value: `Rp ${(Number(financialStats?.totalIn || 0) / 1000000).toFixed(1)} Jt`,
      icon: BarChart3,
    },
    { label: "Laporan Keuangan", value: "Terbuka", icon: FileText },
  ];
  const workflow = [
    { title: "Pengajuan", description: "Menerima informasi dan pengajuan dari masyarakat sekitar.", icon: FileText },
    { title: "Verifikasi", description: "Tim relawan memverifikasi kondisi lapangan secara langsung.", icon: CheckCircle2 },
    { title: "Penyaluran", description: "Dana donasi disalurkan tepat kepada penerima manfaat.", icon: HeartHandshake },
    { title: "Laporan", description: "Seluruh kegiatan dan arus kas dipublikasikan secara real-time.", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        {latestArticle?.imageUrl && (
          <Image
            src={latestArticle.imageUrl}
            alt=""
            fill
            priority
            fetchPriority="high"
            quality={60}
            sizes="100vw"
            className="-z-20 object-cover object-center lg:object-[70%_center]"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,44,34,0.98)_0%,rgba(2,44,34,0.94)_42%,rgba(2,44,34,0.58)_72%,rgba(2,44,34,0.5)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,44,34,0.92)_0%,transparent_48%)] lg:bg-[linear-gradient(0deg,rgba(2,44,34,0.72)_0%,transparent_45%)]" />
        <Image
          src="/images/decor/hero-leaves.webp"
          alt=""
          width={2152}
          height={731}
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-auto w-full select-none opacity-70 sm:opacity-80"
        />

        <div className="relative z-10 mx-auto grid min-h-[590px] max-w-7xl items-center gap-8 px-4 pb-24 pt-10 sm:min-h-[620px] sm:px-6 sm:pb-28 lg:min-h-[560px] lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:px-8 lg:pb-24 lg:pt-12">
          <div className="max-w-[660px] self-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-50 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-citrus-300" />
              Yayasan sosial transparan
            </span>
            <h1 className="mt-5 text-[clamp(2.65rem,12vw,4.25rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-white lg:text-[clamp(3.55rem,4.8vw,4.45rem)]">
              KEPEDULIAN
              <span className="block">PERLU SAMPAI</span>
              <span className="mt-1 block text-citrus-300">KE TEMPAT YANG TEPAT.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-50 sm:text-lg">
              Yayasan Ruang Sejahtera adalah jembatan transparan antara niat baik Anda dan masyarakat yang membutuhkan.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <Link href="/program" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/35 bg-brand-950/25 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:text-base">
                Lihat Program <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/donasi" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-citrus-400 px-7 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-brand-950/20 transition hover:-translate-y-0.5 hover:bg-citrus-300 sm:text-base">
                <HeartHandshake className="h-4 w-4" /> Donasi Sekarang
              </Link>
            </div>
          </div>

          <div className="flex self-end justify-end pb-2 lg:pb-0">
            {latestArticle ? (
              <Link href={`/berita/${latestArticle.slug}`} aria-label={`Baca berita terbaru: ${latestArticle.title}`} className="group w-full max-w-[500px] rounded-2xl border border-white/15 bg-brand-950/75 p-5 shadow-2xl shadow-black/25 backdrop-blur-md transition hover:border-citrus-300/50 sm:p-6 lg:max-w-[470px]">
                <span className="inline-flex rounded-full bg-brand-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-white">Berita Terbaru</span>
                {latestArticleDate && <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-200">{latestArticleDate}</p>}
                <h2 className="mt-2 line-clamp-3 text-lg font-bold leading-snug text-white transition-colors group-hover:text-citrus-300 sm:text-xl lg:text-2xl">{latestArticle.title}</h2>
                {latestArticle.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-100">{latestArticle.excerpt}</p>}
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-citrus-300">Baca Selengkapnya <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ) : (
              <div className="w-full max-w-[470px] rounded-2xl border border-white/15 bg-brand-950/75 p-6 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-brand-200">Kabar Ruang Sejahtera</p>
                <p className="mt-3 text-xl font-bold">Berita terbaru akan tampil setelah dipublikasikan.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-4 -mt-14 max-w-7xl overflow-hidden rounded-2xl border border-frame bg-white shadow-xl sm:mx-6 lg:mx-auto">
        {hasRealData ? (
          <div className="grid grid-cols-2 md:grid-cols-4">
            {impactItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex items-center gap-3 px-4 py-5 sm:px-6 ${index % 2 ? "border-l border-frame" : ""} ${index > 1 ? "border-t border-frame md:border-t-0" : ""} ${index > 0 ? "md:border-l md:border-frame" : ""}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-extrabold tracking-tight text-slate-950 sm:text-xl">{item.value}</div>
                    <div className="mt-0.5 text-[11px] leading-tight text-ink-muted sm:text-xs">{item.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-8 py-6 text-center"><p className="font-medium text-brand-800">Data dampak akan diperbarui setelah laporan kegiatan pertama terverifikasi.</p></div>
        )}
      </section>

      <section className="bg-canvas py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Program Utama Kami</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Salurkan donasi Anda melalui program-program yang tepat sasaran dan terverifikasi.</p>
            </div>
            <Link href="/program" className="inline-flex items-center gap-2 text-sm font-bold text-brand-800 hover:text-brand-950">Lihat Semua Program <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {activePrograms.length > 0 ? (
            <div className="grid gap-x-6 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
              {activePrograms.map((program: any) => {
                const IconComponent = iconMap[program.icon] || HeartHandshake;
                return (
                  <Link href={`/donasi?program=${program.id}`} key={program.id} className="group flex min-h-[112px] items-start gap-4 rounded-2xl border border-transparent p-4 transition hover:border-brand-100 hover:bg-white hover:shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition group-hover:bg-brand-700 group-hover:text-white"><IconComponent className="h-6 w-6" /></div>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="text-base font-bold text-slate-950 transition group-hover:text-brand-800">{program.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{program.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-frame bg-white py-10 text-center text-slate-500"><HeartHandshake className="mx-auto mb-3 h-10 w-10 text-brand-200" /><p>Program utama sedang dalam tahap penyusunan oleh pengurus yayasan.</p></div>
          )}
        </div>
      </section>

      <section className="border-y border-frame bg-surface-muted py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Cara Bantuan Bekerja</h2>
            <p className="mt-2 text-sm text-slate-600">Dari niat baik hingga menjadi manfaat nyata yang terukur.</p>
          </div>
          <div className="relative grid gap-7 md:grid-cols-4 md:gap-5">
            <div className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-brand-200 md:block" />
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative z-10 grid grid-cols-[48px_minmax(0,1fr)] items-start gap-4 md:block md:text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-surface-muted bg-white text-brand-700 shadow-sm md:mx-auto"><Icon className="h-5 w-5" /></div>
                  <div className="md:mt-4">
                    <h3 className="text-sm font-extrabold text-slate-950">{index + 1}. {step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-brand-950 py-14 text-white sm:py-16">
        <Image
          src="/images/decor/transparency-leaves.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover object-right-bottom opacity-75"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,44,34,0.99)_0%,rgba(2,44,34,0.94)_48%,rgba(2,44,34,0.56)_100%)]" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-9 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Transparansi Adalah Janji Kami</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-100 sm:text-base">Kami percaya bahwa setiap rupiah yang dipercayakan kepada yayasan adalah amanah. Laporan penerimaan, pengeluaran, dan saldo kas dapat diakses oleh masyarakat.</p>
            <ul className="mt-5 space-y-2.5 text-sm text-brand-50">
              <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-citrus-300" /> Penerimaan dan pengeluaran tercatat pada ledger keuangan</li>
              <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-citrus-300" /> Transaksi terhubung ke program atau kampanye bila relevan</li>
              <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-citrus-300" /> Riwayat transaksi terbaru dapat dilihat oleh masyarakat</li>
            </ul>
            <Link href="/transparansi" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-citrus-400 px-5 py-2.5 text-sm font-bold text-brand-950 transition hover:bg-citrus-300">Buka Laporan Keuangan <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-brand-900/65 p-3 shadow-2xl backdrop-blur-md sm:p-4">
            <div className="grid gap-2.5">
              {[
                { label: "Total Penerimaan", value: formatCurrency(Number(financialStats?.totalIn || 0)), icon: WalletCards, color: "text-emerald-300" },
                { label: "Total Pengeluaran", value: formatCurrency(Number(financialStats?.totalOut || 0)), icon: BarChart3, color: "text-citrus-300" },
                { label: "Saldo Kas Saat Ini", value: formatCurrency(saldo), icon: FileText, color: "text-white" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700/80 text-brand-50"><Icon className="h-5 w-5" /></div>
                    <div><div className="text-xs font-medium text-brand-200">{item.label}</div><div className={`mt-0.5 text-xl font-extrabold tracking-tight sm:text-2xl ${item.color}`}>{item.value}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
