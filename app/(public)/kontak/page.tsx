
import { Mail, MapPin, Phone } from "lucide-react";
import { db } from "@/src/db";
import { settings } from "@/src/db/schema";

export const revalidate = 60; // Cache for 60 seconds

export default async function KontakPage() {
  const settingsData = await db.select().from(settings);
  const settingsMap = settingsData.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const address = settingsMap.yayasan_address || "Belum diatur";
  const phone = settingsMap.yayasan_phone || "Belum diatur";
  const email = settingsMap.yayasan_email || "Belum diatur";

  return (
    <div className="min-h-screen bg-slate-50">
      
      
      <div className="bg-teal-800 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Hubungi Kami</h1>
          <p className="text-teal-100 text-lg md:text-xl">
            Kami siap mendengar pertanyaan, saran, dan inisiatif kolaborasi dari Anda.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Informasi Kontak</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Alamat Kantor</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {address}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Telepon & WhatsApp</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {phone}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Email</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Jam Operasional Layanan Publik:</h3>
              <p className="text-slate-600">Senin - Jumat: 08.00 - 17.00 WIB</p>
              <p className="text-slate-600">Sabtu & Minggu: Libur (Pesan akan dibalas pada hari kerja)</p>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Kirim Pesan Langsung</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500" placeholder="Nama Anda" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500" placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subjek</label>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option>Pertanyaan Donasi</option>
                    <option>Penawaran Kolaborasi</option>
                    <option>Pelaporan Bug/Masalah</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pesan Anda</label>
                  <textarea rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500" placeholder="Tuliskan pesan Anda di sini..."></textarea>
                </div>
                <button type="submit" className="w-full py-3.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
