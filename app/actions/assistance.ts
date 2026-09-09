"use server";

import {
  del,
} from "@vercel/blob";
import {
  and,
  eq,
} from "drizzle-orm";
import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/auth";
import {
  getProgramQuestions,
} from "@/lib/assistance";
import {
  getAssistanceBlobToken,
  isAllowedAssistanceUserPath,
  isPrivateAssistanceBlobUrl,
} from "@/lib/assistance-media";
import {
  db,
} from "@/src/db";
import {
  assistanceApplicationPhotos,
  assistanceApplications,
  auditLogs,
  programs,
  users,
} from "@/src/db/schema";

export type AssistanceActionState = {
  error: string | null;
};

type SubmittedPhoto = {
  id?: string;
  url: string;
  pathname: string;
};

type ParsedApplication = {
  programId: string;
  title: string;
  beneficiaryName: string;
  applicantRelationship: string;
  contactWhatsapp: string;
  village: string;
  subdistrict: string;
  regency: string;
  detailedAddress: string;
  conditionDescription: string;
  targetAmount: string;
  programData: Record<
    string,
    string
  >;
  truthConsent: boolean;
  photos: SubmittedPhoto[];
  intent:
    | "draft"
    | "submit";
};

function getField(
  formData: FormData,
  name: string,
  label: string,
  maxLength: number,
  required: boolean,
) {
  const value =
    String(
      formData.get(name) ||
        "",
    ).trim();

  if (
    required &&
    !value
  ) {
    throw new Error(
      `${label} wajib diisi.`,
    );
  }

  if (
    value.length >
    maxLength
  ) {
    throw new Error(
      `${label} terlalu panjang.`,
    );
  }

  return value;
}

function parsePhotos(
  formData: FormData,
  userId: string,
) {
  const raw =
    String(
      formData.get(
        "uploadedPhotos",
      ) || "[]",
    );

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(raw);
  } catch {
    throw new Error(
      "Data foto pengajuan tidak valid.",
    );
  }

  if (
    !Array.isArray(parsed)
  ) {
    throw new Error(
      "Data foto pengajuan tidak valid.",
    );
  }

  if (
    parsed.length > 5
  ) {
    throw new Error(
      "Maksimal 5 foto untuk satu pengajuan.",
    );
  }

  const result:
    SubmittedPhoto[] = [];

  const seenIds =
    new Set<string>();

  const seenPaths =
    new Set<string>();

  for (
    const item of parsed
  ) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      throw new Error(
        "Data foto pengajuan tidak valid.",
      );
    }

    const object =
      item as Record<
        string,
        unknown
      >;

    const id =
      typeof object.id ===
      "string"
        ? object.id.trim()
        : undefined;

    const url =
      typeof object.url ===
      "string"
        ? object.url.trim()
        : "";

    const pathname =
      typeof object.pathname ===
      "string"
        ? object.pathname.trim()
        : "";

    if (
      !url ||
      !pathname ||
      !isAllowedAssistanceUserPath(
        pathname,
        userId,
      ) ||
      !isPrivateAssistanceBlobUrl(
        url,
        pathname,
      )
    ) {
      throw new Error(
        "Salah satu foto pengajuan tidak valid.",
      );
    }

    if (
      seenPaths.has(
        pathname,
      ) ||
      (
        id &&
        seenIds.has(id)
      )
    ) {
      throw new Error(
        "Foto pengajuan tidak boleh diduplikasi.",
      );
    }

    seenPaths.add(
      pathname,
    );

    if (id) {
      seenIds.add(id);
    }

    result.push({
      id,
      url,
      pathname,
    });
  }

  return result;
}

async function getVerifiedUser() {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  const role = (
    session?.user as
      | {
          role?: string;
        }
      | undefined
  )?.role;

  if (
    !userId ||
    role !== "USER"
  ) {
    return null;
  }

  const [user] =
    await db
      .select({
        id: users.id,
        role: users.role,
        emailVerifiedAt:
          users.emailVerifiedAt,
      })
      .from(users)
      .where(
        eq(
          users.id,
          userId,
        ),
      )
      .limit(1);

  if (
    !user ||
    user.role !== "USER" ||
    !user.emailVerifiedAt
  ) {
    return null;
  }

  return user;
}

