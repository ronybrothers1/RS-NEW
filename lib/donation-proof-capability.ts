import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";

export const DONATION_PROOF_UPLOAD_TICKET_TTL_MS =
  60 * 60 * 1000;

export const DONATION_PROOF_CLEANUP_TICKET_TTL_MS =
  24 * 60 * 60 * 1000;

const CAPABILITY_CONTEXT =
  "donation-proof-capability:v1";

const UPLOAD_PURPOSE =
  "donation-proof-upload:v1";

const CLEANUP_PURPOSE =
  "donation-proof-cleanup:v1";

const TOKEN_VERSION =
  "v1";

const IV_SIZE =
  12;

const AUTH_TAG_SIZE =
  16;

const MAX_TOKEN_LENGTH =
  8192;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CapabilityEnvelope = {
  v: 1;
  purpose: string;
  jti: string;
  iat: number;
  exp: number;
};

type UploadCapabilityPayload =
  CapabilityEnvelope & {
    uploadUrl: string;
    contentType: string;
    size: number;
  };

type CleanupCapabilityPayload =
  CapabilityEnvelope & {
    locator: string;
  };

function getSecret() {
  const secret =
    process.env.AUTH_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "Konfigurasi keamanan upload tidak tersedia.",
    );
  }

  return secret;
}

function getEnvironment() {
  return (
    process.env.VERCEL_ENV
      ?.trim() ||
    process.env.NODE_ENV
      ?.trim() ||
    "local"
  );
}

function getCapabilityKey() {
  return createHmac(
    "sha256",
    getSecret(),
  )
    .update(
      CAPABILITY_CONTEXT +
        ":" +
        getEnvironment(),
    )
    .digest();
}

function getAdditionalData() {
  return Buffer.from(
    CAPABILITY_CONTEXT +
      ":" +
      getEnvironment(),
    "utf8",
  );
}

function sealPayload(
  payload:
    | UploadCapabilityPayload
    | CleanupCapabilityPayload,
) {
  const iv =
    randomBytes(
      IV_SIZE,
    );

  const cipher =
    createCipheriv(
      "aes-256-gcm",
      getCapabilityKey(),
      iv,
      {
        authTagLength:
          AUTH_TAG_SIZE,
      },
    );

  cipher.setAAD(
    getAdditionalData(),
  );

  const plaintext =
    Buffer.from(
      JSON.stringify(
        payload,
      ),
      "utf8",
    );

  const ciphertext =
    Buffer.concat([
      cipher.update(
        plaintext,
      ),
      cipher.final(),
    ]);

  const authTag =
    cipher.getAuthTag();

  return [
    TOKEN_VERSION,
    iv.toString(
      "base64url",
    ),
    authTag.toString(
      "base64url",
    ),
    ciphertext.toString(
      "base64url",
    ),
  ].join(".");
}

function openPayload(
  token: string,
) {
  const normalized =
    token.trim();

  if (
    !normalized ||
    normalized.length >
      MAX_TOKEN_LENGTH
  ) {
    return null;
  }

  const parts =
    normalized.split(
      ".",
    );

  if (
    parts.length !== 4 ||
    parts[0] !==
      TOKEN_VERSION
  ) {
    return null;
  }

  const [
    ,
    encodedIv,
    encodedTag,
    encodedCiphertext,
  ] = parts;

  if (
    !encodedIv ||
    !encodedTag ||
    !encodedCiphertext ||
    !/^[A-Za-z0-9_-]+$/.test(
      encodedIv,
    ) ||
    !/^[A-Za-z0-9_-]+$/.test(
      encodedTag,
    ) ||
    !/^[A-Za-z0-9_-]+$/.test(
      encodedCiphertext,
    )
  ) {
    return null;
  }

  try {
    const iv =
      Buffer.from(
        encodedIv,
        "base64url",
      );

    const authTag =
      Buffer.from(
        encodedTag,
        "base64url",
      );

    const ciphertext =
      Buffer.from(
        encodedCiphertext,
        "base64url",
      );

    if (
      iv.length !==
        IV_SIZE ||
      authTag.length !==
        AUTH_TAG_SIZE ||
      ciphertext.length <=
        0
    ) {
      return null;
    }

    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        getCapabilityKey(),
        iv,
        {
          authTagLength:
            AUTH_TAG_SIZE,
        },
      );

    decipher.setAAD(
      getAdditionalData(),
    );

    decipher.setAuthTag(
      authTag,
    );

    const plaintext =
      Buffer.concat([
        decipher.update(
          ciphertext,
        ),
        decipher.final(),
      ]);

    return JSON.parse(
      plaintext.toString(
        "utf8",
      ),
    ) as unknown;
  } catch {
    return null;
  }
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value,
    )
  );
}

