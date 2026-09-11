"use client";

import {
  Loader2,
  Save,
  Send,
} from "lucide-react";
import {
  useActionState,
  useMemo,
  useState,
} from "react";

import type {
  AssistanceActionState,
} from "@/app/actions/assistance";
import {
  getProgramQuestions,
} from "@/lib/assistance";

import AssistancePhotoUploader from "./AssistancePhotoUploader";

type ProgramOption = {
  id: string;
  name: string;
  description:
    | string
    | null;
};

type InitialPhoto = {
  id: string;
  url: string;
  pathname: string;
};

type InitialApplication = {
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
  programData:
    Record<
      string,
      string
    >;
  truthConsent: boolean;
  photos:
    InitialPhoto[];
};

type Action = (
  previousState:
    AssistanceActionState,
  formData: FormData,
) => Promise<
  AssistanceActionState
>;

const initialState:
  AssistanceActionState = {
    error: null,
  };

const MINIMUM_PHOTOS = 2;

const MINIMUM_PHOTO_ERROR =
  "Minimal 2 foto diperlukan sebelum pengajuan dikirim.";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50";

const labelClass =
  "text-sm font-semibold text-slate-800";

export default function AssistanceApplicationForm({
  userId,
  programs,
  defaultWhatsapp,
  initialApplication,
  action,
}: {
  userId: string;
  programs:
    ProgramOption[];
  defaultWhatsapp?: string;
  initialApplication?:
    InitialApplication;
  action: Action;
}) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    action,
    initialState,
  );

  const [
    programId,
    setProgramId,
  ] = useState(
    initialApplication
      ?.programId ||
      programs[0]?.id ||
      "",
  );

  const [
    photoCount,
    setPhotoCount,
  ] = useState(
    initialApplication
      ?.photos.length ||
      0,
  );

  const [
    lastSubmittedPhotoCount,
    setLastSubmittedPhotoCount,
  ] = useState<
    number | null
  >(null);

  const selectedProgram =
    useMemo(
      () =>
        programs.find(
          (program) =>
            program.id ===
            programId,
        ) ||
        programs[0],
      [
        programId,
        programs,
      ],
    );

  const questions =
    selectedProgram
      ? getProgramQuestions(
          selectedProgram.name,
        )
      : [];

  const programData =
    initialApplication
      ?.programData || {};

  const visibleError =
    state.error ===
      MINIMUM_PHOTO_ERROR &&
    photoCount >=
      MINIMUM_PHOTOS &&
    (
      pending ||
      lastSubmittedPhotoCount !==
        photoCount
    )
      ? null
      : state.error;

  return (
    <form
      action={
        formAction
      }
      onSubmit={() => {
        setLastSubmittedPhotoCount(
          photoCount,
        );
      }}
      className="space-y-6"
    >
      {visibleError && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
        >
          {visibleError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Bagian 1
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Program dan calon penerima
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pilih program yang paling sesuai dan isi data calon penerima dengan benar.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className={labelClass}>
              Program bantuan
            </span>
            <select
              name="programId"
              value={
                programId
              }
              onChange={(
                event,
              ) =>
                setProgramId(
                  event.target
                    .value,
                )
              }
              required
              className={
                inputClass
              }
            >
              {programs.map(
                (program) => (
                  <option
                    key={
                      program.id
                    }
                    value={
                      program.id
                    }
                  >
                    {
                      program.name
                    }
                  </option>
                ),
              )}
            </select>

            {selectedProgram
              ?.description && (
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                {
                  selectedProgram.description
                }
              </span>
            )}
          </label>

          <label className="md:col-span-2">
            <span className={labelClass}>
              Judul pengajuan
            </span>
            <input
              name="title"
              type="text"
              maxLength={
                180
              }
              required
              defaultValue={
                initialApplication
                  ?.title ||
                ""
              }
              placeholder="Contoh: Renovasi rumah Ibu Siti di Kecamatan Omben"
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className={labelClass}>
              Nama calon penerima
            </span>
            <input
              name="beneficiaryName"
              type="text"
              maxLength={
                150
              }
              required
              defaultValue={
                initialApplication
                  ?.beneficiaryName ||
                ""
              }
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className={labelClass}>
              Hubungan Anda dengan calon penerima
            </span>
            <input
              name="applicantRelationship"
              type="text"
              maxLength={
                100
              }
              required
              defaultValue={
                initialApplication
                  ?.applicantRelationship ||
                ""
              }
              placeholder="Contoh: diri sendiri, keluarga, tetangga"
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className={labelClass}>
              WhatsApp yang dapat dihubungi
            </span>
            <input
              name="contactWhatsapp"
              type="tel"
              maxLength={
                30
              }
              required
              defaultValue={
                initialApplication
                  ?.contactWhatsapp ||
                defaultWhatsapp ||
                ""
              }
              placeholder="Contoh: 081234567890"
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className={labelClass}>
              Target bantuan
            </span>
            <input
              name="targetAmount"
              type="number"
              min="1"
              max="10000000000"
              step="1000"
              required
              defaultValue={
                initialApplication
                  ?.targetAmount ||
                ""
              }
              placeholder="Contoh: 20000000"
              className={
                inputClass
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Bagian 2
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Lokasi dan kondisi
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Alamat lengkap hanya digunakan untuk proses internal dan verifikasi.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className={labelClass}>
              Desa/kelurahan
            </span>
            <input
              name="village"
              type="text"
              maxLength={
                120
              }
              required
              defaultValue={
                initialApplication
                  ?.village ||
                ""
              }
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className={labelClass}>
              Kecamatan
            </span>
            <input
              name="subdistrict"
              type="text"
              maxLength={
                120
              }
              required
              defaultValue={
                initialApplication
                  ?.subdistrict ||
                ""
              }
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className={labelClass}>
              Kabupaten/kota
            </span>
            <input
              name="regency"
              type="text"
              maxLength={
                120
              }
              required
              defaultValue={
                initialApplication
                  ?.regency ||
                "Sampang"
              }
              className={
                inputClass
              }
            />
          </label>

          <label className="md:col-span-2">
            <span className={labelClass}>
              Alamat lengkap
            </span>
            <textarea
              name="detailedAddress"
              rows={
                3
              }
              maxLength={
                500
              }
              required
              defaultValue={
                initialApplication
                  ?.detailedAddress ||
                ""
              }
              placeholder="Dusun, RT/RW bila ada, patokan lokasi, dan informasi yang membantu verifikasi."
              className={
                inputClass
              }
            />
          </label>

          <label className="md:col-span-2">
            <span className={labelClass}>
              Kondisi dan alasan pengajuan
            </span>
            <textarea
              name="conditionDescription"
              rows={
                7
              }
              maxLength={
                5000
              }
              required
              defaultValue={
                initialApplication
                  ?.conditionDescription ||
                ""
              }
              placeholder="Ceritakan kondisi calon penerima, masalah yang dihadapi, dan mengapa bantuan diperlukan."
              className={
                inputClass
              }
            />
          </label>
        </div>
      </section>

      {selectedProgram && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Bagian 3
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Data khusus {selectedProgram.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pertanyaan ini menyesuaikan program yang dipilih.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            {questions.map(
              (
                question,
              ) => {
                const fieldName =
                  `program_${question.key}`;
                const defaultValue =
                  programData[
                    question.key
                  ] || "";

                if (
                  question.type ===
                  "textarea"
                ) {
                  return (
                    <label
                      key={
                        question.key
                      }
                    >
                      <span className={labelClass}>
                        {
                          question.label
                        }
                      </span>
                      <textarea
                        name={
                          fieldName
                        }
                        rows={
                          4
                        }
                        required
                        defaultValue={
                          defaultValue
                        }
                        placeholder={
                          question.placeholder
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>
                  );
                }

                if (
                  question.type ===
                  "select"
                ) {
                  return (
                    <label
                      key={
                        question.key
                      }
                    >
                      <span className={labelClass}>
                        {
                          question.label
                        }
                      </span>
                      <select
                        name={
                          fieldName
                        }
                        required
                        defaultValue={
                          defaultValue
                        }
                        className={
                          inputClass
                        }
                      >
                        <option value="">
                          Pilih salah satu
                        </option>
                        {question.options?.map(
                          (
                            option,
                          ) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {
                                option
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  );
                }

                return (
                  <label
                    key={
                      question.key
                    }
                  >
                    <span className={labelClass}>
                      {
                        question.label
                      }
                    </span>
                    <input
                      name={
                        fieldName
                      }
                      type={
                        question.type
                      }
                      min={
                        question.type ===
                        "number"
                          ? 0
                          : undefined
                      }
                      required
                      defaultValue={
                        defaultValue
                      }
                      placeholder={
                        question.placeholder
                      }
                      className={
                        inputClass
                      }
                    />
                  </label>
                );
              },
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Bagian 4
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Foto kondisi
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Foto disimpan sebagai media internal dan tidak dibuka sebagai file publik.
          </p>
        </div>

        <div className="mt-6">
          <AssistancePhotoUploader
            userId={
              userId
            }
            initialPhotos={
              initialApplication
                ?.photos ||
              []
            }
            onPhotoCountChange={
              setPhotoCount
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label className="flex items-start gap-3">
          <input
            name="truthConsent"
            type="checkbox"
            defaultChecked={
              initialApplication
                ?.truthConsent ||
              false
            }
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />

          <span className="text-sm leading-6 text-slate-700">
            Saya menyatakan data dan foto yang saya kirim sesuai kondisi yang saya ketahui dan bersedia apabila data tersebut diverifikasi oleh Yayasan Ruang Sejahtera.
          </span>
        </label>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Persetujuan ini wajib sebelum pengajuan dikirim. Draf dapat disimpan lebih dahulu.
        </p>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="submit"
          name="intent"
          value="draft"
          formNoValidate
          disabled={
            pending
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Draf
        </button>

        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={
            pending
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Kirim untuk Verifikasi
        </button>
      </div>
    </form>
  );
}
