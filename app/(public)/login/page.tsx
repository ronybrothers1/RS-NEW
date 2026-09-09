"use client";

import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  loginAction,
} from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    loginAction,
    {
      success: false,
      error: null,
      requiresVerification: false,
    },
  );

  const registered =
    searchParams.get(
      "registered",
    ) === "1";

  useEffect(() => {
    if (
      state.requiresVerification
    ) {
      router.replace(
        "/verifikasi-email",
      );

      router.refresh();
      return;
    }

    if (!state.success) {
      return;
    }

    fetch("/api/auth/session")
      .then((response) =>
        response.json(),
      )
      .then((session) => {
        const role =
          session?.user?.role;

        if (
          role === "ADMIN" ||
          role === "OPERATOR"
        ) {
          router.replace(
            "/admin/dashboard",
          );
        } else if (
          role === "USER"
        ) {
          router.replace(
            "/akun",
          );
        } else {
          router.replace("/");
        }

        router.refresh();
      });
  }, [
    state.success,
    state.requiresVerification,
    router,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Masuk
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Yayasan Ruang Sejahtera
            </p>
          </div>

          <form
            action={formAction}
            className="mt-8 space-y-5"
          >
            {registered && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Akun berhasil dibuat.
                Silakan masuk menggunakan
                email dan password Anda.
              </div>
            )}

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
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-11 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Password"
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
                      ? "Sembunyikan password"
                      : "Tampilkan password"
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Memproses..."
                : "Masuk"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Belum memiliki akun?
            </p>

            <Link
              href="/register"
              className="mt-2 inline-flex font-semibold text-teal-700 hover:text-teal-800"
            >
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}