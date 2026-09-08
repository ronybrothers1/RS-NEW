"use server";

import { db } from "@/src/db";
import { donations } from "@/src/db/schema";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitDonation(prevState: any, formData: FormData) {
  // Use IP for rate limiting (5 submissions per minute)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown-ip";
  const { success: rateLimitSuccess } = rateLimit(`donation-submit-${ip}`, 5, 60 * 1000); 
  
  if (!rateLimitSuccess) {
    return { success: false, error: "Terlalu banyak permintaan donasi. Silakan coba beberapa saat lagi." };
  }

  const donorName = formData.get("donorName") as string;
  const amountStr = formData.get("amount") as string;
  const programId = formData.get("programId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;
  const isAnonymous = formData.get("isAnonymous") === "on";
  const proofImage = formData.get("proofImage") as File;
  
  if (!donorName || !amountStr || !programId || !paymentMethod) {
    return { success: false, error: "Semua field wajib diisi." };
  }
  
  if (!proofImage || proofImage.size === 0) {
    return { success: false, error: "Bukti transfer wajib diunggah." };
  }

  const amount = parseInt(amountStr.replace(/\D/g, ''), 10);
  if (isNaN(amount) || amount < 10000) {
    return { success: false, error: "Minimal donasi adalah Rp 10.000." };
  }

  try {
    let imageUrl = "";
    if (proofImage && proofImage.size > 0) {
      // Validate file size (e.g., max 5MB)
      if (proofImage.size > 5 * 1024 * 1024) {
        return { success: false, error: "Ukuran gambar maksimal 5MB." };
      }
      const buffer = await proofImage.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = proofImage.type;
      imageUrl = `data:${mimeType};base64,${base64}`;
    }

    await db.insert(donations).values({
      donorName,
      amount: amount.toString(),
      programId,
      paymentMethod,
      isAnonymous,
      proofImage: imageUrl,
      status: 'PENDING',
    });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: "Gagal memproses donasi. Silakan coba lagi." };
  }
}
