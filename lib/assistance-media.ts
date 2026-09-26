import {
  randomUUID,
} from "node:crypto";

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

export const ASSISTANCE_MEDIA_BASE_PATH =
  "media/pengajuan";

export const ASSISTANCE_MEDIA_MAX_SIZE =
  5 * 1024 * 1024;

export const ASSISTANCE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const allowedTypes =
  new Set<string>(
    ASSISTANCE_MEDIA_TYPES,
  );

type GoogleDriveAssistanceConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
};

function getGoogleDriveAssistanceConfig():
  GoogleDriveAssistanceConfig | null {
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
      .GOOGLE_DRIVE_ASSISTANCE_FOLDER_ID
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

function getAssistanceGoogleDriveStorage(
  config:
    GoogleDriveAssistanceConfig,
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

function validateAssistanceMetadata(
  metadata: StorageMetadata,
) {
  if (
    !allowedTypes.has(
      metadata.contentType,
    )
  ) {
    return false;
  }

  return (
    metadata.size > 0 &&
    metadata.size <=
      ASSISTANCE_MEDIA_MAX_SIZE
  );
}

export function getAssistanceBlobToken() {
  return (
    process.env
      .ASSISTANCE_READ_WRITE_TOKEN
      ?.trim() || null
  );
}

export function isAssistanceGoogleDriveConfigured() {
  return Boolean(
    getGoogleDriveAssistanceConfig(),
  );
}

export async function createAssistancePhotoUploadSession(
  input: {
    userId: string;
    filename: string;
    contentType: string;
    size: number;
  },
) {
  const config =
    getGoogleDriveAssistanceConfig();

  if (!config) {
    throw new Error(
      "Penyimpanan Google Drive foto pengajuan belum dikonfigurasi.",
    );
  }

  const storage =
    getAssistanceGoogleDriveStorage(
      config,
    );

  return storage
    .createResumableUploadSession({
      folderId:
        config.folderId,
      filename:
        `${input.userId}-${randomUUID()}-${input.filename}`,
      contentType:
        input.contentType,
      size:
        input.size,
    });
}

export function getAssistanceUserMediaPrefix(
  userId: string,
) {
  return `${ASSISTANCE_MEDIA_BASE_PATH}/${userId}/`;
}

export function getGoogleDriveAssistanceStoragePath(
  userId: string,
  locator: string,
) {
  return `${getAssistanceUserMediaPrefix(
    userId,
  )}${locator}`;
}

export function isAllowedAssistanceUserPath(
  pathname: string,
  userId: string,
) {
  return pathname.startsWith(
    getAssistanceUserMediaPrefix(
      userId,
    ),
  );
}

export function isGoogleDriveAssistanceLocator(
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

export function isPrivateAssistanceBlobUrl(
  value: string,
  pathname: string,
) {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(
        ".private.blob.vercel-storage.com",
      )
    ) {
      return false;
    }

    const urlPath =
      decodeURIComponent(
        url.pathname.replace(
          /^\/+/, 
          "",
        ),
      );

    return urlPath === pathname;
  } catch {
    return false;
  }
}

export function isValidAssistancePhotoReference(
  value: string,
  pathname: string,
  userId: string,
) {
  if (
    !isAllowedAssistanceUserPath(
      pathname,
      userId,
    )
  ) {
    return false;
  }

  if (
    isGoogleDriveAssistanceLocator(
      value,
    )
  ) {
    return (
      pathname ===
      getGoogleDriveAssistanceStoragePath(
        userId,
        value,
      )
    );
  }

  return isPrivateAssistanceBlobUrl(
    value,
    pathname,
  );
}

export async function validateAssistancePhotoForUser(
  input: {
    value: string;
    pathname: string;
    userId: string;
  },
) {
  if (
    !isValidAssistancePhotoReference(
      input.value,
      input.pathname,
      input.userId,
    )
  ) {
    return false;
  }

  if (
    !isGoogleDriveAssistanceLocator(
      input.value,
    )
  ) {
    return true;
  }

  const config =
    getGoogleDriveAssistanceConfig();

  if (!config) {
    return false;
  }

  try {
    const storage =
      getAssistanceGoogleDriveStorage(
        config,
      );

    const [
      metadata,
      parents,
      name,
    ] =
      await Promise.all([
        storage.head(
          input.value,
        ),
        storage.getParents(
          input.value,
        ),
        storage.getName(
          input.value,
        ),
      ]);

    return (
      validateAssistanceMetadata(
        metadata,
      ) &&
      parents.includes(
        config.folderId,
      ) &&
      name.startsWith(
        `${input.userId}-`,
      )
    );
  } catch (error) {
    console.error(
      "Google Drive assistance photo validation error:",
      error,
    );

    return false;
  }
}

export async function deleteAssistancePhoto(
  input: {
    value: string;
    pathname: string;
    userId: string;
  },
) {
  if (
    !isValidAssistancePhotoReference(
      input.value,
      input.pathname,
      input.userId,
    )
  ) {
    throw new Error(
      "Foto pengajuan tidak valid.",
    );
  }

  if (
    isGoogleDriveAssistanceLocator(
      input.value,
    )
  ) {
    const isValid =
      await validateAssistancePhotoForUser(
        input,
      );

    if (!isValid) {
      throw new Error(
        "Foto Google Drive tidak valid atau bukan milik pengguna ini.",
      );
    }

    const config =
      getGoogleDriveAssistanceConfig();

    if (!config) {
      throw new Error(
        "Penyimpanan foto pengajuan belum tersedia.",
      );
    }

    const storage =
      getAssistanceGoogleDriveStorage(
        config,
      );

    await storage.delete(
      input.value,
    );

    return;
  }

  const token =
    getAssistanceBlobToken();

  if (!token) {
    throw new Error(
      "Penyimpanan foto lama belum tersedia.",
    );
  }

  const storage =
    createVercelBlobStorage({
      access: "private",
      token,
    });

  await storage.delete(
    input.value,
  );
}

export async function getAssistancePhotoForAuthorizedRead(
  value: string,
) {
  if (
    isGoogleDriveAssistanceLocator(
      value,
    )
  ) {
    const config =
      getGoogleDriveAssistanceConfig();

    if (!config) {
      return null;
    }

    const storage =
      getAssistanceGoogleDriveStorage(
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

    if (
      !validateAssistanceMetadata(
        metadata,
      ) ||
      !parents.includes(
        config.folderId,
      )
    ) {
      return null;
    }

    return storage.read(
      value,
    );
  }

  const token =
    getAssistanceBlobToken();

  if (!token) {
    return null;
  }

  const storage =
    createVercelBlobStorage({
      access: "private",
      token,
    });

  return storage.read(
    value,
  );
}
