import {
  BadgeCheck,
  FilePlus2,
  HeartHandshake,
  LogIn,
  MailCheck,
  MapPin,
  Target,
  UserPlus,
} from "lucide-react";
import {
  asc,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/auth";
import {
  formatRupiah,
  getProgramQuestions,
} from "@/lib/assistance";
import { createPageMetadata } from "@/lib/seo-metadata";
import {
  db,
} from "@/src/db";
import {
  campaigns,
  financialTransactions,
  programs,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Kampanye Bantuan",
  description:
    "Lihat kampanye bantuan yang telah diverifikasi Yayasan Ruang Sejahtera dan pantau target, dana terkumpul, serta penyalurannya secara transparan.",
  path: "/bantuan",
});

export default async function AssistanceCampaignsPage() {
  const session = await auth();
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const canSubmitApplication = sessionRole === "USER";

  const [
    rows,
    ledgerRows,
    activePrograms,
  ] =
    await Promise.all([
      db
        .select({
          id:
            campaigns.id,
          slug:
            campaigns.slug,
          title:
            campaigns.title,
          summary:
            campaigns.summary,
          publicLocation:
            campaigns.publicLocation,
          beneficiaryDisplayName:
            campaigns.beneficiaryDisplayName,
          targetAmount:
            campaigns.targetAmount,
          coverPhotoId:
            campaigns.coverPhotoId,
          status:
            campaigns.status,
          activatedAt:
            campaigns.activatedAt,
          createdAt:
            campaigns.createdAt,
          programName:
            programs.name,
        })
        .from(campaigns)
        .innerJoin(
          programs,
          eq(
            campaigns.programId,
            programs.id,
          ),
        )
        .where(
          inArray(
            campaigns.status,
            [
              "ACTIVE",
              "COMPLETED",
            ],
          ),
        )
        .orderBy(
          desc(
            campaigns.activatedAt,
          ),
          desc(
            campaigns.createdAt,
          ),
        ),

      db
        .select({
          campaignId:
            financialTransactions.campaignId,
          type:
            financialTransactions.type,
          amount:
            financialTransactions.amount,
        })
        .from(
          financialTransactions,
        )
        .where(
          isNull(
            financialTransactions.deletedAt,
          ),
        ),

      db
        .select({
          id:
            programs.id,
          name:
            programs.name,
          description:
            programs.description,
        })
        .from(programs)
        .where(
          eq(
            programs.status,
            "ACTIVE",
          ),
        )
        .orderBy(
          asc(
            programs.name,
          ),
        ),
    ]);

  const totals =
    new Map<
      string,
      {
        collected: number;
        spent: number;
      }
    >();

  for (
    const row of
      ledgerRows
  ) {
    if (!row.campaignId) {
      continue;
    }

    const current =
      totals.get(
        row.campaignId,
      ) || {
        collected: 0,
        spent: 0,
      };

    const amount =
      Number(row.amount);

    if (
      Number.isFinite(amount)
    ) {
      if (row.type === "IN") {
        current.collected +=
          amount;
      } else {
        current.spent +=
          amount;
      }
    }

    totals.set(
      row.campaignId,
      current,
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(13,148,136,0.22),_transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
            Bantu Mereka
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Bantuan yang sudah melewati verifikasi.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Setiap kampanye berasal dari pengajuan yang telah diperiksa pengurus. Progres dihitung dari dana masuk yang sudah tercatat pada keuangan kampanye.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Pengajuan Bantuan
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Cara Mengajukan Bantuan
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
              Masyarakat dapat mengajukan calon penerima bantuan melalui akun pribadi.
              Prosesnya dibuat singkat, tetapi setiap pengajuan tetap diperiksa sebelum
              dapat menjadi kampanye publik.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { icon: UserPlus, title: "1. Daftar", text: "Buat akun dengan nama, email, WhatsApp, dan kata sandi Anda." },
              { icon: MailCheck, title: "2. Verifikasi email", text: "Masukkan kode OTP yang dikirim ke email agar akun aktif." },
              { icon: LogIn, title: "3. Masuk ke akun", text: "Login lalu buka menu Akun dan Pengajuan Bantuan." },
              { icon: FilePlus2, title: "4. Lengkapi pengajuan", text: "Pilih program, isi kondisi calon penerima, dan unggah foto pendukung." },
              { icon: BadgeCheck, title: "5. Kirim & tunggu verifikasi", text: "Tim Ruang Sejahtera memeriksa pengajuan sebelum disetujui atau diminta perbaikan." },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 lg:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                Persiapan Pengajuan
              </p>

              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Yang Perlu Disiapkan Sebelum Mengajukan
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                Informasi ini dapat dilihat sebelum membuat akun agar Anda dapat
                menyiapkan data terlebih dahulu. Form pengajuan tetap hanya dapat
                dikirim melalui akun USER yang sudah terverifikasi.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                {
                  title:
                    "Data calon penerima",
                  text:
                    "Nama calon penerima, hubungan pengaju dengan calon penerima, serta WhatsApp yang dapat dihubungi.",
                },
                {
                  title:
                    "Lokasi dan kondisi",
                  text:
                    "Desa/kelurahan, kecamatan, kabupaten/kota, alamat lengkap, serta penjelasan kondisi dan alasan membutuhkan bantuan.",
                },
                {
                  title:
                    "Rencana bantuan",
                  text:
                    "Pilih program yang sesuai, tulis judul pengajuan, dan tentukan perkiraan target bantuan yang dibutuhkan.",
                },
                {
                  title:
                    "Minimal 2 foto kondisi",
                  text:
                    "Siapkan sedikitnya dua foto yang membantu tim memahami kondisi calon penerima saat proses verifikasi.",
                },
              ].map(
                (requirement) => (
                  <div
                    key={
                      requirement.title
                    }
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />

                    <div>
                      <h4 className="text-sm font-bold text-slate-950">
                        {
                          requirement.title
                        }
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {
                          requirement.text
                        }
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <h4 className="text-lg font-bold text-slate-950">
                Pertanyaan sesuai program
              </h4>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Setiap program meminta informasi tambahan yang berbeda. Daftar di
                bawah menggunakan pertanyaan yang sama dengan form pengajuan,
                sehingga Anda dapat menyiapkan jawabannya sejak awal.
              </p>

              {activePrograms.length ===
              0 ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Belum ada program aktif yang dapat diajukan saat ini.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {activePrograms.map(
                    (program) => {
                      const questions =
                        getProgramQuestions(
                          program.name,
                        );

                      return (
                        <details
                          key={
                            program.id
                          }
                          className="group rounded-2xl border border-slate-200 bg-white p-5"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                            <span className="font-bold text-slate-950">
                              {
                                program.name
                              }
                            </span>

                            <span className="shrink-0 text-xs font-semibold text-teal-700 group-open:hidden">
                              Lihat pertanyaan
                            </span>

                            <span className="hidden shrink-0 text-xs font-semibold text-slate-500 group-open:inline">
                              Tutup
                            </span>
                          </summary>

                          {program.description && (
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                              {
                                program.description
                              }
                            </p>
                          )}

                          <ol className="mt-4 space-y-2">
                            {questions.map(
                              (
                                question,
                                index,
                              ) => (
                                <li
                                  key={
                                    question.key
                                  }
                                  className="flex gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700"
                                >
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                    {
                                      index +
                                      1
                                    }
                                  </span>

                                  <span>
                                    {
                                      question.label
                                    }
                                  </span>
                                </li>
                              ),
                            )}
                          </ol>
                        </details>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            <p className="mt-6 text-xs leading-5 text-slate-500">
              Pengajuan tetap melalui proses pemeriksaan. Menyiapkan data lengkap
              tidak berarti pengajuan otomatis disetujui.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {canSubmitApplication ? (
              <Link
                href="/akun/pengajuan/baru"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Ajukan Bantuan Sekarang
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Daftar untuk Mengajukan
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Sudah punya akun? Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <HeartHandshake className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Belum ada kampanye aktif
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Kampanye akan tampil di sini setelah pengajuan disetujui dan informasi publiknya diaktifkan oleh pengurus.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(
              (campaign) => {
                const total =
                  totals.get(
                    campaign.id,
                  ) || {
                    collected: 0,
                    spent: 0,
                  };

                const collected =
                  total.collected;

                const available =
                  total.collected -
                  total.spent;

                const target =
                  Number(
                    campaign.targetAmount,
                  );

                const progress =
                  target > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (
                            collected /
                            target
                          ) *
                            100,
                        ),
                      )
                    : 0;

                return (
                  <article
                    key={
                      campaign.id
                    }
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[16/10] bg-slate-100">
                      {campaign.coverPhotoId ? (
                        <img
                          src={`/api/bantuan/${campaign.slug}/cover`}
                          alt={`Foto kampanye ${campaign.title}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <HeartHandshake className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                          {
                            campaign.programName
                          }
                        </span>
                        {campaign.status ===
                          "COMPLETED" && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                            Selesai
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 text-xl font-bold leading-snug text-slate-950">
                        {
                          campaign.title
                        }
                      </h2>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {
                          campaign.summary
                        }
                      </p>

                      {campaign.publicLocation && (
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {
                            campaign.publicLocation
                          }
                        </div>
                      )}

                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="font-semibold text-slate-700">
                            {formatRupiah(
                              collected,
                            )} terkumpul
                          </span>
                          <span className="text-slate-500">
                            {progress}%
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Target{" "}
                            {formatRupiah(
                              target,
                            )}
                          </span>

                          <span>
                            Tersedia{" "}
                            {formatRupiah(
                              available,
                            )}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/bantuan/${campaign.slug}`}
                        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Lihat Kampanye
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </main>
    </div>
  );
}
