"use client";

import {
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  completePasswordReset,
  resendPasswordResetCode,
  type CompletePasswordResetState,
  type RequestPasswordResetState,
} from "@/app/actions/password-reset";

const completeInitial:
  CompletePasswordResetState = {
    success: false,
    error: null,
  };

const resendInitial:
  RequestPasswordResetState = {
    success: false,
    error: null,
    retryAfter: 0,
  };

export default function PasswordResetForm({
  maskedEmail,
  initialCountdown,
}: {
  maskedEmail: string;
  initialCountdown: number;
}) {
  const router =
    useRouter();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    countdown,
    setCountdown,
  ] = useState(
    initialCountdown,
  );

  const [
    completeState,
    completeAction,
    completePending,
  ] = useActionState(
    completePasswordReset,
    completeInitial,
  );

  const [
    resendState,
    resendAction,
    resendPending,
  ] = useActionState(
    async (
      previousState:
        RequestPasswordResetState,
    ) => {
      const nextState =
        await resendPasswordResetCode(
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
    if (
      !completeState.success
    ) {
      return;
    }

    router.replace(
      "/login?reset=1",
    );

    router.refresh();
  }, [
    completeState.success,
    router,
  ]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <KeyRound className="h-7 w-7" />
      </div>

      <div className="mt-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Atur Ulang Password
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Jika email terdaftar, kode
          pemulihan 6 digit dikirim ke
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {maskedEmail}
        </p>
      </div>

      <form
        action={completeAction}
        className="mt-8 space-y-5"
      >
        {completeState.error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {completeState.error}
          </div>
        )}

        <div>
          <label
            htmlFor="password-reset-code"
            className="mb-2 block text-center text-sm font-medium text-slate-700"
          >
            Kode Pemulihan
          </label>

          <input
            id="password-reset-code"
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

        <div>
          <label
            htmlFor="password-reset-new"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password Baru
          </label>

          <div className="relative">
            <input
              id="password-reset-new"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-3 pr-11 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) =>
                    !value,
                )
              }
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label={
                showPassword
                  ? "Sembunyikan password baru"
                  : "Tampilkan password baru"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="password-reset-confirm"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Konfirmasi Password Baru
          </label>

          <div className="relative">
            <input
              id="password-reset-confirm"
              name="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Ulangi password baru"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-3 pr-11 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (value) =>
                    !value,
                )
              }
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label={
                showConfirmPassword
                  ? "Sembunyikan konfirmasi password"
                  : "Tampilkan konfirmasi password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={completePending}
          className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {completePending
            ? "Memperbarui..."
            : "Atur Ulang Password"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-6 text-center">
        {resendState.error && (
          <p
            role="alert"
            className="mb-3 text-sm text-rose-600"
          >
            {resendState.error}
          </p>
        )}

        {resendState.success && (
          <p className="mb-3 text-sm text-emerald-600">
            Jika email terdaftar, kode
            pemulihan baru telah dikirim.
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

        <Link
          href="/lupa-password"
          className="mt-4 inline-flex text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          Gunakan email lain
        </Link>
      </div>
    </div>
  );
}