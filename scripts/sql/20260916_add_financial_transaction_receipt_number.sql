BEGIN;

CREATE SEQUENCE IF NOT EXISTS financial_transaction_receipt_seq
  AS bigint
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS receipt_number text;

ALTER SEQUENCE financial_transaction_receipt_seq
  OWNED BY financial_transactions.receipt_number;

ALTER TABLE financial_transactions
  ALTER COLUMN receipt_number
  SET DEFAULT (
    'RS-KAS-' ||
    lpad(
      nextval('financial_transaction_receipt_seq')::text,
      6,
      '0'
    )
  );

UPDATE financial_transactions
SET receipt_number =
  'RS-KAS-' ||
  lpad(
    nextval('financial_transaction_receipt_seq')::text,
    6,
    '0'
  )
WHERE receipt_number IS NULL;

DO $$
DECLARE
  max_receipt_number bigint;
  sequence_last_value bigint;
BEGIN
  SELECT
    COALESCE(
      MAX(
        CASE
          WHEN receipt_number ~ '^RS-KAS-[0-9]+$'
          THEN substring(
            receipt_number
            FROM '^RS-KAS-([0-9]+)$'
          )::bigint
          ELSE NULL
        END
      ),
      0
    )
  INTO max_receipt_number
  FROM financial_transactions;

  IF max_receipt_number > 0 THEN
    SELECT last_value
    INTO sequence_last_value
    FROM financial_transaction_receipt_seq;

    PERFORM setval(
      'financial_transaction_receipt_seq',
      GREATEST(
        max_receipt_number,
        sequence_last_value
      ),
      true
    );
  END IF;
END
$$;

ALTER TABLE financial_transactions
  ALTER COLUMN receipt_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  financial_transactions_receipt_number_unique
ON financial_transactions (receipt_number);

COMMIT;