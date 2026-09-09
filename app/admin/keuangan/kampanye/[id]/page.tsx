import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CircleDollarSign,
  ExternalLink,
  Target,
  WalletCards,
} from "lucide-react";
import {
  and,
  desc,
  eq,
  isNull,
} from "drizzle-orm";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  formatRupiah,
} from "@/lib/assistance";
import { db } from "@/src/db";
import {
  campaigns,
  financialTransactions,
  programs,
  users,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

function formatDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
    },
  ).format(value);
}

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

export default async function CampaignFinanceDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = await params;

  const [campaign] = await db
    .select({
      id: campaigns.id,
      applicationId:
        campaigns.applicationId,
      slug: campaigns.slug,
      title: campaigns.title,
      status: campaigns.status,
      targetAmount:
        campaigns.targetAmount,
      programId:
        campaigns.programId,
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
      eq(campaigns.id, id),
    )
    .limit(1);

  if (!campaign) {
    notFound();
  }

  const transactions = await db
    .select({
      id:
        financialTransactions.id,
      type:
        financialTransactions.type,
      amount:
        financialTransactions.amount,
      date:
        financialTransactions.date,
      description:
        financialTransactions.description,
      donationId:
        financialTransactions.donationId,
      donorName:
        financialTransactions.donorName,
      isAnonymous:
        financialTransactions.isAnonymous,
      userName: users.name,
    })
    .from(
      financialTransactions,
    )
    .leftJoin(
      users,
      eq(
        financialTransactions.userId,
        users.id,
      ),
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
    )
    .orderBy(
      desc(
        financialTransactions.date,
      ),
      desc(
        financialTransactions.createdAt,
      ),
    );

  let collected = 0;
  let spent = 0;

  for (
    const transaction of
      transactions
  ) {
    const amount =
      Number(
        transaction.amount,
      );

    if (
      !Number.isFinite(amount)
    ) {
      continue;
    }

    if (
      transaction.type === "IN"
    ) {
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

  const meta =
    statusMeta[
      campaign.status
    ];

  const canReceive =
    campaign.status ===
    "ACTIVE";

  const canSpend =
    campaign.status ===
      "ACTIVE" ||
    campaign.status ===
      "PAUSED" ||
    campaign.status ===
      "COMPLETED";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/keuangan/kampanye"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Semua Ledger Kampanye
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
              >
                {meta.label}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {
                  campaign.programName
                }
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {
                campaign.title
              }
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sub-ledger kampanye berdasarkan
              transaksi yang memiliki
              campaignId ini.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/pengajuan/${campaign.applicationId}/kampanye`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Kelola Kampanye
            </Link>

            {(campaign.status ===
              "ACTIVE" ||
              campaign.status ===
                "COMPLETED") && (
              <Link
                href={`/bantuan/${campaign.slug}`}
                target="_blank"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Halaman Publik
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Dana Terkumpul
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatRupiah(
              collected,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Dana Terpakai
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatRupiah(
              spent,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Saldo Tersedia
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatRupiah(
              available,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Target
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatRupiah(
              target,
            )}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
            <Target className="h-4 w-4 text-teal-700" />
            Progres Target
          </span>
          <span className="font-bold text-slate-950">
            {progress}%
          </span>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-600"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Progres dihitung dari seluruh dana
          masuk kampanye. Pengeluaran tidak
          menurunkan progres; pengeluaran
          hanya mengurangi saldo tersedia.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {canReceive && (
          <Link
            href={`/admin/keuangan/masuk?campaign=${campaign.id}`}
            className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Catat Dana Masuk
          </Link>
        )}

        {canSpend && (
          <Link
            href={`/admin/keuangan/keluar?campaign=${campaign.id}`}
            className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowDownRight className="mr-2 h-4 w-4" />
            Catat Pengeluaran
          </Link>
        )}

        <Link
          href="/admin/keuangan/riwayat"
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CircleDollarSign className="mr-2 h-4 w-4" />
          Riwayat Umum
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <WalletCards className="h-5 w-5 text-teal-700" />
            <div>
              <h2 className="font-bold text-slate-950">
                Riwayat Kampanye
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {transactions.length.toLocaleString(
                  "id-ID",
                )} transaksi aktif
              </p>
            </div>
          </div>
        </div>

        {transactions.length ===
        0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Belum ada transaksi pada
            kampanye ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Keterangan
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sumber / Pencatat
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nominal
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {transactions.map(
                  (transaction) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          transaction.date,
                        )}
                      </td>

                      <td className="min-w-[280px] px-5 py-4">
                        <div className="flex items-start gap-2">
                          {transaction.type ===
                          "IN" ? (
                            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                          )}

                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {
                                transaction.description
                              }
                            </p>
                            {transaction.donationId && (
                              <p className="mt-1 text-xs text-teal-700">
                                Donasi website
                                terverifikasi
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {transaction.type ===
                        "IN"
                          ? (
                              transaction.isAnonymous
                                ? "Hamba Allah"
                                : transaction.donorName ||
                                  "-"
                            )
                          : transaction.userName ||
                            "-"}
                      </td>

                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${
                          transaction.type ===
                          "IN"
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {transaction.type ===
                        "IN"
                          ? "+"
                          : "-"}
                        {formatRupiah(
                          transaction.amount,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
