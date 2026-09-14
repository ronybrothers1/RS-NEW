-- Stage 6.3: JWT session revocation support
-- One-off guarded transactional migration.
-- Do NOT run through drizzle-kit.
--
-- Preconditions:
--   - public.users exists
--   - session_version does not already exist
--   - existing email uniqueness hardening remains intact
--
-- Effect:
--   - add users.session_version integer DEFAULT 0 NOT NULL
--   - all existing users begin at version 0

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $migration_guard$
DECLARE
  users_table_count integer;
  session_version_count integer;
  email_lower_index_count integer;
  exact_email_unique_count integer;
BEGIN
  SELECT COUNT(*)
  INTO users_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'users';

  IF users_table_count <> 1 THEN
    RAISE EXCEPTION
      'Migration blocked: expected exactly one public.users table, found %.',
      users_table_count;
  END IF;

  SELECT COUNT(*)
  INTO session_version_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'session_version';

  IF session_version_count <> 0 THEN
    RAISE EXCEPTION
      'Migration blocked: users.session_version already exists.';
  END IF;

  SELECT COUNT(*)
  INTO email_lower_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'users'
    AND indexname = 'users_email_lower_unique';

  IF email_lower_index_count <> 1 THEN
    RAISE EXCEPTION
      'Migration blocked: expected users_email_lower_unique to exist exactly once, found %.',
      email_lower_index_count;
  END IF;

  SELECT COUNT(*)
  INTO exact_email_unique_count
  FROM pg_constraint c
  JOIN pg_class t
    ON t.oid = c.conrelid
  JOIN pg_namespace n
    ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'users'
    AND c.contype = 'u'
    AND pg_get_constraintdef(c.oid) = 'UNIQUE (email)';

  IF exact_email_unique_count <> 1 THEN
    RAISE EXCEPTION
      'Migration blocked: expected exactly one UNIQUE(email) constraint, found %.',
      exact_email_unique_count;
  END IF;
END
$migration_guard$;

ALTER TABLE public.users
  ADD COLUMN session_version integer DEFAULT 0 NOT NULL;

DO $migration_verify$
DECLARE
  column_contract_count integer;
  nonzero_rows integer;
BEGIN
  SELECT COUNT(*)
  INTO column_contract_count
  FROM pg_attribute a
  JOIN pg_class t
    ON t.oid = a.attrelid
  JOIN pg_namespace n
    ON n.oid = t.relnamespace
  LEFT JOIN pg_attrdef d
    ON d.adrelid = t.oid
   AND d.adnum = a.attnum
  WHERE n.nspname = 'public'
    AND t.relname = 'users'
    AND a.attname = 'session_version'
    AND NOT a.attisdropped
    AND format_type(
      a.atttypid,
      a.atttypmod
    ) = 'integer'
    AND a.attnotnull
    AND COALESCE(
      pg_get_expr(
        d.adbin,
        d.adrelid
      ),
      ''
    ) IN (
      '0',
      '0::integer',
      '(0)::integer'
    );

  IF column_contract_count <> 1 THEN
    RAISE EXCEPTION
      'Migration verification failed: session_version column contract is not exact.';
  END IF;

  EXECUTE
    'SELECT COUNT(*) FROM public.users WHERE session_version <> 0'
  INTO nonzero_rows;

  IF nonzero_rows <> 0 THEN
    RAISE EXCEPTION
      'Migration verification failed: expected all existing session_version values to equal 0, found % nonzero rows.',
      nonzero_rows;
  END IF;
END
$migration_verify$;

COMMIT;
