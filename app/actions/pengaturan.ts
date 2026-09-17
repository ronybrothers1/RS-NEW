"use server";

import { db } from "@/src/db";
import { settings, auditLogs } from "@/src/db/schema";
import { getCurrentDbUser } from "@/lib/current-authz";
import { PUBLIC_SETTINGS_CACHE_TAG } from "@/lib/public-settings";
import { revalidatePath, revalidateTag } from "next/cache";

export async function saveSettings(prevState: any, formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user || user.role !== 'ADMIN') {
    return {
      success: false,
      error: "Unauthorized. Hanya ADMIN yang berhak mengubah pengaturan.",
    };
  }

  const keys = [
    'yayasan_name',
    'yayasan_phone',
    'yayasan_email',
    'yayasan_address',
    'bank_bca',
    'bank_mandiri',
    'bank_bsi',
    'bank_bri',
    'social_instagram',
    'social_facebook',
    'social_twitter',
    'social_tiktok',
  ];

  try {
    for (const key of keys) {
      const value = formData.get(key) as string;

      if (value !== null) {
        await db
          .insert(settings)
          .values({
            key,
            value: value.trim(),
            description: `Pengaturan ${key}`,
          })
          .onConflictDoUpdate({
            target: settings.key,
            set: {
              value: value.trim(),
              updatedAt: new Date(),
            },
          });
      }
    }

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'UPDATE_SETTINGS',
      tableName: 'settings',
      recordId: 'system',
      newData: { updatedKeys: keys },
    });

    revalidateTag(
      PUBLIC_SETTINGS_CACHE_TAG,
    );

    revalidatePath(
      '/',
      'layout',
    );

    return {
      success: true,
      error: null,
      message: "Pengaturan berhasil disimpan.",
    };
  } catch (error: any) {
    console.error("Save settings error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan pengaturan.",
      message: null,
    };
  }
}
