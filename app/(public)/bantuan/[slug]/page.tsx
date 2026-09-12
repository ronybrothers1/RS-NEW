import {
  CheckCircle2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  and,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import {
  notFound,
} from "next/navigation";

import {
  formatRupiah,
} from "@/lib/assistance";
import { createPageMetadata, createSeoDescription } from "@/lib/seo-metadata";
import {
  db,
} from "@/src/db";
import {
  campaigns,
  financialTransactions,
  programs,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const getPublicCampaign = cache(async (slug: string) => {
  const [campaign] = await db
    .select({
      id: campaigns.id,
      programId: campaigns.programId,
      slug: campaigns.slug,
      title: campaigns.title,
      summary: campaigns.summary,
      story: campaigns.story,
      beneficiaryDisplayName: campaigns.beneficiaryDisplayName,
      publicLocation: campaigns.publicLocation,
      targetAmount: campaigns.targetAmount,
      coverPhotoId: campaigns.coverPhotoId,
      status: campaigns.status,
      programName: programs.name,
    })
    .from(campaigns)
    .innerJoin(
      programs,
      eq(campaigns.programId, programs.id),
    )
    .where(
      and(
        eq(campaigns.slug, slug),
        inArray(campaigns.status, ["ACTIVE", "COMPLETED"]),
      ),
    )
    .limit(1);

  return campaign;
});

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const campaign = await getPublicCampaign(slug);

  if (!campaign) {
    return {
      title: "Kampanye Tidak Ditemukan",
      alternates: {
        canonical: `/bantuan/${slug}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = createSeoDescription(
    [campaign.summary, campaign.story],
    "Kampanye bantuan terverifikasi Yayasan Ruang Sejahtera di Kabupaten Sampang.",
  );

  return createPageMetadata({
    title: campaign.title,
    description,
    path: `/bantuan/${slug}`,
    image: campaign.coverPhotoId
      ? `/api/bantuan/${campaign.slug}/cover`
      : undefined,
    imageAlt: `Foto kampanye ${campaign.title}`,
  });
}

export default async function CampaignDetailPage({
  params,
}: Props) {
  const {
    slug,
  } = await params;

  const campaign = await getPublicCampaign(slug);

  if (!campaign) {
    notFound();
  }

  const ledgerRows =
    await db
      .select({
        type:
          financialTransactions.type,
        amount:
          financialTransactions.amount,
      })
      .from(
        financialTransactions,
      )
      .where(
        and(
          eq(
            financialTransactions.campaignId,
            campaign.id,
          ),
          isNull(
            financialTransactions.deletedAt,
          ),
        ),
      );

  let collected = 0;
  let spent = 0;

  for (const row of ledgerRows) {
    const amount =
      Number(row.amount);

    if (
      !Number.isFinite(amount)
    ) {
      continue;
    }

    if (row.type === "IN") {
      collected += amount;
    } else {
      spent += amount;
    }
  }

  const available =
    collected - spent;

  const target =
    Number(
      campaign.targetAmount,
    );

  const progress =
    target > 0
      ? Math.min(
          100,
          Math.round(
            (
              collected /
              target
            ) *
              100,
          ),
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/bantuan"
          className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          ← Semua Kampanye
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {campaign.coverPhotoId && (
              <div className="aspect-[16/9] bg-slate-100">
                <img
                  src={`/api/bantuan/${campaign.slug}/cover`}
                  alt={`Foto kampanye ${campaign.title}`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  {
                    campaign.programName
                  }
                </span>
                {campaign.status ===
                  "COMPLETED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Selesai
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                {
                  campaign.title
                }
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600">
                {
                  campaign.summary
                }
              </p>

              <div className="mt-6 flex flex-wrap gap-4 border-y border-slate-100 py-5 text-sm text-slate-600">
                {campaign.beneficiaryDisplayName && (
                  <span className="inline-flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-teal-700" />
                    {
                      campaign.beneficiaryDisplayName
                    }
                  </span>
                )}
                {campaign.publicLocation && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-teal-700" />
                    {
                      campaign.publicLocation
                    }
                  </span>
                )}
              </div>

              <div className="mt-7">
                <h2 className="text-xl font-bold text-slate-950">
                  Cerita dan Kebutuhan
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-base">
                  {
                    campaign.story
                  }
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                  <p className="text-sm leading-6 text-blue-900">
                    Kampanye ini berasal dari pengajuan yang telah diverifikasi pengurus Ruang Sejahtera. Informasi internal seperti nomor WhatsApp dan alamat lengkap tidak ditampilkan pada halaman publik.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Dana Terkumpul
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatRupiah(
                collected,
              )}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              dari target{" "}
              {formatRupiah(
                target,
              )}
            </p>

            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Target className="h-4 w-4" />
                Progres
              </span>
              <span className="font-semibold text-slate-700">
                {progress}%
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Terpakai
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatRupiah(
                    spent,
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Tersedia
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatRupiah(
                    available,
                  )}
                </p>
              </div>
            </div>

            {campaign.status ===
            "ACTIVE" ? (
              <Link
                href={`/donasi?program=${campaign.programId}&campaign=${campaign.id}`}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-base font-bold text-white transition hover:bg-amber-500"
              >
                Donasi untuk Kampanye Ini
              </Link>
            ) : (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-sm font-semibold text-blue-800">
                Kampanye telah selesai menerima donasi.
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Progres dihitung dari dana masuk kampanye dan tidak berkurang ketika dana digunakan. Saldo tersedia adalah dana masuk dikurangi pengeluaran tercatat.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
