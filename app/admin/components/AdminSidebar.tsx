"use client";

import Link from "next/link";
import Image from "next/image";
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
  const [mobileOpenPath, setMobileOpenPath] =
    useState<string | null>(null);

  const isMobileOpen =
    mobileOpenPath === pathname;
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
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpenPath(null);
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
        { name: "Laporan Keuangan", href: "/admin/keuangan/laporan" },
        { name: "Keuangan Kampanye", href: "/admin/keuangan/kampanye" },
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
          "group flex min-h-9 w-full items-center rounded-lg px-3 text-[13px] font-medium transition-colors",
          isActive
            ? "bg-brand-700 text-white ring-1 ring-inset ring-brand-500"
            : "text-brand-100 hover:bg-brand-900 hover:text-white",
          isChild ? "pl-11" : "",
        )}
      >
        {Icon && (
          <Icon
            className={clsx(
              "mr-3 h-5 w-5 shrink-0",
              isActive ? "text-white" : "text-brand-300 group-hover:text-white",
            )}
          />
        )}
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-brand-900 bg-brand-950 px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpenPath(pathname)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-300"
          aria-label="Buka navigasi admin"
          aria-expanded={isMobileOpen}
          aria-controls="admin-navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link
          href="/admin/dashboard"
          className="flex items-center"
          aria-label="Dashboard Ruang Sejahtera"
        >
          <Image
            src="/brand/ruang-sejahtera-logo.png"
            alt="Ruang Sejahtera"
            width={1100}
            height={500}
            sizes="180px"
            className="h-11 w-auto max-w-[180px] object-contain"
          />
        </Link>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Tutup navigasi admin"
          className="fixed inset-0 z-40 bg-brand-950/55 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileOpenPath(null)}
        />
      )}

      <aside
        id="admin-navigation"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-brand-900 bg-brand-950 text-brand-100 shadow-xl transition-transform duration-200 ease-out md:static md:z-auto md:h-screen md:w-60 md:translate-x-0 md:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-brand-900 bg-brand-950 px-5">
          <Link
            href="/admin/dashboard"
            className="flex min-w-0 items-center"
            aria-label="Dashboard Ruang Sejahtera"
          >
            <Image
              src="/brand/ruang-sejahtera-logo.png"
              alt="Ruang Sejahtera"
              width={1100}
              height={500}
              sizes="160px"
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-200 hover:bg-brand-900 hover:text-white md:hidden"
            onClick={() => setMobileOpenPath(null)}
            aria-label="Tutup navigasi admin"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-brand-900 px-3 py-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-brand-900/80 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-700">
              <CircleDollarSign className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">Mode kerja</p>
              <p className="truncate text-sm font-semibold text-white">
                {role === "ADMIN" ? "Administrator" : "Operator"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Navigasi admin">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300">
            Operasional
          </p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              if (!item.children) return renderLink(item);

              const active = isParentActive(item);
              const open = Boolean(
                item.id &&
                  (active || openMenus[item.id]),
              );
              const Icon = item.icon;

              return (
                <div key={item.name}>
                  <button
                    type="button"
                    onClick={() => item.id && toggleMenu(item.id)}
                    className={clsx(
                      "flex min-h-9 w-full items-center justify-between rounded-lg px-3 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-brand-700 text-white"
                        : "text-brand-100 hover:bg-brand-900 hover:text-white",
                    )}
                    aria-expanded={open}
                  >
                    <span className="flex min-w-0 items-center">
                      <Icon
                        className={clsx(
                          "mr-3 h-5 w-5 shrink-0",
                          active ? "text-white" : "text-brand-300",
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

        <div className="shrink-0 border-t border-brand-900 px-4 py-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2.5 text-sm font-semibold text-rose-200 transition-colors hover:border-rose-300 hover:bg-rose-950/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 md:hidden"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>

          <p className="text-xs leading-5 text-brand-300">
            Yayasan Ruang Sejahtera<br />
            Sistem manajemen internal
          </p>
        </div>
      </aside>
    </>
  );
}
