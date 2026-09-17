import {
  unstable_cache,
} from "next/cache";

import {
  getFinanceMonthlySummary,
} from "@/lib/finance-monthly-summary";
import {
  getFinanceSummary,
} from "@/lib/finance-summary";

export const PUBLIC_FINANCE_CACHE_TAG =
  "public-finance";

async function loadPublicFinance() {
  const [
    finance,
    monthly,
  ] =
    await Promise.all([
      getFinanceSummary(),
      getFinanceMonthlySummary(),
    ]);

  return {
    finance,
    monthlyFinance: {
      year:
        monthly.year,
      month:
        monthly.month,
      monthLabel:
        monthly.monthLabel,
      openingBalance:
        monthly.openingBalance,
      cashIn:
        monthly.cashIn,
      cashOut:
        monthly.cashOut,
      closingBalance:
        monthly.closingBalance,
      transactionCount:
        monthly.transactionCount,
    },
  };
}

export const getCachedPublicFinance =
  unstable_cache(
    loadPublicFinance,
    [
      "public-finance-v1",
    ],
    {
      revalidate:
        300,
      tags: [
        PUBLIC_FINANCE_CACHE_TAG,
      ],
    },
  );