import dotenv from "dotenv";
import {
  del,
  put,
} from "@vercel/blob";
import {
  eq,
} from "drizzle-orm";
import {
  createHash,
} from "node:crypto";

async function main() {
  dotenv.config({
    path: ".env.local",
  });
  dotenv.config();

  const {
    db,
  } = await import(
    "../src/db/index"
  );

  const {
    donations,
  } = await import(
    "../src/db/schema"
  );

  const {
    DONATION_PROOF_BASE_PATH,
    DONATION_PROOF_MAX_SIZE,
    DONATION_PROOF_TYPES,
    getDonationProofBlobToken,
    isLegacyPublicDonationProofUrl,
    isPrivateDonationProofUrl,
  } = await import(
    "../lib/donation-proof-media"
  );

  const privateToken =
    getDonationProofBlobToken();

  if (!privateToken) {
    throw new Error(
      "ASSISTANCE_READ_WRITE_TOKEN belum tersedia; migrasi bukti donasi dihentikan.",
    );
  }

  const publicToken =
    process.env
      .BLOB_READ_WRITE_TOKEN
      ?.trim() ||
    null;

  const allowedTypes =
    new Set<string>(
      DONATION_PROOF_TYPES,
    );

  const rows =
    await db
      .select({
        id: donations.id,
        proofImage:
          donations.proofImage,
      })
      .from(donations);

  let migrated = 0;
  let skipped = 0;
  let deleteWarnings = 0;

  for (
    const row of
    rows
  ) {
    const source =
      row.proofImage?.trim();

    if (!source) {
      skipped += 1;
      continue;
    }

    if (
      isPrivateDonationProofUrl(
        source,
      )
    ) {
      skipped += 1;
      continue;
    }

    if (
      !isLegacyPublicDonationProofUrl(
        source,
      )
    ) {
      console.warn(
        `[WARN] Donasi ${row.id}: format bukti lama tidak dikenali, dilewati.`,
      );
      skipped += 1;
      continue;
    }

    const response =
      await fetch(
        source,
        {
          cache:
            "no-store",
        },
      );

    if (!response.ok) {
      throw new Error(
        `Donasi ${row.id}: bukti publik tidak dapat dibaca (HTTP ${response.status}).`,
      );
    }

    const contentType =
      (
        response.headers.get(
          "content-type",
        ) ||
        ""
      )
        .split(";")[0]
        .trim()
        .toLowerCase();

    if (
      !allowedTypes.has(
        contentType,
      )
    ) {
      throw new Error(
        `Donasi ${row.id}: content-type ${contentType || "(kosong)"} tidak diizinkan.`,
      );
    }

    const bytes =
      await response.arrayBuffer();

    if (
      bytes.byteLength >
      DONATION_PROOF_MAX_SIZE
    ) {
      throw new Error(
        `Donasi ${row.id}: ukuran bukti melebihi batas 5 MB.`,
      );
    }

    const digest =
      createHash(
        "sha256",
      )
        .update(
          Buffer.from(
            bytes,
          ),
        )
        .digest(
          "hex",
        );

    const extension =
      contentType ===
        "image/png"
        ? "png"
        : "jpg";

    const privateBlob =
      await put(
        `${DONATION_PROOF_BASE_PATH}/legacy-${row.id}-${digest.slice(0, 16)}.${extension}`,
        bytes,
        {
          access:
            "private",
          token:
            privateToken,
          contentType,
          addRandomSuffix:
            true,
        },
      );

    await db
      .update(donations)
      .set({
        proofImage:
          privateBlob.url,
      })
      .where(
        eq(
          donations.id,
          row.id,
        ),
      );

    migrated += 1;

    if (publicToken) {
      try {
        await del(
          source,
          {
            token:
              publicToken,
          },
        );
      } catch (error) {
        deleteWarnings +=
          1;
        console.warn(
          `[WARN] Donasi ${row.id}: DB sudah memakai private blob, tetapi public blob lama belum dapat dihapus.`,
          error,
        );
      }
    } else {
      deleteWarnings +=
        1;
      console.warn(
        `[WARN] Donasi ${row.id}: BLOB_READ_WRITE_TOKEN tidak tersedia, public blob lama belum dihapus.`,
      );
    }

    console.log(
      `[MIGRATED] Donasi ${row.id}`,
    );
  }

  console.log(
    "\n============================================",
  );
  console.log(
    "MIGRASI BUKTI DONASI PRIVATE",
  );
  console.log(
    "============================================",
  );
  console.log(
    `Migrated       : ${migrated}`,
  );
  console.log(
    `Skipped        : ${skipped}`,
  );
  console.log(
    `Delete warnings: ${deleteWarnings}`,
  );

  if (
    deleteWarnings >
    0
  ) {
    console.log(
      "Catatan: URL yang tersimpan di database sudah private. Warning hanya terkait penghapusan blob publik lama.",
    );
  }

}

main().catch((error) => {
  console.error("Migrasi bukti donasi gagal:", error);
  process.exitCode = 1;
});
