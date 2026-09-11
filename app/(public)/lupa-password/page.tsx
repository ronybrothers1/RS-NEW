"use client";

import {
  ArrowLeft,
  Mail,
} from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  requestPasswordReset,
  type RequestPasswordResetState,
} from "@/app/actions/password-reset";

const initialState:
  RequestPasswordResetState = {
    success: false,
    error: null,
    retryAfter: 0,
  };

export default function ForgotPasswordPage() {
  const router =
    useRouter();

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    requestPasswordReset,
    initialState,
  );

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.replace(
      "/lupa-password/verifikasi",
    );

    router.refresh();
  }, [
    state.success,
    router,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Lupa Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masukkan email yang terhubung
              dengan akun Ruang Sejahtera.
              Jika email terdaftar, kami akan
              mengirim kode pemulihan.
            </p>
          </div>

          <form
            action={formAction}
            className="mt-8 space-y-5"
          >
            {state.error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
              >
                {state.error}
              </div>
            )}

            <div>
              <label
                htmlFor="reset-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Mengirim..."
                : "Kirim Kode Pemulihan"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}