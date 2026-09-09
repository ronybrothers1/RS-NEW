"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  History,
} from "lucide-react";
import {
  useActionState,
  useState,
} from "react";

import {
  createTransaksiMasuk,
  type KeuanganActionResult,
} from "@/app/actions/keuangan";

type ProgramOption = {
  id: string;
  name: string;
};

function getJakartaDateValue() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());
}
function formatAmount(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("id-ID");
}

export default function TransaksiMasukForm({
  programs,
}: {
  programs: ProgramOption[];
}) {
  const initialState: KeuanganActionResult = {
    success: false,
    error: null,
  };

  const [state, formAction, isPending] =
    useActionState(
      createTransaksiMasuk,
      initialState,
    );

  const [amount, setAmount] =
    useState("");

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />

        <h2 className="mt-4 text-lg font-bold text-emerald-900">
          Uang Masuk Berhasil Dicatat
        </h2>

        <p className="mt-2 text-sm leading-6 text-emerald-700">
          Saldo, dashboard, riwayat
          transaksi, dan transparansi telah
          diperbarui.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Catat Lagi
          </button>

          <Link
            href="/admin/keuangan/riwayat"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            <History className="mr-2 h-4 w-4" />
            Lihat Riwayat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="income-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Tanggal{" "}
            <span className="text-rose-500">
              *
            </span>
          </label>

          <input
            id="income-date"
            type="date"
            name="date"
            required
            defaultValue={getJakartaDateValue()}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="income-amount"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Nominal{" "}
            <span className="text-rose-500">
              *
            </span>
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-medium text-slate-500">
              Rp
            </span>

            <input
              id="income-amount"
              type="text"
              name="amount"
              inputMode="numeric"
              required
              value={amount}
              onChange={(event) =>
                setAmount(
                  formatAmount(
                    event.target.value,
                  ),
                )
              }
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-12 pr-4 font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="income-donor"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Donatur / Sumber Dana{" "}
          <span className="text-rose-500">
            *
          </span>
        </label>

        <input
          id="income-donor"
          type="text"
          name="donorName"
          required
          maxLength={180}
          placeholder="Contoh: Hamba Allah, CSR, atau nama donatur"
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="income-program"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Program Tujuan
          <span className="ml-1 font-normal text-slate-400">
            (Opsional)
          </span>
        </label>

        <select
          id="income-program"
          name="programId"
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">
            Umum
          </option>

          {programs.map((program) => (
            <option
              key={program.id}
              value={program.id}
            >
              {program.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="income-description"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Keterangan
          <span className="ml-1 font-normal text-slate-400">
            (Opsional)
          </span>
        </label>

        <textarea
          id="income-description"
          name="description"
          rows={4}
          maxLength={1000}
          placeholder="Contoh: Donasi kegiatan sosial September 2026"
          className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowUpRight className="mr-2 h-4 w-4" />

        {isPending
          ? "Menyimpan..."
          : "Simpan Uang Masuk"}
      </button>
    </form>
  );
}