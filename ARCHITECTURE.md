# RS-NEW — Architecture Conventions

Dokumen ini menetapkan konvensi struktur resmi proyek RS-NEW.

## 1. Source organization

Application source menggunakan folder root:

- app/
- components/
- hooks/
- lib/
- public/
- scripts/

Folder src/db/ adalah intentional database infrastructure boundary.

Keberadaan src/db/ tidak berarti seluruh application source harus berada di bawah src/.
src/db/ tidak boleh dianggap sebagai partial migration yang belum selesai.

src/db/ hanya memiliki ownership untuk:

- database connection;
- Drizzle schema;
- Drizzle configuration;
- database infrastructure.

Business feature tidak ditempatkan di src/db/.

## 2. Route naming

Product-facing route menggunakan Bahasa Indonesia.

Contoh:

- /program
- /kegiatan
- /berita
- /bantuan
- /donasi
- /akun/pengajuan
- /admin/keuangan
- /admin/berita/tulis

Istilah route boleh domain-specific.
/admin/berita/tulis adalah intentional naming dan tidak perlu diubah menjadi /tambah hanya demi keseragaman.

## 3. Internal engineering naming

Technical abstraction boleh menggunakan Bahasa Inggris.

Contoh:

- assistance
- article
- donation
- finance
- email-verification
- current-authz

Perbedaan antara route Bahasa Indonesia dan internal engineering terminology adalah intentional layer boundary.
Mass rename tidak dilakukan tanpa manfaat struktural nyata.

## 4. Components

Global reusable component berada di components/.
Feature-specific component diletakkan dekat feature masing-masing.

## 5. Route boundaries

- Public routes: app/(public)/
- Admin routes: app/admin/
- API routes: app/api/
- Compatibility routes: route group (legacy)

Route group (legacy) digunakan agar status compatibility route eksplisit tanpa mengubah URL.

## 6. Maintenance tooling

Operational dan maintenance scripts berada di scripts/.
Historical one-off maintenance scripts berada di scripts/maintenance/.

Active project entry point yang memang direferensikan package script tidak dipindahkan hanya demi keseragaman.

## 7. Structural safety

Structural refactor tidak boleh sekaligus mengubah:

- business logic;
- authentication atau RBAC;
- database schema atau data;
- financial behavior;
- donation behavior;
- assistance behavior;
- route semantics.

Variasi struktur dengan ownership dan alasan yang jelas adalah acceptable variation.
Tujuan struktur adalah clear ownership, predictable location, coherent hierarchy, dan safe expansion.
