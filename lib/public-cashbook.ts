import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";

import {
  getFinanceOpeningBalanceAt,
  getJakartaMonthBounds,
  getJakartaMonthPeriod,
} from "@/lib/finance-monthly-summary";
import { db } from "@/src/db";
import {
  financialTransactions,
  programs,
} from "@/src/db/schema";

export const PUBLIC_CASHBOOK_PAGE_SIZE = 20;
const MAX_PUBLIC_SEARCH_LENGTH = 120;
const MIN_YEAR = 2021;
const MAX_YEAR = 2100;

export type PublicCashbookRequest = {
  query?: string | null;
  page?: number | string | null;
};

export type PublicCashbookPeriod = {
  year: number;
  month: number;
  value: string;
  label: string;
  start: Date;
  endExclusive: Date;
};

export type PublicCashbookRow = {
  id: string;
  receiptNumber: string;
  date: Date;
  uraian: string;
  income: number;
  expense: number;
  balance: number;
};

export type PublicCashbookResult = {
  period: PublicCashbookPeriod;
  query: string;
  openingBalance: number;
  cashIn: number;
  cashOut: number;
  closingBalance: number;
  rows: PublicCashbookRow[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

type LedgerUraianInput = {
  type: "IN" | "OUT";
  category:
    | "INCOME"
    | "EXPENSE"
    | "LOAN_OUT"
    | "LOAN_REPAYMENT";
  description: string;
  donorName: string | null;
  isAnonymous: boolean;
  programName: string | null;
};

function formatMonthValue(
  year: number,
  month: number,
) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatMonthLabel(
  year: number,
  month: number,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    },
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12,
      ),
    ),
  );
}

function getCurrentPublicCashbookPeriod(): PublicCashbookPeriod {
  const current =
    getJakartaMonthPeriod();

  const year =
    current.year;

  const month =
    current.month;

  const bounds =
    getJakartaMonthBounds(
      year,
      month,
    );

  if (!bounds) {
    throw new Error(
      "Periode Buku Kas bulan berjalan tidak valid.",
    );
  }

  return {
    year,
    month,
    value:
      formatMonthValue(
        year,
        month,
      ),
    label:
      formatMonthLabel(
        year,
        month,
      ),
    start:
      bounds.start,
    endExclusive:
      bounds.endExclusive,
  };
}

