"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  CheckCircle2,
  History,
} from "lucide-react";
import {
  useActionState,
  useMemo,
  useState,
} from "react";

import {
  createTransaksiKeluar,
  type KeuanganActionResult,
} from "@/app/actions/keuangan";
import {
  formatRupiah,
} from "@/lib/assistance";

type ProgramOption = {
  id: string;
  name: string;
};

type CampaignOption = {
  id: string;
  title: string;
  programId: string;
  status:
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED";
  available: number;
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

function statusLabel(
  status: CampaignOption["status"],
) {
  if (status === "ACTIVE") {
    return "Aktif";
  }

  if (status === "PAUSED") {
    return "Dijeda";
  }

  return "Selesai";
}

export default function TransaksiKeluarForm({
  programs,
  campaigns,
  defaultCampaignId = "",
}: {
  programs: ProgramOption[];
  campaigns: CampaignOption[];
  defaultCampaignId?: string;
}) {
  const initialCampaign =
    campaigns.find(
      (campaign) =>
        campaign.id === defaultCampaignId,
    ) || null;

  const initialState: KeuanganActionResult = {
    success: false,
    error: null,
  };

  const [state, formAction, isPending] =
    useActionState(
      createTransaksiKeluar,
      initialState,
    );

  const [amount, setAmount] =
    useState("");

  const [
    selectedProgram,
    setSelectedProgram,
  ] = useState(
    initialCampaign?.programId || "",
  );

  const [
    selectedCampaign,
    setSelectedCampaign,
  ] = useState(
    initialCampaign?.id || "",
  );

  const availableCampaigns =
    useMemo(
      () =>
        campaigns.filter(
          (campaign) =>
            !selectedProgram ||
            campaign.programId ===
              selectedProgram,
        ),
      [
        campaigns,
        selectedProgram,
      ],
    );

  const campaign =
    campaigns.find(
      (item) =>
        item.id === selectedCampaign,
    ) || null;

  const numericAmount =
    Number(
      amount.replace(/\D/g, ""),
    ) || 0;

  const insufficient =
    Boolean(campaign) &&
    numericAmount >
      (campaign?.available || 0);

  function changeProgram(
    programId: string,
  ) {
    setSelectedProgram(programId);

    if (
      selectedCampaign &&
      !campaigns.some(
        (item) =>
          item.id ===
            selectedCampaign &&
          item.programId ===
            programId,
      )
    ) {
      setSelectedCampaign("");
    }
  }

  function changeCampaign(
    campaignId: string,
  ) {
    setSelectedCampaign(campaignId);

    const selected =
      campaigns.find(
        (item) =>
          item.id === campaignId,
      );

    if (selected) {
      setSelectedProgram(
        selected.programId,
      );
    }
  }

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />

        <h2 className="mt-4 text-lg font-bold text-emerald-900">
          Uang Keluar Berhasil Dicatat
        </h2>

        <p className="mt-2 text-sm leading-6 text-emerald-700">
          Saldo, dashboard, riwayat,
          transparansi, dan sub-ledger
          kampanye telah diperbarui.
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
            htmlFor="expense-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Tanggal{" "}
            <span className="text-rose-500">
              *
            </span>
          </label>

          <input
            id="expense-date"
            type="date"
            name="date"
            required
            defaultValue={getJakartaDateValue()}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="expense-amount"
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
              id="expense-amount"
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="expense-program"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Program / Kategori{" "}
            <span className="text-rose-500">
              *
            </span>
          </label>

          <select
            id="expense-program"
            name="programId"
            required={!selectedCampaign}
            value={selectedProgram}
            onChange={(event) =>
              changeProgram(
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">
              Pilih program
            </option>

            {programs.map((program) => (
              <option
                key={program.id}
                value={program.id}
              >
                {program.name}
              </option>
            ))}

            <option value="other">
              Umum
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="expense-campaign"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Kampanye
            <span className="ml-1 font-normal text-slate-400">
              (Opsional)
            </span>
          </label>

          <select
            id="expense-campaign"
            name="campaignId"
            value={selectedCampaign}
            onChange={(event) =>
              changeCampaign(
                event.target.value,
              )
            }
            disabled={
              selectedProgram === "other"
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">
              Tidak terkait kampanye
            </option>

            {availableCampaigns.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.title} ·{" "}
                  {statusLabel(
                    item.status,
                  )}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {campaign && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            insufficient
              ? "border-rose-200 bg-rose-50"
              : "border-teal-200 bg-teal-50"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              insufficient
                ? "text-rose-800"
                : "text-teal-800"
            }`}
          >
            Saldo tersedia:{" "}
            {formatRupiah(
              campaign.available,
            )}
          </p>

          <p
            className={`mt-1 text-xs leading-5 ${
              insufficient
                ? "text-rose-700"
                : "text-teal-700"
            }`}
          >
            {insufficient
              ? "Nominal pengeluaran melebihi saldo kampanye."
              : "Pengeluaran akan mengurangi saldo tersedia, tetapi tidak menurunkan progres target."}
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="expense-description"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {selectedProgram === "other"
            ? "Keterangan Pengeluaran"
            : "Rincian Pengeluaran"}{" "}
          <span className="text-rose-500">
            *
          </span>
        </label>

        <textarea
          id="expense-description"
          name="description"
          required
          rows={4}
          maxLength={1000}
          placeholder={
            selectedProgram === "other"
              ? "Contoh: Biaya operasional kantor"
              : "Contoh: Pembelian bahan renovasi rumah"
          }
          className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={
          isPending ||
          insufficient
        }
        className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowDownRight className="mr-2 h-4 w-4" />

        {isPending
          ? "Menyimpan..."
          : "Simpan Uang Keluar"}
      </button>
    </form>
  );
}
