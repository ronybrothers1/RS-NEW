import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/auth";
import {
  ASSISTANCE_STATUS_META,
  formatRupiah,
  getProgramQuestions,
  type AssistanceApplicationStatus,
} from "@/lib/assistance";
import {
  db,
} from "@/src/db";
import {
  assistanceApplicationPhotos,
  assistanceApplications,
  programs,
  users,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

function formatDate(
  value:
    | Date
    | null,
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    },
  ).format(value);
}

export default async function AssistanceApplicationDetailPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      id: string;
    }>;
  searchParams:
    Promise<{
      saved?: string;
    }>;
}) {
  const session =
    await auth();

  if (
    !session?.user?.id
  ) {
    redirect(
      "/login",
    );
  }

  const role = (
    session.user as {
      role?: string;
    }
  ).role;

  if (
    role !== "USER"
  ) {
    redirect(
      "/admin/dashboard",
    );
  }

  const [user] =
    await db
      .select({
        id: users.id,
        emailVerifiedAt:
          users.emailVerifiedAt,
      })
      .from(users)
      .where(
        eq(
          users.id,
          session.user.id,
        ),
      )
      .limit(1);

  if (!user) {
    redirect(
      "/login",
    );
  }

  if (
    !user.emailVerifiedAt
  ) {
    redirect(
      "/verifikasi-email",
    );
  }

  const {
    id,
  } = await params;

  const [
    application,
  ] =
    await db
      .select({
        id:
          assistanceApplications.id,
        programId:
          assistanceApplications.programId,
        programName:
          programs.name,
        title:
          assistanceApplications.title,
        beneficiaryName:
          assistanceApplications.beneficiaryName,
        applicantRelationship:
          assistanceApplications.applicantRelationship,
        contactWhatsapp:
          assistanceApplications.contactWhatsapp,
        village:
          assistanceApplications.village,
        subdistrict:
          assistanceApplications.subdistrict,
        regency:
          assistanceApplications.regency,
        detailedAddress:
          assistanceApplications.detailedAddress,
        conditionDescription:
          assistanceApplications.conditionDescription,
        targetAmount:
          assistanceApplications.targetAmount,
        programData:
          assistanceApplications.programData,
        truthConsent:
          assistanceApplications.truthConsent,
        status:
          assistanceApplications.status,
        reviewNote:
          assistanceApplications.reviewNote,
        submittedAt:
          assistanceApplications.submittedAt,
        reviewedAt:
          assistanceApplications.reviewedAt,
        createdAt:
          assistanceApplications.createdAt,
        updatedAt:
          assistanceApplications.updatedAt,
      })
      .from(
        assistanceApplications,
      )
      .innerJoin(
        programs,
        eq(
          assistanceApplications.programId,
          programs.id,
        ),
      )
      .where(
        and(
          eq(
            assistanceApplications.id,
            id,
          ),
          eq(
            assistanceApplications.applicantId,
            user.id,
          ),
        ),
      )
      .limit(1);

  if (!application) {
    notFound();
  }

  const photos =
    await db
      .select({
        id:
          assistanceApplicationPhotos.id,
      })
      .from(
        assistanceApplicationPhotos,
      )
      .where(
        eq(
          assistanceApplicationPhotos.applicationId,
          application.id,
        ),
      )
      .orderBy(
        asc(
          assistanceApplicationPhotos.sortOrder,
        ),
      );

  const status =
    application.status as AssistanceApplicationStatus;

  const meta =
    ASSISTANCE_STATUS_META[
      status
    ];

  const editable =
    status === "DRAFT" ||
    status ===
      "NEEDS_REVISION";

  const programData =
    (
      application.programData &&
      typeof application.programData ===
        "object"
        ? application.programData
        : {}
    ) as Record<
      string,
      string
    >;

  const {
    saved,
  } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/akun/pengajuan"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Pengajuan Saya
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                >
                  {
                    meta.label
                  }
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {
                    application.programName
                  }
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {
                  application.title
                }
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {
                  meta.description
                }
              </p>
            </div>

            {editable && (
              <Link
                href={`/akun/pengajuan/${application.id}/edit`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Edit3 className="h-4 w-4" />
                Perbaiki Pengajuan
              </Link>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {saved ===
          "1" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            Pengajuan berhasil disimpan.
          </div>
        )}

        {application.reviewNote && (
          <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-sm font-bold text-orange-900">
              Catatan pengurus
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-orange-800">
              {
                application.reviewNote
              }
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                Calon penerima
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Nama
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        application.beneficiaryName
                      }
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Hubungan:{" "}
                      {
                        application.applicantRelationship
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      WhatsApp
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        application.contactWhatsapp
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:col-span-2">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Lokasi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        application.village
                      }
                      ,{" "}
                      {
                        application.subdistrict
                      }
                      ,{" "}
                      {
                        application.regency
                      }
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {
                        application.detailedAddress
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                Kondisi dan alasan
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {
                  application.conditionDescription
                }
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                Data khusus program
              </h2>

              <dl className="mt-5 space-y-4">
                {getProgramQuestions(
                  application.programName,
                ).map(
                  (
                    question,
                  ) => (
                    <div
                      key={
                        question.key
                      }
                      className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {
                          question.label
                        }
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                        {programData[
                          question.key
                        ] || "-"}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                Foto kondisi
              </h2>

              {photos.length ===
              0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Belum ada foto pada pengajuan ini.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map(
                    (
                      photo,
                      index,
                    ) => (
                      <div
                        key={
                          photo.id
                        }
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={`/api/akun/pengajuan/media/${photo.id}`}
                          alt={`Foto kondisi ${index + 1}`}
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Target bantuan
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {formatRupiah(
                  application.targetAmount,
                )}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Dibuat
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatDate(
                      application.createdAt,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Dikirim
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatDate(
                      application.submittedAt,
                    )}
                  </p>
                </div>
              </div>

              {application.reviewedAt && (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Terakhir diverifikasi
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatDate(
                      application.reviewedAt,
                    )}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">
                Pernyataan data
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {application.truthConsent
                  ? "Sudah disetujui oleh pengaju."
                  : "Belum disetujui. Pernyataan wajib sebelum pengajuan dikirim."}
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
