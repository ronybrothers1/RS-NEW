import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ketentuan Donasi",
  description:
    "Ketentuan penggunaan layanan donasi Yayasan Ruang Sejahtera.",
  alternates: {
    canonical: "/ketentuan-donasi",
  },
};

export default function KetentuanDonasiPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white">
            Ketentuan Donasi
          </h1>
          <p className="mt-4 text-slate-400">
            Terakhir diperbarui: 8 September 2026
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="prose prose-slate max-w-none">
          <p>
            Halaman donasi Yayasan Ruang Sejahtera digunakan untuk mencatat
            dukungan masyarakat terhadap program sosial yang tersedia pada
            website.
          </p>

          <h2>Rekening resmi</h2>
          <p>
            Donatur diminta melakukan transfer hanya ke rekening yang
            ditampilkan pada halaman donasi resmi. Jika tidak ada rekening
            yang tersedia, tombol pengiriman donasi akan dinonaktifkan.
          </p>

          <h2>Verifikasi</h2>
          <p>
            Pengiriman formulir bukan merupakan konfirmasi otomatis bahwa dana
            telah diterima. Bukti transfer akan diperiksa oleh pengurus sebelum
            status donasi dinyatakan berhasil atau dicatat sebagai penerimaan.
          </p>

          <h2>Pilihan program</h2>
          <p>
            Donatur dapat memilih program yang tersedia. Pengelolaan dan
            pelaporan dana dilakukan melalui sistem pencatatan yayasan dan
            ditampilkan pada bagian transparansi sesuai data yang telah
            diverifikasi.
          </p>

          <h2>Donasi anonim</h2>
          <p>
            Donatur dapat memilih untuk tidak menampilkan namanya secara
            publik. Pilihan anonim tidak menghilangkan kebutuhan pencatatan
            internal yang diperlukan untuk proses verifikasi.
          </p>

          <h2>Koreksi informasi</h2>
          <p>
            Jika terdapat kekeliruan pada nominal, program, identitas, atau
            bukti transfer yang dikirimkan, donatur dapat menghubungi pengurus
            melalui kanal resmi pada halaman Kontak.
          </p>
        </div>
      </section>
    </main>
  );
}
