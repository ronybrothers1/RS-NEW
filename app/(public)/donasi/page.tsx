import { db } from "@/src/db";
import { programs, settings } from "@/src/db/schema";
import { eq } from "drizzle-orm";

import DonasiClientForm from "./components/DonasiClientForm";

export const dynamic = 'force-dynamic';

export default async function DonasiPage() {
  const activePrograms = await db
    .select()
    .from(programs)
    .where(eq(programs.status, 'ACTIVE'));
    
  // Fetch settings to pass dynamic bank accounts
  const settingsData = await db.select().from(settings);
  const settingsMap = settingsData.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const bankAccounts = {
    BCA: settingsMap.bank_bca || '',
    MANDIRI: settingsMap.bank_mandiri || '',
    BSI: settingsMap.bank_bsi || '',
    BRI: settingsMap.bank_bri || '',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      
      <div className="bg-slate-950 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-900/40 via-slate-950 to-slate-950 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 relative z-10">Mulai Berbagi Kebaikan</h1>
          <p className="text-slate-400 relative z-10 text-lg md:text-xl max-w-2xl mx-auto">
            Setiap rupiah yang Anda berikan adalah harapan baru bagi mereka yang membutuhkan.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-10">
          <DonasiClientForm programs={activePrograms} bankAccounts={bankAccounts} />
        </div>
      </div>
    </div>
  );
}
