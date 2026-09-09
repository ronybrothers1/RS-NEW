"use client";

import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  useActionState,
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
      className="space-y-4"
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
