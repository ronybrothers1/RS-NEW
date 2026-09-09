import { auth } from "@/auth";
import { db } from "@/src/db";
import {
  financialTransactions,
  programs,
  users,
} from "@/src/db/schema";
import {
  asc,
  desc,
  eq,
  isNull,
} from "drizzle-orm";

import RiwayatTransaksiClient from "../components/RiwayatTransaksiClient";

export const dynamic = "force-dynamic";

export default async function RiwayatTransaksiPage() {
  const session = await auth();

  const [transactionRows, programRows] =
    await Promise.all([
      db
        .select({
          id: financialTransactions.id,
          type: financialTransactions.type,
          amount:
            financialTransactions.amount,
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
        .where(
          isNull(
            financialTransactions.deletedAt,
          ),
        )
        .orderBy(
          desc(financialTransactions.date),
          desc(
            financialTransactions.createdAt,
          ),
        ),

      db
        .select({
          id: programs.id,
          name: programs.name,
          status: programs.status,
        })
        .from(programs)
        .orderBy(asc(programs.name)),
    ]);

  const role = (
    session?.user as
      | {
          role?: string;
        }
      | undefined
  )?.role;

  const transactions =
    transactionRows.map(
      (transaction) => ({
        ...transaction,
        date:
          transaction.date.toISOString(),
        createdAt:
          transaction.createdAt.toISOString(),
        updatedAt:
          transaction.updatedAt.toISOString(),
      }),
    );

  return (
    <RiwayatTransaksiClient
      transactions={transactions}
      programs={programRows}
      canDelete={role === "ADMIN"}
    />
  );
}