async function parseApplication(
  formData: FormData,
  userId: string,
): Promise<ParsedApplication> {
  const intent =
    formData.get("intent") ===
    "submit"
      ? "submit"
      : "draft";

  const isSubmit =
    intent === "submit";

  const programId =
    getField(
      formData,
      "programId",
      "Program bantuan",
      100,
      true,
    );

  const [program] =
    await db
      .select({
        id: programs.id,
        name: programs.name,
        status:
          programs.status,
      })
      .from(programs)
      .where(
        eq(
          programs.id,
          programId,
        ),
      )
      .limit(1);

  if (
    !program ||
    program.status !==
      "ACTIVE"
  ) {
    throw new Error(
      "Program bantuan tidak tersedia.",
    );
  }

  const rawTarget =
    String(
      formData.get(
        "targetAmount",
      ) || "",
    ).trim();

  const targetValue =
    rawTarget
      ? Number(rawTarget)
      : 0;

  if (
    !Number.isFinite(
      targetValue,
    ) ||
    targetValue < 0 ||
    targetValue >
      10_000_000_000
  ) {
    throw new Error(
      "Target bantuan tidak valid.",
    );
  }

  if (
    isSubmit &&
    targetValue <= 0
  ) {
    throw new Error(
      "Target bantuan harus lebih dari Rp0 sebelum pengajuan dikirim.",
    );
  }

  const contactWhatsapp =
    getField(
      formData,
      "contactWhatsapp",
      "Nomor WhatsApp",
      30,
      isSubmit,
    );

  if (
    contactWhatsapp &&
    !/^[+0-9()\-\s]{8,30}$/.test(
      contactWhatsapp,
    )
  ) {
    throw new Error(
      "Format nomor WhatsApp tidak valid.",
    );
  }

  const truthConsent =
    formData.get(
      "truthConsent",
    ) === "on";

  const photos =
    parsePhotos(
      formData,
      userId,
    );

  if (
    isSubmit &&
    photos.length < 2
  ) {
    throw new Error(
      "Minimal 2 foto diperlukan sebelum pengajuan dikirim.",
    );
  }

  if (
    isSubmit &&
    !truthConsent
  ) {
    throw new Error(
      "Anda harus menyatakan bahwa data yang dikirim benar dan dapat diverifikasi.",
    );
  }

  const programData:
    Record<
      string,
      string
    > = {};

  for (
    const question of
      getProgramQuestions(
        program.name,
      )
  ) {
    const value =
      getField(
        formData,
        `program_${question.key}`,
        question.label,
        2000,
        isSubmit,
      );

    if (value) {
      programData[
        question.key
      ] = value;
    }
  }

  return {
    programId:
      program.id,
    title:
      getField(
        formData,
        "title",
        "Judul pengajuan",
        180,
        isSubmit,
      ),
    beneficiaryName:
      getField(
        formData,
        "beneficiaryName",
        "Nama calon penerima",
        150,
        isSubmit,
      ),
    applicantRelationship:
      getField(
        formData,
        "applicantRelationship",
        "Hubungan dengan calon penerima",
        100,
        isSubmit,
      ),
    contactWhatsapp,
    village:
      getField(
        formData,
        "village",
        "Desa/kelurahan",
        120,
        isSubmit,
      ),
    subdistrict:
      getField(
        formData,
        "subdistrict",
        "Kecamatan",
        120,
        isSubmit,
      ),
    regency:
      getField(
        formData,
        "regency",
        "Kabupaten/kota",
        120,
        isSubmit,
      ),
    detailedAddress:
      getField(
        formData,
        "detailedAddress",
        "Alamat lengkap",
        500,
        isSubmit,
      ),
    conditionDescription:
      getField(
        formData,
        "conditionDescription",
        "Kondisi dan alasan pengajuan",
        5000,
        isSubmit,
      ),
    targetAmount:
      Math.round(
        targetValue,
      ).toString(),
    programData,
    truthConsent,
    photos,
    intent,
  };
}

function refreshAssistancePages(
  id?: string,
) {
  revalidatePath(
    "/akun",
  );
  revalidatePath(
    "/akun/pengajuan",
  );

  if (id) {
    revalidatePath(
      `/akun/pengajuan/${id}`,
    );
    revalidatePath(
      `/akun/pengajuan/${id}/edit`,
    );
  }
}

