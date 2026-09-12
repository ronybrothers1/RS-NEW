import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  HeartHandshake,
} from "lucide-react";
import { db } from "@/src/db";
import { settings } from "@/src/db/schema";
import SiteLogo from "@/components/SiteLogo";

export default async function Footer() {
  let settingsMap: Record<string, string> = {};

  try {
    const settingsData = await db.select().from(settings);
    settingsMap = settingsData.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Footer: failed to fetch settings', error);
  }

  const address = settingsMap.yayasan_address?.trim() || "Alamat belum diatur";
  const phone = settingsMap.yayasan_phone?.trim() || "-";
  const email = settingsMap.yayasan_email?.trim() || "-";
  const name = settingsMap.yayasan_name?.trim() || "Yayasan Ruang Sejahtera";

  const socialLinks = [
    {
      label: "Instagram",
      href: settingsMap.social_instagram?.trim(),
      icon: Instagram,
    },
    {
      label: "Facebook",
      href: settingsMap.social_facebook?.trim(),
      icon: Facebook,
    },
    {
      label: "X / Twitter",
      href: settingsMap.social_twitter?.trim(),
      icon: Twitter,
    },
    {
      label: "TikTok",
      href: settingsMap.social_tiktok?.trim(),
      icon: Music2,
    },
  ].filter((item) => item.href);

  return (
    <footer className="border-t border-brand-900 bg-brand-950 pb-8 pt-16 text-white/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <SiteLogo name={name} />
            <p className="text-sm leading-relaxed text-white/75">
              Membangun harapan dan mewujudkan kesejahteraan melalui
              program-program sosial, pendidikan, dan kemanusiaan yang
              terukur dan transparan.
            </p>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-white/85 transition-colors hover:bg-brand-700 hover:text-white"
                    aria-label={label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Organisasi</h3>
            <ul className="space-y-4 text-white/85">
              <li>
                <Link href="/tentang-kami" className="transition-colors hover:text-citrus-300">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/program" className="transition-colors hover:text-citrus-300">
                  Program Utama
                </Link>
              </li>
              <li>
                <Link href="/kegiatan" className="transition-colors hover:text-citrus-300">
                  Kegiatan
                </Link>
              </li>
              <li>
                <Link href="/berita" className="transition-colors hover:text-citrus-300">
                  Berita & Publikasi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">
              Informasi Publik
            </h3>
            <ul className="space-y-4 text-white/85">
              <li>
                <Link href="/transparansi" className="transition-colors hover:text-citrus-300">
                  Transparansi Keuangan
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="transition-colors hover:text-citrus-300">
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="transition-colors hover:text-citrus-300">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/ketentuan-donasi" className="transition-colors hover:text-citrus-300">
                  Ketentuan Donasi
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg mb-6">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
                <span className="whitespace-pre-line text-sm leading-relaxed text-white/80">
                  {address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-brand-300" />
                <span className="whitespace-pre-line text-sm text-white/80">
                  {phone}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-brand-300" />
                <span className="break-all whitespace-pre-line text-sm text-white/80">
                  {email}
                </span>
              </li>
            </ul>
            <Link
              href="/donasi"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-citrus-400 py-3 font-semibold text-brand-950 transition-colors hover:bg-citrus-300"
            >
              <HeartHandshake className="h-4 w-4" />
              Donasi Sekarang
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-brand-900 pt-8 text-center md:flex-row">
          <p className="text-sm text-white/65">
            &copy; {new Date().getFullYear()} {name}. Seluruh hak cipta dilindungi.
          </p>
          <div className="text-sm text-white/65">
            Dibangun dengan misi kebaikan untuk semua.
          </div>
        </div>
      </div>
    </footer>
  );
}
