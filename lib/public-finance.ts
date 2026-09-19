import {
  and,
  gte,
  isNull,
  sql,
} from "drizzle-orm";
import {
  unstable_cache,
} from "next/cache";

import {
  getFinanceOpeningBalance,
} from "@/lib/finance-opening-balance";
import {
  getJakartaDateStart,
  getJakartaMonthPeriod,
} from "@/lib/finance-monthly-summary";
import {
  db,
} from "@/src/db";
import {
  financialTransactions,
} from "@/src/db/schema";

export const PUBLIC_FINANCE_CACHE_TAG =
  "public-finance";

async function loadPublicFinance() {
  // Resolve the public month at the beginning of the
  // operation, preserving the old monthly-summary timing
  // semantics around a Jakarta month boundary.
  const period =
    getJakartaMonthPeriod();

  const opening =
    await getFinanceOpeningBalance();

  const openingDate =
    opening.date
      ? getJakartaDateStart(
          opening.date,
        )
      : null;

  const financeCondition =
    openingDate
      ? sql`
          ${financialTransactions.date} >=
          ${openingDate}
        `
      : sql`TRUE`;

  const effectiveCategory = sql`
    COALESCE(
      ${financialTransactions.category}::text,
      CASE
        WHEN ${financialTransactions.type} = 'IN'
          THEN 'INCOME'
        ELSE 'EXPENSE'
      END
    )
  `;

  const priorEnabled =
    !openingDate ||
    period.start.getTime() >=
      openingDate.getTime();

  const scanStart =
    openingDate
      ? (
          openingDate.getTime() <=
          period.start.getTime()
            ? openingDate
            : period.start
        )
      : null;

  const conditions = [
    isNull(
      financialTransactions.deletedAt,
    ),
  ];

  if (scanStart) {
    conditions.push(
      gte(
        financialTransactions.date,
        scanStart,
      ),
    );
  }

  const priorDeltaExpression =
    priorEnabled
      ? sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN
                  ${financialTransactions.date} <
                    ${period.start}
                  AND
                  ${financeCondition}
                THEN
                  CASE
                    WHEN ${financialTransactions.type} = 'IN'
                      THEN ${financialTransactions.amount}
                    ELSE -${financialTransactions.amount}
                  END
                ELSE 0
              END
            ),
            0
          )
        `
      : sql<number>`0`;

  const [row] =
    await db
      .select({
        totalIncome: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financeCondition}
                AND
                ${effectiveCategory} = 'INCOME'
            ),
            0
          )
        `,
        totalExpense: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financeCondition}
                AND
                ${effectiveCategory} = 'EXPENSE'
            ),
            0
          )
        `,
        loanOut: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financeCondition}
                AND
                ${effectiveCategory} = 'LOAN_OUT'
            ),
            0
          )
        `,
        loanRepayment: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financeCondition}
                AND
                ${effectiveCategory} = 'LOAN_REPAYMENT'
            ),
            0
          )
        `,
        cashIn: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financeCondition}
                AND
                ${financialTransactions.type} = 'IN'
            ),
            0
          )
        `,
        cashOut: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financeCondition}
                AND
                ${financialTransactions.type} = 'OUT'
            ),
            0
          )
        `,
        transactionCount: sql<number>`
          COUNT(*)
          FILTER (
            WHERE
              ${financeCondition}
          )
        `,
        priorDelta:
          priorDeltaExpression,
        monthlyCashIn: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financialTransactions.date} >=
                  ${period.start}
                AND
                ${financialTransactions.date} <
                  ${period.endExclusive}
                AND
                ${financialTransactions.type} = 'IN'
            ),
            0
          )
        `,
        monthlyCashOut: sql<number>`
          COALESCE(
            SUM(
              ${financialTransactions.amount}
            )
            FILTER (
              WHERE
                ${financialTransactions.date} >=
                  ${period.start}
                AND
                ${financialTransactions.date} <
                  ${period.endExclusive}
                AND
                ${financialTransactions.type} = 'OUT'
            ),
            0
          )
        `,
        monthlyTransactionCount: sql<number>`
          COUNT(*)
          FILTER (
            WHERE
              ${financialTransactions.date} >=
                ${period.start}
              AND
              ${financialTransactions.date} <
                ${period.endExclusive}
          )
        `,
      })
      .from(
        financialTransactions,
      )
      .where(
        and(...conditions),
      );

  const totalIncome =
    Number(
      row?.totalIncome || 0,
    );

  const totalExpense =
    Number(
      row?.totalExpense || 0,
    );

  const loanOut =
    Number(
      row?.loanOut || 0,
    );

  const loanRepayment =
    Number(
      row?.loanRepayment || 0,
    );

  const cashIn =
    Number(
      row?.cashIn || 0,
    );

  const cashOut =
    Number(
      row?.cashOut || 0,
    );

  const monthlyOpeningBalance =
    priorEnabled
      ? (
          opening.amount +
          Number(
            row?.priorDelta || 0,
          )
        )
      : 0;

  const monthlyCashIn =
    Number(
      row?.monthlyCashIn || 0,
    );

  const monthlyCashOut =
    Number(
      row?.monthlyCashOut || 0,
    );

  const finance = {
    openingBalance:
      opening.amount,
    openingBalanceDate:
      opening.date,
    totalIncome,
    totalExpense,
    loanOut,
    loanRepayment,
    loanOutstanding:
      loanOut -
      loanRepayment,
    cashIn,
    cashOut,
    cashBalance:
      opening.amount +
      cashIn -
      cashOut,
    transactionCount:
      Number(
        row?.transactionCount || 0,
      ),
  };

  return {
    finance,
    monthlyFinance: {
      year:
        period.year,
      month:
        period.month,
      monthLabel:
        period.monthLabel,
      openingBalance:
        monthlyOpeningBalance,
      cashIn:
        monthlyCashIn,
      cashOut:
        monthlyCashOut,
      closingBalance:
        monthlyOpeningBalance +
        monthlyCashIn -
        monthlyCashOut,
      transactionCount:
        Number(
          row?.monthlyTransactionCount ||
            0,
        ),
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
