-- Stage 6.3: case-insensitive email uniqueness hardening
-- One-off guarded transactional migration.
-- Do NOT run through drizzle-kit.
-- Preconditions:
--   - public.users exists
--   - users.email is text NOT NULL
--   - existing UNIQUE(email) remains present
--   - all existing emails are trim+lowercase canonical
--   - no duplicate LOWER(BTRIM(email))
--   - users_email_lower_unique does not already exist

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $migration_guard$
DECLARE
  duplicate_groups integer;
  noncanonical_rows integer;
  existing_index_count integer;
  exact_unique_count integer;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_groups
  FROM (
    SELECT
      LOWER(BTRIM(email))
    FROM public.users
    GROUP BY
      LOWER(BTRIM(email))
    HAVING COUNT(*) > 1
  ) AS collisions;

  IF duplicate_groups <> 0 THEN
    RAISE EXCEPTION
      'Migration blocked: canonical email duplicates detected (% groups).',
      duplicate_groups;
  END IF;

  SELECT COUNT(*)
  INTO noncanonical_rows
  FROM public.users
  WHERE
    email <> LOWER(BTRIM(email));

  IF noncanonical_rows <> 0 THEN
    RAISE EXCEPTION
      'Migration blocked: noncanonical email rows detected (% rows).',
      noncanonical_rows;
  END IF;

  SELECT COUNT(*)
  INTO existing_index_count
  FROM pg_indexes
  WHERE
    schemaname = 'public'
    AND tablename = 'users'
    AND indexname = 'users_email_lower_unique';

  IF existing_index_count <> 0 THEN
    RAISE EXCEPTION
      'Migration blocked: users_email_lower_unique already exists.';
  END IF;

  SELECT COUNT(*)
  INTO exact_unique_count
  FROM pg_constraint c
  JOIN pg_class t
    ON t.oid = c.conrelid
  JOIN pg_namespace n
    ON n.oid = t.relnamespace
  WHERE
    n.nspname = 'public'
    AND t.relname = 'users'
    AND c.contype = 'u'
    AND pg_get_constraintdef(c.oid) = 'UNIQUE (email)';

  IF exact_unique_count <> 1 THEN
    RAISE EXCEPTION
      'Migration blocked: expected exactly one UNIQUE(email) constraint, found %.',
      exact_unique_count;
  END IF;
END
$migration_guard$;

CREATE UNIQUE INDEX users_email_lower_unique
  ON public.users
  USING btree (LOWER(email));

COMMIT;