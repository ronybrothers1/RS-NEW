import {
  HeartHandshake,
  MapPin,
  Target,
} from "lucide-react";
import {
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import Link from "next/link";

import {
  formatRupiah,
} from "@/lib/assistance";
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

export const metadata = {
  title:
    "Bantu Mereka | Ruang Sejahtera",
  description:
    "Kampanye bantuan yang telah melalui proses verifikasi Yayasan Ruang Sejahtera.",
};

export default async function AssistanceCampaignsPage() {
  const [
    rows,
    ledgerRows,
  ] =
    await Promise.all([
      db
        .select({
          id:
            campaigns.id,
          slug:
            campaigns.slug,
          title:
            campaigns.title,
          summary:
            campaigns.summary,
          publicLocation:
            campaigns.publicLocation,
          beneficiaryDisplayName:
            campaigns.beneficiaryDisplayName,
          targetAmount:
            campaigns.targetAmount,
          coverPhotoId:
            campaigns.coverPhotoId,
          status:
            campaigns.status,
          activatedAt:
            campaigns.activatedAt,
          createdAt:
            campaigns.createdAt,
          programName:
            programs.name,
        })
        .from(campaigns)
        .innerJoin(
          programs,
          eq(
            campaigns.programId,
            programs.id,
          ),
        )
        .where(
          inArray(
            campaigns.status,
            [
              "ACTIVE",
              "COMPLETED",
            ],
          ),
        )
        .orderBy(
          desc(
            campaigns.activatedAt,
          ),
          desc(
            campaigns.createdAt,
          ),
        ),

      db
        .select({
          campaignId:
            financialTransactions.campaignId,
          type:
            financialTransactions.type,
          amount:
            financialTransactions.amount,
        })
        .from(
          financialTransactions,
        )
        .where(
          isNull(
            financialTransactions.deletedAt,
          ),
        ),
    ]);

  const totals =
    new Map<
      string,
      {
        collected: number;
        spent: number;
      }
    >();

  for (
    const row of
      ledgerRows
  ) {
    if (!row.campaignId) {
      continue;
    }

    const current =
      totals.get(
        row.campaignId,
      ) || {
        collected: 0,
        spent: 0,
      };

    const amount =
      Number(row.amount);

    if (
      Number.isFinite(amount)
    ) {
      if (row.type === "IN") {
        current.collected +=
          amount;
      } else {
        current.spent +=
          amount;
      }
    }

    totals.set(
      row.campaignId,
      current,
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(13,148,136,0.22),_transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
            Bantu Mereka
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Bantuan yang sudah melewati verifikasi.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Setiap kampanye berasal dari pengajuan yang telah diperiksa pengurus. Progres dihitung dari dana masuk yang sudah tercatat pada keuangan kampanye.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <HeartHandshake className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Belum ada kampanye aktif
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Kampanye akan tampil di sini setelah pengajuan disetujui dan informasi publiknya diaktifkan oleh pengurus.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(
              (campaign) => {
                const total =
                  totals.get(
                    campaign.id,
                  ) || {
                    collected: 0,
                    spent: 0,
                  };

                const collected =
                  total.collected;

                const available =
                  total.collected -
                  total.spent;

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
                  <article
                    key={
                      campaign.id
                    }
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[16/10] bg-slate-100">
                      {campaign.coverPhotoId ? (
                        <img
                          src={`/api/bantuan/${campaign.slug}/cover`}
                          alt={`Foto kampanye ${campaign.title}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <HeartHandshake className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                          {
                            campaign.programName
                          }
                        </span>
                        {campaign.status ===
                          "COMPLETED" && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                            Selesai
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 text-xl font-bold leading-snug text-slate-950">
                        {
                          campaign.title
                        }
                      </h2>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {
                          campaign.summary
                        }
                      </p>

                      {campaign.publicLocation && (
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {
                            campaign.publicLocation
                          }
                        </div>
                      )}

                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="font-semibold text-slate-700">
                            {formatRupiah(
                              collected,
                            )} terkumpul
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
                            Target{" "}
                            {formatRupiah(
                              target,
                            )}
                          </span>

                          <span>
                            Tersedia{" "}
                            {formatRupiah(
                              available,
                            )}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/bantuan/${campaign.slug}`}
                        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Lihat Kampanye
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </main>
    </div>
  );
}
