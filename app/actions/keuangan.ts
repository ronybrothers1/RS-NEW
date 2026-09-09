"use server";

import { auth } from "@/auth";
import { db } from "@/src/db";
import {
  auditLogs,
  campaigns,
  financialTransactions,
  programs,
} from "@/src/db/schema";
import {
  and,
  eq,
  isNull,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type KeuanganActionResult = {
  success: boolean;
  error: string | null;
  id?: string;
};

type CampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

function cleanText(
  value: FormDataEntryValue | null,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptional(
  value: FormDataEntryValue | null,
) {
  const text = cleanText(value);
  return text || null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeAmount(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const normalized =
    digits.replace(/^0+(?=\d)/, "");

  const numericValue = Number(normalized);

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue <= 0
  ) {
    return null;
  }

  return normalized;
}

function parseDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const parsed = new Date(
    `${value}T12:00:00.000Z`,
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isWebsiteDonationTransaction(
  transaction: {
    donationId: string | null;
    type: "IN" | "OUT";
    description: string;
  },
) {
  return (
    Boolean(transaction.donationId) ||
    (
      transaction.type === "IN" &&
      transaction.description.startsWith(
        "Donasi via Website - ",
      )
    )
  );
}

async function getFinanceSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const role = (
    session.user as {
      role?: string;
    }
  ).role;

  if (
    role !== "ADMIN" &&
    role !== "OPERATOR"
  ) {
    return null;
  }

  return {
    userId: session.user.id,
    role,
  };
}

function revalidateFinancePages(
  campaignId?: string | null,
) {
  revalidatePath("/admin/dashboard");
  revalidatePath(
    "/admin/keuangan/masuk",
  );
  revalidatePath(
    "/admin/keuangan/keluar",
  );
  revalidatePath(
    "/admin/keuangan/riwayat",
  );
  revalidatePath(
    "/admin/keuangan/kampanye",
  );
  revalidatePath("/transparansi");
  revalidatePath("/bantuan");

  if (campaignId) {
    revalidatePath(
      `/admin/keuangan/kampanye/${campaignId}`,
    );
  }
}

async function resolveProgram(
  rawValue: string | null,
  currentProgramId?: string | null,
) {
  if (
    !rawValue ||
    rawValue === "other"
  ) {
    return {
      success: true as const,
      id: null,
    };
  }

  let program;

  if (isUuid(rawValue)) {
    [program] = await db
      .select({
        id: programs.id,
        status: programs.status,
      })
      .from(programs)
      .where(eq(programs.id, rawValue))
      .limit(1);
  } else {
    [program] = await db
      .select({
        id: programs.id,
        status: programs.status,
      })
      .from(programs)
      .where(eq(programs.name, rawValue))
      .limit(1);
  }

  if (!program) {
    return {
      success: false as const,
      error:
        "Program yang dipilih tidak ditemukan.",
    };
  }

  if (
    program.status !== "ACTIVE" &&
    program.id !== currentProgramId
  ) {
    return {
      success: false as const,
      error:
        "Program tersebut sedang nonaktif.",
    };
  }

  return {
    success: true as const,
    id: program.id,
  };
}

async function resolveCampaign(
  rawCampaignId: string | null,
  rawProgramId: string | null,
  allowedStatuses: CampaignStatus[],
) {
  if (!rawCampaignId) {
    const program =
      await resolveProgram(rawProgramId);

    if (!program.success) {
      return program;
    }

    return {
      success: true as const,
      campaignId: null,
      programId: program.id,
      campaignTitle: null,
    };
  }

  if (!isUuid(rawCampaignId)) {
    return {
      success: false as const,
      error:
        "Kampanye yang dipilih tidak valid.",
    };
  }

  const [campaign] = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      programId: campaigns.programId,
      status: campaigns.status,
    })
    .from(campaigns)
    .where(
      eq(
        campaigns.id,
        rawCampaignId,
      ),
    )
    .limit(1);

  if (!campaign) {
    return {
      success: false as const,
      error:
        "Kampanye tidak ditemukan.",
    };
  }

  if (
    !allowedStatuses.includes(
      campaign.status,
    )
  ) {
    return {
      success: false as const,
      error:
        "Kampanye pada status ini tidak dapat menerima transaksi tersebut.",
    };
  }

  if (
    rawProgramId &&
    rawProgramId !== "other" &&
    rawProgramId !== campaign.programId
  ) {
    return {
      success: false as const,
      error:
        "Kampanye tidak sesuai dengan program yang dipilih.",
    };
  }

  return {
    success: true as const,
    campaignId: campaign.id,
    programId: campaign.programId,
    campaignTitle: campaign.title,
  };
}

