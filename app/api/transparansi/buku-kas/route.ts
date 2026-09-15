import {
  and,
  asc,
  eq,
  gte,
  isNull,
  lt,
} from "drizzle-orm";

import {
  buildPublicCashbookUraian,
  getPublicCashbook,
} from "@/lib/public-cashbook";
import {
  buildPublicCashbookPdf,
} from "@/lib/public-cashbook-pdf";
import { db } from "@/src/db";
import {
  financialTransactions,
  programs,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export async function GET(
  request: Request,
) {
  const url =
    new URL(
      request.url,
    );

  if (
    url.searchParams.has(
      "month",
    )
  ) {
    return new Response(
      "Parameter periode tidak didukung. Buku Kas publik hanya tersedia untuk bulan berjalan.",
      {
        status: 400,
        headers: {
          "Cache-Control":
            "no-store",
          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  }

  const cashbook =
    await getPublicCashbook();

  const transactions =
    await db
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
        and(
          isNull(
            financialTransactions.deletedAt,
          ),
          gte(
            financialTransactions.date,
            cashbook.period.start,
          ),
          lt(
            financialTransactions.date,
            cashbook.period.endExclusive,
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

  let runningBalance =
    cashbook.openingBalance;

  const rows =
    transactions.map(
      (transaction) => {
        const amount =
          Number(
            transaction.amount,
          );

        runningBalance +=
          transaction.type === "IN"
            ? amount
            : -amount;

        return {
          receiptNumber:
            transaction.receiptNumber,
          date:
            transaction.date,
          uraian:
            buildPublicCashbookUraian({
              type:
                transaction.type,
              category:
                transaction.category,
              description:
                transaction.description,
              donorName:
                transaction.donorName,
              isAnonymous:
                transaction.isAnonymous,
              programName:
                transaction.programName,
            }),
          income:
            transaction.type === "IN"
              ? amount
              : 0,
          expense:
            transaction.type === "OUT"
              ? amount
              : 0,
          balance:
            runningBalance,
        };
      },
    );

  const bytes =
    await buildPublicCashbookPdf({
      periodLabel:
        cashbook.period.label,
      openingBalance:
        cashbook.openingBalance,
      cashIn:
        cashbook.cashIn,
      cashOut:
        cashbook.cashOut,
      closingBalance:
        cashbook.closingBalance,
      generatedAt:
        new Date(),
      rows,
    });

  const filename =
    `buku-kas-ruang-sejahtera-${cashbook.period.value}.pdf`;

  return new Response(
    Buffer.from(
      bytes,
    ),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/pdf",
        "Content-Disposition":
          `attachment; filename="${filename}"`,
        "Cache-Control":
          "no-store",
        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}