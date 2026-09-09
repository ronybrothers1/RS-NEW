import {
  ArrowDownRight,
} from "lucide-react";
import {
  and,
  asc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm";

import { db } from "@/src/db";
import {
  campaigns,
  financialTransactions,
  programs,
} from "@/src/db/schema";
import TransaksiKeluarForm from "../components/TransaksiKeluarForm";

export const dynamic = "force-dynamic";

export default async function UangKeluarPage({
  searchParams,
}: {
  searchParams: Promise<{
    campaign?: string;
  }>;
}) {
  const {
    campaign:
      requestedCampaignId = "",
  } = await searchParams;

  const [
    activePrograms,
    campaignRows,
    ledgerRows,
  ] = await Promise.all([
    db
      .select({
        id: programs.id,
        name: programs.name,
      })
      .from(programs)
      .where(
        eq(
          programs.status,
          "ACTIVE",
        ),
      )
      .orderBy(asc(programs.name)),

    db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        programId:
          campaigns.programId,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(
        inArray(
          campaigns.status,
          [
            "ACTIVE",
            "PAUSED",
            "COMPLETED",
          ],
        ),
      )
      .orderBy(asc(campaigns.title)),

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
        and(
          isNotNull(
            financialTransactions.campaignId,
          ),
          isNull(
            financialTransactions.deletedAt,
          ),
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

  const campaignOptions =
    campaignRows.map(
      (campaign) => {
        const total =
          totals.get(
            campaign.id,
          ) || {
            collected: 0,
            spent: 0,
          };

        return {
          id: campaign.id,
          title:
            campaign.title,
          programId:
            campaign.programId,
          status:
            campaign.status as
              | "ACTIVE"
              | "PAUSED"
              | "COMPLETED",
          available:
            total.collected -
            total.spent,
        };
      },
    );

  const defaultCampaignId =
    campaignOptions.some(
      (item) =>
        item.id ===
        requestedCampaignId,
    )
      ? requestedCampaignId
      : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ArrowDownRight className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Catat Uang Keluar
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Catat pengeluaran umum,
              program, atau penggunaan dana
              kampanye.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <TransaksiKeluarForm
          programs={activePrograms}
          campaigns={campaignOptions}
          defaultCampaignId={
            defaultCampaignId
          }
        />
      </div>
    </div>
  );
}
