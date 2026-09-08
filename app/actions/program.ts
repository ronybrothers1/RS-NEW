"use server";

import { auth } from "@/auth";
import { db } from "@/src/db";
import { auditLogs, programs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const ALLOWED_ICONS = new Set([
  "HeartHandshake",
  "BookOpen",
  "Stethoscope",
  "Leaf",
  "Users",
  "Activity",
  "FileText",
]);

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAmount(value: string) {
  const clean = value.replace(/\D/g, "");
  return clean || null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function revalidateProgramPages() {
  revalidatePath("/admin/program");
  revalidatePath("/admin/dashboard");
  revalidatePath("/program");
  revalidatePath("/");
  revalidatePath("/donasi");
  revalidatePath("/admin/kegiatan/tambah");
  revalidatePath("/admin/kegiatan");
  revalidatePath("/kegiatan");
}

async function requireAdminUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (
    !userId ||
    (session?.user as any)?.role !== "ADMIN"
  ) {
    return null;
  }

  return userId;
}

export async function createProgram(formData: FormData) {
  const userId = await requireAdminUserId();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }

  const name = cleanText(formData.get("name"));
  const description = cleanText(
    formData.get("description"),
  );
  const icon = cleanText(formData.get("icon"));
  const targetAmount = normalizeAmount(
    cleanText(formData.get("targetAmount")),
  );

  if (!name) {
    return {
      success: false,
      error: "Nama program wajib diisi.",
    };
  }

  if (name.length > 180) {
    return {
      success: false,
      error: "Nama program maksimal 180 karakter.",
    };
  }

  if (!ALLOWED_ICONS.has(icon)) {
    return {
      success: false,
      error: "Ikon program tidak valid.",
    };
  }

  if (description.length > 1500) {
    return {
      success: false,
      error: "Deskripsi program maksimal 1.500 karakter.",
    };
  }

  try {
    const existing = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.name, name))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Nama program tersebut sudah tersedia.",
      };
    }

    const [created] = await db
      .insert(programs)
      .values({
        name,
        description: description || null,
        icon,
        targetAmount,
        status: "ACTIVE",
      })
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action: "CREATE",
      tableName: "programs",
      recordId: created.id,
      newData: created,
    });

    revalidateProgramPages();

    return {
      success: true,
      id: created.id,
    };
  } catch (error) {
    console.error("Create program error:", error);

    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan program.",
    };
  }
}

export async function updateProgram(
  id: string,
  formData: FormData,
) {
  const userId = await requireAdminUserId();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error: "ID program tidak valid.",
    };
  }

  const name = cleanText(formData.get("name"));
  const description = cleanText(
    formData.get("description"),
  );
  const icon = cleanText(formData.get("icon"));
  const targetAmount = normalizeAmount(
    cleanText(formData.get("targetAmount")),
  );

  if (!name) {
    return {
      success: false,
      error: "Nama program wajib diisi.",
    };
  }

  if (name.length > 180) {
    return {
      success: false,
      error: "Nama program maksimal 180 karakter.",
    };
  }

  if (!ALLOWED_ICONS.has(icon)) {
    return {
      success: false,
      error: "Ikon program tidak valid.",
    };
  }

  if (description.length > 1500) {
    return {
      success: false,
      error: "Deskripsi program maksimal 1.500 karakter.",
    };
  }

  try {
    const [oldProgram] = await db
      .select()
      .from(programs)
      .where(eq(programs.id, id))
      .limit(1);

    if (!oldProgram) {
      return {
        success: false,
        error: "Program tidak ditemukan.",
      };
    }

    const sameNamePrograms = await db
      .select({
        id: programs.id,
      })
      .from(programs)
      .where(eq(programs.name, name));

    const duplicateName = sameNamePrograms.some(
      (program) => program.id !== id,
    );

    if (duplicateName) {
      return {
        success: false,
        error: "Nama program tersebut sudah digunakan.",
      };
    }

    const [updated] = await db
      .update(programs)
      .set({
        name,
        description: description || null,
        icon,
        targetAmount,
      })
      .where(eq(programs.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action: "UPDATE",
      tableName: "programs",
      recordId: id,
      oldData: oldProgram,
      newData: updated,
    });

    revalidateProgramPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update program error:", error);

    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui program.",
    };
  }
}

export async function setProgramStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
) {
  const userId = await requireAdminUserId();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error: "ID program tidak valid.",
    };
  }

  if (
    status !== "ACTIVE" &&
    status !== "INACTIVE"
  ) {
    return {
      success: false,
      error: "Status program tidak valid.",
    };
  }

  try {
    const [oldProgram] = await db
      .select()
      .from(programs)
      .where(eq(programs.id, id))
      .limit(1);

    if (!oldProgram) {
      return {
        success: false,
        error: "Program tidak ditemukan.",
      };
    }


    const [updated] = await db
      .update(programs)
      .set({ status })
      .where(eq(programs.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action:
        status === "ACTIVE"
          ? "ACTIVATE"
          : "DEACTIVATE",
      tableName: "programs",
      recordId: id,
      oldData: oldProgram,
      newData: updated,
    });

    revalidateProgramPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Set program status error:", error);

    return {
      success: false,
      error: "Gagal mengubah status program.",
    };
  }
}

/**
 * Compatibility wrapper untuk pemanggilan lama.
 * Tidak melakukan hard delete.
 */
export async function deleteProgram(id: string) {
  return setProgramStatus(id, "INACTIVE");
}