function calculateAvailable(
  rows: Array<{
    type: "IN" | "OUT";
    amount: string;
  }>,
) {
  let collected = 0;
  let spent = 0;

  for (const row of rows) {
    const amount = Number(row.amount);

    if (!Number.isFinite(amount)) {
      continue;
    }

    if (row.type === "IN") {
      collected += amount;
    } else {
      spent += amount;
    }
  }

  return {
    collected,
    spent,
    available:
      collected - spent,
  };
}

export async function createTransaksiMasuk(
  _prevState: unknown,
  formData: FormData,
): Promise<KeuanganActionResult> {
  const financeUser =
    await getFinanceSession();

  if (!financeUser) {
    return {
      success: false,
      error:
        "Anda tidak memiliki akses untuk mencatat transaksi.",
    };
  }

  const date = parseDate(
    cleanText(formData.get("date")),
  );

  const amount = normalizeAmount(
    cleanText(formData.get("amount")),
  );

  const donorName = cleanText(
    formData.get("donorName"),
  );

  const description =
    cleanOptional(
      formData.get("description"),
    ) ?? "Penerimaan Dana";

  const rawProgramId = cleanOptional(
    formData.get("programId"),
  );

  const rawCampaignId = cleanOptional(
    formData.get("campaignId"),
  );

  if (!date) {
    return {
      success: false,
      error: "Tanggal tidak valid.",
    };
  }

  if (!amount) {
    return {
      success: false,
      error:
        "Nominal harus lebih besar dari Rp0.",
    };
  }

  if (!donorName) {
    return {
      success: false,
      error:
        "Nama donatur atau sumber dana wajib diisi.",
    };
  }

  if (donorName.length > 180) {
    return {
      success: false,
      error:
        "Nama sumber dana maksimal 180 karakter.",
    };
  }

  if (description.length > 1000) {
    return {
      success: false,
      error:
        "Keterangan maksimal 1.000 karakter.",
    };
  }

  const target =
    await resolveCampaign(
      rawCampaignId,
      rawProgramId,
      ["ACTIVE"],
    );

  if (!target.success) {
    return {
      success: false,
      error: target.error,
    };
  }

  try {
    const created =
      await db.transaction(
        async (tx) => {
          const [newTransaction] =
            await tx
              .insert(
                financialTransactions,
              )
              .values({
                type: "IN",
                amount,
                date,
                description,
                programId:
                  target.programId,
                campaignId:
                  target.campaignId,
                userId:
                  financeUser.userId,
                donorName,
                isAnonymous: false,
                updatedAt: new Date(),
              })
              .returning();

          await tx
            .insert(auditLogs)
            .values({
              userId:
                financeUser.userId,
              action: "CREATE",
              tableName:
                "financial_transactions",
              recordId:
                newTransaction.id,
              newData:
                newTransaction,
            });

          return newTransaction;
        },
      );

    revalidateFinancePages(
      target.campaignId,
    );

    return {
      success: true,
      error: null,
      id: created.id,
    };
  } catch (error) {
    console.error(
      "Create income transaction error:",
      error,
    );

    return {
      success: false,
      error:
        "Gagal menyimpan uang masuk.",
    };
  }
}