function parseRequestedPage(
  rawValue:
    | number
    | string
    | null
    | undefined,
) {
  const parsed =
    typeof rawValue ===
    "number"
      ? rawValue
      : Number.parseInt(
          rawValue ?? "1",
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

function normalizePublicQuery(
  rawValue?: string | null,
) {
  return (
    rawValue ?? ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .slice(
      0,
      MAX_PUBLIC_SEARCH_LENGTH,
    );
}

function queryMatchesAnonymousLabel(
  value: string,
) {
  if (!value) {
    return false;
  }

  const normalized =
    value.toLocaleLowerCase(
      "id-ID",
    );

  return (
    "hamba allah".includes(
      normalized,
    ) ||
    normalized.includes(
      "hamba allah",
    )
  );
}

export function buildPublicCashbookUraian(
  input: LedgerUraianInput,
) {
  const description =
    input.description
      .replace(/\s+/g, " ")
      .trim();

  if (input.type === "OUT") {
    return (
      description ||
      "Tidak dicantumkan"
    );
  }

  const source =
    input.isAnonymous
      ? "Hamba Allah"
      : (
          input.donorName
            ?.replace(
              /\s+/g,
              " ",
            )
            .trim() ||
          "Tidak dicantumkan"
        );

  if (
    input.category ===
    "LOAN_REPAYMENT"
  ) {
    const loanDescription =
      description ||
      "Pengembalian Pinjaman";

    return `${loanDescription} — ${source}`;
  }

  const programName =
    input.programName
      ?.replace(
        /\s+/g,
        " ",
      )
      .trim();

  return programName
    ? `${programName} — ${source}`
    : source;
}

export async function getPublicCashbook(
  request: PublicCashbookRequest = {},
): Promise<PublicCashbookResult> {
  const period =
    getCurrentPublicCashbookPeriod();

  const query =
    normalizePublicQuery(
      request.query,
    );

  const requestedPage =
    parseRequestedPage(
      request.page,
    );

  const periodCondition =
    and(
      isNull(
        financialTransactions.deletedAt,
      ),
      gte(
        financialTransactions.date,
        period.start,
      ),
      lt(
        financialTransactions.date,
        period.endExclusive,
      ),
    );

  const summaryPromise =
    db
      .select({
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
        `.mapWith(Number),
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
        `.mapWith(Number),
        transactionCount:
          count(),
      })
      .from(
        financialTransactions,
      )
      .where(
        periodCondition,
      );

  const openingPromise =
    getFinanceOpeningBalanceAt(
      period.start,
    );

  const [
    summaryRows,
    openingBalance,
  ] =
    await Promise.all([
      summaryPromise,
      openingPromise,
    ]);

  const summary =
    summaryRows[0];

  const cashIn =
    Number(
      summary?.cashIn ?? 0,
    );

  const cashOut =
    Number(
      summary?.cashOut ?? 0,
    );

  const periodTransactionCount =
    Number(
      summary?.transactionCount ??
        0,
    );

  const countSource =
    db
      .select({
        id:
          financialTransactions.id,
        receiptNumber:
          financialTransactions.receiptNumber,
        type:
          financialTransactions.type,
        category:
          financialTransactions.category,
        description:
          financialTransactions.description,
        donorName:
          financialTransactions.donorName,
        isAnonymous:
          financialTransactions.isAnonymous,
        programName:
          programs.name,
      })
      .from(
        financialTransactions,
      )
      .leftJoin(
        programs,
        eq(
          financialTransactions.programId,
          programs.id,
        ),
      )
      .where(
        periodCondition,
      )
      .as(
        "public_cashbook_count_source",
      );

  let totalItems =
    periodTransactionCount;

  if (
    query &&
    requestedPage > 1
  ) {
    const pattern =
      `%${query}%`;

    const countConditions = [
      ilike(
        countSource.receiptNumber,
        pattern,
      ),
      and(
        eq(
          countSource.type,
          "OUT",
        ),
        ilike(
          countSource.description,
          pattern,
        ),
      ),
      and(
        eq(
          countSource.type,
          "IN",
        ),
        eq(
          countSource.isAnonymous,
          false,
        ),
        ilike(
          countSource.donorName,
          pattern,
        ),
      ),
      and(
        eq(
          countSource.type,
          "IN",
        ),
        ilike(
          countSource.programName,
          pattern,
        ),
      ),
      and(
        eq(
          countSource.category,
          "LOAN_REPAYMENT",
        ),
        ilike(
          countSource.description,
          pattern,
        ),
      ),
    ];

    if (
      queryMatchesAnonymousLabel(
        query,
      )
    ) {
      countConditions.push(
        and(
          eq(
            countSource.type,
            "IN",
          ),
          eq(
            countSource.isAnonymous,
            true,
          ),
        ),
      );
    }

    const [countRow] =
      await db
        .select({
          total:
            count(),
        })
        .from(
          countSource,
        )
        .where(
          or(
            ...countConditions,
          ),
        );

    totalItems =
      Number(
        countRow?.total ?? 0,
      );
  }

  let totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
          PUBLIC_CASHBOOK_PAGE_SIZE,
      ),
    );

  const currentPage =
    Math.min(
      requestedPage,
      totalPages,
    );

  const ledgerSource =
    db
      .select({
        id:
          financialTransactions.id,
        receiptNumber:
          financialTransactions.receiptNumber,
        type:
          financialTransactions.type,
        category:
          financialTransactions.category,
        amount:
          financialTransactions.amount,
        date:
          financialTransactions.date,
        description:
          financialTransactions.description,
        donorName:
          financialTransactions.donorName,
        isAnonymous:
          financialTransactions.isAnonymous,
        programName:
          programs.name,
        createdAt:
          financialTransactions.createdAt,
        runningBalance:
          sql<number>`
            ${openingBalance}::numeric +
            SUM(
              CASE
                WHEN ${financialTransactions.type} = 'IN'
                  THEN ${financialTransactions.amount}
                ELSE -${financialTransactions.amount}
              END
            ) OVER (
              ORDER BY
                ${financialTransactions.date} ASC,
                ${financialTransactions.createdAt} ASC,
                ${financialTransactions.id} ASC
            )
          `
            .mapWith(Number)
            .as(
              "running_balance",
            ),
      })
      .from(
        financialTransactions,
      )
      .leftJoin(
        programs,
        eq(
          financialTransactions.programId,
          programs.id,
        ),
      )
      .where(
        periodCondition,
      )
      .as(
        "public_cashbook_ledger",
      );

  const rowPattern =
    `%${query}%`;

  const rowConditions = [
    ilike(
      ledgerSource.receiptNumber,
      rowPattern,
    ),
    and(
      eq(
        ledgerSource.type,
        "OUT",
      ),
      ilike(
        ledgerSource.description,
        rowPattern,
      ),
    ),
    and(
      eq(
        ledgerSource.type,
        "IN",
      ),
      eq(
        ledgerSource.isAnonymous,
        false,
      ),
      ilike(
        ledgerSource.donorName,
        rowPattern,
      ),
    ),
    and(
      eq(
        ledgerSource.type,
        "IN",
      ),
      ilike(
        ledgerSource.programName,
        rowPattern,
      ),
    ),
    and(
      eq(
        ledgerSource.category,
        "LOAN_REPAYMENT",
      ),
      ilike(
        ledgerSource.description,
        rowPattern,
      ),
    ),
  ];

  if (
    query &&
    queryMatchesAnonymousLabel(
      query,
    )
  ) {
    rowConditions.push(
      and(
        eq(
          ledgerSource.type,
          "IN",
        ),
        eq(
          ledgerSource.isAnonymous,
          true,
        ),
      ),
    );
  }

  const rowSearchCondition =
    query
      ? or(
          ...rowConditions,
        )
      : undefined;

  const ledgerRows =
    await db
      .select({
        id:
          ledgerSource.id,
        receiptNumber:
          ledgerSource.receiptNumber,
        type:
          ledgerSource.type,
        category:
          ledgerSource.category,
        amount:
          ledgerSource.amount,
        date:
          ledgerSource.date,
        description:
          ledgerSource.description,
        donorName:
          ledgerSource.donorName,
        isAnonymous:
          ledgerSource.isAnonymous,
        programName:
          ledgerSource.programName,
        createdAt:
          ledgerSource.createdAt,
        runningBalance:
          ledgerSource.runningBalance,
        filteredCount:
          query &&
          requestedPage === 1
            ? sql<number>`
                COUNT(*) OVER()
              `.mapWith(Number)
            : sql<number>`0`.mapWith(Number),
      })
      .from(
        ledgerSource,
      )
      .where(
        rowSearchCondition,
      )
      .orderBy(
        asc(
          ledgerSource.date,
        ),
        asc(
          ledgerSource.createdAt,
        ),
        asc(
          ledgerSource.id,
        ),
      )
      .limit(
        PUBLIC_CASHBOOK_PAGE_SIZE,
      )
      .offset(
        (
          currentPage - 1
        ) *
          PUBLIC_CASHBOOK_PAGE_SIZE,
      );

  if (
    query &&
    requestedPage === 1
  ) {
    totalItems =
      Number(
        ledgerRows[0]
          ?.filteredCount ??
          0,
      );

    totalPages =
      Math.max(
        1,
        Math.ceil(
          totalItems /
            PUBLIC_CASHBOOK_PAGE_SIZE,
        ),
      );
  }

  const rows =
    ledgerRows.map(
      (row): PublicCashbookRow => {
        const amount =
          Number(
            row.amount,
          );

        return {
          id:
            row.id,
          receiptNumber:
            row.receiptNumber,
          date:
            row.date,
          uraian:
            buildPublicCashbookUraian(
              {
                type:
                  row.type,
                category:
                  row.category,
                description:
                  row.description,
                donorName:
                  row.donorName,
                isAnonymous:
                  row.isAnonymous,
                programName:
                  row.programName,
              },
            ),
          income:
            row.type === "IN"
              ? amount
              : 0,
          expense:
            row.type === "OUT"
              ? amount
              : 0,
          balance:
            Number(
              row.runningBalance,
            ),
        };
      },
    );

  return {
    period,
    query,
    openingBalance,
    cashIn,
    cashOut,
    closingBalance:
      openingBalance +
      cashIn -
      cashOut,
    rows,
    pagination: {
      currentPage,
      pageSize:
        PUBLIC_CASHBOOK_PAGE_SIZE,
      totalItems,
      totalPages,
    },
  };
}