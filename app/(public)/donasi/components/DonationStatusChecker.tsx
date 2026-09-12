"use client";

import {
  CheckCircle2,
  Clock3,
  Search,
  XCircle,
} from "lucide-react";
import {
  useActionState,
} from "react";

import {
  checkDonationStatus,
} from "@/app/actions/donasi";

type DonationStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

type StatusData = {
  reference: string;
  status: DonationStatus;
  amount: string;
  programName:
    | string
    | null;
  createdAt: string;
  reviewedAt:
    | string
    | null;
  reviewNote:
    | string
    | null;
};

type StatusState = {
  success: boolean;
  error: string | null;
  data:
    | StatusData
    | null;
};

const initialState:
  StatusState = {
    success: false,
    error: null,
    data: null,
  };

function formatCurrency(
  value: string,
) {
  const amount =
    Number(value);

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0,
  );
}

function formatDateTime(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getStatusMeta(
  status:
    DonationStatus,
) {
  if (
    status ===
    "SUCCESS"
  ) {
    return {
      label:
        "Terverifikasi",
      description:
        "Bukti transfer telah diverifikasi dan donasi telah dicatat sebagai penerimaan yayasan.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
      Icon:
        CheckCircle2,
    };
  }

  if (
    status ===
    "FAILED"
  ) {
    return {
      label:
        "Tidak Terverifikasi",
      description:
        "Donasi tidak dapat dinyatakan terverifikasi berdasarkan pemeriksaan pengurus.",
      className:
        "border-rose-200 bg-rose-50 text-rose-800",
      Icon:
        XCircle,
    };
  }

  return {
    label:
      "Menunggu Verifikasi",
    description:
      "Data dan bukti transfer sudah diterima dan masih menunggu pemeriksaan pengurus. Dana belum dicatat sebagai penerimaan yayasan.",
    className:
      "border-amber-200 bg-amber-50 text-amber-800",
    Icon:
      Clock3,
  };
}

export default function DonationStatusChecker() {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    checkDonationStatus,
    initialState,
  );

  const statusMeta =
    state.data
      ? getStatusMeta(
          state.data.status,
        )
      : null;

  const StatusIcon =
    statusMeta?.Icon;

  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
          Status Donasi
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Cek Status Donasi
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Masukkan nomor registrasi yang
          diberikan setelah formulir
          donasi berhasil dikirim.
          Pemeriksaan ini tidak
          memerlukan akun.
        </p>
      </div>

      <form
        action={formAction}
        className="mt-6"
      >
        <label
          htmlFor="donation-reference"
          className="text-sm font-semibold text-slate-800"
        >
          Nomor Registrasi Donasi
        </label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="donation-reference"
            name="reference"
            type="text"
            required
            autoComplete="off"
            placeholder="RS-DON-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
          />

          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="mr-2 h-4 w-4" />
            {pending
              ? "Memeriksa..."
              : "Cek Status"}
          </button>
        </div>
      </form>

      {state.error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
        >
          {state.error}
        </div>
      )}

      {state.data &&
        statusMeta &&
        StatusIcon && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div
              className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${statusMeta.className}`}
            >
              <StatusIcon className="mr-2 h-4 w-4" />
              {
                statusMeta.label
              }
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {
                statusMeta.description
              }
            </p>

            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nomor Registrasi
                </dt>
                <dd className="mt-1 break-all text-sm font-bold text-slate-900">
                  {
                    state.data
                      .reference
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Program
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {
                    state.data
                      .programName ||
                    "Program donasi"
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nominal
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatCurrency(
                    state.data
                      .amount,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Formulir Dikirim
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {formatDateTime(
                    state.data
                      .createdAt,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Diproses
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {state.data
                    .reviewedAt
                    ? formatDateTime(
                        state.data
                          .reviewedAt,
                      )
                    : "Belum diproses"}
                </dd>
              </div>

              {state.data.status !==
                "PENDING" && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Catatan Pengurus
                  </dt>

                  <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {state.data
                      .reviewNote ||
                      "Data keputusan lama belum memiliki catatan pengurus."}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Status hanya menunjukkan hasil
        pemeriksaan donasi. Nama donatur
        dan bukti transfer tidak
        ditampilkan melalui fasilitas
        pengecekan publik ini.
      </p>
    </div>
  );
}
