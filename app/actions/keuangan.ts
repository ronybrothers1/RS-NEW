"use server";

import { db } from "@/src/db";
import { financialTransactions, auditLogs } from "@/src/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createTransaksiMasuk(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const dateStr = formData.get("date") as string;
  const donorName = formData.get("donorName") as string;
  const amountStr = formData.get("amount") as string;
  const description = (formData.get("description") as string) || "Penerimaan Donasi";

  if (!dateStr || !donorName || !amountStr) {
    return { success: false, error: "Semua field wajib diisi." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "Nominal tidak valid." };
  }

  try {
    const [newTrx] = await db.insert(financialTransactions).values({
      type: 'IN',
      amount: amount.toString(),
      date: new Date(dateStr),
      description,
      donorName,
      userId: session.user.id,
    }).returning();

    // Audit Log
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'financial_transactions',
      recordId: newTrx.id,
      newData: newTrx,
    });

    revalidatePath('/admin/keuangan');
    revalidatePath('/admin/dashboard');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menyimpan transaksi." };
  }
}

export async function createTransaksiKeluar(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const dateStr = formData.get("date") as string;
  const programId = formData.get("programId") as string; // Currently holds string value like "Bantuan Sembako"
  const amountStr = formData.get("amount") as string;
  let description = formData.get("description") as string;

  if (!dateStr || !description || !amountStr || !programId) {
    return { success: false, error: "Semua field wajib diisi." };
  }
  
  let realProgramId = null;
  if (programId && programId !== "other") {
    const { programs } = await import("@/src/db/schema");
    const [prog] = await db.select().from(programs).where(eq(programs.name, programId));
    if (prog) {
      realProgramId = prog.id;
    }
    description = `[${programId}] ${description}`;
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "Nominal tidak valid." };
  }

  try {
    const [newTrx] = await db.insert(financialTransactions).values({
      type: 'OUT',
      amount: amount.toString(),
      date: new Date(dateStr),
      description,
      programId: realProgramId,
      userId: session.user.id,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'financial_transactions',
      recordId: newTrx.id,
      newData: newTrx,
    });

    revalidatePath('/admin/keuangan');
    revalidatePath('/admin/dashboard');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menyimpan transaksi." };
  }
}

export async function deleteTransaksi(id: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    return { success: false, error: "Unauthorized. Hanya admin yang bisa menghapus transaksi." };
  }

  try {
    const [oldData] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id));
    if (!oldData) {
      return { success: false, error: "Transaksi tidak ditemukan." };
    }

    await db.update(financialTransactions)
      .set({ deletedAt: new Date() })
      .where(eq(financialTransactions.id, id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'SOFT_DELETE',
      tableName: 'financial_transactions',
      recordId: id,
      oldData: oldData,
    });

    revalidatePath('/admin/keuangan');
    revalidatePath('/admin/dashboard');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menghapus transaksi." };
  }
}
