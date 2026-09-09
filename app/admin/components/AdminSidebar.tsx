"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CalendarRange,
  Newspaper,
  HeartHandshake,
  ClipboardCheck,
  Users,
  Settings,
  ClipboardList,
  ChevronDown,
  Menu,
  X,
  CircleDollarSign,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { signOut } from "next-auth/react";

interface AdminSidebarProps {
  role: string;
}

type MenuChild = {
  name: string;
  href: string;
};

type MenuItem = {
  name: string;
  icon: LucideIcon;
  href?: string;
  exact?: boolean;
  id?: string;
  children?: MenuChild[];
};

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    keuangan: pathname?.startsWith("/admin/keuangan") || false,
    kegiatan: pathname?.startsWith("/admin/kegiatan") || false,
    berita: pathname?.startsWith("/admin/berita") || false,
    program:
      pathname?.startsWith("/admin/donasi") ||
      pathname?.startsWith("/admin/program") ||
      false,
  });

  useEffect(() => {
    setIsMobileOpen(false);
    setOpenMenus((prev) => ({
      ...prev,
      keuangan: pathname?.startsWith("/admin/keuangan") || prev.keuangan,
      kegiatan: pathname?.startsWith("/admin/kegiatan") || prev.kegiatan,
      berita: pathname?.startsWith("/admin/berita") || prev.berita,
      program:
        pathname?.startsWith("/admin/donasi") ||
        pathname?.startsWith("/admin/program") ||
        prev.program,
    }));
  }, [pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      exact: true,
    },
    {
      name: "Keuangan",
      icon: Wallet,
      id: "keuangan",
      children: [
        { name: "Uang Masuk", href: "/admin/keuangan/masuk" },
        { name: "Uang Keluar", href: "/admin/keuangan/keluar" },
        { name: "Riwayat Transaksi", href: "/admin/keuangan/riwayat" },
      ],
    },
    {
      name: "Kegiatan",
      icon: CalendarRange,
      id: "kegiatan",
      children: [
        { name: "Semua Kegiatan", href: "/admin/kegiatan" },
        { name: "Tambah Kegiatan", href: "/admin/kegiatan/tambah" },
      ],
    },
    {
      name: "Berita",
      icon: Newspaper,
      id: "berita",
      children: [
        { name: "Semua Berita", href: "/admin/berita" },
        { name: "Tulis Berita", href: "/admin/berita/tulis" },
      ],
    },
    {
      name: "Program & Donasi",
      icon: HeartHandshake,
      id: "program",
      children: [
        { name: "Verifikasi Donasi", href: "/admin/donasi" },
        { name: "Manajemen Program", href: "/admin/program" },
      ],
    },
    { name: "Pengajuan Bantuan", icon: ClipboardCheck, href: "/admin/pengajuan" },
  ];

  if (role === "ADMIN") {
    menuItems.push(
      { name: "Pengguna", icon: Users, href: "/admin/pengguna" },
      { name: "Pengaturan", icon: Settings, href: "/admin/pengaturan" },
      { name: "Audit Log", icon: ClipboardList, href: "/admin/audit-logs" },
    );
  }

  const isLinkActive = (item: { href?: string; exact?: boolean }) => {
    if (!item.href) return false;
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  };

  const isParentActive = (item: MenuItem) =>
    item.children?.some((child) => isLinkActive(child)) ?? false;

  const renderLink = (item: MenuChild | MenuItem, isChild = false) => {
    if (!item.href) return null;
    const isActive = isLinkActive(item);
    const Icon = "icon" in item ? item.icon : undefined;

    return (
      <Link
        key={item.name}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={clsx(
          "group flex min-h-10 w-full items-center rounded-lg px-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          isChild ? "pl-11" : "",
        )}
      >
        {Icon && (
          <Icon
            className={clsx(
              "mr-3 h-5 w-5 shrink-0",
              isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600",
            )}
          />
        )}
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-black px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Buka navigasi admin"
          aria-expanded={isMobileOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link
          href="/admin/dashboard"
          className="flex items-center"
          aria-label="Dashboard Ruang Sejahtera"
        >
          <img
            src="/brand/ruang-sejahtera-logo.png"
            alt="Ruang Sejahtera"
            className="h-11 w-auto max-w-[180px] object-contain"
          />
        </Link>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Tutup navigasi admin"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out md:static md:z-auto md:h-screen md:w-64 md:translate-x-0 md:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-black px-5">
          <Link
            href="/admin/dashboard"
            className="flex min-w-0 items-center"
            aria-label="Dashboard Ruang Sejahtera"
          >
            <img
              src="/brand/ruang-sejahtera-logo.png"
              alt="Ruang Sejahtera"
              className="h-12 w-auto max-w-[205px] object-contain"
            />
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Tutup navigasi admin"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm ring-1 ring-slate-200">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mode kerja</p>
              <p className="truncate text-sm font-semibold text-slate-800">
                {role === "ADMIN" ? "Administrator" : "Operator"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigasi admin">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Operasional
          </p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              if (!item.children) return renderLink(item);

              const active = isParentActive(item);
              const open = Boolean(item.id && openMenus[item.id]);
              const Icon = item.icon;

              return (
                <div key={item.name}>
                  <button
                    type="button"
                    onClick={() => item.id && toggleMenu(item.id)}
                    className={clsx(
                      "flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-teal-50 text-teal-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    )}
                    aria-expanded={open}
                  >
                    <span className="flex min-w-0 items-center">
                      <Icon
                        className={clsx(
                          "mr-3 h-5 w-5 shrink-0",
                          active ? "text-teal-700" : "text-slate-400",
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <ChevronDown
                      className={clsx(
                        "h-4 w-4 shrink-0 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  {open && (
                    <div className="mt-1 space-y-1">
                      {item.children.map((child) => renderLink(child, true))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 md:hidden"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>

          <p className="text-xs leading-5 text-slate-400">
            Yayasan Ruang Sejahtera<br />
            Sistem manajemen internal
          </p>
        </div>
      </aside>
    </>
  );
}
