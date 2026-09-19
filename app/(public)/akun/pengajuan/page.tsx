import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Plus,
} from "lucide-react";
import {
  desc,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import {
  getCurrentDbUser,
} from "@/lib/current-authz";
import {
  ASSISTANCE_STATUS_META,
  formatRupiah,
  type AssistanceApplicationStatus,
} from "@/lib/assistance";
import {
  formatAssistanceRegistrationNumber,
  parseAssistanceRegistrationNumber,
} from "@/lib/assistance-lifecycle";
import {
  db,
} from "@/src/db";
import {
  assistanceApplications,
  programs,
  users,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

export default async function AssistanceApplicationsPage({
  searchParams,
}: {
  searchParams:
    Promise<{
      register?: string;
    }>;
}) {
  const currentUser =
    await getCurrentDbUser();

  if (!currentUser) {
    redirect(
      "/login",
    );
  }

  if (
    currentUser.role !== "USER"
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
          currentUser.id,
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

  const applications =
    await db
      .select({
        id:
          assistanceApplications.id,
        title:
          assistanceApplications.title,
        beneficiaryName:
          assistanceApplications.beneficiaryName,
        village:
          assistanceApplications.village,
        subdistrict:
          assistanceApplications.subdistrict,
        targetAmount:
          assistanceApplications.targetAmount,
        status:
          assistanceApplications.status,
        createdAt:
          assistanceApplications.createdAt,
        updatedAt:
          assistanceApplications.updatedAt,
        programName:
          programs.name,
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
        eq(
          assistanceApplications.applicantId,
          user.id,
        ),
      )
      .orderBy(
        desc(
          assistanceApplications.updatedAt,
        ),
      );

  const {
    register,
  } =
    await searchParams;

  const registrationQuery =
    String(
      register || "",
    ).trim();

  const trackedApplicationId =
    parseAssistanceRegistrationNumber(
      registrationQuery,
    );

  const trackedApplication =
    trackedApplicationId
      ? applications.find(
          (application) =>
            application.id ===
              trackedApplicationId &&
            application.status !==
              "DRAFT",
        ) || null
      : null;

  const trackingAttempted =
    registrationQuery.length >
    0;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/akun"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke akun
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">
                Pengajuan Bantuan
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Pengajuan Saya
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Simpan draf, kirim untuk verifikasi, dan pantau perkembangan pengajuan dari satu tempat.
              </p>
            </div>

            <Link
              href="/akun/pengajuan/baru"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Pengajuan Baru
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-950">
            Lacak Pengajuan
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Masukkan Nomor Register Pengajuan yang terhubung dengan akun ini.
          </p>

          <form
            method="get"
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              name="register"
              defaultValue={registrationQuery}
              placeholder="RS-PENG-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            />

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Cek Pengajuan
            </button>
          </form>

          {trackingAttempted && (
            trackedApplication ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Pengajuan ditemukan
                </p>
                <p className="mt-1 font-bold text-emerald-950">
                  {trackedApplication.title}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Status:{" "}
                  {
                    ASSISTANCE_STATUS_META[
                      trackedApplication.status as
                        AssistanceApplicationStatus
                    ].label
                  }
                </p>
                <Link
                  href={`/akun/pengajuan/${trackedApplication.id}`}
                  className="mt-3 inline-flex text-sm font-semibold text-emerald-800 underline underline-offset-4"
                >
                  Lihat perkembangan pengajuan
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Nomor register tidak ditemukan pada akun ini. Periksa kembali nomor yang dimasukkan.
              </div>
            )
          )}
        </section>
        {applications.length ===
        0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">
              Belum ada pengajuan
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Anda dapat mengajukan calon penerima untuk salah satu program aktif Ruang Sejahtera.
            </p>
            <Link
              href="/akun/pengajuan/baru"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Buat Pengajuan
            </Link>
          </section>
        ) : (
          <div className="grid gap-4">
            {applications.map(
              (
                application,
              ) => {
                const status =
                  application.status as AssistanceApplicationStatus;
                const meta =
                  ASSISTANCE_STATUS_META[
                    status
                  ];

                return (
                  <Link
                    key={
                      application.id
                    }
                    href={`/akun/pengajuan/${application.id}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                          >
                            {
                              meta.label
                            }
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {
                              application.programName
                            }
                          </span>
                        </div>

                        <h2 className="mt-3 text-lg font-bold text-slate-950 transition group-hover:text-teal-800">
                          {
                            application.title
                          }
                        </h2>

                        {application.status !== "DRAFT" && (
                          <p className="mt-2 break-all font-mono text-xs font-semibold text-teal-700">
                            {formatAssistanceRegistrationNumber(
                              application.id,
                            )}
                          </p>
                        )}

                        <p className="mt-1 text-sm text-slate-600">
                          Calon penerima:{" "}
                          <span className="font-semibold text-slate-700">
                            {
                              application.beneficiaryName
                            }
                          </span>
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            application.village
                          }
                          ,{" "}
                          {
                            application.subdistrict
                          }
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-5 border-t border-slate-100 pt-4 sm:block sm:border-0 sm:pt-0 sm:text-right">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Target
                          </p>
                          <p className="mt-1 font-bold text-slate-800">
                            {formatRupiah(
                              application.targetAmount,
                            )}
                          </p>
                        </div>

                        <ChevronRight className="h-5 w-5 text-slate-400 sm:ml-auto sm:mt-4" />
                      </div>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </main>
    </div>
  );
}
