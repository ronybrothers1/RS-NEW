import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

export const ASSISTANCE_PHOTO_UPLOAD_TICKET_TTL_MS =
  60 * 60 * 1000;

const CONTEXT =
  "assistance-photo-upload:v1";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_TOKEN_LENGTH =
  8192;

type UploadCapability = {
  v: 1;
  jti: string;
  userId: string;
  uploadUrl: string;
  contentType: string;
  size: number;
  iat: number;
  exp: number;
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

function getSigningKey() {
  return createHmac(
    "sha256",
    getSecret(),
  )
    .update(
      `${CONTEXT}:${getEnvironment()}`,
    )
    .digest();
}

function sign(
  encodedPayload: string,
) {
  return createHmac(
    "sha256",
    getSigningKey(),
  )
    .update(
      encodedPayload,
    )
    .digest(
      "base64url",
    );
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

export function createAssistancePhotoUploadTicket(
  input: {
    userId: string;
    uploadUrl: string;
    contentType: string;
    size: number;
  },
) {
  const userId =
    input.userId.trim();
  const uploadUrl =
    input.uploadUrl.trim();
  const contentType =
    input.contentType
      .trim()
      .toLowerCase();
  const size =
    input.size;

  if (
    !UUID_PATTERN.test(
      userId,
    ) ||
    !uploadUrl ||
    !contentType ||
    !Number.isSafeInteger(
      size,
    ) ||
    size <= 0
  ) {
    throw new Error(
      "Data capability upload foto tidak valid.",
    );
  }

  const issuedAt =
    Date.now();

  const payload:
    UploadCapability = {
      v: 1,
      jti:
        randomUUID(),
      userId,
      uploadUrl,
      contentType,
      size,
      iat:
        issuedAt,
      exp:
        issuedAt +
        ASSISTANCE_PHOTO_UPLOAD_TICKET_TTL_MS,
    };

  const encodedPayload =
    Buffer.from(
      JSON.stringify(
        payload,
      ),
      "utf8",
    ).toString(
      "base64url",
    );

  return `${encodedPayload}.${sign(
    encodedPayload,
  )}`;
}

export function verifyAssistancePhotoUploadTicket(
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

  const [
    encodedPayload,
    encodedSignature,
    ...extra
  ] = normalized.split(
    ".",
  );

  if (
    extra.length > 0 ||
    !encodedPayload ||
    !encodedSignature ||
    !/^[A-Za-z0-9_-]+$/.test(
      encodedPayload,
    ) ||
    !/^[A-Za-z0-9_-]+$/.test(
      encodedSignature,
    )
  ) {
    return null;
  }

  const expected =
    Buffer.from(
      sign(
        encodedPayload,
      ),
      "utf8",
    );
  const actual =
    Buffer.from(
      encodedSignature,
      "utf8",
    );

  if (
    expected.length !==
      actual.length ||
    !timingSafeEqual(
      expected,
      actual,
    )
  ) {
    return null;
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        Buffer.from(
          encodedPayload,
          "base64url",
        ).toString(
          "utf8",
        ),
      );
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const {
    v,
    jti,
    userId,
    uploadUrl,
    contentType,
    size,
    iat,
    exp,
  } = parsed;

  if (
    v !== 1 ||
    typeof jti !==
      "string" ||
    !UUID_PATTERN.test(jti) ||
    typeof userId !==
      "string" ||
    !UUID_PATTERN.test(userId) ||
    typeof uploadUrl !==
      "string" ||
    !uploadUrl.trim() ||
    typeof contentType !==
      "string" ||
    !contentType.trim() ||
    typeof size !==
      "number" ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    typeof iat !==
      "number" ||
    !Number.isSafeInteger(iat) ||
    typeof exp !==
      "number" ||
    !Number.isSafeInteger(exp)
  ) {
    return null;
  }

  const now =
    Date.now();

  if (
    exp <= now ||
    iat > now + 60_000 ||
    exp <= iat ||
    exp - iat >
      ASSISTANCE_PHOTO_UPLOAD_TICKET_TTL_MS +
        60_000
  ) {
    return null;
  }

  return {
    v: 1 as const,
    jti,
    userId,
    uploadUrl:
      uploadUrl.trim(),
    contentType:
      contentType
        .trim()
        .toLowerCase(),
    size,
    iat,
    exp,
  };
}
