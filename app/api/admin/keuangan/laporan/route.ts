import {
  and,
  asc,
  eq,
  gte,
  isNull,
  lt,
} from "drizzle-orm";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";
import {
  getFinanceOpeningBalanceAt,
  getJakartaDateStart,
  getJakartaMonthBounds,
  getJakartaNextDayStart,
  getJakartaYearBounds,
} from "@/lib/finance-monthly-summary";
import {
  buildFinanceReportPdf,
} from "@/lib/finance-report-pdf";
import {
  db,
} from "@/src/db";
import {
  financialTransactions,
  programs,
} from "@/src/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}



function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

function fullDateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function parsePeriod(url: URL) {
  const period = url.searchParams.get("period") || "month";

  if (period === "month") {
    const raw = url.searchParams.get("month") || "";
    const match = /^(\d{4})-(\d{2})$/.exec(raw);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year < 2021 || year > 2100 || month < 1 || month > 12) return null;

    const bounds =
      getJakartaMonthBounds(
        year,
        month,
      );

    if (!bounds) {
      return null;
    }

    return {
      start:
        bounds.start,
      endExclusive:
        bounds.endExclusive,
      label: monthLabel(year, month),
      filename: `laporan-keuangan-${year}-${String(month).padStart(2, "0")}.pdf`,
    };
  }

  if (period === "year") {
    const year = Number(url.searchParams.get("year"));
    if (!Number.isInteger(year) || year < 2021 || year > 2100) return null;

    const bounds =
      getJakartaYearBounds(
        year,
      );

    if (!bounds) {
      return null;
    }

    return {
      start:
        bounds.start,
      endExclusive:
        bounds.endExclusive,
      label: `1 Januari ${year} - 31 Desember ${year}`,
      filename: `laporan-keuangan-${year}.pdf`,
    };
  }

  if (period === "custom") {
    const startRaw = url.searchParams.get("start") || "";
    const endRaw = url.searchParams.get("end") || "";
    if (!isDateString(startRaw) || !isDateString(endRaw)) return null;

    const start =
      getJakartaDateStart(
        startRaw,
      );

    const endExclusive =
      getJakartaNextDayStart(
        endRaw,
      );

    if (
      !start ||
      !endExclusive ||
      start.getTime() >=
        endExclusive.getTime()
    ) {
      return null;
    }

    return {
      start,
      endExclusive,
      label: `${fullDateLabel(startRaw)} - ${fullDateLabel(endRaw)}`,
      filename: `laporan-keuangan-${startRaw}-sampai-${endRaw}.pdf`,
    };
  }

  return null;
}



export async function GET(request: Request) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const period = parsePeriod(new URL(request.url));
  if (!period) {
    return new Response("Periode laporan tidak valid.", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const openingBalance =
    await getFinanceOpeningBalanceAt(
      period.start,
    );

  const rows = await db
    .select({
      id: financialTransactions.id,
      date: financialTransactions.date,
      type: financialTransactions.type,
      amount: financialTransactions.amount,
      description: financialTransactions.description,
      programName: programs.name,
      createdAt: financialTransactions.createdAt,
    })
    .from(financialTransactions)
    .leftJoin(programs, eq(financialTransactions.programId, programs.id))
    .where(
      and(
        isNull(financialTransactions.deletedAt),
        gte(financialTransactions.date, period.start),
        lt(financialTransactions.date, period.endExclusive),
      ),
    )
    .orderBy(
      asc(financialTransactions.date),
      asc(financialTransactions.createdAt),
    );

  let totalIn = 0;
  let totalOut = 0;

  const reportRows = rows.map((row) => {
    const amount = Number(row.amount);
    if (row.type === "IN") totalIn += amount;
    else totalOut += amount;

    return {
      date: row.date,
      type: row.type,
      description: row.description,
      programName: row.programName,
      amount,
    };
  });

  const closingBalance = openingBalance + totalIn - totalOut;

  const bytes = await buildFinanceReportPdf({
    periodLabel: period.label,
    generatedAt: new Date(),
    openingBalance,
    totalIn,
    totalOut,
    closingBalance,
    rows: reportRows,
  });

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${period.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