export async function createAssistanceApplication(
  _previousState:
    AssistanceActionState,
  formData: FormData,
): Promise<AssistanceActionState> {
  const user =
    await getVerifiedUser();

  if (!user) {
    return {
      error:
        "Sesi tidak valid. Silakan masuk kembali dan pastikan email telah diverifikasi.",
    };
  }

  let input:
    ParsedApplication;

  try {
    input =
      await parseApplication(
        formData,
        user.id,
      );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Data pengajuan tidak valid.",
    };
  }

  let createdId:
    string;

  try {
    createdId =
      await db.transaction(
        async (tx) => {
          const now =
            new Date();

          const status =
            input.intent ===
            "submit"
              ? "SUBMITTED"
              : "DRAFT";

          const [created] =
            await tx
              .insert(
                assistanceApplications,
              )
              .values({
                applicantId:
                  user.id,
                programId:
                  input.programId,
                title:
                  input.title,
                beneficiaryName:
                  input.beneficiaryName,
                applicantRelationship:
                  input.applicantRelationship,
                contactWhatsapp:
                  input.contactWhatsapp,
                village:
                  input.village,
                subdistrict:
                  input.subdistrict,
                regency:
                  input.regency,
                detailedAddress:
                  input.detailedAddress,
                conditionDescription:
                  input.conditionDescription,
                targetAmount:
                  input.targetAmount,
                programData:
                  input.programData,
                truthConsent:
                  input.truthConsent,
                truthConsentAt:
                  input.truthConsent
                    ? now
                    : null,
                status,
                submittedAt:
                  status ===
                  "SUBMITTED"
                    ? now
                    : null,
                updatedAt:
                  now,
              })
              .returning({
                id:
                  assistanceApplications.id,
              });

          if (
            input.photos.length >
            0
          ) {
            await tx
              .insert(
                assistanceApplicationPhotos,
              )
              .values(
                input.photos.map(
                  (
                    photo,
                    index,
                  ) => ({
                    applicationId:
                      created.id,
                    imageUrl:
                      photo.url,
                    storagePath:
                      photo.pathname,
                    sortOrder:
                      index,
                  }),
                ),
              );
          }

          await tx
            .insert(
              auditLogs,
            )
            .values({
              userId:
                user.id,
              action:
                status ===
                "SUBMITTED"
                  ? "SUBMIT_APPLICATION"
                  : "CREATE_APPLICATION_DRAFT",
              tableName:
                "assistance_applications",
              recordId:
                created.id,
              newData: {
                programId:
                  input.programId,
                title:
                  input.title,
                status,
                photoCount:
                  input.photos.length,
              },
            });

          return created.id;
        },
      );
  } catch (error) {
    console.error(
      "Create assistance application error:",
      error,
    );

    return {
      error:
        "Pengajuan belum dapat disimpan. Silakan coba lagi.",
    };
  }

  refreshAssistancePages(
    createdId,
  );

  redirect(
    `/akun/pengajuan/${createdId}?saved=1`,
  );
}

