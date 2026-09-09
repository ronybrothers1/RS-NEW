import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  asc,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";

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

import AssistanceReviewForm from "../components/AssistanceReviewForm";

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

export default async function AdminAssistanceDetailPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      id: string;
    }>;
  searchParams:
    Promise<{
      reviewed?: string;
    }>;
}) {
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
        applicantId:
          assistanceApplications.applicantId,
        applicantName:
          users.name,
        applicantEmail:
          users.email,
        applicantPhone:
          users.phone,
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
        truthConsentAt:
          assistanceApplications.truthConsentAt,
        status:
          assistanceApplications.status,
        reviewNote:
          assistanceApplications.reviewNote,
        reviewedBy:
          assistanceApplications.reviewedBy,
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
        users,
        eq(
          assistanceApplications.applicantId,
          users.id,
        ),
      )
      .innerJoin(
        programs,
        eq(
          assistanceApplications.programId,
          programs.id,
        ),
      )
      .where(
        eq(
          assistanceApplications.id,
          id,
        ),
      )
      .limit(1);

  if (
    !application ||
    application.status ===
      "DRAFT"
  ) {
    notFound();
  }

  const photos =
    await db
      .select({
        id:
          assistanceApplicationPhotos.id,
        sortOrder:
          assistanceApplicationPhotos.sortOrder,
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

  let reviewer:
    | {
        name: string;
        email: string;
      }
    | null = null;

  if (
    application.reviewedBy
  ) {
    const [user] =
      await db
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(
          eq(
            users.id,
            application.reviewedBy,
          ),
        )
        .limit(1);

    reviewer =
      user || null;
  }

  const status =
    application.status as
      AssistanceApplicationStatus;

  const meta =
    ASSISTANCE_STATUS_META[
      status
    ];

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

  const questions =
    getProgramQuestions(
      application.programName,
    );

  const knownKeys =
    new Set(
      questions.map(
        (question) =>
          question.key,
      ),
    );

  const extraProgramData =
    Object.entries(
      programData,
    ).filter(
      ([key]) =>
        !knownKeys.has(
          key,
        ),
    );

  const {
    reviewed,
  } =
    await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pengajuan"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Semua Pengajuan
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
              >
                {meta.label}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {
                  application.programName
                }
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {
                application.title
              }
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              ID pengajuan:{" "}
              <span className="font-mono text-xs text-slate-600">
                {
                  application.id
                }
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Target Bantuan
            </p>
            <p className="mt-1 text-xl font-bold text-slate-950">
              {formatRupiah(
                application.targetAmount,
              )}
            </p>
          </div>
        </div>
      </div>

      {reviewed && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-medium">
            Keputusan verifikasi berhasil disimpan.
          </p>
        </div>
      )}

{status ===
  "APPROVED" && (
  <section className="flex flex-col gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-sm font-bold text-teal-950">
        Pengajuan siap menjadi kampanye publik
      </p>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-teal-800">
        Tinjau judul, cerita, lokasi publik, target, dan foto sampul sebelum ditampilkan pada menu Bantu Mereka.
      </p>
    </div>
    <Link
      href={`/admin/pengajuan/${application.id}/kampanye`}
      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
    >
      Kelola Kampanye Publik
    </Link>
  </section>
)}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-teal-700" />
              <h2 className="font-bold text-slate-950">
                Pemohon dan Calon Penerima
              </h2>
            </div>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pemohon
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {
                    application.applicantName
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Calon penerima
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {
                    application.beneficiaryName
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Hubungan
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {
                    application.applicantRelationship
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  WhatsApp pengajuan
                </dt>
                <dd className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {
                    application.contactWhatsapp
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email akun
                </dt>
                <dd className="mt-1 flex items-center gap-2 break-all text-sm text-slate-700">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  {
                    application.applicantEmail
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  WhatsApp akun
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {
                    application.applicantPhone ||
                    "-"
                  }
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-teal-700" />
              <h2 className="font-bold text-slate-950">
                Lokasi Internal
              </h2>
            </div>

            <dl className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Desa/Kelurahan
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {
                    application.village
                  }
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Kecamatan
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {
                    application.subdistrict
                  }
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Kabupaten/Kota
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {
                    application.regency
                  }
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Alamat lengkap — internal
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-950">
                {
                  application.detailedAddress
                }
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-teal-700" />
              <h2 className="font-bold text-slate-950">
                Kondisi dan Data Program
              </h2>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Kondisi / alasan pengajuan
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {
                  application.conditionDescription
                }
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {questions.map(
                (question) => (
                  <div
                    key={
                      question.key
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {
                        question.label
                      }
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {
                        programData[
                          question.key
                        ] || "-"
                      }
                    </p>
                  </div>
                ),
              )}

              {extraProgramData.map(
                ([
                  key,
                  value,
                ]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {key}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {value || "-"}
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Foto Kondisi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Media ini bersifat private dan hanya dibaca melalui autentikasi aplikasi.
            </p>

            {photos.length ===
            0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Tidak ada foto tersimpan.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
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
                      <div className="aspect-[4/3]">
                        <img
                          src={`/api/akun/pengajuan/media/${photo.id}`}
                          alt={`Foto kondisi pengajuan ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="border-t border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
                        Foto{" "}
                        {index +
                          1}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-teal-700" />
              <h2 className="font-bold text-slate-950">
                Status Verifikasi
              </h2>
            </div>

            <div
              className={`mt-4 rounded-xl border p-4 ${meta.className}`}
            >
              <p className="font-bold">
                {meta.label}
              </p>
              <p className="mt-1 text-sm leading-6">
                {
                  meta.description
                }
              </p>
            </div>

            {application.reviewNote && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Catatan terakhir
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {
                    application.reviewNote
                  }
                </p>
              </div>
            )}

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">
                  Dikirim
                </dt>
                <dd className="text-right font-medium text-slate-700">
                  {formatDate(
                    application.submittedAt,
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">
                  Direview
                </dt>
                <dd className="text-right font-medium text-slate-700">
                  {formatDate(
                    application.reviewedAt,
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">
                  Pengurus
                </dt>
                <dd className="text-right font-medium text-slate-700">
                  {
                    reviewer?.name ||
                    "-"
                  }
                </dd>
              </div>
            </dl>
          </section>

          {status ===
          "SUBMITTED" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">
                Keputusan Pengurus
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Pilih satu keputusan. Permintaan revisi dan penolakan wajib disertai catatan.
              </p>

              <div className="mt-5">
                <AssistanceReviewForm
                  applicationId={
                    application.id
                  }
                />
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">
                {status ===
                "NEEDS_REVISION"
                  ? "Menunggu pemohon memperbaiki dan mengirim ulang pengajuan."
                  : "Keputusan akhir telah dicatat. Pengajuan tidak dapat diproses ulang dari halaman ini."}
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-400" />
              <h2 className="font-bold text-slate-950">
                Jejak Waktu
              </h2>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Dibuat
                </dt>
                <dd className="text-right text-slate-700">
                  {formatDate(
                    application.createdAt,
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Terakhir berubah
                </dt>
                <dd className="text-right text-slate-700">
                  {formatDate(
                    application.updatedAt,
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Pernyataan kebenaran data:{" "}
                <span className="font-semibold">
                  {
                    application.truthConsent
                      ? "disetujui"
                      : "belum disetujui"
                  }
                </span>
                {application.truthConsentAt
                  ? ` pada ${formatDate(application.truthConsentAt)}`
                  : "."}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
