export const revalidate = 60;

import { HeartHandshake, Landmark, ShieldCheck, Target, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata = createPageMetadata({
  title: "Tentang Kami",
  description:
    "Kenali visi, misi, legalitas, maksud dan tujuan, nilai, serta komitmen Yayasan Ruang Sejahtera Indonesia di bidang sosial, kemanusiaan, dan keagamaan.",
  path: "/tentang-kami",
});

const legalDetails = [
  {
    label: "Nama Yayasan",
    value: "Yayasan Ruang Sejahtera Indonesia",
    featured: true,
  },
  {
    label: "Nomor SK Menkumham",
    value: "AHU-0032818.AH.01.04.Tahun 2025",
  },
  {
    label: "Tanggal Pengesahan",
    value: "31 Desember 2025",
  },
  {
    label: "Nomor Akta Notaris",
    value: "01",
  },
  {
    label: "Tanggal Akta",
    value: "29 Desember 2025",
  },
  {
    label: "Notaris",
    value: "Yuni Safitri, S.H., M.Kn. (Sampang)",
  },
  {
    label: "Kedudukan",
    value: "Kabupaten Sampang, Provinsi Jawa Timur",
  },
  {
    label: "Kekayaan Awal",
    value: "Rp 10.000.000",
  },
  {
    label: "Nomor Daftar Yayasan",
    value: "AHU-0050270.AH.01.12.Tahun 2025",
  },
];

const purposeAreas = [
  {
    title: "Bidang Sosial",
    icon: Users,
    iconClass:
      "bg-teal-50 text-teal-700 ring-teal-100",
    bulletClass: "bg-teal-600",
    items: [
      "Kerja sama dengan lembaga atau Yayasan lainnya yang memiliki tujuan yang sama",
      "Menyelenggarakan kegiatan sosial (bhakti sosial) membantu masyarakat sekitar",
      "Lembaga formal dan non formal",
      "Menyelenggarakan kegiatan sosial lainnya yang bermanfaat bagi masyarakat",
      "Panti asuhan, panti jompo, dan panti wreda",
      "Studi banding",
    ],
  },
  {
    title: "Bidang Kemanusiaan",
    icon: HeartHandshake,
    iconClass:
      "bg-amber-50 text-amber-700 ring-amber-100",
    bulletClass: "bg-amber-500",
    items: [
      "Memberi bantuan kepada korban bencana alam",
      "Memberi bantuan kepada tunawisma, fakir miskin, dan gelandangan",
      "Penghimpunan dana dan donasi untuk program sosial",
      "Menyalurkan bantuan sosial (sandang, pangan, papan)",
      "Memberikan bantuan kepada pengungsi akibat perang",
      "Menyelenggarakan kegiatan di bidang jasa atau kewirausahaan",
      "Mendirikan dan menyelenggarakan rumah singgah dan rumah duka",
      "Melestarikan lingkungan hidup",
    ],
  },
  {
    title: "Bidang Keagamaan",
    icon: Landmark,
    iconClass:
      "bg-indigo-50 text-indigo-700 ring-indigo-100",
    bulletClass: "bg-indigo-500",
    items: [
      "Mendirikan sarana ibadah",
      "Menyelenggarakan sarana peribadahan dan pendidikan keagamaan",
      "Meningkatkan pemahaman keagamaan",
      "Penyuluhan keagamaan",
      "Menerima dan menyalurkan amal zakat, infaq, dan sedekah",
      "Studi banding keagamaan",
      "Santunan Yatim Piatu dan Dhuafa",
    ],
  },
];

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

        <section
          className="mb-24"
          aria-labelledby="legalitas-heading"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
              <ShieldCheck className="h-4 w-4" />
              Legalitas Yayasan
            </div>

            <h2
              id="legalitas-heading"
              className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
            >
              Identitas dan Legalitas
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Informasi pendirian dan pengesahan Yayasan Ruang Sejahtera Indonesia sebagai bagian dari keterbukaan informasi kepada masyarakat.
            </p>
          </div>

          <dl className="mt-10 grid gap-4 sm:grid-cols-2">
            {legalDetails.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
                  item.featured
                    ? "border-teal-200 bg-teal-50 sm:col-span-2"
                    : "border-slate-200 bg-white"
                }`}
              >
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {item.label}
                </dt>

                <dd
                  className={`mt-2 break-words leading-7 ${
                    item.featured
                      ? "text-xl font-bold text-teal-950 sm:text-2xl"
                      : "text-base font-semibold text-slate-900"
                  }`}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="mb-24 overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12"
          aria-labelledby="maksud-tujuan-heading"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">
              Maksud & Tujuan
            </p>

            <h2
              id="maksud-tujuan-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
            >
              Ruang Lingkup Kegiatan Yayasan
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Bergerak di bidang sosial, kemanusiaan, dan keagamaan.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {purposeAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article
                  key={area.title}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${area.iconClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {area.title}
                  </h3>

                  <ul className="mt-5 space-y-3">
                    {area.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-6 text-slate-600"
                      >
                        <span
                          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${area.bulletClass}`}
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

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
          <Link href="/donasi" className="public-cta-3d inline-flex min-h-12 items-center justify-center px-8 py-3.5 font-bold">
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
