import {
  ArrowDownRight,
} from "lucide-react";
import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  sql,
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
        collected:
          sql<string>`
            coalesce(
              sum(
                case
                  when
                    ${financialTransactions.type} = 'IN'
                    and ${financialTransactions.amount} <> 'NaN'::numeric
                  then ${financialTransactions.amount}
                  else 0
                end
              ),
              0
            )
          `,
        spent:
          sql<string>`
            coalesce(
              sum(
                case
                  when
                    ${financialTransactions.type} = 'OUT'
                    and ${financialTransactions.amount} <> 'NaN'::numeric
                  then ${financialTransactions.amount}
                  else 0
                end
              ),
              0
            )
          `,
      })
      .from(campaigns)
      .leftJoin(
        financialTransactions,
        and(
          eq(
            financialTransactions.campaignId,
            campaigns.id,
          ),
          isNull(
            financialTransactions.deletedAt,
          ),
        ),
      )
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
      .groupBy(
        campaigns.id,
        campaigns.title,
        campaigns.programId,
        campaigns.status,
      )
      .orderBy(
        asc(campaigns.title),
      ),
  ]);

  const campaignOptions =
    campaignRows.map(
      (campaign) => {
        const collected =
          Number(
            campaign.collected,
          );

        const spent =
          Number(
            campaign.spent,
          );

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
            (
              Number.isFinite(
                collected,
              )
                ? collected
                : 0
            ) -
            (
              Number.isFinite(
                spent,
              )
                ? spent
                : 0
            ),
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