function readEnvelope(
  value: unknown,
  purpose: string,
  maxTtlMs: number,
) {
  if (
    !isRecord(
      value,
    )
  ) {
    return null;
  }

  const {
    v,
    purpose:
      payloadPurpose,
    jti,
    iat,
    exp,
  } = value;

  if (
    v !== 1 ||
    payloadPurpose !==
      purpose ||
    typeof jti !==
      "string" ||
    !UUID_PATTERN.test(
      jti,
    ) ||
    typeof iat !==
      "number" ||
    !Number.isSafeInteger(
      iat,
    ) ||
    typeof exp !==
      "number" ||
    !Number.isSafeInteger(
      exp,
    )
  ) {
    return null;
  }

  const now =
    Date.now();

  if (
    exp <= now ||
    iat >
      now + 60_000 ||
    exp <= iat ||
    exp - iat >
      maxTtlMs +
        60_000
  ) {
    return null;
  }

  return {
    v: 1 as const,
    purpose,
    jti,
    iat,
    exp,
  };
}

export function createDonationProofUploadTicket(
  input: {
    uploadUrl: string;
    contentType: string;
    size: number;
  },
) {
  const uploadUrl =
    input.uploadUrl.trim();

  const contentType =
    input.contentType
      .trim()
      .toLowerCase();

  const size =
    input.size;

  if (
    !uploadUrl ||
    !contentType ||
    !Number.isSafeInteger(
      size,
    ) ||
    size <= 0
  ) {
    throw new Error(
      "Data capability upload tidak valid.",
    );
  }

  const issuedAt =
    Date.now();

  return sealPayload({
    v: 1,
    purpose:
      UPLOAD_PURPOSE,
    jti:
      randomUUID(),
    iat:
      issuedAt,
    exp:
      issuedAt +
      DONATION_PROOF_UPLOAD_TICKET_TTL_MS,
    uploadUrl,
    contentType,
    size,
  });
}

export function verifyDonationProofUploadTicket(
  token: string,
) {
  const value =
    openPayload(
      token,
    );

  const envelope =
    readEnvelope(
      value,
      UPLOAD_PURPOSE,
      DONATION_PROOF_UPLOAD_TICKET_TTL_MS,
    );

  if (
    !envelope ||
    !isRecord(
      value,
    )
  ) {
    return null;
  }

  const {
    uploadUrl,
    contentType,
    size,
  } = value;

  if (
    typeof uploadUrl !==
      "string" ||
    !uploadUrl.trim() ||
    typeof contentType !==
      "string" ||
    !contentType.trim() ||
    typeof size !==
      "number" ||
    !Number.isSafeInteger(
      size,
    ) ||
    size <= 0
  ) {
    return null;
  }

  return {
    ...envelope,
    uploadUrl:
      uploadUrl.trim(),
    contentType:
      contentType
        .trim()
        .toLowerCase(),
    size,
  };
}

export function createDonationProofCleanupTicket(
  locator: string,
) {
  const normalizedLocator =
    locator.trim();

  if (
    !normalizedLocator ||
    normalizedLocator.length >
      1024
  ) {
    throw new Error(
      "Locator cleanup tidak valid.",
    );
  }

  const issuedAt =
    Date.now();

  return sealPayload({
    v: 1,
    purpose:
      CLEANUP_PURPOSE,
    jti:
      randomUUID(),
    iat:
      issuedAt,
    exp:
      issuedAt +
      DONATION_PROOF_CLEANUP_TICKET_TTL_MS,
    locator:
      normalizedLocator,
  });
}

export function verifyDonationProofCleanupTicket(
  token: string,
) {
  const value =
    openPayload(
      token,
    );

  const envelope =
    readEnvelope(
      value,
      CLEANUP_PURPOSE,
      DONATION_PROOF_CLEANUP_TICKET_TTL_MS,
    );

  if (
    !envelope ||
    !isRecord(
      value,
    )
  ) {
    return null;
  }

  const {
    locator,
  } = value;

  if (
    typeof locator !==
      "string" ||
    !locator.trim() ||
    locator.length >
      1024
  ) {
    return null;
  }

  return {
    ...envelope,
    locator:
      locator.trim(),
  };
}
