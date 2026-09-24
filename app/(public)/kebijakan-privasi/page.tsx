import type {
  Metadata,
} from "next";
import Link from "next/link";

import {
  createPageMetadata,
} from "@/lib/seo-metadata";

export const metadata: Metadata =
  createPageMetadata({
    title:
      "Kebijakan Privasi",
    description:
      "Pelajari cara Yayasan Ruang Sejahtera memproses, menggunakan, menyimpan, melindungi, dan menghapus data pengguna website dan aplikasi Android Ruang Sejahtera.",
    path:
      "/kebijakan-privasi",
  });

export default function KebijakanPrivasiPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white md:text-5xl">
            Kebijakan Privasi
          </h1>

          <p className="mt-4 text-slate-400">
            Terakhir diperbarui: 24 September 2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="prose prose-slate max-w-none">
          <p>
            Kebijakan Privasi ini berlaku
            untuk website Ruang Sejahtera dan
            aplikasi Android Ruang Sejahtera
            yang menampilkan layanan dari
            domain resmi Yayasan Ruang
            Sejahtera.
          </p>

          <p>
            Yayasan memproses data hanya
            sejauh diperlukan untuk
            menyediakan layanan, mengelola
            kegiatan sosial dan kemanusiaan,
            menjaga keamanan sistem,
            memenuhi kebutuhan administrasi,
            serta mempertahankan integritas
            pencatatan organisasi.
          </p>

          <h2>Data yang dapat diproses</h2>

          <p>
            Jenis data bergantung pada fitur
            yang digunakan oleh pengguna.
            Data tersebut dapat mencakup:
          </p>

          <ul>
            <li>
              <strong>data akun</strong>,
              seperti nama, alamat email,
              nomor WhatsApp, status
              verifikasi email, dan
              informasi akun lainnya;
            </li>

            <li>
              <strong>
                data autentikasi dan
                keamanan
              </strong>
              , termasuk hash password, kode
              atau status verifikasi,
              informasi pemulihan akun,
              alamat IP yang diperlukan
              untuk pembatasan percobaan,
              serta catatan audit dan
              keamanan;
            </li>

            <li>
              <strong>data donasi</strong>,
              seperti nama donatur, nominal,
              program atau campaign yang
              dipilih, metode pembayaran,
              bukti transfer, status
              verifikasi, serta pilihan
              anonim;
            </li>

            <li>
              <strong>
                data pengajuan bantuan
              </strong>
              , yang dapat mencakup nama
              calon penerima manfaat,
              hubungan pemohon dengan calon
              penerima, nomor kontak, desa,
              kecamatan, kabupaten, alamat
              rinci, uraian kondisi, nilai
              kebutuhan yang diajukan, foto,
              dan data lain yang dimasukkan
              oleh pengguna;
            </li>

            <li>
              <strong>
                data aktivitas layanan
              </strong>
              , seperti waktu pembuatan atau
              perubahan data, status
              pengajuan, dan aktivitas yang
              diperlukan untuk audit,
              keamanan, serta administrasi.
            </li>
          </ul>

          <p>
            Password asli pengguna tidak
            ditujukan untuk disimpan dalam
            bentuk yang dapat dibaca.
            Sistem menyimpan representasi
            hash password untuk keperluan
            autentikasi.
          </p>

          <h2>Tujuan penggunaan data</h2>

          <p>
            Data dapat digunakan untuk:
          </p>

          <ul>
            <li>
              membuat, memverifikasi, dan
              mengamankan akun pengguna;
            </li>
            <li>
              memproses dan memverifikasi
              donasi;
            </li>
            <li>
              menerima, meninjau, dan
              menindaklanjuti pengajuan
              bantuan;
            </li>
            <li>
              berkomunikasi dengan pengguna
              mengenai layanan yang mereka
              gunakan;
            </li>
            <li>
              menjaga akurasi pencatatan
              kegiatan dan transaksi;
            </li>
            <li>
              mencegah penyalahgunaan,
              spam, percobaan otomatis, atau
              aktivitas yang mengganggu
              keamanan layanan;
            </li>
            <li>
              memenuhi kebutuhan
              administrasi, pembukuan,
              pelaporan, dan audit yayasan.
            </li>
          </ul>

          <h2>
            Donasi dan publikasi nama
          </h2>

          <p>
            Jika donatur memilih opsi
            anonim, nama donatur tidak
            ditujukan untuk ditampilkan
            secara publik. Data internal
            yang diperlukan untuk
            verifikasi, pencatatan,
            pembukuan, atau audit tetap
            dapat dipertahankan sesuai
            kebutuhan yang sah.
          </p>

          <h2>Pengajuan bantuan</h2>

          <p>
            Data alamat rinci, kontak,
            uraian kondisi, dan foto yang
            dikirim melalui pengajuan
            bantuan digunakan untuk proses
            internal penilaian dan
            administrasi. Data yang
            dikirimkan sebagai data internal
            tidak otomatis menjadi media
            publik.
          </p>

          <p>
            Jika suatu pengajuan kemudian
            menjadi bagian dari campaign
            atau publikasi resmi, informasi
            yang dipublikasikan ditentukan
            dalam proses pengelolaan konten
            yayasan dan tidak berarti
            seluruh data internal pengajuan
            dipublikasikan.
          </p>

          <h2>
            Penyedia layanan dan layanan
            pihak ketiga
          </h2>

          <p>
            Untuk menjalankan layanan,
            Yayasan dapat menggunakan
            penyedia infrastruktur,
            penyimpanan media, database,
            pengiriman email, keamanan,
            pencegahan penyalahgunaan, dan
            layanan teknis lain yang
            diperlukan untuk mengoperasikan
            sistem.
          </p>

          <p>
            Konten dari layanan pihak ketiga,
            seperti pemutar video TikTok,
            dapat dimuat ketika pengguna
            memilih untuk menampilkannya.
            Pemrosesan yang dilakukan oleh
            layanan pihak ketiga tersebut
            juga tunduk pada ketentuan dan
            kebijakan penyedia yang
            bersangkutan.
          </p>

          <p>
            Yayasan tidak menjual data
            pribadi pengguna sebagai
            komoditas.
          </p>

          <h2>
            Keamanan dan pembatasan akses
          </h2>

          <p>
            Yayasan berupaya membatasi
            akses terhadap data kepada
            pihak yang memerlukannya untuk
            menjalankan tugas, menerapkan
            autentikasi dan verifikasi pada
            fungsi tertentu, serta
            menggunakan mekanisme keamanan
            untuk mengurangi risiko akses
            atau penggunaan yang tidak sah.
          </p>

          <p>
            Tidak ada sistem elektronik yang
            dapat dijamin bebas sepenuhnya
            dari risiko. Karena itu,
            perlindungan data dilakukan
            secara berkelanjutan sesuai
            kebutuhan dan kemampuan teknis
            layanan.
          </p>

          <h2>Penyimpanan data</h2>

          <p>
            Data disimpan selama masih
            diperlukan untuk memberikan
            layanan, melakukan verifikasi,
            menjaga keamanan, memenuhi
            kebutuhan administrasi,
            pembukuan, pelaporan, audit,
            mempertahankan integritas
            riwayat kegiatan, atau memenuhi
            kewajiban yang berlaku.
          </p>

          <p>
            Periode penyimpanan dapat berbeda
            menurut jenis data dan tujuan
            pemrosesannya. Data yang tidak
            lagi diperlukan akan dihapus,
            dianonimkan, atau tidak lagi
            digunakan secara aktif sesuai
            kebutuhan pengelolaan data.
          </p>

          <h2>
            Penghapusan akun dan data
          </h2>

          <p>
            Pengguna yang memiliki akun dapat
            meminta penghapusan akun melalui
            menu pengelolaan akun di layanan
            Ruang Sejahtera atau melalui
            halaman publik{" "}
            <Link
              href="/hapus-akun"
              className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2"
            >
              Penghapusan Akun
            </Link>
            .
          </p>

          <p>
            Setelah permintaan yang valid
            diproses, data akun dan
            autentikasi yang tidak lagi
            diperlukan akan dihapus atau
            dianonimkan. Sebagian data dapat
            tetap dipertahankan apabila
            diperlukan untuk pembukuan,
            audit, keamanan, pencegahan
            penyalahgunaan, pemenuhan
            kewajiban hukum, atau menjaga
            integritas riwayat transaksi
            dan kegiatan.
          </p>

          <h2>Hak dan permintaan pengguna</h2>

          <p>
            Pengguna dapat menghubungi
            Yayasan untuk meminta
            penjelasan, koreksi terhadap data
            yang tidak tepat, atau
            penghapusan data sejauh
            penghapusan tersebut tidak
            bertentangan dengan kebutuhan
            penyimpanan yang sah.
          </p>

          <h2>Notifikasi Push</h2>
          <p>
            Ruang Sejahtera dapat menyediakan notifikasi push untuk
            menyampaikan pembaruan layanan, seperti perubahan status donasi,
            pengajuan bantuan, jadwal pelaksanaan, atau informasi layanan lain
            yang berkaitan langsung dengan aktivitas pengguna.
          </p>
          <p>
            Notifikasi push hanya diaktifkan setelah pengguna secara sadar
            memilih untuk mengaktifkannya dan memberikan izin melalui browser,
            peramban, atau perangkat yang digunakan. Ruang Sejahtera tidak
            meminta izin notifikasi secara otomatis saat halaman pertama kali
            dibuka.
          </p>
          <p>
            Untuk mengirim notifikasi, sistem dapat memproses data teknis
            subscription push, termasuk endpoint layanan push, pengidentifikasi
            subscription, serta kunci teknis yang diperlukan untuk pengiriman
            pesan secara aman. Data tersebut digunakan untuk pengiriman dan
            pengelolaan notifikasi layanan, bukan untuk menampilkan informasi
            pribadi pada layar notifikasi atau untuk tujuan periklanan.
          </p>
          <p>
            Endpoint dan data subscription dapat berkaitan dengan browser,
            perangkat, sistem operasi, atau layanan push yang digunakan oleh
            pengguna. Penyedia browser, sistem operasi, atau layanan push dapat
            memproses data teknis yang diperlukan agar pesan dapat dikirim ke
            perangkat pengguna sesuai mekanisme layanan mereka.
          </p>
          <p>
            Pengguna dapat menonaktifkan notifikasi melalui pengaturan yang
            tersedia pada layanan Ruang Sejahtera atau mencabut izin notifikasi
            melalui pengaturan browser atau perangkat. Setelah dinonaktifkan,
            sistem tidak lagi menggunakan subscription tersebut untuk
            pengiriman notifikasi baru, kecuali sejauh data teknis tertentu
            masih perlu dipertahankan sementara untuk keamanan, pencegahan
            penyalahgunaan, pencatatan teknis, atau pemenuhan kewajiban yang
            berlaku.
          </p>
<h2>Kontak</h2>

          <p>
            Pertanyaan mengenai privasi,
            penggunaan data, atau
            penghapusan akun dapat
            disampaikan melalui kanal resmi
            pada halaman{" "}
            <Link
              href="/kontak"
              className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2"
            >
              Kontak
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
