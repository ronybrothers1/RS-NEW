import {
  inArray,
} from "drizzle-orm";

import { db } from "@/src/db";
import {
  settings,
} from "@/src/db/schema";

const BALANCE_KEY =
  "finance_opening_balance";

const DATE_KEY =
  "finance_opening_balance_date";

export async function getFinanceOpeningBalance() {
  const rows = await db
    .select({
      key: settings.key,
      value: settings.value,
    })
    .from(settings)
    .where(
      inArray(
        settings.key,
        [
          BALANCE_KEY,
          DATE_KEY,
        ],
      ),
    );

  const balanceRaw =
    rows.find(
      (row) =>
        row.key === BALANCE_KEY,
    )?.value ?? "0";

  const dateRaw =
    rows.find(
      (row) =>
        row.key === DATE_KEY,
    )?.value ?? null;

  const parsedBalance =
    Number(balanceRaw);

  const amount =
    Number.isFinite(
      parsedBalance,
    ) &&
    parsedBalance >= 0
      ? parsedBalance
      : 0;

  const date =
    dateRaw &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateRaw,
    )
      ? dateRaw
      : null;

  return {
    amount,
    date,
  };
}