BEGIN;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS review_note text;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'donations_reviewed_by_users_id_fk'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT donations_reviewed_by_users_id_fk
      FOREIGN KEY (reviewed_by)
      REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

COMMIT;
