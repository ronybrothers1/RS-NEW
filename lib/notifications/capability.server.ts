import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function hashNotificationValue(
  value: string,
) {
  return createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest(
      "hex",
    );
}

export function createDonationNotificationCapability() {
  const token =
    randomBytes(
      32,
    ).toString(
      "base64url",
    );

  return {
    token,
    hash:
      hashNotificationValue(
        token,
      ),
  };
}

export function verifyDonationNotificationCapability(
  token: string,
  expectedHash: string,
) {
  if (
    !token ||
    !expectedHash
  ) {
    return false;
  }

  const actual =
    Buffer.from(
      hashNotificationValue(
        token,
      ),
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
