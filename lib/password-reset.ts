import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

const PASSWORD_RESET_OTP_TTL_MS =
  10 * 60 * 1000;

const PASSWORD_RESET_PENDING_TTL_MS =
  30 * 60 * 1000;

type SignedPayload = {
  sub: string;
  exp: number;
  purpose: string;
};

function getSecret() {
  const secret =
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET tidak tersedia.",
    );
  }

  return secret;
}

function signPayload(
  payload: SignedPayload,
) {
  const encodedPayload =
    Buffer.from(
      JSON.stringify(payload),
      "utf8",
    ).toString("base64url");

  const signature =
    createHmac(
      "sha256",
      getSecret(),
    )
      .update(encodedPayload)
      .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifySignedPayload(
  token: string,
  purpose: string,
) {
  const [
    encodedPayload,
    signature,
  ] = token.split(".");

  if (
    !encodedPayload ||
    !signature
  ) {
    return null;
  }

  const expectedSignature =
    createHmac(
      "sha256",
      getSecret(),
    )
      .update(encodedPayload)
      .digest("base64url");

  const actual =
    Buffer.from(signature);

  const expected =
    Buffer.from(
      expectedSignature,
    );

  if (
    actual.length !==
      expected.length ||
    !timingSafeEqual(
      actual,
      expected,
    )
  ) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        Buffer.from(
          encodedPayload,
          "base64url",
        ).toString("utf8"),
      ) as SignedPayload;

    if (
      payload.purpose !==
        purpose ||
      !payload.sub ||
      payload.exp <
        Date.now()
    ) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export function generatePasswordResetOtp() {
  return randomInt(
    0,
    1_000_000,
  )
    .toString()
    .padStart(6, "0");
}

export function hashPasswordResetOtp(
  userId: string,
  code: string,
) {
  return createHmac(
    "sha256",
    getSecret(),
  )
    .update(
      `password-reset:${userId}:${code}`,
    )
    .digest("hex");
}

export function verifyPasswordResetOtpHash(
  userId: string,
  code: string,
  expectedHash: string,
) {
  const actualHash =
    hashPasswordResetOtp(
      userId,
      code,
    );

  const actual =
    Buffer.from(
      actualHash,
      "hex",
    );

  const expected =
    Buffer.from(
      expectedHash,
      "hex",
    );

  if (
    actual.length !==
    expected.length
  ) {
    return false;
  }

  return timingSafeEqual(
    actual,
    expected,
  );
}

export function getPasswordResetOtpExpiry() {
  return new Date(
    Date.now() +
      PASSWORD_RESET_OTP_TTL_MS,
  );
}

export function createPendingPasswordResetToken(
  email: string,
) {
  return signPayload({
    sub:
      email
        .trim()
        .toLowerCase(),
    exp:
      Date.now() +
      PASSWORD_RESET_PENDING_TTL_MS,
    purpose:
      "pending-password-reset",
  });
}

export function verifyPendingPasswordResetToken(
  token: string,
) {
  return verifySignedPayload(
    token,
    "pending-password-reset",
  );
}