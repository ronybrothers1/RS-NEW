import {
  and,
  gte,
  isNull,
  lt,
  sql,
} from "drizzle-orm";

import {
  getFinanceOpeningBalance,
} from "@/lib/finance-opening-balance";
import {
  db,
} from "@/src/db";
import {
  financialTransactions,
} from "@/src/db/schema";

export const JAKARTA_TIME_ZONE =
  "Asia/Jakarta";

const JAKARTA_OFFSET_MS =
  7 * 60 * 60 * 1000;

type JakartaDateParts = {
  year: number;
  month: number;
  day: number;
};

export type FinanceMonthlySummary = {
  year: number;
  month: number;
  monthLabel: string;
  periodStart: Date;
  periodEndExclusive: Date;
  openingBalance: number;
  cashIn: number;
  cashOut: number;
  closingBalance: number;
  transactionCount: number;
};

function getJakartaDateParts(
  referenceDate: Date,
): JakartaDateParts {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          JAKARTA_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      referenceDate,
    );

  const values =
    Object.fromEntries(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ],
      ),
    );

  return {
    year:
      Number(values.year),
    month:
      Number(values.month),
    day:
      Number(values.day),
  };
}

function jakartaStartOfDayUtc(
  year: number,
  month: number,
  day: number,
) {
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ) -
      JAKARTA_OFFSET_MS,
  );
}

export function getJakartaDateStart(
  value: string,
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const probe =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12,
      ),
    );

  if (
    probe.getUTCFullYear() !==
      year ||
    probe.getUTCMonth() !==
      month - 1 ||
    probe.getUTCDate() !==
      day
  ) {
    return null;
  }

  return jakartaStartOfDayUtc(
    year,
    month,
    day,
  );
}

export function getJakartaNextDayStart(
  value: string,
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const currentStart =
    getJakartaDateStart(
      value,
    );

  if (!currentStart) {
    return null;
  }

  const nextDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + 1,
        12,
      ),
    );

  return jakartaStartOfDayUtc(
    nextDate.getUTCFullYear(),
    nextDate.getUTCMonth() + 1,
    nextDate.getUTCDate(),
  );
}

function getNextMonth(
  year: number,
  month: number,
) {
  if (month === 12) {
    return {
      year:
        year + 1,
      month: 1,
    };
  }

  return {
    year,
    month:
      month + 1,
  };
}

export function getJakartaMonthBounds(
  year: number,
  month: number,
) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const next =
    getNextMonth(
      year,
      month,
    );

  return {
    start:
      jakartaStartOfDayUtc(
        year,
        month,
        1,
      ),
    endExclusive:
      jakartaStartOfDayUtc(
        next.year,
        next.month,
        1,
      ),
  };
}

export function getJakartaYearBounds(
  year: number,
) {
  if (
    !Number.isInteger(year)
  ) {
    return null;
  }

  return {
    start:
      jakartaStartOfDayUtc(
        year,
        1,
        1,
      ),
    endExclusive:
      jakartaStartOfDayUtc(
        year + 1,
        1,
        1,
      ),
  };
}

export function getJakartaMonthPeriod(
  referenceDate =
    new Date(),
) {
  const current =
    getJakartaDateParts(
      referenceDate,
    );

  const next =
    getNextMonth(
      current.year,
      current.month,
    );

  const start =
    jakartaStartOfDayUtc(
      current.year,
      current.month,
      1,
    );

  const endExclusive =
    jakartaStartOfDayUtc(
      next.year,
      next.month,
      1,
    );

  const monthLabel =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        month: "long",
        year: "numeric",
        timeZone:
          JAKARTA_TIME_ZONE,
      },
    ).format(
      new Date(
        Date.UTC(
          current.year,
          current.month - 1,
          1,
          12,
        ),
      ),
    );

  return {
    year:
      current.year,
    month:
      current.month,
    monthLabel,
    start,
    endExclusive,
  };
}

export async function getFinanceOpeningBalanceAt(
  periodStart: Date,
) {
  const opening =
    await getFinanceOpeningBalance();

  const configuredDate =
    opening.date
      ? getJakartaDateStart(
          opening.date,
        )
      : null;

  if (
    configuredDate &&
    periodStart.getTime() <
      configuredDate.getTime()
  ) {
    return 0;
  }

  const conditions = [
    isNull(
      financialTransactions.deletedAt,
    ),
    lt(
      financialTransactions.date,
      periodStart,
    ),
  ];

  if (configuredDate) {
    conditions.push(
      gte(
        financialTransactions.date,
        configuredDate,
      ),
    );
  }

  const [row] =
    await db
      .select({
        delta: sql<number>`
          COALESCE(
            SUM(
              CASE
                WHEN ${financialTransactions.type} = 'IN'
                  THEN ${financialTransactions.amount}
                ELSE -${financialTransactions.amount}
              END
            ),
            0
          )
        `,
      })
      .from(
        financialTransactions,
      )
      .where(
        and(...conditions),
      );

  const priorDelta =
    Number(
      row?.delta || 0,
    );

  return (
    opening.amount +
    priorDelta
  );
}

export async function getFinanceMonthlySummary(
  referenceDate =
    new Date(),
): Promise<FinanceMonthlySummary> {
  const period =
    getJakartaMonthPeriod(
      referenceDate,
    );

  const openingBalance =
    await getFinanceOpeningBalanceAt(
      period.start,
    );

  const [row] =
    await db
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
        count:
          sql<number>`COUNT(*)`,
      })
      .from(
        financialTransactions,
      )
      .where(
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
        ),
      );

  const cashIn =
    Number(
      row?.cashIn || 0,
    );

  const cashOut =
    Number(
      row?.cashOut || 0,
    );

  return {
    year:
      period.year,
    month:
      period.month,
    monthLabel:
      period.monthLabel,
    periodStart:
      period.start,
    periodEndExclusive:
      period.endExclusive,
    openingBalance,
    cashIn,
    cashOut,
    closingBalance:
      openingBalance +
      cashIn -
      cashOut,
    transactionCount:
      Number(
        row?.count || 0,
      ),
  };
}