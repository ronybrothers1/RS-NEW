-- PASSWORD RECOVERY FOUNDATION
-- Additive-only schema change.
-- IMPORTANT:
--   This file must NOT be executed automatically.
--   Production execution requires a separate guarded step
--   after exact SQL review and a fresh read-only preflight.

BEGIN;

CREATE TABLE "public"."password_reset_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_sent_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "password_reset_codes_user_id_unique"
    UNIQUE("user_id")
);

ALTER TABLE "public"."password_reset_codes"
  ADD CONSTRAINT "password_reset_codes_user_id_users_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."users"("id")
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

COMMIT;