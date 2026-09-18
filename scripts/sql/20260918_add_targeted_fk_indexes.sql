-- F10 targeted foreign-key/query indexes.
-- Additive only; no application row is changed.
--
-- IMPORTANT:
-- Execute separately with production guards.
-- CREATE INDEX CONCURRENTLY must not run inside BEGIN/COMMIT.

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  assistance_applications_applicant_updated_idx
ON assistance_applications (
  applicant_id,
  updated_at DESC
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  assistance_applications_program_updated_idx
ON assistance_applications (
  program_id,
  updated_at DESC
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  assistance_application_photos_application_sort_idx
ON assistance_application_photos (
  application_id,
  sort_order
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  financial_transactions_campaign_deleted_date_idx
ON financial_transactions (
  campaign_id,
  deleted_at,
  date DESC,
  created_at DESC,
  id DESC
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  financial_transactions_program_deleted_date_idx
ON financial_transactions (
  program_id,
  deleted_at,
  date DESC,
  created_at DESC,
  id DESC
);
