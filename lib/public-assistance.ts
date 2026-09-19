import {
  unstable_cache,
} from "next/cache";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  sql,
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
          collected:
            sql<string>`
              COALESCE(
                SUM(
                  CASE
                    WHEN ${financialTransactions.type} = 'IN'
                    THEN ${financialTransactions.amount}
                    ELSE 0
                  END
                ),
                0
              )::text
            `,
          spent:
            sql<string>`
              COALESCE(
                SUM(
                  CASE
                    WHEN ${financialTransactions.type} = 'IN'
                    THEN 0
                    ELSE ${financialTransactions.amount}
                  END
                ),
                0
              )::text
            `,
        })
        .from(
          financialTransactions,
        )
        .where(
          isNull(
            financialTransactions.deletedAt,
          ),
        )
        .groupBy(
          financialTransactions.campaignId,
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

    totals.set(
      row.campaignId,
      {
        collected:
          Number(
            row.collected ||
              0,
          ),
        spent:
          Number(
            row.spent ||
              0,
          ),
      },
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

async function loadPublicCampaign(
  slug: string,
) {
  const [
    campaign,
  ] =
    await db
      .select({
        id:
          campaigns.id,
        programId:
          campaigns.programId,
        slug:
          campaigns.slug,
        title:
          campaigns.title,
        summary:
          campaigns.summary,
        story:
          campaigns.story,
        beneficiaryDisplayName:
          campaigns.beneficiaryDisplayName,
        publicLocation:
          campaigns.publicLocation,
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
        and(
          eq(
            campaigns.slug,
            slug,
          ),
          inArray(
            campaigns.status,
            [
              "ACTIVE",
              "COMPLETED",
            ],
          ),
        ),
      )
      .limit(1);

  return campaign ?? null;
}

const getCachedPublicCampaignData =
  unstable_cache(
    loadPublicCampaign,
    [
      "public-assistance-detail-v1",
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

export async function getCachedPublicCampaign(
  slug: string,
) {
  return getCachedPublicCampaignData(
    slug,
  );
}

async function loadPublicCampaignTotals(
  campaignId: string,
): Promise<CampaignTotals> {
  const [
    totals,
  ] =
    await db
      .select({
        collected:
          sql<string>`
            COALESCE(
              SUM(
                CASE
                  WHEN ${financialTransactions.type} = 'IN'
                  THEN ${financialTransactions.amount}
                  ELSE 0
                END
              ),
              0
            )::text
          `,
        spent:
          sql<string>`
            COALESCE(
              SUM(
                CASE
                  WHEN ${financialTransactions.type} = 'IN'
                  THEN 0
                  ELSE ${financialTransactions.amount}
                END
              ),
              0
            )::text
          `,
      })
      .from(
        financialTransactions,
      )
      .where(
        and(
          eq(
            financialTransactions.campaignId,
            campaignId,
          ),
          isNull(
            financialTransactions.deletedAt,
          ),
        ),
      );

  return {
    collected:
      Number(
        totals?.collected ||
          0,
      ),
    spent:
      Number(
        totals?.spent ||
          0,
      ),
  };
}

const getCachedPublicCampaignTotalsData =
  unstable_cache(
    loadPublicCampaignTotals,
    [
      "public-assistance-campaign-totals-v1",
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

export async function getCachedPublicCampaignTotals(
  campaignId: string,
) {
  return getCachedPublicCampaignTotalsData(
    campaignId,
  );
}
