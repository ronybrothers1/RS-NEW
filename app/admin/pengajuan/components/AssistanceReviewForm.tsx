"use client";

import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  useActionState,
  useState,
} from "react";

import {
  reviewAssistanceApplication,
  type AdminAssistanceActionState,
} from "@/app/actions/admin-assistance";

const initialState:
  AdminAssistanceActionState = {
    error: null,
  };

export default function AssistanceReviewForm({
  applicationId,
}: {
  applicationId: string;
}) {
  const [
    fundingSource,
    setFundingSource,
  ] = useState<
    "cash" | "campaign"
  >("cash");

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    reviewAssistanceApplication,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="applicationId"
        value={applicationId}
      />

      <div>
        <label
          htmlFor="reviewNote"
          className="text-sm font-semibold text-slate-800"
        >
          Catatan Verifikasi
        </label>

        <textarea
          id="reviewNote"
          name="reviewNote"
          rows={5}
          maxLength={3000}
          placeholder="Tuliskan catatan yang perlu diketahui pemohon. Catatan wajib untuk permintaan revisi dan penolakan."
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Catatan akan terlihat oleh pemohon pada halaman detail pengajuan.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-sm font-bold text-emerald-950">
          Jika pengajuan disetujui
        </p>

        <p className="mt-1 text-xs leading-5 text-emerald-800">
          Tentukan sumber pendanaan dan nominal berdasarkan hasil verifikasi pengurus.
        </p>

        <fieldset className="mt-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sumber Pendanaan
          </legend>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="radio"
                name="fundingSource"
                value="cash"
                checked={fundingSource === "cash"}
                onChange={() =>
                  setFundingSource(
                    "cash",
                  )
                }
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Kas Ruang Sejahtera
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Tidak membuat kampanye publik.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="radio"
                name="fundingSource"
                value="campaign"
                checked={fundingSource === "campaign"}
                onChange={() =>
                  setFundingSource(
                    "campaign",
                  )
                }
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Kampanye
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Membuat draft kampanye Bantu Mereka.
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="approvedAmount"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Bantuan Disetujui
            </label>
            <input
              id="approvedAmount"
              name="approvedAmount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Contoh: 5000000"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            />
          </div>

          <div>
            <label
              htmlFor="operationalAmount"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Biaya Operasional
            </label>
            <input
              id="operationalAmount"
              name="operationalAmount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue="0"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            />
          </div>
        </div>

        {fundingSource ===
          "campaign" && (
          <div className="mt-4">
            <label
              htmlFor="campaignTarget"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Target Kampanye
            </label>
            <input
              id="campaignTarget"
              name="campaignTarget"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Nominal target penggalangan dana"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Target kampanye ditetapkan pengurus dan tidak otomatis mengikuti nominal yang diajukan pemohon.
            </p>
          </div>
        )}
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="submit"
          name="decision"
          value="revision"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Minta Revisi
        </button>

        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Setujui
        </button>

        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Tolak
        </button>
      </div>
    </form>
  );
}