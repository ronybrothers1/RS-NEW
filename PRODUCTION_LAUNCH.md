# RS-NEW — Production Launch Readiness

Dokumen ini menjadi checklist operasional setelah Fase 10.

## Gate otomatis

Sebelum deployment produksi dianggap siap:

```bash
npm run typecheck
npm run qa:launch
npm run build
```

Runtime acceptance juga harus memastikan:

- `/` HTTP 200.
- `/donasi` HTTP 200.
- `/bantuan` HTTP 200.
- `/transparansi` HTTP 200.
- `/api/health` HTTP 200 dan database `ok`.
- route admin tetap mengarahkan guest ke login.
- `/galeri` tetap redirect permanen ke `/kegiatan`.
- security headers tetap aktif.

## Urutan aman migrasi bukti donasi lama

Kode Fase 10 harus dideploy terlebih dahulu. Migrasi bukti lama dijalankan setelah deployment Fase 10 berstatus SUCCESS agar database tidak menunjuk private Blob sebelum production memiliki proxy private-media.

Setelah deployment SUCCESS:

```bash
npx tsx scripts/migrate-donation-proofs-private.ts
```

Script bersifat idempotent: record yang sudah private dilewati.

## Privasi media

Foto pengajuan bantuan dan bukti transfer donasi menggunakan private Vercel Blob.

Bukti transfer hanya ditampilkan kepada ADMIN/OPERATOR melalui proxy terautentikasi:

`/api/admin/donasi/[id]/proof`

Jangan mengubah bukti transfer kembali menjadi public Blob.

## Environment produksi

Wajib:

- `DATABASE_URL` atau fallback `SQL_*`.
- `AUTH_SECRET`.
- `ASSISTANCE_READ_WRITE_TOKEN`.
- `RESEND_API_KEY`.
- `EMAIL_FROM`.
- `NEXT_PUBLIC_SITE_URL` saat domain utama resmi dipindahkan.

PostgreSQL disarankan memakai `sslmode=verify-full` secara eksplisit.

## Email

Sebelum registrasi publik diumumkan:

1. Domain `ruangsejahtera.web.id` harus berstatus **verified** di Resend.
2. `EMAIL_FROM` harus memakai domain tersebut, bukan `onboarding@resend.dev`.
3. Lakukan satu registrasi uji dan pastikan OTP benar-benar diterima.

## Domain utama

Migrasi domain utama dilakukan setelah semua gate di atas PASS.

Urutan:

1. Pastikan deployment commit launch berstatus SUCCESS.
2. Set `NEXT_PUBLIC_SITE_URL=https://www.ruangsejahtera.web.id`.
3. Hubungkan domain ke project Vercel RS-NEW.
4. Pastikan HTTPS valid.
5. Uji `robots.txt`, `sitemap.xml`, canonical metadata, login, donasi, dan `/api/health`.
6. Baru arahkan trafik publik sepenuhnya.

## Monitoring

Endpoint:

`GET /api/health`

Response 200 berarti aplikasi dapat berkomunikasi dengan database. Endpoint menggunakan `no-store` dan tidak mempublikasikan secret.

Pantau:

- HTTP 5xx.
- kegagalan health check.
- kegagalan email verifikasi.
- error upload private Blob.
- lonjakan donasi PENDING.
- saldo kampanye negatif (harus selalu nol kejadian).

## Backup dan rollback

Sebelum perubahan besar:

- simpan commit Git terakhir yang stabil;
- pastikan backup database managed PostgreSQL tersedia;
- jangan menghapus transaksi historis untuk rollback;
- rollback aplikasi dilakukan melalui deployment/commit sebelumnya, bukan dengan mengubah ledger secara manual.

Commit stabil sebelum Fase 10:

`a5b2aa270aff77b10b1bc76c26b7156bc18bb116`

## Residual technical debt

Rate limiter aplikasi masih bersifat in-memory per instance. Untuk trafik yayasan saat ini ini berfungsi sebagai perlindungan best-effort, tetapi jika trafik atau abuse meningkat, pindahkan rate limiting ke mekanisme persistent/shared atau Vercel Firewall yang sesuai dengan paket yang digunakan.
