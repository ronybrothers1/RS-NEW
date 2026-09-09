import {
  desc,
  eq,
} from "drizzle-orm";

import { db } from "@/src/db";
import {
  donations,
  financialTransactions,
  programs,
} from "@/src/db/schema";

import AdminDonasiClient from "./components/AdminDonasiClient";

export const dynamic = "force-dynamic";

export default async function AdminDonasiPage() {
  const rows = await db
    .select({
      id: donations.id,
      donorName:
        donations.donorName,
      amount: donations.amount,
      programId:
        donations.programId,
      programName:
        programs.name,
      status: donations.status,
      paymentMethod:
        donations.paymentMethod,
      isAnonymous:
        donations.isAnonymous,
      createdAt:
        donations.createdAt,
      linkedTransactionId:
        financialTransactions.id,
    })
    .from(donations)
    .leftJoin(
      programs,
      eq(
        donations.programId,
        programs.id,
      ),
    )
    .leftJoin(
      financialTransactions,
      eq(
        financialTransactions.donationId,
        donations.id,
      ),
    )
    .orderBy(
      desc(donations.createdAt),
    );

  const donationList = rows.map(
    (donation) => ({
      ...donation,
      createdAt:
        donation.createdAt.toISOString(),
    }),
  );

  return (
    <AdminDonasiClient
      donations={donationList}
    />
  );
}