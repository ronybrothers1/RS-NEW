"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  CalendarRange, 
  Newspaper, 
  HeartHandshake, 
  Image as ImageIcon, 
  Users, 
  Settings,
  ClipboardList,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

interface AdminSidebarProps {
  role: string;
}

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    keuangan: pathname?.includes('/admin/keuangan') || false,
    kegiatan: pathname?.includes('/admin/kegiatan') || false,
    berita: pathname?.includes('/admin/berita') || false,
    donasi: pathname?.includes('/admin/donasi') || false
  });

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", exact: true },
    { 
      name: "Keuangan", icon: Wallet, id: "keuangan",
      children: [
        { name: "Uang Masuk", href: "/admin/keuangan/masuk" },
        { name: "Uang Keluar", href: "/admin/keuangan/keluar" },
        { name: "Riwayat Transaksi", href: "/admin/keuangan/riwayat" },
      ]
    },
    { 
      name: "Kegiatan", icon: CalendarRange, id: "kegiatan",
      children: [
        { name: "Semua Kegiatan", href: "/admin/kegiatan" },
        { name: "Tambah Kegiatan", href: "/admin/kegiatan/tambah" },
      ]
    },
    { 
      name: "Berita", icon: Newspaper, id: "berita",
      children: [
        { name: "Semua Berita", href: "/admin/berita" },
        { name: "Tulis Berita", href: "/admin/berita/tulis" },
      ]
    },
    { 
      name: "Program Sosial", icon: HeartHandshake, id: "donasi",
      children: [
        { name: "Verifikasi Donasi", href: "/admin/donasi" },
        { name: "Manajemen Program", href: "/admin/program" },
      ]
    },
    { name: "Galeri", icon: ImageIcon, href: "/admin/galeri" },
  ];

  if (role === 'ADMIN') {
    menuItems.push(
      { name: "Pengguna", icon: Users, href: "/admin/pengguna" },
      { name: "Pengaturan", icon: Settings, href: "/admin/pengaturan" },
      { name: "Audit Logs", icon: ClipboardList, href: "/admin/audit-logs" }
    );
  }

  const renderLink = (item: any, isChild = false) => {
    const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
    
    return (
      <Link 
        key={item.name} 
        href={item.href}
        className={clsx(
          "flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          isActive 
            ? "bg-teal-50 text-teal-700" 
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          isChild ? "pl-10" : ""
        )}
      >
        {item.icon && <item.icon className={clsx("mr-3 h-5 w-5", isActive ? "text-teal-700" : "text-slate-400")} />}
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center px-4">
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-slate-500 hover:text-slate-700">
          <Menu className="h-6 w-6" />
        </button>
        <span className="ml-4 font-bold text-slate-800">Ruang Sejahtera</span>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-200 ease-in-out md:transform-none flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950 justify-between">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <img 
              src="/logo.jpeg" 
              alt="Logo Ruang Sejahtera" 
              className="h-10 w-auto object-contain mix-blend-screen"
              title="Ruang Sejahtera"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = '<div class="w-8 h-8 bg-teal-700 text-white rounded flex items-center justify-center font-bold text-sm">YRS</div><span class="font-bold text-white ml-2">Admin Panel</span>';
                }
              }}
            />
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <button 
                    onClick={() => toggleMenu(item.id!)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5 text-slate-400" />
                      {item.name}
                    </div>
                    <ChevronDown className={clsx("h-4 w-4 transition-transform", openMenus[item.id!] ? "rotate-180" : "")} />
                  </button>
                  {openMenus[item.id!] && (
                    <div className="mt-1 space-y-1">
                      {item.children.map(child => renderLink(child, true))}
                    </div>
                  )}
                </div>
              ) : (
                renderLink(item)
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
