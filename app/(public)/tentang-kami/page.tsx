export const revalidate = 60;

import { HeartHandshake, ShieldCheck, Target, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      
      
      <div className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Membangun Harapan, Mewujudkan Kesejahteraan</h1>
          <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
            Yayasan Ruang Sejahtera adalah lembaga non-profit yang berdedikasi untuk meningkatkan kualitas hidup masyarakat melalui program sosial, pendidikan, dan kemanusiaan.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Visi & Misi</h2>
            <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
              <p>
                <strong>Visi:</strong> Menjadi jembatan kebaikan yang terpercaya dalam mewujudkan masyarakat yang berdaya, mandiri, dan sejahtera.
              </p>
              <ul className="space-y-4 list-none">
                <li className="flex gap-3">
                  <Target className="h-6 w-6 text-teal-600 shrink-0" />
                  <span>Meningkatkan akses pendidikan bagi anak-anak dari keluarga kurang mampu.</span>
                </li>
                <li className="flex gap-3">
                  <Target className="h-6 w-6 text-teal-600 shrink-0" />
                  <span>Memberikan respons cepat tanggap terhadap bencana alam dan krisis kemanusiaan.</span>
                </li>
                <li className="flex gap-3">
                  <Target className="h-6 w-6 text-teal-600 shrink-0" />
                  <span>Memberdayakan ekonomi masyarakat kecil melalui bantuan modal dan pembinaan.</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-slate-200">
            <Image
              src="/images/tentang-kami/tim-ruang-sejahtera.jpg"
              alt="Tim Yayasan Ruang Sejahtera"
              fill
              priority
              sizes="(max-width: 767px) calc(100vw - 2rem), 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Nilai Inti Kami</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Kami berpegang teguh pada prinsip-prinsip untuk menjaga amanah donatur dan memastikan setiap bantuan tepat sasaran.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 mb-24">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Transparan</h3>
            <p className="text-slate-600">Seluruh laporan keuangan dan operasional dibuka secara transparan kepada publik.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Inklusif</h3>
            <p className="text-slate-600">Bantuan disalurkan tanpa memandang latar belakang suku, agama, ras, dan golongan.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HeartHandshake className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Amanah</h3>
            <p className="text-slate-600">Berkomitmen penuh menyalurkan donasi 100% sesuai dengan peruntukan programnya.</p>
          </div>
        </div>

        <div className="bg-teal-50 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Mari Menjadi Bagian dari Perubahan</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-8">Dukungan Anda sangat berarti bagi mereka yang membutuhkan. Mulailah berbagi kebaikan hari ini.</p>
          <Link href="/donasi" className="inline-flex items-center justify-center px-8 py-3.5 bg-teal-700 text-white font-medium rounded-full hover:bg-teal-800 transition-colors shadow-lg hover:shadow-xl">
            Donasi Sekarang
          </Link>
        </div>
        <div className="mt-12 border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-500">
            Website Yayasan Ruang Sejahtera dibuat dan dikembangkan oleh
          </p>
          <p className="mt-1 font-semibold text-slate-700">
            Imam Sahroni Darmawan, S.T
          </p>
        </div>
      </div>
    </div>
  );
}