export async function createTransaksiKeluar(
  _prevState: unknown,
  formData: FormData,
): Promise<KeuanganActionResult> {
  const financeUser =
    await getFinanceSession();

  if (!financeUser) {
    return {
      success: false,
      error:
        "Anda tidak memiliki akses untuk mencatat transaksi.",
    };
  }

  const date = parseDate(
    cleanText(formData.get("date")),
  );

  const amount = normalizeAmount(
    cleanText(formData.get("amount")),
  );

  const description = cleanText(
    formData.get("description"),
  );

  const rawProgramId = cleanText(
    formData.get("programId"),
  );

  const rawCampaignId = cleanOptional(
    formData.get("campaignId"),
  );

  if (!date) {
    return {
      success: false,
      error: "Tanggal tidak valid.",
    };
  }

  if (!amount) {
    return {
      success: false,
      error:
        "Nominal harus lebih besar dari Rp0.",
    };
  }

  if (
    !rawProgramId &&
    !rawCampaignId
  ) {
    return {
      success: false,
      error:
        "Pilih program, kampanye, atau kategori Umum.",
    };
  }

  if (!description) {
    return {
      success: false,
      error:
        "Keterangan pengeluaran wajib diisi.",
    };
  }

  if (description.length > 1000) {
    return {
      success: false,
      error:
        "Keterangan maksimal 1.000 karakter.",
    };
  }

  const target =
    await resolveCampaign(
      rawCampaignId,
      rawProgramId || null,
      [
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
      ],
    );

  if (!target.success) {
    return {
      success: false,
      error: target.error,
    };
  }

  try {
    const result =
      await db.transaction(
        async (tx) => {
          if (target.campaignId) {
            const ledgerRows =
              await tx
                .select({
                  type:
                    financialTransactions.type,
                  amount:
                    financialTransactions.amount,
                })
                .from(
                  financialTransactions,
                )
                .where(
                  and(
                    eq(
                      financialTransactions.campaignId,
                      target.campaignId,
                    ),
                    isNull(
                      financialTransactions.deletedAt,
                    ),
                  ),
                );

            const totals =
              calculateAvailable(
                ledgerRows,
              );

            if (
              Number(amount) >
              totals.available
            ) {
              return {
                success:
                  false as const,
                error:
                  `Saldo kampanye tidak mencukupi. Saldo tersedia Rp${totals.available.toLocaleString("id-ID")}.`,
              };
            }
          }

          const [newTransaction] =
            await tx
              .insert(
                financialTransactions,
              )
              .values({
                type: "OUT",
                amount,
                date,
                description,
                programId:
                  target.programId,
                campaignId:
                  target.campaignId,
                userId:
                  financeUser.userId,
                donorName: null,
                isAnonymous: false,
                updatedAt: new Date(),
              })
              .returning();

          await tx
            .insert(auditLogs)
            .values({
              userId:
                financeUser.userId,
              action: "CREATE",
              tableName:
                "financial_transactions",
              recordId:
                newTransaction.id,
              newData:
                newTransaction,
            });

          return {
            success:
              true as const,
            error: null,
            transaction:
              newTransaction,
          };
        },
      );

    if (!result.success) {
      return result;
    }

    revalidateFinancePages(
      target.campaignId,
    );

    return {
      success: true,
      error: null,
      id: result.transaction.id,
    };
  } catch (error) {
    console.error(
      "Create expense transaction error:",
      error,
    );

    return {
      success: false,
      error:
        "Gagal menyimpan uang keluar.",
    };
  }
}

