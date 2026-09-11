"use client";

import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  registerUser,
  type RegisterState,
} from "@/app/actions/register";

const initialState: RegisterState = {
  success: false,
  error: null,
  verificationRequired: false,
  emailSent: false,
};

export default function RegisterPage() {
  const router = useRouter();

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    registerUser,
    initialState,
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  useEffect(() => {
    if (
      state.success &&
      state.verificationRequired
    ) {
      router.replace(
        "/verifikasi-email",
      );

      router.refresh();
    }
  }, [
    state.success,
    state.verificationRequired,
    router,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Buat Akun
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Daftar untuk mengakses
              layanan pengguna Yayasan
              Ruang Sejahtera dan
              mengajukan bantuan.
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
                htmlFor="register-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nama Lengkap
              </label>

              <div className="relative">
                <UserRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="register-name"
                  name="name"
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Nama lengkap"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nomor WhatsApp
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Digunakan sebagai kontak
                akun dan dapat menjadi
                kontak awal saat Anda
                mengajukan bantuan.
              </p>
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="register-password"
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

            <div>
              <label
                htmlFor="register-confirm-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Konfirmasi Password
              </label>

              <div className="relative">
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Ulangi password"
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

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <input
                id="register-terms"
                type="checkbox"
                name="terms"
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
              />

              <label
                htmlFor="register-terms"
                className="text-sm leading-6 text-slate-600"
              >
                Saya menyatakan data yang
                saya berikan benar dan
                telah membaca{" "}
                <Link
                  href="/kebijakan-privasi"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2 hover:text-teal-800"
                >
                  Kebijakan Privasi
                </Link>{" "}
                Yayasan Ruang Sejahtera.
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Mendaftarkan..."
                : "Daftar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-teal-700 hover:text-teal-800"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}