"use client";

import {
  LogOut,
} from "lucide-react";
import {
  signOut,
} from "next-auth/react";

export default function AccountLogoutButton() {
  return (
    <button
      type="button"
      onClick={() =>
        signOut({
          callbackUrl: "/",
        })
      }
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </button>
  );
}