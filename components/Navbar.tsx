"use client";

import Link from "next/link";
import {
  HeartHandshake,
  Menu,
  User,
  X,
} from "lucide-react";
import {
  usePathname,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import SiteLogo from "@/components/SiteLogo";

const navLinks = [
  {
    name: "Beranda",
    path: "/",
  },
  {
    name: "Tentang",
    path: "/tentang-kami",
  },
  {
    name: "Program",
    path: "/program",
  },
  {
    name: "Kegiatan",
    path: "/kegiatan",
  },
  {
    name: "Berita",
    path: "/berita",
  },
  {
    name: "Bantu Mereka",
    path: "/bantuan",
  },
  {
    name: "Transparansi",
    path: "/transparansi",
  },
  {
    name: "Kontak",
    path: "/kontak",
  },
];

export default function Navbar() {
  const pathname =
    usePathname();

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(
      false,
    );
  }, [pathname]);

  useEffect(() => {
    if (
      !isMobileMenuOpen
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setIsMobileMenuOpen(
          false,
        );
      }
    };

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [
    isMobileMenuOpen,
  ]);

  function isActive(
    path: string,
  ) {
    if (
      path === "/"
    ) {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname?.startsWith(
        `${path}/`,
      )
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <SiteLogo name="Yayasan Ruang Sejahtera" />

          <nav
            className="hidden items-center gap-1 xl:flex"
            aria-label="Navigasi utama"
          >
            {navLinks.map(
              (link) => {
                const active =
                  isActive(
                    link.path,
                  );

                return (
                  <Link
                    key={
                      link.path
                    }
                    href={
                      link.path
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {
                      link.name
                    }
                  </Link>
                );
              },
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 xl:flex"
            >
              <User className="h-4 w-4" />
              <span>
                Akun
              </span>
            </Link>

            <Link
              href="/donasi"
              className="flex min-h-11 items-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:px-5 sm:text-base"
            >
              <HeartHandshake className="h-4 w-4" />
              <span className="hidden sm:inline">
                Donasi Sekarang
              </span>
              <span className="sm:hidden">
                Donasi
              </span>
            </Link>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 xl:hidden"
              onClick={() =>
                setIsMobileMenuOpen(
                  (open) =>
                    !open,
                )
              }
              aria-label={
                isMobileMenuOpen
                  ? "Tutup menu navigasi"
                  : "Buka menu navigasi"
              }
              aria-expanded={
                isMobileMenuOpen
              }
              aria-controls="public-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="public-mobile-menu"
          className="border-b border-slate-800 bg-slate-900 shadow-xl xl:hidden"
        >
          <nav
            className="mx-auto max-w-7xl space-y-1 px-4 pb-6 pt-2 sm:px-6"
            aria-label="Navigasi utama seluler"
          >
            {navLinks.map(
              (link) => {
                const active =
                  isActive(
                    link.path,
                  );

                return (
                  <Link
                    key={
                      link.path
                    }
                    href={
                      link.path
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`block min-h-11 rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                      active
                        ? "bg-teal-950 text-teal-200 ring-1 ring-inset ring-teal-800"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {
                      link.name
                    }
                  </Link>
                );
              },
            )}

            <Link
              href="/login"
              className="mt-4 flex min-h-11 items-center gap-2 border-t border-slate-800 px-3 py-3 text-base font-medium text-teal-400 transition-colors hover:bg-slate-800 hover:text-teal-300"
            >
              <User className="h-5 w-5" />
              <span>
                Masuk / Daftar
              </span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
