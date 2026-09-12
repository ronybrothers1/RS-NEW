import { auth } from "@/auth";
import { db } from "@/src/db";
import {
  financialTransactions,
  programs,
  users,
} from "@/src/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  sql,
} from "drizzle-orm";

import RiwayatTransaksiClient from "../components/RiwayatTransaksiClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const MAX_QUERY_LENGTH = 120;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TransactionTypeFilter =
  | "ALL"
  | "IN"
  | "OUT";

type TransactionHistorySearchParams = {
  page?: string | string[];
  q?: string | string[];
  type?: string | string[];
  program?: string | string[];
};

function getFirstParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function parsePositiveInteger(
  value: string | undefined,
) {
  const parsed = Number.parseInt(
    value ?? "1",
    10,
  );

  return Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : 1;
}

function parseTypeFilter(
  value: string | undefined,
): TransactionTypeFilter {
  const normalized = value?.toUpperCase();

  return normalized === "IN" ||
    normalized === "OUT"
    ? normalized
    : "ALL";
}

function parseProgramFilter(
  value: string | undefined,
) {
  if (value === "NONE") {
    return value;
  }

  return value && UUID_PATTERN.test(value)
    ? value
    : "ALL";
}

export default async function RiwayatTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<TransactionHistorySearchParams>;
}) {
  const rawSearchParams =
    await searchParams;

  const requestedPage =
    parsePositiveInteger(
      getFirstParam(rawSearchParams.page),
    );
  const query = (
    getFirstParam(rawSearchParams.q) ?? ""
  )
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
  const typeFilter = parseTypeFilter(
    getFirstParam(rawSearchParams.type),
  );
  const programFilter =
    parseProgramFilter(
      getFirstParam(rawSearchParams.program),
    );

  const conditions = [
    isNull(financialTransactions.deletedAt),
  ];

  if (typeFilter !== "ALL") {
    conditions.push(
      eq(
        financialTransactions.type,
        typeFilter,
      ),
    );
  }

  if (programFilter === "NONE") {
    conditions.push(
      isNull(financialTransactions.programId),
    );
  } else if (programFilter !== "ALL") {
    conditions.push(
      eq(
        financialTransactions.programId,
        programFilter,
      ),
    );
  }

  if (query) {
    conditions.push(sql<boolean>`
      strpos(
        lower(
          concat_ws(
            ' ',
            ${financialTransactions.description},
            coalesce(${financialTransactions.donorName}, ''),
            coalesce(
              ${programs.name},
              case
                when ${financialTransactions.programId} is null
                  then 'Umum'
                else ''
              end
            ),
            coalesce(${users.name}, '')
          )
        ),
        lower(${query})
      ) > 0
    `);
  }

  const whereCondition = and(
    ...conditions,
  );

  const [session, programRows, countRows] =
    await Promise.all([
      auth(),
      db
        .select({
          id: programs.id,
          name: programs.name,
          status: programs.status,
        })
        .from(programs)
        .orderBy(asc(programs.name)),
      db
        .select({
          total: count(),
        })
        .from(financialTransactions)
        .leftJoin(
          programs,
          eq(
            financialTransactions.programId,
            programs.id,
          ),
        )
        .leftJoin(
          users,
          eq(
            financialTransactions.userId,
            users.id,
          ),
        )
        .where(whereCondition),
    ]);

  const totalTransactions = Number(
    countRows[0]?.total ?? 0,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(
      totalTransactions / PAGE_SIZE,
    ),
  );
  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );
  const offset =
    (currentPage - 1) * PAGE_SIZE;

  const transactionRows = await db
    .select({
      id: financialTransactions.id,
      type: financialTransactions.type,
      amount: financialTransactions.amount,
      date: financialTransactions.date,
      description:
        financialTransactions.description,
      programId:
        financialTransactions.programId,
      programName: programs.name,
      programStatus: programs.status,
      donationId:
        financialTransactions.donationId,
      donorName:
        financialTransactions.donorName,
      isAnonymous:
        financialTransactions.isAnonymous,
      userName: users.name,
      createdAt:
        financialTransactions.createdAt,
      updatedAt:
        financialTransactions.updatedAt,
    })
    .from(financialTransactions)
    .leftJoin(
      programs,
      eq(
        financialTransactions.programId,
        programs.id,
      ),
    )
    .leftJoin(
      users,
      eq(
        financialTransactions.userId,
        users.id,
      ),
    )
    .where(whereCondition)
    .orderBy(
      desc(financialTransactions.date),
      desc(financialTransactions.createdAt),
      desc(financialTransactions.id),
    )
    .limit(PAGE_SIZE)
    .offset(offset);

  const role = (
    session?.user as
      | {
          role?: string;
        }
      | undefined
  )?.role;

  const transactions = transactionRows.map(
    (transaction) => ({
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt:
        transaction.createdAt.toISOString(),
      updatedAt:
        transaction.updatedAt.toISOString(),
    }),
  );

  return (
    <RiwayatTransaksiClient
      key={`${query}:${typeFilter}:${programFilter}`}
      transactions={transactions}
      programs={programRows}
      canDelete={role === "ADMIN"}
      filters={{
        query,
        type: typeFilter,
        program: programFilter,
      }}
      pagination={{
        currentPage,
        pageSize: PAGE_SIZE,
        totalItems: totalTransactions,
        totalPages,
      }}
    />
  );
}
