import {
  unstable_cache,
} from "next/cache";
import {
  asc,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";

import {
  PUBLIC_FINANCE_CACHE_TAG,
} from "@/lib/public-finance";
import {
  PUBLIC_PROGRAMS_CACHE_TAG,
} from "@/lib/public-programs";
import {
  db,
} from "@/src/db";
import {
  campaigns,
  financialTransactions,
  programs,
} from "@/src/db/schema";

export const PUBLIC_ASSISTANCE_CACHE_TAG =
  "public-assistance";

const PUBLIC_ASSISTANCE_REVALIDATE_SECONDS =
  300;

type CampaignTotals = {
  collected: number;
  spent: number;
};

async function loadPublicAssistanceIndex() {
  const [
    rows,
    ledgerRows,
    activePrograms,
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
          programName:
            programs.name,
        })
        .from(
          campaigns,
        )
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

      db
        .select({
          id:
            programs.id,
          name:
            programs.name,
          description:
            programs.description,
        })
        .from(
          programs,
        )
        .where(
          eq(
            programs.status,
            "ACTIVE",
          ),
        )
        .orderBy(
          asc(
            programs.name,
          ),
        ),
    ]);

  const totals =
    new Map<
      string,
      CampaignTotals
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
      ) ?? {
        collected: 0,
        spent: 0,
      };

    const amount =
      Number(
        row.amount,
      );

    if (
      Number.isFinite(
        amount,
      )
    ) {
      if (
        row.type ===
        "IN"
      ) {
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

  return {
    rows,
    activePrograms,
    totalsEntries:
      Array.from(
        totals.entries(),
      ),
  };
}

const getCachedPublicAssistanceIndexData =
  unstable_cache(
    loadPublicAssistanceIndex,
    [
      "public-assistance-index-v1",
    ],
    {
      revalidate:
        PUBLIC_ASSISTANCE_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_ASSISTANCE_CACHE_TAG,
        PUBLIC_FINANCE_CACHE_TAG,
        PUBLIC_PROGRAMS_CACHE_TAG,
      ],
    },
  );

export async function getCachedPublicAssistanceIndex() {
  const cached =
    await getCachedPublicAssistanceIndexData();

  return {
    rows:
      cached.rows,
    activePrograms:
      cached.activePrograms,
    totals:
      new Map<
        string,
        CampaignTotals
      >(
        cached.totalsEntries,
      ),
  };
}