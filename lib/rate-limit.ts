// Simple in-memory rate limiting for prototype purposes.
// In a production environment, you should use Redis or a database.

type RateLimitRecord = {
  count: number;
  lastReset: number;
};

const store = new Map<string, RateLimitRecord>();

export function rateLimit(identifier: string, limit: number, windowMs: number): { success: boolean } {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record) {
    store.set(identifier, { count: 1, lastReset: now });
    return { success: true };
  }

  if (now - record.lastReset > windowMs) {
    // Reset window
    store.set(identifier, { count: 1, lastReset: now });
    return { success: true };
  }

  if (record.count >= limit) {
    return { success: false };
  }

  record.count += 1;
  return { success: true };
}
