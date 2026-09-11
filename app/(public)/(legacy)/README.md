# Public Legacy Routes

Route group `(legacy)` digunakan hanya untuk compatibility route yang masih harus mempertahankan URL lamanya.

## Galeri

URL publik tetap:

`/galeri`

Route tersebut bukan lagi feature publik utama. Route dipertahankan sebagai compatibility path dan diarahkan ke:

`/kegiatan`

Aturan:

- jangan menambahkan feature publik baru di bawah route legacy;
- jangan mengubah URL `/galeri` tanpa keputusan migrasi tersendiri;
- active public documentation/activity content berada pada `/kegiatan`;
- route group `(legacy)` tidak menjadi bagian dari URL Next.js.