"use client";

import {
  MailCheck,
  RefreshCw,
} from "lucide-react";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  resendEmailCode,
  type ResendEmailState,
  type VerifyEmailState,
  verifyEmailCode,
} from "@/app/actions/email-verification";

const verifyInitial:
  VerifyEmailState = {
    success: false,
    error: null,
    autoLogin: false,
  };

const resendInitial:
  ResendEmailState = {
    success: false,
    error: null,
    retryAfter: 0,
  };

export default function EmailVerificationForm({
  maskedEmail,
  initialCountdown,
}: {
  maskedEmail: string;
  initialCountdown: number;
}) {
  const router =
    useRouter();

  const [
    verifyState,
    verifyAction,
    verifyPending,
  ] = useActionState(
    verifyEmailCode,
    verifyInitial,
  );

  const [
    countdown,
    setCountdown,
  ] = useState(
    initialCountdown,
  );

  const [
    resendState,
    resendAction,
    resendPending,
  ] = useActionState(
    async (
      previousState:
        ResendEmailState,
    ) => {
      const nextState =
        await resendEmailCode(
          previousState,
        );

      if (
        nextState.retryAfter >
        0
      ) {
        setCountdown(
          nextState.retryAfter,
        );
      }

      return nextState;
    },
    resendInitial,
  );

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setCountdown(
            (value) =>
              Math.max(
                0,
                value - 1,
              ),
          );
        },
        1000,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [countdown]);


  useEffect(() => {
    if (!verifyState.success) {
      return;
    }

    router.replace(
      verifyState.autoLogin
        ? "/akun"
        : "/login?verified=1",
    );

    router.refresh();
  }, [
    verifyState.success,
    verifyState.autoLogin,
    router,
  ]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <MailCheck className="h-7 w-7" />
      </div>

      <div className="mt-5 text-center">
        <h1 className="text-2xl font-bold text-slate-950">
          Verifikasi Email
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Kami mengirim kode
          verifikasi 6 digit ke
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {maskedEmail}
        </p>
      </div>

      <form
        action={verifyAction}
        className="mt-8 space-y-5"
      >
        {verifyState.error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {verifyState.error}
          </div>
        )}

        <div>
          <label
            htmlFor="verification-code"
            className="mb-2 block text-center text-sm font-medium text-slate-700"
          >
            Kode Verifikasi
          </label>

          <input
            id="verification-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            placeholder="000000"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-slate-950 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={verifyPending}
          className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
        >
          {verifyPending
            ? "Memverifikasi..."
            : "Verifikasi Email"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-6 text-center">
        {resendState.error && (
          <p className="mb-3 text-sm text-rose-600">
            {resendState.error}
          </p>
        )}

        {resendState.success && (
          <p className="mb-3 text-sm text-emerald-600">
            Kode baru berhasil
            dikirim.
          </p>
        )}

        <form
          action={resendAction}
        >
          <button
            type="submit"
            disabled={
              resendPending ||
              countdown > 0
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <RefreshCw className="h-4 w-4" />

            {resendPending
              ? "Mengirim..."
              : countdown > 0
                ? `Kirim ulang dalam ${countdown} detik`
                : "Kirim Ulang Kode"}
          </button>
        </form>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Kode berlaku selama
          10 menit dan maksimal
          5 kali percobaan.
        </p>
      </div>
    </div>
  );
}