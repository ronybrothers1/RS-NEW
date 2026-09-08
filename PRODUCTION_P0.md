# RS-NEW — Production P0

Paket ini menutup masalah kode P0 yang dapat diperbaiki tanpa akses langsung ke akun Vercel/database.

## Environment Vercel yang wajib

Minimal:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Untuk operasi skema database disarankan juga:

- `DATABASE_ADMIN_URL`

Untuk bootstrap admin pertama:

- `ADMIN_DEFAULT_PASSWORD`

`DATABASE_URL` sebaiknya berasal dari PostgreSQL managed yang dapat diakses dari Vercel dan menggunakan koneksi SSL.

## Urutan aktivasi database

```bash
bun install
bun run db:push
bun run db:seed
bun run typecheck
bun run build
```

Untuk workflow migration yang lebih disiplin setelah production aktif:

```bash
bun run db:generate
bun run db:migrate
```

## Setelah login admin

Buka menu Pengaturan lalu isi:

- nama yayasan
- alamat
- email publik
- nomor WhatsApp/telepon
- rekening donasi yang benar-benar digunakan
- URL media sosial resmi

Lalu input program aktif agar beranda dan form donasi tidak kosong.

## Perubahan P0 yang sudah tercakup

1. `DATABASE_URL` dan `DATABASE_ADMIN_URL` didukung.
2. Koneksi legacy `SQL_*` tetap dipertahankan sebagai fallback.
3. Script Drizzle/typecheck ditambahkan.
4. Domain sitemap/robots/metadata tidak lagi hard-coded.
5. Logo yang hilang tidak lagi menghasilkan broken image.
6. Form kontak palsu dihapus dan diganti kanal WhatsApp/email yang benar-benar berfungsi.
7. Link media sosial `#` dihilangkan; hanya tampil jika sudah dikonfigurasi.
8. Halaman Kebijakan Privasi dan Ketentuan Donasi dibuat.
9. Kedua halaman legal dimasukkan ke sitemap.
