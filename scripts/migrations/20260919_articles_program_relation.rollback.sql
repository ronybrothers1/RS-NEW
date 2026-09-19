BEGIN;

DROP INDEX IF EXISTS articles_program_id_idx;

ALTER TABLE articles
  DROP CONSTRAINT IF EXISTS articles_program_id_programs_id_fk;

ALTER TABLE articles
  DROP COLUMN IF EXISTS program_id;

COMMIT;
