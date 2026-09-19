BEGIN;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS program_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'articles_program_id_programs_id_fk'
  ) THEN
    ALTER TABLE articles
      ADD CONSTRAINT articles_program_id_programs_id_fk
      FOREIGN KEY (program_id)
      REFERENCES programs(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS articles_program_id_idx
  ON articles(program_id);

COMMIT;
