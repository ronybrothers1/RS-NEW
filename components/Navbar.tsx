"use client";

import Link from "next/link";
import { HeartHandshake, Menu, X, User } from "lucide-react";
import { useState } from "react";
import SiteLogo from "@/components/SiteLogo";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Beranda", path: "/" },
    { name: "Tentang", path: "/tentang-kami" },
    { name: "Program", path: "/program" },
    { name: "Kegiatan", path: "/kegiatan" },
    { name: "Berita", path: "/berita" },
    { name: "Galeri", path: "/galeri" },
    { name: "Transparansi", path: "/transparansi" },
    { name: "Kontak", path: "/kontak" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <SiteLogo name="Yayasan Ruang Sejahtera" />

          <nav className="hidden xl:flex space-x-6" aria-label="Navigasi utama">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="text-slate-300 hover:text-white font-medium text-sm"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="hidden xl:flex items-center gap-2 text-slate-400 hover:text-white font-medium text-sm transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Akun</span>
            </Link>
            <Link
              href="/donasi"
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 sm:px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2 text-sm sm:text-base"
            >
              <HeartHandshake className="h-4 w-4" />
              <span className="hidden sm:inline">Donasi Sekarang</span>
              <span className="sm:hidden">Donasi</span>
            </Link>

            <button
              className="xl:hidden text-slate-300 hover:text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={
                isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
              }
              aria-expanded={isMobileMenuOpen}
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
        <div className="xl:hidden bg-slate-900 border-b border-slate-800 animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-3 mt-4 text-base font-medium text-teal-400 hover:text-teal-300 hover:bg-slate-800 rounded-md border-t border-slate-800"
            >
              <User className="w-5 h-5" />
              <span>Masuk / Akun Admin</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
