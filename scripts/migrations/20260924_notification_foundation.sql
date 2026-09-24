BEGIN;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS notification_capability_hash text,
  ADD COLUMN IF NOT EXISTS notification_capability_created_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS donations_notification_capability_hash_unique
  ON donations (notification_capability_hash)
  WHERE notification_capability_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_url text,
  dedupe_key text,
  read_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_key_unique
  ON notifications (
    user_id,
    dedupe_key
  )
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (
    user_id,
    created_at DESC,
    id DESC
  );

CREATE INDEX IF NOT EXISTS notifications_user_unread_created_idx
  ON notifications (
    user_id,
    created_at DESC
  )
  WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid
    REFERENCES users(id)
    ON DELETE CASCADE,
  endpoint_hash text NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  failure_count integer NOT NULL DEFAULT 0,
  last_success_at timestamp,
  last_failure_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_hash_unique
  ON push_subscriptions (endpoint_hash);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_active_idx
  ON push_subscriptions (
    user_id,
    is_active,
    updated_at DESC
  );

CREATE TABLE IF NOT EXISTS donation_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL
    REFERENCES donations(id)
    ON DELETE CASCADE,
  push_subscription_id uuid NOT NULL
    REFERENCES push_subscriptions(id)
    ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS donation_push_subscriptions_donation_subscription_unique
  ON donation_push_subscriptions (
    donation_id,
    push_subscription_id
  );

CREATE INDEX IF NOT EXISTS donation_push_subscriptions_subscription_idx
  ON donation_push_subscriptions (
    push_subscription_id
  );

COMMIT;
