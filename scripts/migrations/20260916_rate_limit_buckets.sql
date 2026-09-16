CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key_hash text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
    CHECK (count >= 0),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
    DEFAULT now()
);

CREATE INDEX IF NOT EXISTS
  rate_limit_buckets_expires_at_idx
ON rate_limit_buckets (expires_at);