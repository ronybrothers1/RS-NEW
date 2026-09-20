import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";

import {
  getCachedPublicFinance,
} from "@/lib/public-finance";
import {
  getCachedPublicCashbook,
} from "@/lib/public-cashbook-cache";

type TransparencyContentProps = {
  q?: string | string[];
  page?: string | string[];
};

const primary3dButton =
  "public-cta-3d inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-300 focus-visible:ring-offset-2";

const secondary3dButton =
  "public-cta-3d-secondary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2";

function getFirstParam(
  value:
    | string
    | string[]
    | undefined,
) {
  return Array.isArray(
    value,
  )
    ? value[0]
    : value;
}

const currencyFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",
      currency:
        "IDR",
      maximumFractionDigits:
        0,
    },
  );

const dateFormatter =
  new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      timeZone:
        "Asia/Jakarta",
    },
  );

function formatCurrency(
  value: number,
) {
  return currencyFormatter.format(
    value,
  );
}

function formatDate(
  value: Date,
) {
  return dateFormatter.format(
    value,
  );
}

function buildCashbookHref({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (query) {
    params.set(
      "q",
      query,
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(
        page,
      ),
    );
  }

  return `/transparansi?${params.toString()}`;
}

export default async function TransparencyPageContent({
  q,
  page,
}: TransparencyContentProps) {

  const [
    cashbook,
    finance,
  ] =
    await Promise.all([
      getCachedPublicCashbook({
        query:
          getFirstParam(
            q,
          ),
        page:
          getFirstParam(
            page,
          ),
      }),
      getCachedPublicFinance().then(
        (cached) =>
          cached.finance,
      ),
    ]);

  const {
    pagination,
  } =
    cashbook;

  const firstVisible =
    pagination.totalItems === 0
      ? 0
      : (
          pagination.currentPage -
          1
        ) *
          pagination.pageSize +
        1;

  const lastVisible =
    Math.min(
      pagination.currentPage *
        pagination.pageSize,
      pagination.totalItems,
    );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <section className="border-b border-brand-900 bg-brand-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-citrus-300 sm:text-sm">
              Transparansi Keuangan
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              BUKU KAS
              <span className="block text-citrus-300">
                RUANG SEJAHTERA
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-100 sm:text-base">
              Catatan penerimaan, pengeluaran, dan posisi saldo kas yang disajikan berdasarkan transaksi yang tercatat di sistem.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section
          className="overflow-hidden rounded-3xl border border-frame bg-white shadow-sm"
          aria-labelledby="cashbook-heading"
        >
          <div className="border-b border-frame bg-brand-50 px-5 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                  Buku Kas Ruang Sejahtera
                </p>

                <h2
                  id="cashbook-heading"
                  className="mt-1 text-xl font-extrabold text-brand-950 sm:text-2xl"
                >
                  Periode {cashbook.period.label}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
                <div className="rounded-2xl border border-brand-100 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Periode
                  </p>
                  <p className="mt-1 font-bold text-brand-950">
                    {cashbook.period.label}
                  </p>
                </div>

                <div className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Saldo Awal
                  </p>
                  <p className="mt-1 font-extrabold text-brand-950">
                    {formatCurrency(
                      cashbook.openingBalance,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="overflow-hidden rounded-2xl border border-frame bg-white">
                <div className="border-b border-frame px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                      <Wallet className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-ink">
                        Rekonsiliasi Saldo Kas
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
                        Arus kas bulan {cashbook.period.label}.
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="divide-y divide-frame">
                  <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                    <dt className="text-sm text-ink-muted">
                      Saldo awal bulan {cashbook.period.label}
                    </dt>
                    <dd className="shrink-0 font-bold text-ink">
                      {formatCurrency(
                        cashbook.openingBalance,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                    <dt className="text-sm text-ink-muted">
                      Penerimaan bulan {cashbook.period.label}
                    </dt>
                    <dd className="shrink-0 font-bold text-emerald-700">
                      {formatCurrency(
                        cashbook.cashIn,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                    <dt className="text-sm text-ink-muted">
                      Pengeluaran bulan {cashbook.period.label}
                    </dt>
                    <dd className="shrink-0 font-bold text-rose-700">
                      {formatCurrency(
                        cashbook.cashOut,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 bg-brand-50 px-5 py-4 sm:px-6">
                    <dt className="font-bold text-brand-950">
                      Sisa saldo bulan {cashbook.period.label}
                    </dt>
                    <dd className="shrink-0 text-lg font-extrabold text-brand-800">
                      {formatCurrency(
                        cashbook.closingBalance,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
                <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      Total Penerimaan
                    </p>
                    <p className="mt-1 truncate font-extrabold text-ink">
                      {formatCurrency(
                        finance.totalIncome,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">
                      Total Pengeluaran
                    </p>
                    <p className="mt-1 truncate font-extrabold text-ink">
                      {formatCurrency(
                        finance.totalExpense,
                      )}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-6 rounded-3xl border border-frame bg-white p-5 shadow-sm sm:p-6"
          aria-label="Filter Buku Kas"
        >
          <form
            method="get"
            action="/transparansi"
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div>
              <label
                htmlFor="cashbook-search"
                className="mb-2 block text-sm font-semibold text-ink"
              >
                Cari transaksi
              </label>

              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                />

                <input
                  id="cashbook-search"
                  type="search"
                  name="q"
                  maxLength={120}
                  defaultValue={
                    cashbook.query
                  }
                  placeholder="Cari Nomor Bukti atau Uraian"
                  className="min-h-11 w-full rounded-xl border border-frame bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-stone-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <button
                type="submit"
                className={
                  primary3dButton
                }
              >
                <Search className="h-4 w-4" />
                Terapkan
              </button>

              <Link
                href="/transparansi"
                className={
                  secondary3dButton
                }
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Link>

            </div>
          </form>
        </section>

        <section
          className="mt-6 overflow-hidden rounded-3xl border border-frame bg-white shadow-sm"
          aria-labelledby="ledger-heading"
        >
          <div className="flex flex-col gap-3 border-b border-frame px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                Ledger Kas
              </p>

              <h2
                id="ledger-heading"
                className="mt-1 text-xl font-extrabold text-ink"
              >
                Riwayat Transaksi
              </h2>

              <p className="mt-1 text-sm text-ink-muted">
                Periode {cashbook.period.label}
                {cashbook.query
                  ? ` · Hasil pencarian “${cashbook.query}”`
                  : ""}
              </p>
            </div>

            <p className="text-sm font-medium text-ink-muted">
              Menampilkan{" "}
              <span className="font-bold text-ink">
                {firstVisible}–{lastVisible}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-ink">
                {pagination.totalItems}
              </span>{" "}
              transaksi
            </p>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[940px] text-left text-sm">
              <caption className="sr-only">
                Buku Kas Ruang Sejahtera periode {cashbook.period.label}
              </caption>

              <thead className="border-b border-brand-900 bg-brand-950 text-xs font-bold uppercase tracking-wide text-brand-100">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-5 py-4 lg:px-6">
                    Nomor Bukti
                  </th>

                  <th scope="col" className="whitespace-nowrap px-5 py-4">
                    Tanggal
                  </th>

                  <th scope="col" className="min-w-[260px] px-5 py-4">
                    Uraian
                  </th>

                  <th scope="col" className="whitespace-nowrap px-5 py-4 text-right">
                    Penerimaan
                  </th>

                  <th scope="col" className="whitespace-nowrap px-5 py-4 text-right">
                    Pengeluaran
                  </th>

                  <th scope="col" className="whitespace-nowrap px-5 py-4 text-right lg:px-6">
                    Saldo
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-frame">
                {cashbook.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-14 text-center"
                    >
                      <BookOpen className="mx-auto h-9 w-9 text-brand-200" />

                      <p className="mt-3 font-semibold text-ink">
                        Belum ada transaksi yang dapat ditampilkan.
                      </p>

                      <p className="mt-1 text-sm text-ink-muted">
                        Ubah periode atau kata pencarian untuk melihat data lainnya.
                      </p>
                    </td>
                  </tr>
                ) : (
                  cashbook.rows.map(
                    (row) => (
                      <tr
                        key={row.id}
                        className="align-top transition-colors hover:bg-brand-50/60"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-brand-800 lg:px-6">
                          {row.receiptNumber}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-ink-muted">
                          {formatDate(
                            row.date,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium leading-6 text-ink">
                            {row.uraian}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-emerald-700">
                          {row.income > 0
                            ? formatCurrency(
                                row.income,
                              )
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-rose-700">
                          {row.expense > 0
                            ? formatCurrency(
                                row.expense,
                              )
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-brand-950 lg:px-6">
                          {formatCurrency(
                            row.balance,
                          )}
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-frame md:hidden">
            {cashbook.rows.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <BookOpen className="mx-auto h-9 w-9 text-brand-200" />

                <p className="mt-3 font-semibold text-ink">
                  Belum ada transaksi yang dapat ditampilkan.
                </p>

                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Ubah periode atau kata pencarian untuk melihat data lainnya.
                </p>
              </div>
            ) : (
              cashbook.rows.map(
                (row) => (
                  <article
                    key={row.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs font-bold text-brand-800">
                          {row.receiptNumber}
                        </p>

                        <p className="mt-1 text-xs text-ink-muted">
                          {formatDate(
                            row.date,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-brand-50 px-3 py-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                          Saldo
                        </p>

                        <p className="mt-0.5 text-sm font-extrabold text-brand-950">
                          {formatCurrency(
                            row.balance,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                        Uraian
                      </p>

                      <p className="mt-1 text-sm font-medium leading-6 text-ink">
                        {row.uraian}
                      </p>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                          Penerimaan
                        </dt>

                        <dd className="mt-1 text-sm font-bold text-emerald-700">
                          {row.income > 0
                            ? formatCurrency(
                                row.income,
                              )
                            : "—"}
                        </dd>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-rose-800">
                          Pengeluaran
                        </dt>

                        <dd className="mt-1 text-sm font-bold text-rose-700">
                          {row.expense > 0
                            ? formatCurrency(
                                row.expense,
                              )
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ),
              )
            )}
          </div>

          <div className="border-t border-frame bg-surface-muted px-5 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-ink-muted sm:text-sm">
                Data diperbarui mengikuti transaksi yang telah tercatat di sistem.
              </p>

              {pagination.totalPages > 1 && (
                <nav
                  aria-label="Navigasi halaman Buku Kas"
                  className="flex items-center gap-2"
                >
                  {pagination.currentPage > 1 ? (
                    <Link
                      href={buildCashbookHref({
                        query:
                          cashbook.query,
                        page:
                          pagination.currentPage -
                          1,
                      })}
                      prefetch={false}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-[0_3px_0_#d6d3d1] transition-[transform,box-shadow,background-color] hover:bg-brand-50 active:translate-y-[1px] active:shadow-[0_1px_0_#d6d3d1]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Link>
                  ) : null}

                  <span className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-brand-950 px-3 py-2 text-sm font-bold text-white">
                    {pagination.currentPage}
                    <span className="sr-only">
                      {" "}dari {pagination.totalPages}
                    </span>
                  </span>

                  {pagination.currentPage < pagination.totalPages ? (
                    <Link
                      href={buildCashbookHref({
                        query:
                          cashbook.query,
                        page:
                          pagination.currentPage +
                          1,
                      })}
                      prefetch={false}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-[0_3px_0_#d6d3d1] transition-[transform,box-shadow,background-color] hover:bg-brand-50 active:translate-y-[1px] active:shadow-[0_1px_0_#d6d3d1]"
                    >
                      Berikutnya
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </nav>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}