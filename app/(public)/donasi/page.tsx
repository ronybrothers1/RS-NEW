import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";

import { db } from "@/src/db";
import { createPageMetadata } from "@/lib/seo-metadata";
import {
  programs,
  settings,
} from "@/src/db/schema";

import DonasiClientForm from "./components/DonasiClientForm";
import DonationStatusChecker from "./components/DonationStatusChecker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Donasi",
  description:
    "Dukung program Yayasan Ruang Sejahtera melalui formulir donasi resmi, unggah bukti transfer, dan pantau status verifikasi dengan nomor registrasi.",
  path: "/donasi",
});

export default async function DonasiPage() {
  const [
    activePrograms,
    settingsData,
  ] = await Promise.all([
    db
      .select({
        id: programs.id,
        name: programs.name,
      })
      .from(programs)
      .where(
        eq(
          programs.status,
          "ACTIVE",
        ),
      )
      .orderBy(asc(programs.name)),

    db
      .select({
        key: settings.key,
        value: settings.value,
      })
      .from(settings),
  ]);

  const settingsMap =
    settingsData.reduce(
      (acc, item) => {
        acc[item.key] =
          item.value;
        return acc;
      },
      {} as Record<string, string>,
    );

  const bankAccounts = {
    BCA:
      settingsMap.bank_bca || "",
    MANDIRI:
      settingsMap.bank_mandiri || "",
    BSI:
      settingsMap.bank_bsi || "",
    BRI:
      settingsMap.bank_bri || "",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-900/40 via-slate-950 to-slate-950" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-white md:text-5xl">
            Mulai Berbagi Kebaikan
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Pilih program, lakukan
            transfer ke rekening resmi
            Yayasan Ruang Sejahtera,
            kemudian kirim bukti untuk
            diverifikasi.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl md:p-10">
            <DonasiClientForm
              programs={activePrograms}
              bankAccounts={
                bankAccounts
              }
            />
          </div>

          <div
            id="cek-status"
            className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <DonationStatusChecker />
          </div>
        </div>
      </section>
    </div>
  );
}