export async function updateTransaksi(
  id: string,
  formData: FormData,
): Promise<KeuanganActionResult> {
  const financeUser =
    await getFinanceSession();

  if (!financeUser) {
    return {
      success: false,
      error:
        "Anda tidak memiliki akses untuk mengubah transaksi.",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error:
        "ID transaksi tidak valid.",
    };
  }

  const [oldTransaction] = await db
    .select()
    .from(financialTransactions)
    .where(
      and(
        eq(
          financialTransactions.id,
          id,
        ),
        isNull(
          financialTransactions.deletedAt,
        ),
      ),
    )
    .limit(1);

  if (!oldTransaction) {
    return {
      success: false,
      error:
        "Transaksi tidak ditemukan.",
    };
  }

  if (
    isWebsiteDonationTransaction(
      oldTransaction,
    )
  ) {
    return {
      success: false,
      error:
        "Transaksi yang berasal dari donasi website tidak dapat diedit dari menu Keuangan.",
    };
  }

  const type = cleanText(
    formData.get("type"),
  );

  if (
    type !== "IN" &&
    type !== "OUT"
  ) {
    return {
      success: false,
      error:
        "Jenis transaksi tidak valid.",
    };
  }

  const date = parseDate(
    cleanText(formData.get("date")),
  );

  const amount = normalizeAmount(
    cleanText(formData.get("amount")),
  );

  const description = cleanText(
    formData.get("description"),
  );

  const donorName =
    type === "IN"
      ? cleanText(
          formData.get("donorName"),
        )
      : "";

  const rawProgramId =
    cleanOptional(
      formData.get("programId"),
    );

  if (!date) {
    return {
      success: false,
      error: "Tanggal tidak valid.",
    };
  }

  if (!amount) {
    return {
      success: false,
      error:
        "Nominal harus lebih besar dari Rp0.",
    };
  }

  if (!description) {
    return {
      success: false,
      error:
        "Keterangan transaksi wajib diisi.",
    };
  }

  if (
    type === "IN" &&
    !donorName
  ) {
    return {
      success: false,
      error:
        "Nama donatur atau sumber dana wajib diisi.",
    };
  }

  if (
    donorName &&
    donorName.length > 180
  ) {
    return {
      success: false,
      error:
        "Nama sumber dana maksimal 180 karakter.",
    };
  }

  if (description.length > 1000) {
    return {
      success: false,
      error:
        "Keterangan maksimal 1.000 karakter.",
    };
  }

  let targetProgramId:
    string | null =
    oldTransaction.programId;

  if (oldTransaction.campaignId) {
    const [campaign] = await db
      .select({
        id: campaigns.id,
        programId:
          campaigns.programId,
      })
      .from(campaigns)
      .where(
        eq(
          campaigns.id,
          oldTransaction.campaignId,
        ),
      )
      .limit(1);

    if (!campaign) {
      return {
        success: false,
        error:
          "Kampanye transaksi ini tidak ditemukan.",
      };
    }

    if (
      rawProgramId &&
      rawProgramId !==
        campaign.programId
    ) {
      return {
        success: false,
        error:
          "Program transaksi kampanye tidak dapat diubah ke program lain.",
      };
    }

    targetProgramId =
      campaign.programId;
  } else {
    const resolvedProgram =
      await resolveProgram(
        rawProgramId,
        oldTransaction.programId,
      );

    if (!resolvedProgram.success) {
      return {
        success: false,
        error:
          resolvedProgram.error,
      };
    }

    targetProgramId =
      resolvedProgram.id;
  }

  try {
    const result =
      await db.transaction(
        async (tx) => {
          if (
            oldTransaction.campaignId
          ) {
            const ledgerRows =
              await tx
                .select({
                  id:
                    financialTransactions.id,
                  type:
                    financialTransactions.type,
                  amount:
                    financialTransactions.amount,
                })
                .from(
                  financialTransactions,
                )
                .where(
                  and(
                    eq(
                      financialTransactions.campaignId,
                      oldTransaction.campaignId,
                    ),
                    isNull(
                      financialTransactions.deletedAt,
                    ),
                  ),
                );

            const rowsWithoutCurrent =
              ledgerRows
                .filter(
                  (row) =>
                    row.id !== id,
                )
                .map((row) => ({
                  type: row.type,
                  amount: row.amount,
                }));

            const totals =
              calculateAvailable(
                rowsWithoutCurrent,
              );

            const nextAvailable =
              totals.available +
              (
                type === "IN"
                  ? Number(amount)
                  : -Number(amount)
              );

            if (nextAvailable < 0) {
              return {
                success:
                  false as const,
                error:
                  `Perubahan membuat saldo kampanye menjadi minus Rp${Math.abs(nextAvailable).toLocaleString("id-ID")}.`,
              };
            }
          }

          const [newTransaction] =
            await tx
              .update(
                financialTransactions,
              )
              .set({
                type,
                amount,
                date,
                description,
                programId:
                  targetProgramId,
                campaignId:
                  oldTransaction.campaignId,
                donorName:
                  type === "IN"
                    ? donorName
                    : null,
                isAnonymous: false,
                updatedAt: new Date(),
              })
              .where(
                eq(
                  financialTransactions.id,
                  id,
                ),
              )
              .returning();

          await tx
            .insert(auditLogs)
            .values({
              userId:
                financeUser.userId,
              action: "UPDATE",
              tableName:
                "financial_transactions",
              recordId: id,
              oldData:
                oldTransaction,
              newData:
                newTransaction,
            });

          return {
            success:
              true as const,
            error: null,
            transaction:
              newTransaction,
          };
        },
      );

    if (!result.success) {
      return result;
    }

    revalidateFinancePages(
      oldTransaction.campaignId,
    );

    return {
      success: true,
      error: null,
      id: result.transaction.id,
    };
  } catch (error) {
    console.error(
      "Update transaction error:",
      error,
    );

    return {
      success: false,
      error:
        "Gagal memperbarui transaksi.",
    };
  }
}

