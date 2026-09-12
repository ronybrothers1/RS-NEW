"use client";

import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Home,
  LogOut,
  User,
} from "lucide-react";
import {
  usePathname,
} from "next/navigation";
import {
  signOut,
} from "next-auth/react";

const labels:
  Record<string, string> = {
    dashboard: "Dashboard",
    keuangan: "Keuangan",
    masuk: "Uang Masuk",
    keluar: "Uang Keluar",
    riwayat:
      "Riwayat Transaksi",
    laporan:
      "Laporan Keuangan",
    kampanye: "Kampanye",
    kegiatan: "Kegiatan",
    tambah: "Tambah",
    berita: "Berita",
    tulis: "Tulis Berita",
    donasi: "Donasi",
    program: "Program",
    pengguna: "Pengguna",
    pengaturan:
      "Pengaturan",
    pengajuan:
      "Pengajuan Bantuan",
    "audit-logs":
      "Audit Log",
  };

function segmentLabel(
  segment: string,
) {
  if (
    labels[segment]
  ) {
    return labels[
      segment
    ];
  }

  if (
    /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(
      segment,
    )
  ) {
    return "Detail";
  }

  return segment
    .replace(
      /-/g,
      " ",
    )
    .replace(
      /w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

export default function AdminHeader({
  user,
  role,
}: {
  user: {
    name?: string | null;
  };
  role:
    | "ADMIN"
    | "OPERATOR";
}) {
  const pathname =
    usePathname();

  const segments =
    pathname
      .split("/")
      .filter(Boolean)
      .slice(1);

  return (
    <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center justify-between border-b border-frame bg-white/95 px-6 backdrop-blur md:flex">
      <nav
        className="flex min-w-0 items-center text-sm"
        aria-label="Breadcrumb"
      >
        <Link
          href="/admin/dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-800"
          aria-label="Dashboard admin"
        >
          <Home className="h-4 w-4" />
        </Link>

        {segments.map(
          (
            segment,
            index,
          ) => {
            const href =
              `/admin/${segments
                .slice(
                  0,
                  index + 1,
                )
                .join("/")}`;

            const isLast =
              index ===
              segments.length -
                1;

            const label =
              segmentLabel(
                segment,
              );

            return (
              <div
                key={href}
                className="flex min-w-0 items-center"
              >
                <ChevronRight className="mx-1.5 h-4 w-4 shrink-0 text-slate-300" />

                {isLast ? (
                  <span
                    className="max-w-56 truncate font-semibold text-slate-800"
                    aria-current="page"
                  >
                    {label}
                  </span>
                ) : (
                  <Link
                    href={
                      href
                    }
                    className="max-w-48 truncate rounded-md px-1 py-1 font-medium text-slate-500 transition-colors hover:text-brand-800"
                  >
                    {label}
                  </Link>
                )}
              </div>
            );
          },
        )}
      </nav>

      <div className="ml-6 flex shrink-0 items-center gap-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
        >
          Lihat Website
          <ExternalLink className="h-4 w-4" />
        </Link>

        <div className="h-7 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end leading-tight">
            <span className="max-w-44 truncate text-sm font-semibold text-slate-900">
              {user?.name ||
                "Pengguna"}
            </span>

            <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {role ===
              "ADMIN"
                ? "Administrator"
                : "Operator"}
            </span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-800 ring-1 ring-brand-100">
            <User className="h-4 w-4" />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            signOut({
              callbackUrl:
                "/login",
            })
          }
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          title="Keluar"
          aria-label="Keluar dari panel admin"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
