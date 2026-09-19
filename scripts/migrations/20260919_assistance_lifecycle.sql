BEGIN;

ALTER TABLE assistance_applications
  ADD COLUMN IF NOT EXISTS approved_amount numeric,
  ADD COLUMN IF NOT EXISTS operational_amount numeric,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp,
  ADD COLUMN IF NOT EXISTS completed_at timestamp;

COMMIT;