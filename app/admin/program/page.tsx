import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import { auth } from "@/auth";
import { desc } from "drizzle-orm";
import { ShieldAlert, Plus } from "lucide-react";
import Link from "next/link";
import ProgramList from "./components/ProgramList";

export const dynamic = 'force-dynamic';

export default async function AdminProgramPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2">Hanya Admin yang memiliki akses ke halaman manajemen program.</p>
      </div>
    );
  }

  const allPrograms = await db.select().from(programs).orderBy(desc(programs.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Program Utama</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola daftar program sosial yang aktif di yayasan.</p>
        </div>
        <Link 
          href="/admin/program/tambah" 
          className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Program Baru
        </Link>
      </div>

      <ProgramList programs={allPrograms} />
    </div>
  );
}
