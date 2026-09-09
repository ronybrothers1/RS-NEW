import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

const OTP_TTL_MS =
  10 * 60 * 1000;

const LOGIN_TOKEN_TTL_MS =
  2 * 60 * 1000;

const PENDING_TOKEN_TTL_MS =
  24 * 60 * 60 * 1000;

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

export function generateEmailOtp() {
  return randomInt(
    0,
    1_000_000,
  )
    .toString()
    .padStart(6, "0");
}

export function hashEmailOtp(
  userId: string,
  code: string,
) {
  return createHmac(
    "sha256",
    getSecret(),
  )
    .update(
      `email-verification:${userId}:${code}`,
    )
    .digest("hex");
}

export function verifyEmailOtpHash(
  userId: string,
  code: string,
  expectedHash: string,
) {
  const actualHash =
    hashEmailOtp(
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

export function getEmailOtpExpiry() {
  return new Date(
    Date.now() + OTP_TTL_MS,
  );
}

export function createPendingEmailVerificationToken(
  userId: string,
) {
  return signPayload({
    sub: userId,
    exp:
      Date.now() +
      PENDING_TOKEN_TTL_MS,
    purpose:
      "pending-email-verification",
  });
}

export function verifyPendingEmailVerificationToken(
  token: string,
) {
  return verifySignedPayload(
    token,
    "pending-email-verification",
  );
}

export function createEmailVerificationLoginToken(
  userId: string,
) {
  return signPayload({
    sub: userId,
    exp:
      Date.now() +
      LOGIN_TOKEN_TTL_MS,
    purpose:
      "email-verification-login",
  });
}

export function verifyEmailVerificationLoginToken(
  token: string,
) {
  return verifySignedPayload(
    token,
    "email-verification-login",
  );
}