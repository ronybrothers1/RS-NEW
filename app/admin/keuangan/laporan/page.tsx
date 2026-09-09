import {
  CalendarDays,
  CalendarRange,
  FileDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getJakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function LaporanKeuanganPage() {
  const today = getJakartaToday();
  const currentMonth = `${today.year}-${pad(today.month)}`;
  const firstDay = `${currentMonth}-01`;
  const currentDay = `${currentMonth}-${pad(today.day)}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">
          Keuangan
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
          Laporan Keuangan PDF
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Unduh laporan langsung dari ledger keuangan berdasarkan bulan, tahun,
          atau rentang tanggal tertentu. Transaksi yang sudah dihapus tidak
          dimasukkan ke laporan.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <form
          method="get"
          action="/api/admin/keuangan/laporan"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="period" value="month" />
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-950">Laporan Bulanan</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Pilih satu bulan. Seluruh transaksi pada bulan tersebut akan masuk
            ke PDF.
          </p>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Bulan dan tahun
          </label>
          <input
            type="month"
            name="month"
            defaultValue={currentMonth}
            required
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
          />
          <button
            type="submit"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <FileDown className="h-4 w-4" />
            Download PDF Bulanan
          </button>
        </form>

        <form
          method="get"
          action="/api/admin/keuangan/laporan"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="period" value="year" />
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CalendarRange className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-950">Laporan Tahunan</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Rekap satu tahun penuh dari 1 Januari sampai 31 Desember.
          </p>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Tahun laporan
          </label>
          <input
            type="number"
            name="year"
            min="2021"
            max="2100"
            defaultValue={today.year}
            required
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
          />
          <button
            type="submit"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <FileDown className="h-4 w-4" />
            Download PDF Tahunan
          </button>
        </form>

        <form
          method="get"
          action="/api/admin/keuangan/laporan"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="period" value="custom" />
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <CalendarRange className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-950">Rentang Tanggal</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Atur sendiri tanggal awal dan akhir sesuai kebutuhan pelaporan.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Dari
              <input
                type="date"
                name="start"
                defaultValue={firstDay}
                required
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Sampai
              <input
                type="date"
                name="end"
                defaultValue={currentDay}
                required
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <FileDown className="h-4 w-4" />
            Download PDF Periode
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
        PDF memuat saldo awal periode, total penerimaan, total pengeluaran,
        saldo akhir, serta seluruh transaksi pada periode yang dipilih beserta
        program terkait.
      </div>
    </div>
  );
}
