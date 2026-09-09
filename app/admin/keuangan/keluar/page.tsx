import {
  ArrowDownRight,
} from "lucide-react";
import {
  asc,
  eq,
} from "drizzle-orm";

import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import TransaksiKeluarForm from "../components/TransaksiKeluarForm";

export const dynamic = "force-dynamic";

export default async function UangKeluarPage() {
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ArrowDownRight className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Catat Uang Keluar
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Catat pengeluaran yayasan
              berdasarkan program atau
              kebutuhan operasional.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <TransaksiKeluarForm
          programs={activePrograms}
        />
      </div>
    </div>
  );
}