export async function deleteTransaksi(
  id: string,
): Promise<KeuanganActionResult> {
  const financeUser =
    await getFinanceSession();

  if (
    !financeUser ||
    financeUser.role !== "ADMIN"
  ) {
    return {
      success: false,
      error:
        "Hanya Admin yang dapat menghapus transaksi.",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error:
        "ID transaksi tidak valid.",
    };
  }

  try {
    const result =
      await db.transaction(
        async (tx) => {
          const [oldTransaction] =
            await tx
              .select()
              .from(
                financialTransactions,
              )
              .where(
                and(
                  eq(
                    financialTransactions.id,
                    id,
                  ),
                  isNull(
                    financialTransactions.deletedAt,
                  ),
                ),
              )
              .limit(1);

          if (!oldTransaction) {
            return {
              success:
                false as const,
              error:
                "Transaksi tidak ditemukan.",
            };
          }

          if (
            isWebsiteDonationTransaction(
              oldTransaction,
            )
          ) {
            return {
              success:
                false as const,
              error:
                "Transaksi dari donasi website tidak dapat dihapus dari menu Keuangan.",
            };
          }

          if (
            oldTransaction.campaignId &&
            oldTransaction.type === "IN"
          ) {
            const ledgerRows =
              await tx
                .select({
                  id:
                    financialTransactions.id,
                  type:
                    financialTransactions.type,
                  amount:
                    financialTransactions.amount,
                })
                .from(
                  financialTransactions,
                )
                .where(
                  and(
                    eq(
                      financialTransactions.campaignId,
                      oldTransaction.campaignId,
                    ),
                    isNull(
                      financialTransactions.deletedAt,
                    ),
                  ),
                );

            const totals =
              calculateAvailable(
                ledgerRows
                  .filter(
                    (row) =>
                      row.id !== id,
                  )
                  .map((row) => ({
                    type: row.type,
                    amount: row.amount,
                  })),
              );

            if (totals.available < 0) {
              return {
                success:
                  false as const,
                error:
                  "Penerimaan ini tidak dapat dihapus karena dana kampanye sudah digunakan. Sesuaikan pengeluaran terlebih dahulu.",
              };
            }
          }

          const [updated] =
            await tx
              .update(
                financialTransactions,
              )
              .set({
                deletedAt:
                  new Date(),
                updatedAt:
                  new Date(),
              })
              .where(
                eq(
                  financialTransactions.id,
                  id,
                ),
              )
              .returning();

          await tx
            .insert(auditLogs)
            .values({
              userId:
                financeUser.userId,
              action:
                "SOFT_DELETE",
              tableName:
                "financial_transactions",
              recordId: id,
              oldData:
                oldTransaction,
              newData: updated,
            });

          return {
            success:
              true as const,
            error: null,
            campaignId:
              oldTransaction.campaignId,
          };
        },
      );

    if (!result.success) {
      return result;
    }

    revalidateFinancePages(
      result.campaignId,
    );

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(
      "Delete transaction error:",
      error,
    );

    return {
      success: false,
      error:
        "Gagal menghapus transaksi.",
    };
  }
}
