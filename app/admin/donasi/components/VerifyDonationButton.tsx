"use client";

import { useTransition } from "react";
import { verifyDonation, rejectDonation } from "@/app/actions/donasi-admin";
import { Check, X } from "lucide-react";

export default function VerifyDonationButton({ donationId }: { donationId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleVerify = () => {
    if (confirm("Verifikasi donasi ini? Dana akan otomatis masuk ke catatan kas masuk (Uang Masuk).")) {
      startTransition(async () => {
        const res = await verifyDonation(donationId);
        if (!res.success) {
          alert(res.error);
        }
      });
    }
  };

  const handleReject = () => {
    if (confirm("Tolak donasi ini?")) {
      startTransition(async () => {
        const res = await rejectDonation(donationId);
        if (!res.success) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={handleVerify}
        disabled={isPending}
        title="Verifikasi Donasi (Berhasil)"
        className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 disabled:opacity-50 transition-colors"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        title="Tolak Donasi"
        className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 disabled:opacity-50 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
