import {
  get,
  head,
} from "@vercel/blob";

import {
  getAssistanceBlobToken,
} from "@/lib/assistance-media";

export const DONATION_PROOF_BASE_PATH =
  "media/donasi";

export const DONATION_PROOF_MAX_SIZE =
  5 * 1024 * 1024;

export const DONATION_PROOF_TYPES =
  [
    "image/jpeg",
    "image/png",
  ] as const;

const allowedTypes =
  new Set<string>(
    DONATION_PROOF_TYPES,
  );

export function getDonationProofBlobToken() {
  return getAssistanceBlobToken();
}

export function isPrivateDonationProofUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    if (
      url.protocol !==
        "https:" ||
      !url.hostname.endsWith(
        ".private.blob.vercel-storage.com",
      )
    ) {
      return false;
    }

    const pathname =
      decodeURIComponent(
        url.pathname.replace(
          /^\/+/, 
          "",
        ),
      );

    return pathname.startsWith(
      `${DONATION_PROOF_BASE_PATH}/`,
    );
  } catch {
    return false;
  }
}

export function isLegacyPublicDonationProofUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    if (
      url.protocol !==
        "https:" ||
      !url.hostname.endsWith(
        ".public.blob.vercel-storage.com",
      )
    ) {
      return false;
    }

    const pathname =
      decodeURIComponent(
        url.pathname.replace(
          /^\/+/, 
          "",
        ),
      );

    return pathname.startsWith(
      `${DONATION_PROOF_BASE_PATH}/`,
    );
  } catch {
    return false;
  }
}

export async function validatePrivateDonationProof(
  value: string,
) {
  if (
    !isPrivateDonationProofUrl(
      value,
    )
  ) {
    return {
      success: false as const,
      error:
        "Bukti transfer tidak valid. Silakan unggah ulang.",
    };
  }

  const token =
    getDonationProofBlobToken();

  if (!token) {
    return {
      success: false as const,
      error:
        "Penyimpanan bukti transfer belum tersedia.",
    };
  }

  try {
    const metadata =
      await head(
        value,
        {
          token,
        },
      );

    if (
      !allowedTypes.has(
        metadata.contentType,
      )
    ) {
      return {
        success: false as const,
        error:
          "Format bukti transfer tidak valid.",
      };
    }

    if (
      metadata.size >
      DONATION_PROOF_MAX_SIZE
    ) {
      return {
        success: false as const,
        error:
          "Ukuran bukti transfer melebihi 5 MB.",
      };
    }

    if (
      !metadata.pathname.startsWith(
        `${DONATION_PROOF_BASE_PATH}/`,
      )
    ) {
      return {
        success: false as const,
        error:
          "Lokasi bukti transfer tidak valid.",
      };
    }

    return {
      success: true as const,
      metadata,
    };
  } catch (error) {
    console.error(
      "Private donation proof validation error:",
      error,
    );

    return {
      success: false as const,
      error:
        "Bukti transfer tidak dapat diverifikasi. Silakan unggah ulang.",
    };
  }
}

export async function getDonationProofForStaff(
  value: string,
) {
  if (
    isPrivateDonationProofUrl(
      value,
    )
  ) {
    const token =
      getDonationProofBlobToken();

    if (!token) {
      return null;
    }

    const result =
      await get(
        value,
        {
          access:
            "private",
          token,
        },
      );

    if (
      !result ||
      result.statusCode !==
        200 ||
      !result.stream
    ) {
      return null;
    }

    return {
      stream:
        result.stream,
      contentType:
        result.blob
          .contentType ||
        "application/octet-stream",
    };
  }

  if (
    isLegacyPublicDonationProofUrl(
      value,
    )
  ) {
    const response =
      await fetch(
        value,
        {
          cache:
            "no-store",
        },
      );

    if (
      !response.ok ||
      !response.body
    ) {
      return null;
    }

    return {
      stream:
        response.body,
      contentType:
        response.headers.get(
          "content-type",
        ) ||
        "application/octet-stream",
    };
  }

  return null;
}
