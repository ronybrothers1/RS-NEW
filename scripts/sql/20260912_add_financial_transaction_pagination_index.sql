BEGIN;

CREATE INDEX IF NOT EXISTS financial_transactions_active_date_created_idx
  ON financial_transactions (date DESC, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

COMMIT;
