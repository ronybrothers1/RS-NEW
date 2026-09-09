"use client";

import {
  CheckCircle2,
  Eye,
  Loader2,
  PauseCircle,
  Save,
  StopCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useActionState,
} from "react";

import type {
  CampaignActionState,
} from "@/app/actions/campaign";

type CampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

type CampaignData = {
  slug: string;
  title: string;
  summary: string;
  story: string;
  beneficiaryDisplayName:
    string | null;
  publicLocation:
    string | null;
  targetAmount: string;
  coverPhotoId:
    string | null;
  status: CampaignStatus;
};

type Photo = {
  id: string;
};

type Action = (
  previousState:
    CampaignActionState,
  formData: FormData,
) => Promise<
  CampaignActionState
>;

const initialState:
  CampaignActionState = {
    error: null,
  };

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50";

const statusMeta: Record<
  CampaignStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: "Draf",
    className:
      "border-slate-200 bg-slate-50 text-slate-700",
  },
  ACTIVE: {
    label: "Aktif",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  PAUSED: {
    label: "Dijeda",
    className:
      "border-amber-200 bg-amber-50 text-amber-800",
  },
  COMPLETED: {
    label: "Selesai",
    className:
      "border-blue-200 bg-blue-50 text-blue-800",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className:
      "border-rose-200 bg-rose-50 text-rose-800",
  },
};

export default function CampaignEditorForm({
  campaign,
  photos,
  action,
}: {
  campaign: CampaignData;
  photos: Photo[];
  action: Action;
}) {
  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    action,
    initialState,
  );

  const terminal =
    campaign.status ===
      "COMPLETED" ||
    campaign.status ===
      "CANCELLED";

  const meta =
    statusMeta[
      campaign.status
    ];

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status Kampanye
          </p>
          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>

        {(campaign.status ===
          "ACTIVE" ||
          campaign.status ===
            "COMPLETED") && (
          <Link
            href={`/bantuan/${campaign.slug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Lihat Halaman Publik
          </Link>
        )}
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
        >
          {state.error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-950">
          Informasi yang Ditampilkan ke Publik
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Jangan menyalin nomor WhatsApp, alamat lengkap, dokumen identitas, atau catatan verifikasi internal ke bagian ini.
        </p>

        <div className="mt-6 grid gap-5">
          <label>
            <span className="text-sm font-semibold text-slate-800">
              Judul Kampanye
            </span>
            <input
              name="title"
              defaultValue={
                campaign.title
              }
              maxLength={180}
              disabled={terminal}
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-800">
              Nama yang Ditampilkan
            </span>
            <input
              name="beneficiaryDisplayName"
              defaultValue={
                campaign.beneficiaryDisplayName ||
                ""
              }
              maxLength={150}
              disabled={terminal}
              placeholder="Opsional. Dapat dikosongkan untuk menjaga privasi."
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-800">
              Lokasi Publik
            </span>
            <input
              name="publicLocation"
              defaultValue={
                campaign.publicLocation ||
                ""
              }
              maxLength={180}
              disabled={terminal}
              placeholder="Contoh: Kecamatan Omben, Kabupaten Sampang"
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-800">
              Target Penggalangan
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-slate-500">
                Rp
              </span>
              <input
                name="targetAmount"
                type="number"
                inputMode="numeric"
                min={1}
                max={10000000000}
                defaultValue={
                  campaign.targetAmount
                }
                disabled={terminal}
                className={`${inputClass} pl-12`}
              />
            </div>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-800">
              Ringkasan
            </span>
            <textarea
              name="summary"
              defaultValue={
                campaign.summary
              }
              maxLength={600}
              rows={4}
              disabled={terminal}
              placeholder="Ringkas kebutuhan penerima dan tujuan kampanye tanpa memasukkan data pribadi."
              className={
                inputClass
              }
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-800">
              Cerita Publik
            </span>
            <textarea
              name="story"
              defaultValue={
                campaign.story
              }
              maxLength={10000}
              rows={10}
              disabled={terminal}
              placeholder="Jelaskan kondisi, kebutuhan, dan rencana penggunaan bantuan secara manusiawi dan faktual."
              className={
                inputClass
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-bold text-slate-950">
          Foto Sampul Publik
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Hanya foto yang dipilih sebagai sampul yang dapat ditampilkan melalui endpoint publik kampanye. Foto lain tetap private.
        </p>

        {photos.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Tidak ada foto pengajuan yang dapat dipilih.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map(
              (
                photo,
                index,
              ) => (
                <label
                  key={photo.id}
                  className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white has-[:checked]:border-teal-600 has-[:checked]:ring-2 has-[:checked]:ring-teal-100"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    <img
                      src={`/api/akun/pengajuan/media/${photo.id}`}
                      alt={`Pilihan foto sampul ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-200 px-3 py-3">
                    <input
                      type="radio"
                      name="coverPhotoId"
                      value={
                        photo.id
                      }
                      defaultChecked={
                        campaign.coverPhotoId ===
                        photo.id
                      }
                      disabled={
                        terminal
                      }
                      className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Foto{" "}
                      {index + 1}
                    </span>
                  </div>
                </label>
              ),
            )}
          </div>
        )}
      </section>

      {!terminal && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="intent"
              value="save"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan
            </button>

            {(campaign.status ===
              "DRAFT" ||
              campaign.status ===
                "PAUSED") && (
              <button
                type="submit"
                name="intent"
                value="activate"
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Aktifkan Kampanye
              </button>
            )}

            {campaign.status ===
              "ACTIVE" && (
              <button
                type="submit"
                name="intent"
                value="pause"
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
              >
                <PauseCircle className="h-4 w-4" />
                Jeda
              </button>
            )}

            {(campaign.status ===
              "ACTIVE" ||
              campaign.status ===
                "PAUSED") && (
              <button
                type="submit"
                name="intent"
                value="complete"
                disabled={isPending}
                onClick={(
                  event,
                ) => {
                  if (
                    !window.confirm(
                      "Tandai kampanye ini sebagai selesai?",
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-60"
              >
                <StopCircle className="h-4 w-4" />
                Selesai
              </button>
            )}

            <button
              type="submit"
              name="intent"
              value="cancel"
              disabled={isPending}
              onClick={(
                event,
              ) => {
                if (
                  !window.confirm(
                    "Batalkan kampanye ini? Kampanye tidak akan tampil kepada publik.",
                  )
                ) {
                  event.preventDefault();
                }
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Batalkan
            </button>
          </div>
        </section>
      )}
    </form>
  );
}
