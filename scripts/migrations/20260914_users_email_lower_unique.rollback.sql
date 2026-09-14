-- Stage 6.3 rollback: remove case-insensitive email uniqueness index.
-- Existing UNIQUE(email) constraint is intentionally preserved.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $rollback_guard$
DECLARE
  target_index_count integer;
BEGIN
  SELECT COUNT(*)
  INTO target_index_count
  FROM pg_indexes
  WHERE
    schemaname = 'public'
    AND tablename = 'users'
    AND indexname = 'users_email_lower_unique';

  IF target_index_count <> 1 THEN
    RAISE EXCEPTION
      'Rollback blocked: expected exactly one users_email_lower_unique index, found %.',
      target_index_count;
  END IF;
END
$rollback_guard$;

DROP INDEX public.users_email_lower_unique;

COMMIT;