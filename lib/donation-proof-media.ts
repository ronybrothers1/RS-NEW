import type {
  StorageMetadata,
} from "@/lib/storage/contracts";
import {
  createGoogleDriveStorage,
  getGoogleDriveFileId,
  GOOGLE_DRIVE_LOCATOR_PREFIX,
  type GoogleDriveStorageAdapter,
} from "@/lib/storage/providers/google-drive";
import {
  createVercelBlobStorage,
} from "@/lib/storage/providers/vercel-blob";
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

type GoogleDriveDonationConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
};

function getGoogleDriveDonationConfig():
  GoogleDriveDonationConfig | null {
  const clientId =
    process.env
      .GOOGLE_DRIVE_CLIENT_ID
      ?.trim();

  const clientSecret =
    process.env
      .GOOGLE_DRIVE_CLIENT_SECRET
      ?.trim();

  const refreshToken =
    process.env
      .GOOGLE_DRIVE_REFRESH_TOKEN
      ?.trim();

  const folderId =
    process.env
      .GOOGLE_DRIVE_DONATION_FOLDER_ID
      ?.trim();

  if (
    !clientId ||
    !clientSecret ||
    !refreshToken ||
    !folderId
  ) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    folderId,
  };
}

function getDonationProofGoogleDriveStorage(
  config:
    GoogleDriveDonationConfig,
): GoogleDriveStorageAdapter {
  return createGoogleDriveStorage({
    clientId:
      config.clientId,
    clientSecret:
      config.clientSecret,
    refreshToken:
      config.refreshToken,
  });
}

export function isDonationProofGoogleDriveConfigured() {
  return Boolean(
    getGoogleDriveDonationConfig(),
  );
}

export async function createDonationProofUploadSession(
  input: {
    filename: string;
    contentType: string;
    size: number;
  },
) {
  const config =
    getGoogleDriveDonationConfig();

  if (!config) {
    throw new Error(
      "Penyimpanan Google Drive bukti transfer belum dikonfigurasi.",
    );
  }

  const storage =
    getDonationProofGoogleDriveStorage(
      config,
    );

  return storage
    .createResumableUploadSession({
      folderId:
        config.folderId,
      filename:
        input.filename,
      contentType:
        input.contentType,
      size:
        input.size,
    });
}

export async function deleteGoogleDriveDonationProof(
  value: string,
) {
  const config =
    getGoogleDriveDonationConfig();

  if (!config) {
    throw new Error(
      "Penyimpanan bukti transfer belum tersedia.",
    );
  }

  const locator =
    value.trim();

  if (
    !isGoogleDriveDonationProofLocator(
      locator,
    )
  ) {
    throw new Error(
      "Bukti transfer Google Drive tidak valid.",
    );
  }

  const storage =
    getDonationProofGoogleDriveStorage(
      config,
    );

  const parents =
    await storage.getParents(
      locator,
    );

  if (
    !parents.includes(
      config.folderId,
    )
  ) {
    throw new Error(
      "Lokasi bukti transfer tidak valid.",
    );
  }

  await storage.delete(
    locator,
  );
}

export function getDonationProofBlobToken() {
  return getAssistanceBlobToken();
}

export function isGoogleDriveDonationProofLocator(
  value: string,
) {
  const normalized =
    value.trim();

  if (
    !normalized.startsWith(
      GOOGLE_DRIVE_LOCATOR_PREFIX,
    )
  ) {
    return false;
  }

  try {
    getGoogleDriveFileId(
      normalized,
    );

    return true;
  } catch {
    return false;
  }
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

function validateDonationProofMetadata(
  metadata: StorageMetadata,
) {
  if (
    !allowedTypes.has(
      metadata.contentType,
    )
  ) {
    return "Format bukti transfer tidak valid.";
  }

  if (
    metadata.size >
      DONATION_PROOF_MAX_SIZE ||
    metadata.size <= 0
  ) {
    return "Ukuran bukti transfer melebihi batas yang diizinkan.";
  }

  return null;
}

export async function validatePrivateDonationProof(
  value: string,
) {
  if (
    isGoogleDriveDonationProofLocator(
      value,
    )
  ) {
    const config =
      getGoogleDriveDonationConfig();

    if (!config) {
      return {
        success: false as const,
        error:
          "Penyimpanan bukti transfer belum tersedia.",
      };
    }

    try {
      const storage =
        getDonationProofGoogleDriveStorage(
          config,
        );

      const [
        metadata,
        parents,
      ] =
        await Promise.all([
          storage.head(
            value,
          ),
          storage.getParents(
            value,
          ),
        ]);

      const metadataError =
        validateDonationProofMetadata(
          metadata,
        );

      if (metadataError) {
        return {
          success: false as const,
          error:
            metadataError,
        };
      }

      if (
        !parents.includes(
          config.folderId,
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
        "Google Drive donation proof validation error:",
        error,
      );

      return {
        success: false as const,
        error:
          "Bukti transfer tidak dapat diverifikasi. Silakan unggah ulang.",
      };
    }
  }

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
    const storage =
      createVercelBlobStorage({
        access: "private",
        token,
      });

    const metadata =
      await storage.head(
        value,
      );

    const metadataError =
      validateDonationProofMetadata(
        metadata,
      );

    if (metadataError) {
      return {
        success: false as const,
        error:
          metadataError,
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

function getLegacyDataDonationProof(
  value: string,
) {
  const match =
    /^data:image\/(jpeg|jpg|png|webp);base64,([a-z0-9+/=\r\n]+)$/i.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const subtype =
    match[1].toLowerCase();

  const contentType =
    subtype === "jpg"
      ? "image/jpeg"
      : `image/${subtype}`;

  try {
    const buffer =
      Buffer.from(
        match[2].replace(
          /\s+/g,
          "",
        ),
        "base64",
      );

    if (
      buffer.length === 0 ||
      buffer.length >
        DONATION_PROOF_MAX_SIZE
    ) {
      return null;
    }

    const bytes =
      Uint8Array.from(
        buffer,
      );

    return {
      stream:
        new Blob(
          [bytes],
          {
            type:
              contentType,
          },
        ).stream(),
      contentType,
    };
  } catch {
    return null;
  }
}

export async function getDonationProofForStaff(
  value: string,
) {
  const legacyDataProof =
    getLegacyDataDonationProof(
      value,
    );

  if (legacyDataProof) {
    return legacyDataProof;
  }

  if (
    isGoogleDriveDonationProofLocator(
      value,
    )
  ) {
    const config =
      getGoogleDriveDonationConfig();

    if (!config) {
      return null;
    }

    const storage =
      getDonationProofGoogleDriveStorage(
        config,
      );

    const result =
      await storage.read(
        value,
      );

    if (!result) {
      return null;
    }

    return {
      stream:
        result.stream,
      contentType:
        result.contentType,
    };
  }

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

    const storage =
      createVercelBlobStorage({
        access: "private",
        token,
      });

    const result =
      await storage.read(
        value,
      );

    if (!result) {
      return null;
    }

    return {
      stream:
        result.stream,
      contentType:
        result.contentType,
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
