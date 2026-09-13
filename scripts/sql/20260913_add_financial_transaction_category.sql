BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'financial_transaction_category'
  ) THEN
    CREATE TYPE financial_transaction_category AS ENUM (
      'INCOME',
      'EXPENSE',
      'LOAN_OUT',
      'LOAN_REPAYMENT'
    );
  END IF;
END
$$;

ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS category financial_transaction_category;

UPDATE financial_transactions
SET category =
  CASE
    WHEN type = 'IN'
      THEN 'INCOME'::financial_transaction_category
    ELSE 'EXPENSE'::financial_transaction_category
  END
WHERE category IS NULL;

UPDATE financial_transactions
SET category = 'LOAN_OUT'::financial_transaction_category
WHERE id IN (
  '37c1c164-1658-4592-9aae-d608c041f96f',
  'aeed272c-7524-43ef-bf7f-f36af57e56eb',
  'fd2114ee-530c-4795-9baf-a4dc373bf0f0',
  '3055d014-594f-4bfd-960a-89758a655b5e'
);

UPDATE financial_transactions
SET category = 'LOAN_REPAYMENT'::financial_transaction_category
WHERE id IN (
  'aa110dcf-52cd-443f-83b9-85a62afdcf41',
  '8b6d99f9-c53f-4b72-8b81-13822ff3a1e4'
);

COMMIT;
