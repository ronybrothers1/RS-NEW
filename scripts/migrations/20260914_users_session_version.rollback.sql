-- Stage 6.3 rollback: remove JWT session revocation column.
-- Existing email uniqueness constraints are intentionally preserved.
--
-- Safety rule:
--   rollback is blocked if any user has session_version <> 0.
--   A nonzero value means revocation state has already been used and
--   must not be silently discarded.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $rollback_guard$
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
      'Rollback blocked: expected exact users.session_version column contract.';
  END IF;

  EXECUTE
    'SELECT COUNT(*) FROM public.users WHERE session_version <> 0'
  INTO nonzero_rows;

  IF nonzero_rows <> 0 THEN
    RAISE EXCEPTION
      'Rollback blocked: session_version contains nonzero values (% rows). Revocation state must not be discarded.',
      nonzero_rows;
  END IF;
END
$rollback_guard$;

ALTER TABLE public.users
  DROP COLUMN session_version;

COMMIT;
