import {
  and,
  gte,
  isNull,
  sql,
} from "drizzle-orm";

import {
  getFinanceOpeningBalance,
} from "@/lib/finance-opening-balance";
import {
  getJakartaDateStart,
} from "@/lib/finance-monthly-summary";
import { db } from "@/src/db";
import {
  financialTransactions,
} from "@/src/db/schema";

export type FinanceSummary = {
  openingBalance: number;
  openingBalanceDate: string | null;
  totalIncome: number;
  totalExpense: number;
  loanOut: number;
  loanRepayment: number;
  loanOutstanding: number;
  cashIn: number;
  cashOut: number;
  cashBalance: number;
  transactionCount: number;
};

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const opening =
    await getFinanceOpeningBalance();

  const openingDate =
    opening.date
      ? getJakartaDateStart(
          opening.date,
        )
      : null;

  const conditions = [
    isNull(
      financialTransactions.deletedAt,
    ),
  ];

  if (openingDate) {
    conditions.push(
      gte(
        financialTransactions.date,
        openingDate,
      ),
    );
  }

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

  const [row] = await db
    .select({
      totalIncome: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${effectiveCategory} = 'INCOME'
                THEN ${financialTransactions.amount}
              ELSE 0
            END
          ),
          0
        )
      `,
      totalExpense: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${effectiveCategory} = 'EXPENSE'
                THEN ${financialTransactions.amount}
              ELSE 0
            END
          ),
          0
        )
      `,
      loanOut: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${effectiveCategory} = 'LOAN_OUT'
                THEN ${financialTransactions.amount}
              ELSE 0
            END
          ),
          0
        )
      `,
      loanRepayment: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${effectiveCategory} = 'LOAN_REPAYMENT'
                THEN ${financialTransactions.amount}
              ELSE 0
            END
          ),
          0
        )
      `,
      cashIn: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${financialTransactions.type} = 'IN'
                THEN ${financialTransactions.amount}
              ELSE 0
            END
          ),
          0
        )
      `,
      cashOut: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${financialTransactions.type} = 'OUT'
                THEN ${financialTransactions.amount}
              ELSE 0
            END
          ),
          0
        )
      `,
      count: sql<number>`COUNT(*)`,
    })
    .from(financialTransactions)
    .where(and(...conditions));

  const totalIncome =
    Number(row?.totalIncome || 0);
  const totalExpense =
    Number(row?.totalExpense || 0);
  const loanOut =
    Number(row?.loanOut || 0);
  const loanRepayment =
    Number(row?.loanRepayment || 0);
  const cashIn =
    Number(row?.cashIn || 0);
  const cashOut =
    Number(row?.cashOut || 0);

  return {
    openingBalance:
      opening.amount,
    openingBalanceDate:
      opening.date,
    totalIncome,
    totalExpense,
    loanOut,
    loanRepayment,
    loanOutstanding:
      loanOut - loanRepayment,
    cashIn,
    cashOut,
    cashBalance:
      opening.amount +
      cashIn -
      cashOut,
    transactionCount:
      Number(row?.count || 0),
  };
}
