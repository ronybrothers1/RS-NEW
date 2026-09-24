BEGIN;

DROP TABLE IF EXISTS donation_push_subscriptions;
DROP TABLE IF EXISTS push_subscriptions;
DROP TABLE IF EXISTS notifications;

DROP INDEX IF EXISTS donations_notification_capability_hash_unique;

ALTER TABLE donations
  DROP COLUMN IF EXISTS notification_capability_created_at,
  DROP COLUMN IF EXISTS notification_capability_hash;

COMMIT;
