# Admin Legacy Routes

Route group `(legacy)` digunakan untuk subsystem internal lama yang masih dipertahankan tanpa memasukkannya ke hierarchy navigasi Admin utama.

## Galeri

URL internal tetap:

`/admin/galeri`

dan:

`/admin/galeri/tambah`

Gallery Admin dipertahankan untuk compatibility dan maintenance data yang sudah ada.

Aturan:

- route tetap tersedia;
- action Galeri tetap dipertahankan;
- database dan tabel Gallery tidak diubah;
- Galeri tidak menjadi bagian dari navigasi Admin utama;
- jangan memperluas subsystem ini sebagai feature baru tanpa keputusan arsitektural tersendiri;
- route group `(legacy)` tidak menjadi bagian dari URL Next.js.