export async function updateAssistanceApplication(
  applicationId: string,
  _previousState:
    AssistanceActionState,
  formData: FormData,
): Promise<AssistanceActionState> {
  const user =
    await getVerifiedUser();

  if (!user) {
    return {
      error:
        "Sesi tidak valid. Silakan masuk kembali dan pastikan email telah diverifikasi.",
    };
  }

  const [existing] =
    await db
      .select({
        id:
          assistanceApplications.id,
        status:
          assistanceApplications.status,
        submittedAt:
          assistanceApplications.submittedAt,
      })
      .from(
        assistanceApplications,
      )
      .where(
        and(
          eq(
            assistanceApplications.id,
            applicationId,
          ),
          eq(
            assistanceApplications.applicantId,
            user.id,
          ),
        ),
      )
      .limit(1);

  if (!existing) {
    return {
      error:
        "Pengajuan tidak ditemukan.",
    };
  }

  if (
    existing.status !==
      "DRAFT" &&
    existing.status !==
      "NEEDS_REVISION"
  ) {
    return {
      error:
        "Pengajuan pada status ini tidak dapat diubah.",
    };
  }

  let input:
    ParsedApplication;

  try {
    input =
      await parseApplication(
        formData,
        user.id,
      );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Data pengajuan tidak valid.",
    };
  }

  const oldPhotos =
    await db
      .select({
        id:
          assistanceApplicationPhotos.id,
        imageUrl:
          assistanceApplicationPhotos.imageUrl,
        storagePath:
          assistanceApplicationPhotos.storagePath,
      })
      .from(
        assistanceApplicationPhotos,
      )
      .where(
        eq(
          assistanceApplicationPhotos.applicationId,
          applicationId,
        ),
      );

  const oldPhotoMap =
    new Map(
      oldPhotos.map(
        (photo) => [
          photo.id,
          photo,
        ],
      ),
    );

  for (
    const photo of
      input.photos
  ) {
    if (!photo.id) {
      continue;
    }

    const stored =
      oldPhotoMap.get(
        photo.id,
      );

    if (
      !stored ||
      stored.imageUrl !==
        photo.url ||
      stored.storagePath !==
        photo.pathname
    ) {
      return {
        error:
          "Data foto lama tidak valid.",
      };
    }
  }

  const keptIds =
    new Set(
      input.photos
        .map(
          (photo) =>
            photo.id,
        )
        .filter(
          (
            id,
          ): id is string =>
            Boolean(id),
        ),
    );

  const removed =
    oldPhotos.filter(
      (photo) =>
        !keptIds.has(
          photo.id,
        ),
    );

  const newPhotos =
    input.photos.filter(
      (photo) =>
        !photo.id,
    );

  try {
    await db.transaction(
      async (tx) => {
        const now =
          new Date();

        const nextStatus =
          input.intent ===
          "submit"
            ? "SUBMITTED"
            : existing.status;

        await tx
          .update(
            assistanceApplications,
          )
          .set({
            programId:
              input.programId,
            title:
              input.title,
            beneficiaryName:
              input.beneficiaryName,
            applicantRelationship:
              input.applicantRelationship,
            contactWhatsapp:
              input.contactWhatsapp,
            village:
              input.village,
            subdistrict:
              input.subdistrict,
            regency:
              input.regency,
            detailedAddress:
              input.detailedAddress,
            conditionDescription:
              input.conditionDescription,
            targetAmount:
              input.targetAmount,
            programData:
              input.programData,
            truthConsent:
              input.truthConsent,
            truthConsentAt:
              input.truthConsent
                ? now
                : null,
            status:
              nextStatus,
            submittedAt:
              input.intent ===
              "submit"
                ? now
                : existing.submittedAt,
            reviewedBy:
              input.intent ===
              "submit"
                ? null
                : undefined,
            reviewedAt:
              input.intent ===
              "submit"
                ? null
                : undefined,
            updatedAt:
              now,
          })
          .where(
            and(
              eq(
                assistanceApplications.id,
                applicationId,
              ),
              eq(
                assistanceApplications.applicantId,
                user.id,
              ),
            ),
          );

        for (
          const photo of
            removed
        ) {
          await tx
            .delete(
              assistanceApplicationPhotos,
            )
            .where(
              eq(
                assistanceApplicationPhotos.id,
                photo.id,
              ),
            );
        }

        for (
          const [
            index,
            photo,
          ] of input.photos.entries()
        ) {
          if (
            photo.id
          ) {
            await tx
              .update(
                assistanceApplicationPhotos,
              )
              .set({
                sortOrder:
                  index,
              })
              .where(
                eq(
                  assistanceApplicationPhotos.id,
                  photo.id,
                ),
              );
          }
        }

        if (
          newPhotos.length >
          0
        ) {
          await tx
            .insert(
              assistanceApplicationPhotos,
            )
            .values(
              newPhotos.map(
                (photo) => ({
                  applicationId,
                  imageUrl:
                    photo.url,
                  storagePath:
                    photo.pathname,
                  sortOrder:
                    input.photos.findIndex(
                      (candidate) =>
                        candidate.pathname ===
                        photo.pathname,
                    ),
                }),
              ),
            );
        }

        await tx
          .insert(
            auditLogs,
          )
          .values({
            userId:
              user.id,
            action:
              input.intent ===
              "submit"
                ? "RESUBMIT_APPLICATION"
                : "UPDATE_APPLICATION_DRAFT",
            tableName:
              "assistance_applications",
            recordId:
              applicationId,
            oldData: {
              status:
                existing.status,
              photoCount:
                oldPhotos.length,
            },
            newData: {
              status:
                nextStatus,
              programId:
                input.programId,
              title:
                input.title,
              photoCount:
                input.photos.length,
            },
          });
      },
    );
  } catch (error) {
    console.error(
      "Update assistance application error:",
      error,
    );

    return {
      error:
        "Perubahan belum dapat disimpan. Silakan coba lagi.",
    };
  }

  if (
    removed.length >
    0
  ) {
    const token =
      getAssistanceBlobToken();

    if (token) {
      for (
        const photo of
          removed
      ) {
        try {
          await del(
            photo.imageUrl,
            {
              token,
            },
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to delete removed assistance blob:",
            error,
          );
        }
      }
    }
  }

  refreshAssistancePages(
    applicationId,
  );

  redirect(
    `/akun/pengajuan/${applicationId}?saved=1`,
  );
}
