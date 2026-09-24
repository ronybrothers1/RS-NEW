import type {
  Metadata,
} from "next";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  createPageMetadata,
} from "@/lib/seo-metadata";
import {
  getCachedPublicSettings,
} from "@/lib/public-settings";

export const dynamic =
  "force-dynamic";

export const metadata: Metadata =
  createPageMetadata({
    title:
      "Penghapusan Akun",
    description:
      "Ajukan penghapusan akun Ruang Sejahtera dan pelajari data yang dihapus atau perlu dipertahankan untuk keperluan administrasi, audit, keamanan, dan kewajiban yang berlaku.",
    path: "/hapus-akun",
  });

function normalizeWhatsappNumber(
  value: string,
) {
  const firstNumber =
    value.split(
      /[\n,;/]/,
    )[0] || "";

  let digits =
    firstNumber.replace(
      /\D/g,
      "",
    );

  if (
    digits.startsWith(
      "0",
    )
  ) {
    digits =
      `62${digits.slice(
        1,
      )}`;
  }

  return digits;
}

export default async function HapusAkunPage() {
  const settingsMap =
    await getCachedPublicSettings();

  const email =
    settingsMap.yayasan_email?.trim() ||
    "";

  const phone =
    settingsMap.yayasan_phone?.trim() ||
    "";

  const whatsappNumber =
    normalizeWhatsappNumber(
      phone,
    );

  const subject =
    "Permintaan Penghapusan Akun Ruang Sejahtera";

  const requestTemplate = [
    "Saya mengajukan penghapusan akun Ruang Sejahtera.",
    "",
    "Nama lengkap:",
    "Email akun:",
    "Nomor WhatsApp akun (jika ada):",
    "",
    "Mohon konfirmasi proses penghapusan akun dan data terkait yang tidak wajib dipertahankan.",
  ].join("\n");

  const emailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(
        requestTemplate,
      )}`
    : "";

  const whatsappHref =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          `${subject}\n\n${requestTemplate}`,
        )}`
      : "";

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20">
            <Trash2 className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-white md:text-5xl">
            Penghapusan Akun
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Pengguna Ruang Sejahtera dapat
            mengajukan penghapusan akun
            melalui halaman ini, baik dari
            aplikasi Android maupun browser.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Cara mengajukan penghapusan
            </h2>

            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-600">
              <li>
                Gunakan alamat email yang
                terdaftar pada akun Ruang
                Sejahtera, atau cantumkan
                alamat email akun dalam
                permintaan.
              </li>

              <li>
                Sertakan nama lengkap dan,
                jika tersedia, nomor WhatsApp
                yang terhubung dengan akun.
              </li>

              <li>
                Sampaikan bahwa Anda meminta
                penghapusan akun Ruang
                Sejahtera. Yayasan dapat
                meminta verifikasi tambahan
                untuk memastikan permintaan
                berasal dari pemilik akun.
              </li>
            </ol>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {emailHref && (
                <a
                  href={emailHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  <Mail className="h-4 w-4" />
                  Ajukan via Email
                </a>
              )}

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ajukan via WhatsApp
                </a>
              )}
            </div>

            {!emailHref &&
              !whatsappHref && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Kanal pengajuan langsung
                  belum tersedia. Silakan
                  gunakan halaman{" "}
                  <Link
                    href="/kontak"
                    className="font-semibold underline"
                  >
                    Kontak
                  </Link>{" "}
                  untuk menghubungi pengurus.
                </div>
              )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-950">
              Data yang diproses saat akun
              dihapus
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Setelah permintaan yang valid
              diproses, data akun dan
              autentikasi yang tidak lagi
              diperlukan akan dihapus atau
              dianonimkan sesuai kebutuhan
              proses penghapusan.
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Data tertentu dapat tetap
              dipertahankan apabila diperlukan
              untuk pembukuan, audit, keamanan,
              pencegahan penyalahgunaan,
              pemenuhan kewajiban hukum, atau
              menjaga integritas riwayat
              transaksi dan kegiatan yayasan.
              Jika memungkinkan, data yang
              dipertahankan akan dipisahkan
              dari penggunaan aktif akun.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Contoh data yang mungkin perlu
              dipertahankan
            </h2>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
              <li>
                catatan transaksi dan donasi
                yang diperlukan untuk
                pembukuan atau audit;
              </li>
              <li>
                riwayat pengajuan bantuan yang
                telah dikirim atau diproses;
              </li>
              <li>
                catatan keamanan dan audit
                yang diperlukan untuk
                pencegahan penyalahgunaan;
              </li>
              <li>
                konten organisasi atau riwayat
                kegiatan yang perlu
                dipertahankan sebagai rekam
                administrasi.
              </li>
            </ul>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              Informasi lebih lengkap mengenai
              pemrosesan dan penyimpanan data
              tersedia dalam{" "}
              <Link
                href="/kebijakan-privasi"
                className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2"
              >
                Kebijakan Privasi
              </Link>
              .
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
