"use client";

import {
  LogOut,
  ShieldAlert,
} from "lucide-react";
import {
  signOut,
} from "next-auth/react";
import {
  useState,
} from "react";

export default function AccessRevoked() {
  const [
    isSigningOut,
    setIsSigningOut,
  ] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Sesi perlu diperbarui
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Hak akses akun pada database sudah berubah atau akun tidak lagi memiliki akses ke Control Plane. Keluar lalu masuk kembali agar sesi mengikuti hak akses terbaru.
        </p>

        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => {
            setIsSigningOut(true);
            void signOut({
              callbackUrl:
                "/login",
            });
          }}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut
            ? "Memperbarui sesi..."
            : "Keluar dan Masuk Kembali"}
        </button>
      </div>
    </div>
  );
}
