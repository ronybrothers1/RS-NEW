import dotenv from "dotenv";
import { eq } from "drizzle-orm";

async function main() {
  dotenv.config({ path: ".env.local" });
  dotenv.config();

  const { db } = await import("../src/db/index");
  const { programs } = await import("../src/db/schema");

  const rows = await db
    .select({ id: programs.id, name: programs.name })
    .from(programs);

  const merakyat = rows.filter((row) =>
    row.name.trim().toLowerCase().startsWith("merakyat"),
  );
  const rehat = rows.filter((row) =>
    row.name.trim().toLowerCase().startsWith("rehat"),
  );

  if (merakyat.length !== 1) {
    throw new Error(`Master program Merakyat harus tepat 1 baris, ditemukan ${merakyat.length}.`);
  }
  if (rehat.length !== 1) {
    throw new Error(`Master program REHAT harus tepat 1 baris, ditemukan ${rehat.length}.`);
  }

  const canonicalMerakyat = "Merakyat (Mabecce' Usahanah Rakyat)";
  const canonicalRehat = "REHAT (Renovasi Hunian Rakyat)";

  if (merakyat[0].name !== canonicalMerakyat) {
    await db
      .update(programs)
      .set({ name: canonicalMerakyat })
      .where(eq(programs.id, merakyat[0].id));
  }

  if (rehat[0].name !== canonicalRehat) {
    await db
      .update(programs)
      .set({ name: canonicalRehat })
      .where(eq(programs.id, rehat[0].id));
  }

  const verified = await db
    .select({ id: programs.id, name: programs.name })
    .from(programs);

  const names = new Set(verified.map((row) => row.name));
  if (!names.has(canonicalMerakyat) || !names.has(canonicalRehat)) {
    throw new Error("Verifikasi nama master program gagal.");
  }

  console.log("[PASS] Merakyat ->", canonicalMerakyat);
  console.log("[PASS] REHAT ->", canonicalRehat);
}

main().catch((error) => {
  console.error("Remediasi nama program gagal:", error);
  process.exitCode = 1;
});
