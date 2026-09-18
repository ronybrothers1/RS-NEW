# Admin Legacy Routes

Route group `(legacy)` digunakan untuk subsystem internal lama yang masih dipertahankan tanpa memasukkannya ke hierarchy navigasi Admin utama.

## Galeri

URL internal arsip tetap:

`/admin/galeri`

Route lama:

`/admin/galeri/tambah`

tetap dikenali untuk compatibility, tetapi diarahkan kembali ke halaman arsip Galeri.

Galeri telah dinonaktifkan sebagai fitur operasional. Data lama dipertahankan sebagai arsip read-only dan dokumentasi baru harus dikelola melalui modul Kegiatan.

Aturan:

- database dan tabel `gallery` tidak dihapus;
- data Galeri lama tidak dimodifikasi atau dihapus oleh proses retirement;
- `/admin/galeri` hanya menampilkan data lama secara read-only;
- `/admin/galeri/tambah` tidak lagi menyediakan form input;
- server action Galeri menolak create, delete, dan perubahan status publikasi;
- `/galeri` publik tetap mengikuti redirect yang sudah ada ke `/kegiatan`;
- Galeri tidak menjadi bagian dari navigasi Admin utama;
- dokumentasi baru dikelola melalui modul Kegiatan;
- route group `(legacy)` tidak menjadi bagian dari URL Next.js.