"use client";

import {
  CalendarDays,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useActionState,
} from "react";

import {
  completeAssistanceApplication,
  scheduleAssistanceApplication,
  type AdminAssistanceActionState,
} from "@/app/actions/admin-assistance";

const initialState:
  AdminAssistanceActionState = {
    error: null,
  };

export default function AssistanceLifecycleActions({
  applicationId,
  scheduledDate,
  canSchedule,
  fundingBlocked,
  completed,
}: {
  applicationId: string;
  scheduledDate: string | null;
  canSchedule: boolean;
  fundingBlocked: boolean;
  completed: boolean;
}) {
  const [
    scheduleState,
    scheduleAction,
    schedulePending,
  ] = useActionState(
    scheduleAssistanceApplication,
    initialState,
  );

  const [
    completeState,
    completeAction,
    completePending,
  ] = useActionState(
    completeAssistanceApplication,
    initialState,
  );

  return (
    <div className="space-y-4">
      {fundingBlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Jadwal belum dapat ditetapkan sampai dana kampanye memenuhi target.
        </div>
      )}

      {!completed && (
        <form
          action={scheduleAction}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <input
            type="hidden"
            name="applicationId"
            value={applicationId}
          />

          <label
            htmlFor="scheduledDate"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Tanggal Pelaksanaan
          </label>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="scheduledDate"
              name="scheduledDate"
              type="date"
              defaultValue={
                scheduledDate ||
                undefined
              }
              required
              disabled={
                schedulePending ||
                !canSchedule
              }
              className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <button
              type="submit"
              disabled={
                schedulePending ||
                !canSchedule
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {schedulePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              {scheduledDate
                ? "Ubah Jadwal"
                : "Tetapkan Jadwal"}
            </button>
          </div>

          {scheduleState.error && (
            <p
              role="alert"
              className="mt-3 text-sm font-medium text-rose-700"
            >
              {scheduleState.error}
            </p>
          )}
        </form>
      )}

      <form
        action={completeAction}
        onSubmit={(event) => {
          const confirmed =
            window.confirm(
              "Pastikan bantuan benar-benar telah dilaksanakan. Setelah dilanjutkan, kegiatan akan dicatat sebagai selesai. Lanjutkan?",
            );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input
          type="hidden"
          name="applicationId"
          value={applicationId}
        />

        <button
          type="submit"
          disabled={
            completePending ||
            !scheduledDate ||
            completed
          }
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {completePending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {completed
            ? "Telah Dilaksanakan"
            : "Tandai Telah Dilaksanakan"}
        </button>

        {completeState.error && (
          <p
            role="alert"
            className="mt-3 text-sm font-medium text-rose-700"
          >
            {completeState.error}
          </p>
        )}
      </form>
    </div>
  );
}