import {
  ArrowRight,
  HeartHandshake,
  MapPin,
  Target,
} from "lucide-react";
import Link from "next/link";

import {
  getCachedPublicAssistanceIndex,
} from "@/lib/public-assistance";
import { formatRupiah } from "@/lib/assistance";

const HIGHLIGHT_LIMIT = 3;

export default async function HomeCampaignHighlight() {
  const { rows, totals } =
    await getCachedPublicAssistanceIndex();

  const activeCampaigns = rows
    .filter(
      (campaign) => campaign.status === "ACTIVE",
    )
    .slice(0, HIGHLIGHT_LIMIT);

  if (activeCampaigns.length === 0) {
    return null;
  }

  return (
    <section className="bg-canvas pt-14 pb-0 sm:pt-16 sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Kampanye Bantuan Aktif
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Setiap kampanye telah diverifikasi pengurus. Salurkan bantuan Anda melalui kampanye yang tepat sasaran.
            </p>
          </div>
          <Link
            href="/bantuan"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-800 hover:text-brand-950"
          >
            Lihat Semua Kampanye{" "}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeCampaigns.map((campaign) => {
            const total =
              totals.get(campaign.id) || {
                collected: 0,
                spent: 0,
              };

            const target = Number(
              campaign.targetAmount,
            );

            const progress =
              target > 0
                ? Math.min(
                    100,
                    Math.round(
                      (total.collected / target) *
                        100,
                    ),
                  )
                : 0;

            return (
              <Link
                key={campaign.id}
                href={`/bantuan/${campaign.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-frame bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-brand-200 hover:shadow-md focus-visible:border-brand-200"
              >
                <div className="aspect-[16/10] bg-slate-100">
                  {campaign.coverPhotoId ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- campaign cover preserves direct API response and cache semantics */
                    <img
                      src={`/api/bantuan/${campaign.slug}/cover`}
                      alt={`Foto kampanye ${campaign.title}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <HeartHandshake className="h-12 w-12" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                      {campaign.programName}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-slate-950 transition-colors group-hover:text-brand-800">
                    {campaign.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {campaign.summary}
                  </p>

                  {campaign.publicLocation && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {campaign.publicLocation}
                    </div>
                  )}

                  <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="font-semibold text-slate-700">
                        {formatRupiah(
                          total.collected,
                        )}{" "}
                        terkumpul
                      </span>
                      <span className="text-slate-500">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {formatRupiah(target)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}