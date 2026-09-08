"use server";

import { db } from "@/src/db";
import { settings, auditLogs } from "@/src/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveSettings(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    return { success: false, error: "Unauthorized. Hanya ADMIN yang berhak mengubah pengaturan." };
  }

  const keys = [
    'yayasan_name', 
    'yayasan_phone', 
    'yayasan_email', 
    'yayasan_address', 
    'bank_bca', 
    'bank_mandiri', 
    'bank_bsi'
  ];
  
  try {
    for (const key of keys) {
      const value = formData.get(key) as string;
      if (value !== null) {
        await db.insert(settings)
          .values({ key, value, description: `Pengaturan ${key}` })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value, updatedAt: new Date() }
          });
      }
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'UPDATE_SETTINGS',
      tableName: 'settings',
      recordId: 'system',
      newData: { updatedKeys: keys },
    });

    // Revalidate paths that use settings
    revalidatePath('/', 'layout');
    
    return { success: true, message: "Pengaturan berhasil disimpan." };
  } catch (error: any) {
    console.error("Save settings error:", error);
    return { success: false, error: "Terjadi kesalahan saat menyimpan pengaturan." };
  }
}
