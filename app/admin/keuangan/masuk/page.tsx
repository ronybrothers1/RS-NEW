import {
  ArrowUpRight,
} from "lucide-react";
import {
  asc,
  eq,
} from "drizzle-orm";

import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import TransaksiMasukForm from "../components/TransaksiMasukForm";

export const dynamic = "force-dynamic";

export default async function UangMasukPage() {
  const activePrograms = await db
    .select({
      id: programs.id,
      name: programs.name,
    })
    .from(programs)
    .where(
      eq(programs.status, "ACTIVE"),
    )
    .orderBy(asc(programs.name));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowUpRight className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Catat Uang Masuk
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Catat donasi manual atau
              penerimaan dana lainnya.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <TransaksiMasukForm
          programs={activePrograms}
        />
      </div>
    </div>
  );
}