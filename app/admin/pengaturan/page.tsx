import { db } from "@/src/db";
import { settings } from "@/src/db/schema";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PengaturanForm from "./components/PengaturanForm";
import { ShieldAlert } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminPengaturanPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2">Hanya Admin yang memiliki akses ke halaman pengaturan.</p>
      </div>
    );
  }

  const settingsData = await db.select().from(settings);
  const settingsMap = settingsData.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola profil yayasan dan informasi rekening donasi.</p>
      </div>

      <PengaturanForm initialData={settingsMap} />
    </div>
  );
}
