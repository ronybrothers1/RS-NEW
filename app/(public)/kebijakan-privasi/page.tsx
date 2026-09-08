import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi penggunaan website Yayasan Ruang Sejahtera.",
};

export default function KebijakanPrivasiPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white">
            Kebijakan Privasi
          </h1>
          <p className="mt-4 text-slate-400">
            Terakhir diperbarui: 8 September 2026
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="prose prose-slate max-w-none">
          <p>
            Yayasan Ruang Sejahtera menggunakan data yang diberikan melalui
            website hanya untuk menjalankan layanan yang berkaitan dengan
            kegiatan yayasan, termasuk administrasi donasi, verifikasi bukti
            transfer, komunikasi, dan pencatatan internal.
          </p>

          <h2>Data yang dapat diproses</h2>
          <p>
            Bergantung pada layanan yang digunakan, data dapat mencakup nama
            donatur, nominal donasi, pilihan program, metode pembayaran,
            bukti transfer, serta informasi lain yang secara sadar dikirimkan
            oleh pengguna.
          </p>

          <h2>Tujuan penggunaan</h2>
          <p>
            Data digunakan untuk memverifikasi transaksi, mengelola kegiatan
            dan laporan yayasan, menjaga akurasi pencatatan, menindaklanjuti
            permintaan pengguna, serta memenuhi kebutuhan administrasi dan
            audit internal.
          </p>

          <h2>Publikasi nama donatur</h2>
          <p>
            Jika donatur memilih opsi anonim, nama tidak ditujukan untuk
            ditampilkan secara publik. Informasi internal tetap dapat disimpan
            sejauh diperlukan untuk proses verifikasi dan administrasi.
          </p>

          <h2>Keamanan dan penyimpanan</h2>
          <p>
            Yayasan berupaya membatasi akses terhadap data kepada pihak yang
            memang memerlukannya untuk menjalankan tugas. Data disimpan selama
            masih diperlukan untuk administrasi, verifikasi, pelaporan, atau
            kepentingan organisasi yang sah.
          </p>

          <h2>Kontak</h2>
          <p>
            Pertanyaan mengenai data pribadi dapat disampaikan melalui kanal
            resmi yang tercantum pada halaman Kontak.
          </p>
        </div>
      </section>
    </main>
  );
}
