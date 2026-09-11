"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Copy,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import {
  useActionState,
  useMemo,
  useState,
} from "react";

import { submitDonation } from "@/app/actions/donasi";
import DonationProofUploader from "./DonationProofUploader";

type ProgramOption = {
  id: string;
  name: string;
};

type BankAccounts = Record<
  string,
  string
>;

type DonationState = {
  success: boolean;
  error: string | null;
  reference?:
    | string
    | null;
};

const PREDEFINED_AMOUNTS = [
  50000,
  100000,
  200000,
  500000,
];

const BANK_ORDER = [
  "BCA",
  "MANDIRI",
  "BSI",
  "BRI",
];

function formatAmount(value: string) {
  if (!value) {
    return "";
  }

  return Number(value).toLocaleString(
    "id-ID",
  );
}

function getCleanAccountNumber(
  value: string,
) {
  return (
    value.match(/\d+/g)?.join("") ||
    value
  );
}

export default function DonasiClientForm({
  programs,
  bankAccounts,
}: {
  programs: ProgramOption[];
  bankAccounts: BankAccounts;
}) {
  const searchParams =
    useSearchParams();

  const requestedProgram =
    searchParams?.get("program") || "";

  const requestedCampaign =
    searchParams?.get("campaign") || "";

  const defaultProgram = useMemo(
    () => {
      const requestedExists =
        programs.some(
          (program) =>
            program.id ===
            requestedProgram,
        );

      if (requestedExists) {
        return requestedProgram;
      }

      return programs[0]?.id || "";
    },
    [
      programs,
      requestedProgram,
    ],
  );

  const availableBanks =
    useMemo(
      () =>
        BANK_ORDER.filter(
          (bank) =>
            bankAccounts[
              bank
            ]?.trim(),
        ),
      [bankAccounts],
    );

  const initialState: DonationState = {
    success: false,
    error: null,
    reference: null,
  };

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    submitDonation,
    initialState,
  );

  const [amount, setAmount] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState(
    availableBanks[0] || "",
  );

  const [copied, setCopied] =
    useState(false);

  const [
    referenceCopied,
    setReferenceCopied,
  ] = useState(false);

  const [
    proofState,
    setProofState,
  ] = useState({
    ready: false,
    uploading: false,
  });

  async function handleCopy() {
    const account =
      bankAccounts[
        paymentMethod
      ] || "";

    if (!account) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        getCleanAccountNumber(
          account,
        ),
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        2000,
      );
    } catch {
      setCopied(false);
    }
  }

  async function handleReferenceCopy() {
    if (!state.reference) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        state.reference,
      );

      setReferenceCopied(
        true,
      );

      window.setTimeout(
        () =>
          setReferenceCopied(
            false,
          ),
        2000,
      );
    } catch {
      setReferenceCopied(
        false,
      );
    }
  }

  if (state.success) {
    return (
      <div className="py-6 text-center sm:py-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-11 w-11 text-emerald-600" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-slate-900">
          Bukti Donasi Berhasil Dikirim
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
          Data dan bukti transfer Anda
          sudah kami terima. Donasi belum
          dinyatakan selesai karena masih
          menunggu verifikasi pengurus
          Yayasan Ruang Sejahtera.
        </p>

        <div className="mx-auto mt-5 flex max-w-lg items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <Clock3 className="h-4 w-4" />
          Status: Menunggu Verifikasi
        </div>

        {state.reference && (
          <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Nomor Referensi Donasi
            </p>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <code className="break-all text-sm font-bold text-slate-900">
                {state.reference}
              </code>

              <button
                type="button"
                onClick={
                  handleReferenceCopy
                }
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {referenceCopied
                  ? "Tersalin"
                  : "Salin"}
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Simpan nomor ini. Anda dapat
              menggunakannya untuk mengecek
              hasil verifikasi tanpa harus
              membuat akun.
            </p>
          </div>
        )}

        <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <p className="text-sm leading-6 text-blue-800">
              Dana baru dicatat sebagai
              penerimaan yayasan setelah
              bukti transfer selesai
              diverifikasi.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/donasi#cek-status"
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Cek Status Donasi
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Kembali ke Beranda
          </Link>

          <Link
            href="/transparansi"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Lihat Transparansi
          </Link>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="font-bold text-amber-900">
          Program Donasi Belum Tersedia
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-700">
          Saat ini belum ada program aktif
          yang dapat menerima donasi.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-8"
    >
      {requestedCampaign && (
        <>
          <input
            type="hidden"
            name="campaignId"
            value={requestedCampaign}
          />
          <input
            type="hidden"
            name="programId"
            value={defaultProgram}
          />
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-medium leading-6 text-teal-900">
            Donasi ini diarahkan khusus ke kampanye Bantu Mereka yang Anda pilih.
          </div>
        </>
      )}
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
        >
          {state.error}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            1
          </span>

          <h2 className="text-lg font-bold text-slate-900">
            Pilih Program
          </h2>
        </div>

        <label
          htmlFor="donation-program"
          className="sr-only"
        >
          Program Donasi
        </label>

        <select
          id="donation-program"
          name="programId"
          defaultValue={
            defaultProgram
          }
          required
          disabled={Boolean(
            requestedCampaign,
          )}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option
            value=""
            disabled
          >
            Pilih program
          </option>

          {programs.map(
            (program) => (
              <option
                key={program.id}
                value={program.id}
              >
                {program.name}
              </option>
            ),
          )}
        </select>
      </section>

      <section className="border-t border-slate-100 pt-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            2
          </span>

          <h2 className="text-lg font-bold text-slate-900">
            Nominal Donasi
          </h2>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PREDEFINED_AMOUNTS.map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setAmount(
                    String(value),
                  )
                }
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  amount ===
                  String(value)
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                Rp{" "}
                {value.toLocaleString(
                  "id-ID",
                )}
              </button>
            ),
          )}
        </div>

        <label
          htmlFor="donation-amount"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nominal lainnya
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-slate-500">
            Rp
          </span>

          <input
            id="donation-amount"
            type="text"
            name="amount"
            inputMode="numeric"
            required
            value={formatAmount(
              amount,
            )}
            onChange={(event) =>
              setAmount(
                event.target.value.replace(
                  /\D/g,
                  "",
                ),
              )
            }
            placeholder="50.000"
            className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 text-lg font-bold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <p className="mt-2 text-xs text-slate-500">
            Minimal donasi Rp10.000.
          </p>
        </div>
      </section>

      <section className="border-t border-slate-100 pt-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            3
          </span>

          <h2 className="text-lg font-bold text-slate-900">
            Data Donatur
          </h2>
        </div>

        <label
          htmlFor="donor-name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nama Lengkap
        </label>

        <input
          id="donor-name"
          type="text"
          name="donorName"
          required
          maxLength={180}
          placeholder="Nama Anda"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            name="isAnonymous"
            className="mt-0.5 h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />

          <span>
            <span className="block text-sm font-medium text-slate-800">
              Tampilkan sebagai Hamba Allah
            </span>

            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Nama tetap tersimpan untuk
              keperluan verifikasi internal,
              tetapi tidak ditampilkan
              kepada publik.
            </span>
          </span>
        </label>
      </section>

      <section className="border-t border-slate-100 pt-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            4
          </span>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Transfer ke Rekening Resmi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pilih bank lalu lakukan
              transfer sebelum mengunggah
              bukti.
            </p>
          </div>
        </div>

        {availableBanks.length >
        0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {availableBanks.map(
                (bank) => (
                  <label
                    key={bank}
                    className={`cursor-pointer rounded-xl border p-4 text-center transition ${
                      paymentMethod ===
                      bank
                        ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                        : "border-slate-200 bg-white hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={bank}
                      checked={
                        paymentMethod ===
                        bank
                      }
                      onChange={() =>
                        setPaymentMethod(
                          bank,
                        )
                      }
                      className="sr-only"
                    />

                    <Landmark className="mx-auto h-5 w-5 text-teal-700" />

                    <span className="mt-2 block text-sm font-bold text-slate-800">
                      {bank}
                    </span>
                  </label>
                ),
              )}
            </div>

            {paymentMethod && (
              <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Rekening Resmi{" "}
                  {paymentMethod}
                </p>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="break-all text-xl font-bold tracking-wide text-slate-900 sm:text-2xl">
                    {bankAccounts[
                      paymentMethod
                    ]}
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCopy
                    }
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied
                      ? "Tersalin"
                      : "Salin Rekening"}
                  </button>
                </div>

                <p className="mt-4 text-xs leading-5 text-teal-800">
                  Pastikan rekening tujuan
                  sama dengan yang
                  ditampilkan pada halaman
                  resmi ini.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
            Saat ini belum ada rekening
            donasi yang tersedia. Form
            pengiriman dinonaktifkan.
          </div>
        )}
      </section>

      <section className="border-t border-slate-100 pt-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            5
          </span>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Unggah Bukti Transfer
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Bukti akan diperiksa oleh
              pengurus sebelum donasi
              dinyatakan berhasil.
            </p>
          </div>
        </div>

        <DonationProofUploader
          onStateChange={
            setProofState
          }
        />
      </section>

      <div className="border-t border-slate-100 pt-8">
        <button
          type="submit"
          disabled={
            isPending ||
            proofState.uploading ||
            !proofState.ready ||
            availableBanks.length ===
              0
          }
          className="w-full rounded-xl bg-amber-600 px-5 py-4 text-base font-bold text-white shadow-lg transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Mengirim Donasi..."
            : "Kirim untuk Diverifikasi"}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          Dengan mengirim formulir ini,
          Anda menyetujui{" "}
          <Link
            href="/ketentuan-donasi"
            className="font-medium text-teal-700 underline underline-offset-2"
          >
            Ketentuan Donasi
          </Link>
          .
        </p>
      </div>
    </form>
  );
}