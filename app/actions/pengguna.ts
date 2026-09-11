"use server";

import {
  hash,
} from "bcryptjs";
import {
  eq,
  or,
} from "drizzle-orm";
import {
  revalidatePath,
} from "next/cache";

import {
  auth,
} from "@/auth";
import {
  db,
} from "@/src/db";
import {
  assistanceApplications,
  articles,
  auditLogs,
  campaigns,
  financialTransactions,
  users,
} from "@/src/db/schema";

export async function createUser(
  prevState: any,
  formData: FormData,
) {
  const session =
    await auth();

  if (
    !session?.user?.id ||
    (session.user as any).role !==
      "ADMIN"
  ) {
    return {
      success: false,
      error:
        "Unauthorized. Hanya admin yang dapat menambah pengguna.",
    };
  }

  const name =
    formData.get("name") as string;

  const email =
    formData.get("email") as string;

  const password =
    formData.get("password") as string;

  const role =
    formData.get("role") as
      | "ADMIN"
      | "OPERATOR";

  if (
    !name ||
    !email ||
    !password ||
    !role
  ) {
    return {
      success: false,
      error:
        "Semua field wajib diisi.",
    };
  }

  if (
    role !== "ADMIN" &&
    role !== "OPERATOR"
  ) {
    return {
      success: false,
      error:
        "Role pengguna internal tidak valid.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error:
        "Password minimal 6 karakter.",
    };
  }

  try {
    const passwordHash =
      await hash(
        password,
        10,
      );

    const [newUser] =
      await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role,
        })
        .returning();

    await db
      .insert(auditLogs)
      .values({
        userId:
          session.user.id,
        action:
          "CREATE",
        tableName:
          "users",
        recordId:
          newUser.id,
        newData: {
          id:
            newUser.id,
          email:
            newUser.email,
          role:
            newUser.role,
        },
      });

    revalidatePath(
      "/admin/pengguna",
    );

    return {
      success: true,
      error: null,
    };
  } catch (err: any) {
    if (err.code === "23505") {
      return {
        success: false,
        error:
          "Email sudah terdaftar.",
      };
    }

    return {
      success: false,
      error:
        "Gagal menyimpan pengguna.",
    };
  }
}

async function getUserDeletionBlockers(
  id: string,
) {
  const [
    applications,
    transactions,
    userArticles,
    userCampaigns,
  ] =
    await Promise.all([
      db
        .select({
          id:
            assistanceApplications.id,
        })
        .from(
          assistanceApplications,
        )
        .where(
          eq(
            assistanceApplications
              .applicantId,
            id,
          ),
        )
        .limit(1),

      db
        .select({
          id:
            financialTransactions.id,
        })
        .from(
          financialTransactions,
        )
        .where(
          eq(
            financialTransactions
              .userId,
            id,
          ),
        )
        .limit(1),

      db
        .select({
          id:
            articles.id,
        })
        .from(articles)
        .where(
          eq(
            articles.authorId,
            id,
          ),
        )
        .limit(1),

      db
        .select({
          id:
            campaigns.id,
        })
        .from(campaigns)
        .where(
          or(
            eq(
              campaigns.createdBy,
              id,
            ),
            eq(
              campaigns.updatedBy,
              id,
            ),
          ),
        )
        .limit(1),
    ]);

  const blockers:
    string[] = [];

  if (
    applications.length >
    0
  ) {
    blockers.push(
      "pengajuan bantuan",
    );
  }

  if (
    transactions.length >
    0
  ) {
    blockers.push(
      "transaksi keuangan",
    );
  }

  if (
    userArticles.length >
    0
  ) {
    blockers.push(
      "berita",
    );
  }

  if (
    userCampaigns.length >
    0
  ) {
    blockers.push(
      "campaign bantuan",
    );
  }

  return blockers;
}

export async function deleteUser(
  id: string,
) {
  const session =
    await auth();

  if (
    !session?.user?.id ||
    (session.user as any).role !==
      "ADMIN"
  ) {
    return {
      success: false,
      error:
        "Unauthorized.",
    };
  }

  const actorUserId =
    session.user.id;

  if (
    actorUserId === id
  ) {
    return {
      success: false,
      error:
        "Tidak dapat menghapus akun Administrator yang sedang digunakan.",
    };
  }

  try {
    const [oldData] =
      await db
        .select()
        .from(users)
        .where(
          eq(
            users.id,
            id,
          ),
        )
        .limit(1);

    if (!oldData) {
      return {
        success: false,
        error:
          "Pengguna tidak ditemukan.",
      };
    }

    if (
      oldData.role ===
      "ADMIN"
    ) {
      const admins =
        await db
          .select({
            id:
              users.id,
          })
          .from(users)
          .where(
            eq(
              users.role,
              "ADMIN",
            ),
          )
          .limit(2);

      if (
        admins.length <= 1
      ) {
        return {
          success: false,
          error:
            "Administrator terakhir tidak dapat dihapus.",
        };
      }
    }

    const blockers =
      await getUserDeletionBlockers(
        id,
      );

    if (
      blockers.length >
      0
    ) {
      return {
        success: false,
        error:
          `Pengguna tidak dapat dihapus karena masih memiliki ${blockers.join(
            ", ",
          )}. Riwayat tersebut harus dipertahankan untuk menjaga integritas data.`,
      };
    }

    await db.transaction(
      async (tx) => {
        await tx
          .delete(users)
          .where(
            eq(
              users.id,
              id,
            ),
          );

        await tx
          .insert(
            auditLogs,
          )
          .values({
            userId:
              actorUserId,
            action:
              "DELETE",
            tableName:
              "users",
            recordId:
              id,
            oldData: {
              id:
                oldData.id,
              email:
                oldData.email,
              role:
                oldData.role,
            },
          });
      },
    );

    revalidatePath(
      "/admin/pengguna",
    );

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(
      "Delete user error:",
      error,
    );

    return {
      success: false,
      error:
        "Pengguna belum dapat dihapus karena masih terdapat relasi data yang harus dipertahankan.",
    };
  }
}