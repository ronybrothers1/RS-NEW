"use server";

import { db } from "@/src/db";
import { donations } from "@/src/db/schema";
import { redirect } from "next/navigation";

export async function submitDonation(prevState: any, formData: FormData) {
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
    // Note: In a real app we'd upload the file to a cloud bucket (e.g. Supabase Storage / S3).
    // For this prototype, we'll store a mock URL since we don't have object storage configured.
    const mockImageUrl = `/uploads/mock-proof-${Date.now()}.png`;

    await db.insert(donations).values({
      donorName,
      amount: amount.toString(),
      programId,
      paymentMethod,
      isAnonymous,
      proofImage: mockImageUrl,
      status: 'PENDING',
    });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: "Gagal memproses donasi. Silakan coba lagi." };
  }
}
