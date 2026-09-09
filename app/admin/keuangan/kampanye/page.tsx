import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Target,
  WalletCards,
} from "lucide-react";
import {
  desc,
  eq,
  isNull,
} from "drizzle-orm";
import Link from "next/link";

import {
  formatRupiah,
} from "@/lib/assistance";
import { db } from "@/src/db";
import {
  campaigns,
  financialTransactions,
  programs,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

const statusMeta = {
  DRAFT: {
    label: "Draf",
    className:
      "border-slate-200 bg-slate-50 text-slate-700",
  },
  ACTIVE: {
    label: "Aktif",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  PAUSED: {
    label: "Dijeda",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  },
  COMPLETED: {
    label: "Selesai",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className:
      "border-rose-200 bg-rose-50 text-rose-700",
  },
} as const;

export default async function CampaignFinancePage() {
  const [
    campaignRows,
    ledgerRows,
  ] = await Promise.all([
    db
      .select({
        id: campaigns.id,
        slug: campaigns.slug,
        title: campaigns.title,
        status: campaigns.status,
        programId:
          campaigns.programId,
        programName:
          programs.name,
        targetAmount:
          campaigns.targetAmount,
        updatedAt:
          campaigns.updatedAt,
      })
      .from(campaigns)
      .innerJoin(
        programs,
        eq(
          campaigns.programId,
          programs.id,
        ),
      )
      .orderBy(
        desc(
          campaigns.updatedAt,
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

  for (const row of ledgerRows) {
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

    const value =
      Number(row.amount);

    if (
      Number.isFinite(value)
    ) {
      if (row.type === "IN") {
        current.collected +=
          value;
      } else {
        current.spent +=
          value;
      }
    }

    totals.set(
      row.campaignId,
      current,
    );
  }

  const summary =
    campaignRows.reduce(
      (acc, campaign) => {
        const total =
          totals.get(
            campaign.id,
          ) || {
            collected: 0,
            spent: 0,
          };

        acc.collected +=
          total.collected;
        acc.spent +=
          total.spent;

        return acc;
      },
      {
        collected: 0,
        spent: 0,
      },
    );

  const available =
    summary.collected -
    summary.spent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">
            Sub-ledger Kampanye
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Keuangan Kampanye
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Dana kampanye dihitung langsung
            dari transaksi keuangan dengan
            campaignId. Tidak ada saldo
            manual yang disimpan terpisah.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/keuangan/masuk"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowUpRight className="mr-2 h-4 w-4 text-emerald-600" />
            Catat Masuk
          </Link>

          <Link
            href="/admin/keuangan/keluar"
            className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowDownRight className="mr-2 h-4 w-4" />
            Catat Keluar
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <Landmark className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium">
              Dana Terkumpul
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {formatRupiah(
              summary.collected,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <ArrowDownRight className="h-5 w-5 text-rose-600" />
            <span className="text-sm font-medium">
              Dana Terpakai
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {formatRupiah(
              summary.spent,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <WalletCards className="h-5 w-5 text-teal-600" />
            <span className="text-sm font-medium">
              Saldo Tersedia
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {formatRupiah(
              available,
            )}
          </p>
        </div>
      </div>

      {campaignRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          Belum ada kampanye yang dapat
          ditampilkan.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {campaignRows.map(
            (campaign) => {
              const total =
                totals.get(
                  campaign.id,
                ) || {
                  collected: 0,
                  spent: 0,
                };

              const campaignAvailable =
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
                          total.collected /
                          target
                        ) *
                          100,
                      ),
                    )
                  : 0;

              const meta =
                statusMeta[
                  campaign.status
                ];

              return (
                <article
                  key={campaign.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {
                            campaign.programName
                          }
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-bold leading-snug text-slate-950">
                        {
                          campaign.title
                        }
                      </h2>
                    </div>

                    <Link
                      href={`/admin/keuangan/kampanye/${campaign.id}`}
                      className="shrink-0 text-sm font-semibold text-teal-700 hover:text-teal-800"
                    >
                      Buka Ledger →
                    </Link>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Terkumpul
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatRupiah(
                          total.collected,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Terpakai
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatRupiah(
                          total.spent,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Tersedia
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatRupiah(
                          campaignAvailable,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Progres target
                      </span>
                      <span className="font-semibold text-slate-700">
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
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
