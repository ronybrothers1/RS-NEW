"use server";

import { db } from "@/src/db";
import { donations, financialTransactions, auditLogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function verifyDonation(donationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Get donation data
    const [donation] = await db.select().from(donations).where(eq(donations.id, donationId));
    if (!donation) {
      return { success: false, error: "Donasi tidak ditemukan." };
    }
    if (donation.status !== 'PENDING') {
      return { success: false, error: "Donasi sudah diproses sebelumnya." };
    }

    // 2. Update donation status to SUCCESS
    await db.update(donations)
      .set({ status: 'SUCCESS' })
      .where(eq(donations.id, donationId));

    // 3. Create financial transaction (Uang Masuk)
    const [newTrx] = await db.insert(financialTransactions).values({
      type: 'IN',
      amount: donation.amount,
      date: new Date(),
      description: `Donasi via Website - ${donation.paymentMethod || 'Transfer'}`,
      programId: donation.programId,
      userId: session.user.id,
      donorName: donation.donorName,
      isAnonymous: donation.isAnonymous,
    }).returning();

    // 4. Audit Log
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'VERIFY_DONATION',
      tableName: 'donations',
      recordId: donation.id,
      newData: { status: 'SUCCESS', transactionId: newTrx.id },
    });

    revalidatePath('/admin/donasi');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/keuangan/masuk');
    revalidatePath('/admin/keuangan/riwayat');
    revalidatePath('/transparansi');
    
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal memverifikasi donasi." };
  }
}

export async function rejectDonation(donationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.update(donations)
      .set({ status: 'FAILED' })
      .where(eq(donations.id, donationId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'REJECT_DONATION',
      tableName: 'donations',
      recordId: donationId,
      newData: { status: 'FAILED' },
    });

    revalidatePath('/admin/donasi');
    revalidatePath('/admin/dashboard');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menolak donasi." };
  }
}
