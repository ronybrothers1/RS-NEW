import {
  and,
  asc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import {
  unstable_cache,
} from "next/cache";

import {
  getJakartaMonthPeriod,
} from "@/lib/finance-monthly-summary";
import {
  PUBLIC_FINANCE_CACHE_TAG,
} from "@/lib/public-finance";
import {
  db,
} from "@/src/db";
import {
  financialTransactions,
} from "@/src/db/schema";

const DONOR_CACHE_REVALIDATE_SECONDS =
  60 * 60;

export type CurrentMonthDonorData = {
  monthLabel: string;
  donors: string[];
};

async function loadCurrentMonthDonors(
  startIso: string,
  endExclusiveIso: string,
) {
  const start =
    new Date(
      startIso,
    );

  const endExclusive =
    new Date(
      endExclusiveIso,
    );

  const rows =
    await db
      .select({
        donorName:
          financialTransactions.donorName,
        isAnonymous:
          financialTransactions.isAnonymous,
        date:
          financialTransactions.date,
        createdAt:
          financialTransactions.createdAt,
        id:
          financialTransactions.id,
      })
      .from(
        financialTransactions,
      )
      .where(
        and(
          isNull(
            financialTransactions.deletedAt,
          ),
          eq(
            financialTransactions.type,
            "IN",
          ),
          eq(
            financialTransactions.category,
            "INCOME",
          ),
          gte(
            financialTransactions.date,
            start,
          ),
          lt(
            financialTransactions.date,
            endExclusive,
          ),
          or(
            eq(
              financialTransactions.isAnonymous,
              true,
            ),
            isNotNull(
              financialTransactions.donorName,
            ),
          ),
        ),
      )
      .orderBy(
        asc(
          financialTransactions.date,
        ),
        asc(
          financialTransactions.createdAt,
        ),
        asc(
          financialTransactions.id,
        ),
      );

  const donors: string[] = [];
  const seen =
    new Set<string>();

  for (const row of rows) {
    const label =
      row.isAnonymous
        ? "Hamba Allah"
        : (
            row.donorName
              ?.replace(
                /\s+/g,
                " ",
              )
              .trim() || ""
          );

    if (!label) {
      continue;
    }

    const key =
      label.toLocaleLowerCase(
        "id-ID",
      );

    if (
      seen.has(
        key,
      )
    ) {
      continue;
    }

    seen.add(
      key,
    );

    donors.push(
      label,
    );
  }

  return donors;
}

const getCachedCurrentMonthDonorNames =
  unstable_cache(
    loadCurrentMonthDonors,
    [
      "public-current-month-donors-v1",
    ],
    {
      revalidate:
        DONOR_CACHE_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_FINANCE_CACHE_TAG,
      ],
    },
  );

export async function getCachedCurrentMonthDonors():
Promise<CurrentMonthDonorData> {
  const period =
    getJakartaMonthPeriod();

  const donors =
    await getCachedCurrentMonthDonorNames(
      period.start.toISOString(),
      period.endExclusive.toISOString(),
    );

  return {
    monthLabel:
      period.monthLabel,
    donors,
  };
}
