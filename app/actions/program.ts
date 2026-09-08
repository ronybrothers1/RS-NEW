"use server";

import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createProgram(formData: FormData) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return { success: false, error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;
  const targetAmount = formData.get("targetAmount") as string;

  if (!name || !icon) {
    return { success: false, error: "Nama dan Ikon program wajib diisi." };
  }

  try {
    await db.insert(programs).values({
      name,
      description,
      icon,
      targetAmount: targetAmount ? targetAmount.replace(/\D/g, '') : null,
      status: 'ACTIVE',
    });

    revalidatePath("/admin/program");
    revalidatePath("/program");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan saat menyimpan program." };
  }
}

export async function deleteProgram(id: string) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Soft delete or status change is preferable. The schema enum only supports ACTIVE and INACTIVE.
    // Let's update status to INACTIVE instead of hard delete to prevent foreign key errors with donations.
    await db.update(programs).set({ status: 'INACTIVE' }).where(eq(programs.id, id));
    
    revalidatePath("/admin/program");
    revalidatePath("/program");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal menghapus program." };
  }
}
