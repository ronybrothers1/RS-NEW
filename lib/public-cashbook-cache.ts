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
  getPublicCashbook,
  type PublicCashbookRequest,
  type PublicCashbookResult,
} from "@/lib/public-cashbook";
import {
  PUBLIC_PROGRAMS_CACHE_TAG,
} from "@/lib/public-programs";

const PUBLIC_CASHBOOK_REVALIDATE_SECONDS =
  300;

type CachedPublicCashbookResult =
  Omit<
    PublicCashbookResult,
    "period" | "rows"
  > & {
    period:
      Omit<
        PublicCashbookResult["period"],
        "start" | "endExclusive"
      > & {
        start: string;
        endExclusive: string;
      };
    rows:
      Array<
        Omit<
          PublicCashbookResult["rows"][number],
          "date"
        > & {
          date: string;
        }
      >;
  };

function serializePublicCashbook(
  result: PublicCashbookResult,
): CachedPublicCashbookResult {
  return {
    ...result,
    period: {
      ...result.period,
      start:
        result.period.start.toISOString(),
      endExclusive:
        result.period.endExclusive.toISOString(),
    },
    rows:
      result.rows.map(
        (row) => ({
          ...row,
          date:
            row.date.toISOString(),
        }),
      ),
  };
}

function hydratePublicCashbook(
  result: CachedPublicCashbookResult,
): PublicCashbookResult {
  return {
    ...result,
    period: {
      ...result.period,
      start:
        new Date(
          result.period.start,
        ),
      endExclusive:
        new Date(
          result.period.endExclusive,
        ),
    },
    rows:
      result.rows.map(
        (row) => ({
          ...row,
          date:
            new Date(
              row.date,
            ),
        }),
      ),
  };
}

async function loadDefaultPublicCashbook(
  _periodKey: string,
): Promise<CachedPublicCashbookResult> {
  const result =
    await getPublicCashbook({
      query: "",
      page: 1,
    });

  return serializePublicCashbook(
    result,
  );
}

const getCachedDefaultPublicCashbook =
  unstable_cache(
    loadDefaultPublicCashbook,
    [
      "public-cashbook-default-v1",
    ],
    {
      revalidate:
        PUBLIC_CASHBOOK_REVALIDATE_SECONDS,
      tags: [
        PUBLIC_FINANCE_CACHE_TAG,
        PUBLIC_PROGRAMS_CACHE_TAG,
      ],
    },
  );

function normalizeQuery(
  value?: string | null,
) {
  return (
    value ?? ""
  )
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePage(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(
          value ?? "1",
          10,
        );

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed < 1
  ) {
    return 1;
  }

  return parsed;
}

function getCurrentPeriodKey() {
  const period =
    getJakartaMonthPeriod();

  return `${period.year}-${String(
    period.month,
  ).padStart(2, "0")}`;
}

export async function getCachedPublicCashbook(
  request: PublicCashbookRequest = {},
): Promise<PublicCashbookResult> {
  const normalizedQuery =
    normalizeQuery(
      request.query,
    );

  const normalizedPage =
    normalizePage(
      request.page,
    );

  // Search and deeper pagination are deliberately
  // left uncached to avoid unbounded cache cardinality.
  if (
    normalizedQuery ||
    normalizedPage !== 1
  ) {
    return getPublicCashbook(
      request,
    );
  }

  const cached =
    await getCachedDefaultPublicCashbook(
      getCurrentPeriodKey(),
    );

  return hydratePublicCashbook(
    cached,
  );
}