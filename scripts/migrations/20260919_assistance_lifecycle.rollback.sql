BEGIN;

ALTER TABLE assistance_applications
  DROP COLUMN IF EXISTS completed_at,
  DROP COLUMN IF EXISTS scheduled_at,
  DROP COLUMN IF EXISTS operational_amount,
  DROP COLUMN IF EXISTS approved_amount;

COMMIT;