"use client";
/* eslint-disable @next/next/no-img-element */

import {
  Check,
  Eye,
  FileImage,
  Filter,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
} from "react";

import {
  rejectDonation,
  verifyDonation,
} from "@/app/actions/donasi-admin";
import { getDonationDetail } from "@/app/actions/donasi-detail";
import { formatCurrency } from "@/lib/utils";

type DonationStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

type DonationItem = {
  id: string;
  donorName: string;
  amount: string;
  programId: string | null;
  programName: string | null;
  status: DonationStatus;
  paymentMethod: string | null;
  isAnonymous: boolean;
  createdAt: string;
  linkedTransactionId:
    | string
    | null;
};

type DonationDetail = DonationItem & {
  proofImage: string | null;
};

type ConfirmAction =
  | "VERIFY"
  | "REJECT"
  | null;

function statusLabel(
  status: DonationStatus,
) {
  if (status === "SUCCESS") {
    return "Berhasil";
  }

  if (status === "FAILED") {
    return "Ditolak";
  }

  return "Menunggu";
}

function statusClass(
  status: DonationStatus,
) {
  if (status === "SUCCESS") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "FAILED") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-amber-50 text-amber-700";
}

function formatDateTime(
  value: string,
) {
  return new Date(value).toLocaleString(
    "id-ID",
    {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getSafeProofImage(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  if (
    /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(
      value,
    )
  ) {
    return value;
  }

  if (
    /^\/api\/admin\/donasi\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/proof$/i.test(
      value,
    )
  ) {
    return value;
  }

  if (
    /^https:\/\//i.test(value)
  ) {
    return value;
  }

  return null;
}

export default function AdminDonasiClient({
  donations,
}: {
  donations: DonationItem[];
}) {
  const router = useRouter();

  const [query, setQuery] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    programFilter,
    setProgramFilter,
  ] = useState("ALL");

  const [detail, setDetail] =
    useState<DonationDetail | null>(
      null,
    );

  const [
    isLoadingDetail,
    setIsLoadingDetail,
  ] = useState(false);

  const [
    detailError,
    setDetailError,
  ] = useState<string | null>(
    null,
  );

  const [
    confirmAction,
    setConfirmAction,
  ] = useState<ConfirmAction>(
    null,
  );

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const summary = useMemo(() => {
    return donations.reduce(
      (acc, donation) => {
        const amount = Number(
          donation.amount,
        );

        if (
          donation.status ===
          "PENDING"
        ) {
          acc.pendingCount += 1;
          acc.pendingAmount +=
            amount;
        }

        if (
          donation.status ===
          "SUCCESS"
        ) {
          acc.successCount += 1;
          acc.successAmount +=
            amount;
        }

        if (
          donation.status ===
          "FAILED"
        ) {
          acc.failedCount += 1;
          acc.failedAmount +=
            amount;
        }

        return acc;
      },
      {
        pendingCount: 0,
        pendingAmount: 0,
        successCount: 0,
        successAmount: 0,
        failedCount: 0,
        failedAmount: 0,
      },
    );
  }, [donations]);

  const programOptions =
    useMemo(() => {
      const map = new Map<
        string,
        string
      >();

      donations.forEach(
        (donation) => {
          if (
            donation.programId &&
            donation.programName
          ) {
            map.set(
              donation.programId,
              donation.programName,
            );
          }
        },
      );

      return Array.from(
        map.entries(),
      )
        .map(([id, name]) => ({
          id,
          name,
        }))
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "id-ID",
          ),
        );
    }, [donations]);

  const filteredDonations =
    useMemo(() => {
      const needle =
        query
          .trim()
          .toLowerCase();

      return donations.filter(
        (donation) => {
          if (
            statusFilter !==
              "ALL" &&
            donation.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            programFilter !==
              "ALL" &&
            donation.programId !==
              programFilter
          ) {
            return false;
          }

          if (!needle) {
            return true;
          }

          const haystack = [
            donation.donorName,
            donation.programName,
            donation.paymentMethod,
            donation.amount,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            needle,
          );
        },
      );
    }, [
      donations,
      query,
      statusFilter,
      programFilter,
    ]);

  async function openDetail(
    donationId: string,
  ) {
    setDetail(null);
    setDetailError(null);
    setActionError(null);
    setConfirmAction(null);
    setIsLoadingDetail(true);

    const result =
      await getDonationDetail(
        donationId,
      );

    setIsLoadingDetail(false);

    if (
      !result.success ||
      !result.data
    ) {
      setDetailError(
        result.error ||
          "Gagal memuat detail.",
      );
      return;
    }

    setDetail(
      result.data as DonationDetail,
    );
  }

  function closeDetail() {
    if (isProcessing) {
      return;
    }

    setDetail(null);
    setDetailError(null);
    setConfirmAction(null);
    setActionError(null);
  }

  async function processDonation() {
    if (
      !detail ||
      !confirmAction
    ) {
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    const result =
      confirmAction === "VERIFY"
        ? await verifyDonation(
            detail.id,
          )
        : await rejectDonation(
            detail.id,
          );

    setIsProcessing(false);

    if (!result.success) {
      setActionError(
        result.error ||
          "Proses donasi gagal.",
      );
      return;
    }

    closeDetail();
    router.refresh();
  }

  const proofImage =
    getSafeProofImage(
      detail?.proofImage || null,
    );

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Donasi
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Periksa bukti transfer
            sebelum donasi dicatat
            sebagai penerimaan yayasan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "PENDING",
              )
            }
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left transition hover:border-amber-300"
          >
            <p className="text-sm font-medium text-amber-700">
              Menunggu Verifikasi
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.pendingCount}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {formatCurrency(
                summary.pendingAmount,
              )}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "SUCCESS",
              )
            }
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:border-emerald-300"
          >
            <p className="text-sm font-medium text-emerald-700">
              Berhasil
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.successCount}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {formatCurrency(
                summary.successAmount,
              )}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "FAILED",
              )
            }
            className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-left transition hover:border-rose-300"
          >
            <p className="text-sm font-medium text-rose-700">
              Ditolak
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.failedCount}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {formatCurrency(
                summary.failedAmount,
              )}
            </p>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_250px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="Cari donatur, program, bank, atau nominal..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800"
              >
                <option value="ALL">
                  Semua Status
                </option>
                <option value="PENDING">
                  Menunggu
                </option>
                <option value="SUCCESS">
                  Berhasil
                </option>
                <option value="FAILED">
                  Ditolak
                </option>
              </select>
            </div>

            <select
              value={programFilter}
              onChange={(event) =>
                setProgramFilter(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800"
            >
              <option value="ALL">
                Semua Program
              </option>

              {programOptions.map(
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
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Tanggal
                  </th>
                  <th className="px-5 py-4">
                    Donatur
                  </th>
                  <th className="px-5 py-4">
                    Program
                  </th>
                  <th className="px-5 py-4">
                    Bank
                  </th>
                  <th className="px-5 py-4 text-right">
                    Nominal
                  </th>
                  <th className="px-5 py-4 text-center">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDonations.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Tidak ada donasi
                      yang sesuai dengan
                      pencarian atau
                      filter.
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map(
                    (donation) => (
                      <tr
                        key={donation.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDateTime(
                            donation.createdAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900">
                            {
                              donation.donorName
                            }
                          </div>

                          {donation.isAnonymous && (
                            <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              Anonim publik
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {donation.programName ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {donation.paymentMethod ||
                            "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                          {formatCurrency(
                            Number(
                              donation.amount,
                            ),
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                              donation.status,
                            )}`}
                          >
                            {statusLabel(
                              donation.status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDetail(
                                donation.id,
                              )
                            }
                            disabled={
                              isLoadingDetail
                            }
                            className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            Periksa
                          </button>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Menampilkan{" "}
              {filteredDonations.length}{" "}
              dari {donations.length} donasi
            </span>

            {(query ||
              statusFilter !== "ALL" ||
              programFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter(
                    "ALL",
                  );
                  setProgramFilter(
                    "ALL",
                  );
                }}
                className="font-medium text-teal-700 hover:text-teal-800"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>

        {detailError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {detailError}
          </div>
        )}

        {isLoadingDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="rounded-2xl bg-white px-8 py-6 text-sm font-medium text-slate-700 shadow-xl">
              Memuat detail donasi...
            </div>
          </div>
        )}
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="donation-detail-title"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2
                  id="donation-detail-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Detail Donasi
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Periksa data dan bukti
                  sebelum menentukan
                  status.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                disabled={isProcessing}
                aria-label="Tutup"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
              <div>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Donatur
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {detail.donorName}
                    </dd>

                    {detail.isAnonymous && (
                      <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        Ditampilkan sebagai
                        Hamba Allah
                      </span>
                    )}
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          detail.status,
                        )}`}
                      >
                        {statusLabel(
                          detail.status,
                        )}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Nominal
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-slate-900">
                      {formatCurrency(
                        Number(
                          detail.amount,
                        ),
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Bank
                    </dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {detail.paymentMethod ||
                        "—"}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Program
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {detail.programName ||
                        "—"}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase text-slate-400">
                      Dikirim
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatDateTime(
                        detail.createdAt,
                      )}
                    </dd>
                  </div>

                  {detail.status ===
                    "SUCCESS" && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase text-slate-400">
                        Catatan Keuangan
                      </dt>

                      <dd className="mt-1">
                        {detail.linkedTransactionId ? (
                          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Sudah tercatat
                            di Uang Masuk
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                            Data lama belum
                            memiliki tautan
                            transaksi
                          </span>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium uppercase text-slate-400">
                  Bukti Transfer
                </p>

                {proofImage ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={proofImage}
                      alt={`Bukti transfer ${detail.donorName}`}
                      className="max-h-[480px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <FileImage className="h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">
                      Bukti transfer
                      tidak tersedia atau
                      format lama tidak
                      dapat ditampilkan.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {actionError && (
              <div className="mx-6 mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {actionError}
              </div>
            )}

            {detail.status ===
              "PENDING" && (
              <div className="border-t border-slate-200 bg-slate-50 p-6">
                {!confirmAction ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction(
                          "REJECT",
                        )
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Tolak
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction(
                          "VERIFY",
                        )
                      }
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Verifikasi
                    </button>
                  </div>
                ) : (
                  <div className={`rounded-xl border p-4 ${
                    confirmAction ===
                    "VERIFY"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}>
                    <p className="font-semibold text-slate-900">
                      {confirmAction ===
                      "VERIFY"
                        ? "Verifikasi donasi ini?"
                        : "Tolak donasi ini?"}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {confirmAction ===
                      "VERIFY"
                        ? "Setelah diverifikasi, nominal donasi akan otomatis dicatat satu kali sebagai Uang Masuk."
                        : "Donasi akan ditandai sebagai Ditolak dan tidak memengaruhi saldo keuangan."}
                    </p>

                    <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          setConfirmAction(
                            null,
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        Batal
                      </button>

                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={
                          processDonation
                        }
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                          confirmAction ===
                          "VERIFY"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        }`}
                      >
                        {isProcessing
                          ? "Memproses..."
                          : confirmAction ===
                              "VERIFY"
                            ? "Ya, Verifikasi"
                            : "Ya, Tolak"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}