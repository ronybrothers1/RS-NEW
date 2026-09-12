import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/src/db";
import { settings } from "@/src/db/schema";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: "/kontak",
  },
};

function normalizeWhatsappNumber(value: string) {
  const firstNumber = value.split(/[\n,;/]/)[0] || "";
  let digits = firstNumber.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  }

  return digits;
}

export default async function KontakPage() {
  const settingsData = await db.select().from(settings);
  const settingsMap = settingsData.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const address = settingsMap.yayasan_address?.trim() || "";
  const phone = settingsMap.yayasan_phone?.trim() || "";
  const email = settingsMap.yayasan_email?.trim() || "";

  const whatsappNumber = normalizeWhatsappNumber(phone);
  const emailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent("Pesan dari Website Ruang Sejahtera")}`
    : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Hubungi Kami
          </h1>
          <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
            Kami siap menerima pertanyaan, saran, informasi penerima manfaat,
            dan inisiatif kolaborasi.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Informasi Kontak
            </h2>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    Alamat
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {address || "Alamat belum dipublikasikan."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    Telepon / WhatsApp
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {phone || "Nomor kontak belum dipublikasikan."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Email</h3>
                  <p className="text-slate-600 leading-relaxed break-all">
                    {email || "Email publik belum dipublikasikan."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">
                Waktu Respons
              </h3>
              <p className="text-slate-600">
                Pesan akan ditindaklanjuti menyesuaikan jadwal pengurus
                Yayasan Ruang Sejahtera.
              </p>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Kirim Pesan
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8">
                Gunakan kanal resmi di bawah ini agar pesan benar-benar
                diterima oleh pengurus.
              </p>

              <div className="space-y-4">
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Hubungi via WhatsApp
                  </a>
                )}

                {email && (
                  <a
                    href={emailHref}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    Kirim Email
                  </a>
                )}

                {!whatsappNumber && !email && (
                  <div className="p-5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm leading-relaxed">
                    Kanal kontak resmi belum diatur. Administrator dapat
                    mengisinya melalui menu Pengaturan.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
