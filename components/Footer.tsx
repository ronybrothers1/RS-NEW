import Link from "next/link";
import { Mail, MapPin, Phone, Instagram, Facebook, Twitter, HeartHandshake } from "lucide-react";
import { db } from "@/src/db";
import { settings } from "@/src/db/schema";
import SiteLogo from "@/components/SiteLogo";

export default async function Footer() {
  const settingsData = await db.select().from(settings);
  const settingsMap = settingsData.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const address = settingsMap.yayasan_address || "Alamat belum diatur";
  const phone = settingsMap.yayasan_phone || "-";
  const email = settingsMap.yayasan_email || "-";
  const name = settingsMap.yayasan_name || "Yayasan Ruang Sejahtera";

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: About */}
          <div className="space-y-6">
            <SiteLogo name={name} />
            <p className="text-slate-400 text-sm leading-relaxed">
              Membangun harapan dan mewujudkan kesejahteraan melalui program-program sosial, pendidikan, dan kemanusiaan yang terukur dan transparan.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-teal-700 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-teal-700 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-teal-700 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Organisasi</h3>
            <ul className="space-y-4">
              <li><Link href="/tentang-kami" className="hover:text-teal-400 transition-colors">Tentang Kami</Link></li>
              <li><Link href="/program" className="hover:text-teal-400 transition-colors">Program Utama</Link></li>
              <li><Link href="/kegiatan" className="hover:text-teal-400 transition-colors">Galeri Kegiatan</Link></li>
              <li><Link href="/berita" className="hover:text-teal-400 transition-colors">Berita & Publikasi</Link></li>
            </ul>
          </div>

          {/* Column 3: Transparency */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Informasi Publik</h3>
            <ul className="space-y-4">
              <li><Link href="/transparansi" className="hover:text-teal-400 transition-colors">Transparansi Keuangan</Link></li>
              <li><Link href="/kontak" className="hover:text-teal-400 transition-colors">Hubungi Kami</Link></li>
              <li><Link href="#" className="hover:text-teal-400 transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="#" className="hover:text-teal-400 transition-colors">Ketentuan Donasi</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact & CTA */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg mb-6">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-teal-500 shrink-0" />
                <span className="text-slate-400 text-sm whitespace-pre-line">{phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-teal-500 shrink-0" />
                <span className="text-slate-400 text-sm whitespace-pre-line">{email}</span>
              </li>
            </ul>
            <Link 
              href="/donasi" 
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors"
            >
              <HeartHandshake className="h-4 w-4" />
              Donasi Sekarang
            </Link>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} {name}. Seluruh hak cipta dilindungi.
          </p>
          <div className="text-slate-500 text-sm">
            Dibangun dengan misi kebaikan untuk semua.
          </div>
        </div>
      </div>
    </footer>
  );
}
