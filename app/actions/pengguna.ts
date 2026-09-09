"use server";

import { db } from "@/src/db";
import { users, auditLogs } from "@/src/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function createUser(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    return { success: false, error: "Unauthorized. Hanya admin yang dapat menambah pengguna." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "OPERATOR";

  if (!name || !email || !password || !role) {
    return { success: false, error: "Semua field wajib diisi." };
  }

  if (role !== "ADMIN" && role !== "OPERATOR") {
    return {
      success: false,
      error: "Role pengguna internal tidak valid.",
    };
  }

  if (password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter." };
  }

  try {
    const passwordHash = await hash(password, 10);
    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'users',
      recordId: newUser.id,
      newData: { id: newUser.id, email: newUser.email, role: newUser.role },
    });

    revalidatePath('/admin/pengguna');
    return { success: true, error: null };
  } catch (err: any) {
    if (err.code === '23505') {
       return { success: false, error: "Email sudah terdaftar." };
    }
    return { success: false, error: "Gagal menyimpan pengguna." };
  }
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    return { success: false, error: "Unauthorized." };
  }

  if (session.user.id === id) {
    return { success: false, error: "Tidak dapat menghapus akun Anda sendiri." };
  }

  try {
    const [oldData] = await db.select().from(users).where(eq(users.id, id));
    if (!oldData) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    await db.delete(users).where(eq(users.id, id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'DELETE',
      tableName: 'users',
      recordId: id,
      oldData: { id: oldData.id, email: oldData.email },
    });

    revalidatePath('/admin/pengguna');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menghapus pengguna. Pengguna memiliki riwayat aktivitas (berita/transaksi) yang tidak boleh dihapus." };
  }
}
