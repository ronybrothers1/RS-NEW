"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  FilePenLine,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  deleteTransaksi,
  updateTransaksi,
} from "@/app/actions/keuangan";
import { formatCurrency } from "@/lib/utils";

type TransactionType = "IN" | "OUT";
type ProgramStatus = "ACTIVE" | "INACTIVE";

type TransactionItem = {
  id: string;
  type: TransactionType;
  amount: string;
  date: string;
  description: string;
  programId: string | null;
  programName: string | null;
  programStatus: ProgramStatus | null;
  donationId: string | null;
  donorName: string | null;
  isAnonymous: boolean;
  userName: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProgramOption = {
  id: string;
  name: string;
  status: ProgramStatus;
};

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("id-ID");
}

function isWebsiteDonation(
  transaction: TransactionItem,
) {
  return (
    Boolean(transaction.donationId) ||
    (
      transaction.type === "IN" &&
      transaction.description.startsWith(
        "Donasi via Website - ",
      )
    )
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export default function RiwayatTransaksiClient({
  transactions,
  programs,
  canDelete,
}: {
  transactions: TransactionItem[];
  programs: ProgramOption[];
  canDelete: boolean;
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("ALL");
  const [programFilter, setProgramFilter] =
    useState("ALL");

  const [detailItem, setDetailItem] =
    useState<TransactionItem | null>(null);

  const [editItem, setEditItem] =
    useState<TransactionItem | null>(null);
  const [editType, setEditType] =
    useState<TransactionType>("IN");
  const [editAmount, setEditAmount] =
    useState("");
  const [editProgramId, setEditProgramId] =
    useState("other");
  const [editError, setEditError] =
    useState<string | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<TransactionItem | null>(null);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const [
    isUpdating,
    startUpdate,
  ] = useTransition();

  const [
    isDeleting,
    startDelete,
  ] = useTransition();

  const filteredTransactions = useMemo(
    () => {
      const needle =
        query.trim().toLowerCase();

      return transactions.filter(
        (transaction) => {
          if (
            typeFilter !== "ALL" &&
            transaction.type !== typeFilter
          ) {
            return false;
          }

          if (
            programFilter === "NONE" &&
            transaction.programId
          ) {
            return false;
          }

          if (
            programFilter !== "ALL" &&
            programFilter !== "NONE" &&
            transaction.programId !==
              programFilter
          ) {
            return false;
          }

          if (!needle) {
            return true;
          }

          const haystack = [
            transaction.description,
            transaction.donorName,
            transaction.programName ??
              (transaction.programId ? "" : "Umum"),
            transaction.userName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(needle);
        },
      );
    },
    [
      transactions,
      query,
      typeFilter,
      programFilter,
    ],
  );

  function openEdit(
    transaction: TransactionItem,
  ) {
    if (isWebsiteDonation(transaction)) {
      return;
    }

    setEditItem(transaction);
    setEditType(transaction.type);
    setEditAmount(
      formatAmountInput(transaction.amount),
    );
    setEditProgramId(
      transaction.programId ?? "other",
    );
    setEditError(null);
  }

  function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editItem) {
      return;
    }

    const formData = new FormData(
      event.currentTarget,
    );

    setEditError(null);

    startUpdate(async () => {
      const result = await updateTransaksi(
        editItem.id,
        formData,
      );

      if (!result.success) {
        setEditError(
          result.error ||
            "Gagal memperbarui transaksi.",
        );
        return;
      }

      setEditItem(null);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteItem) {
      return;
    }

    setDeleteError(null);

    startDelete(async () => {
      const result = await deleteTransaksi(
        deleteItem.id,
      );

      if (!result.success) {
        setDeleteError(
          result.error ||
            "Gagal menghapus transaksi.",
        );
        return;
      }

      setDeleteItem(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat Transaksi
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola pemasukan dan
              pengeluaran Yayasan Ruang
              Sejahtera.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/keuangan/masuk"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Uang Masuk
            </Link>

            <Link
              href="/admin/keuangan/keluar"
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Uang Keluar
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Cari donatur, keterangan, program, atau pencatat..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value,
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="ALL">
                Semua Jenis
              </option>
              <option value="IN">
                Uang Masuk
              </option>
              <option value="OUT">
                Uang Keluar
              </option>
            </select>

            <select
              value={programFilter}
              onChange={(event) =>
                setProgramFilter(
                  event.target.value,
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="ALL">
                Semua Program
              </option>

              {programs.map((program) => (
                <option
                  key={program.id}
                  value={program.id}
                >
                  {program.name}
                  {program.status ===
                  "INACTIVE"
                    ? " (Nonaktif)"
                    : ""}
                </option>
              ))}

              <option value="NONE">
                Umum
              </option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Tanggal
                  </th>
                  <th className="px-5 py-4">
                    Jenis
                  </th>
                  <th className="px-5 py-4">
                    Keterangan
                  </th>
                  <th className="px-5 py-4">
                    Program
                  </th>
                  <th className="px-5 py-4 text-right">
                    Nominal
                  </th>
                  <th className="px-5 py-4">
                    Pencatat
                  </th>
                  <th className="px-5 py-4 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Tidak ada transaksi
                      yang sesuai dengan
                      pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(
                    (transaction) => {
                      const websiteDonation =
                        isWebsiteDonation(
                          transaction,
                        );

                      return (
                        <tr
                          key={transaction.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {formatDate(
                              transaction.date,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {transaction.type ===
                            "IN" ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                Masuk
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                <ArrowDownRight className="mr-1 h-3 w-3" />
                                Keluar
                              </span>
                            )}
                          </td>

                          <td className="max-w-[320px] px-5 py-4">
                            <div className="font-medium text-slate-900">
                              {transaction.type ===
                                "IN" &&
                              transaction.donorName
                                ? transaction.donorName
                                : transaction.description}
                            </div>

                            {transaction.type ===
                              "IN" &&
                              transaction.donorName && (
                                <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                                  {
                                    transaction.description
                                  }
                                </div>
                              )}

                            {websiteDonation && (
                              <span className="mt-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Donasi Website
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {transaction.programName ? (
                              <div>
                                <span className="text-slate-700">
                                  {
                                    transaction.programName
                                  }
                                </span>

                                {transaction.programStatus ===
                                  "INACTIVE" && (
                                  <div className="mt-1 text-xs text-amber-600">
                                    Program nonaktif
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-700">
                                Umum
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                            <span
                              className={
                                transaction.type ===
                                "IN"
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }
                            >
                              {transaction.type ===
                              "IN"
                                ? "+"
                                : "-"}
                              {formatCurrency(
                                Number(
                                  transaction.amount,
                                ),
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {transaction.userName ||
                              "—"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setDetailItem(
                                    transaction,
                                  )
                                }
                                title="Detail transaksi"
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {!websiteDonation && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      transaction,
                                    )
                                  }
                                  title="Edit transaksi"
                                  className="rounded-lg p-2 text-teal-600 transition hover:bg-teal-50 hover:text-teal-800"
                                >
                                  <FilePenLine className="h-4 w-4" />
                                </button>
                              )}

                              {canDelete &&
                                !websiteDonation && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteItem(
                                        transaction,
                                      );
                                      setDeleteError(
                                        null,
                                      );
                                    }}
                                    title="Hapus transaksi"
                                    className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Menampilkan{" "}
              {filteredTransactions.length}{" "}
              dari {transactions.length}{" "}
              transaksi aktif
            </span>

            {(query ||
              typeFilter !== "ALL" ||
              programFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTypeFilter("ALL");
                  setProgramFilter("ALL");
                }}
                className="font-medium text-teal-700 hover:text-teal-800"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>
      </div>

      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2
                  id="detail-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Detail Transaksi
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Informasi transaksi yang
                  tercatat di sistem.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDetailItem(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Jenis
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {detailItem.type === "IN"
                    ? "Uang Masuk"
                    : "Uang Keluar"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Tanggal
                </dt>
                <dd className="mt-1 text-slate-800">
                  {formatDate(
                    detailItem.date,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Nominal
                </dt>
                <dd className="mt-1 font-bold text-slate-900">
                  {formatCurrency(
                    Number(
                      detailItem.amount,
                    ),
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Program
                </dt>
                <dd className="mt-1 text-slate-800">
                  {detailItem.programName ||
                    "Umum"}
                </dd>
              </div>

              {detailItem.type === "IN" && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase text-slate-400">
                    Donatur / Sumber Dana
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {detailItem.donorName ||
                      "—"}
                    {detailItem.isAnonymous
                      ? " · Anonim di halaman publik"
                      : ""}
                  </dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Keterangan
                </dt>
                <dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-800">
                  {
                    detailItem.description
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Sumber
                </dt>
                <dd className="mt-1 text-slate-800">
                  {isWebsiteDonation(
                    detailItem,
                  )
                    ? "Donasi Website"
                    : "Input Manual"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Pencatat
                </dt>
                <dd className="mt-1 text-slate-800">
                  {detailItem.userName ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Dibuat
                </dt>
                <dd className="mt-1 text-sm text-slate-600">
                  {formatDateTime(
                    detailItem.createdAt,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  Terakhir Diperbarui
                </dt>
                <dd className="mt-1 text-sm text-slate-600">
                  {formatDateTime(
                    detailItem.updatedAt,
                  )}
                </dd>
              </div>
            </dl>

            {isWebsiteDonation(
              detailItem,
            ) && (
              <div className="mx-6 mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-700">
                Transaksi ini berasal dari
                verifikasi donasi website dan
                dikunci dari proses edit atau
                hapus di menu Keuangan.
              </div>
            )}
          </div>
        </div>
      )}

      {editItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2
                  id="edit-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Edit Transaksi
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Perubahan akan dicatat
                  dalam audit log.
                </p>
              </div>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  setEditItem(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-6"
            >
              {editError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Jenis
                  </label>

                  <select
                    name="type"
                    value={editType}
                    onChange={(event) =>
                      setEditType(
                        event.target
                          .value as TransactionType,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                  >
                    <option value="IN">
                      Uang Masuk
                    </option>
                    <option value="OUT">
                      Uang Keluar
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={editItem.date.slice(
                      0,
                      10,
                    )}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nominal
                </label>

                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-500">
                    Rp
                  </span>

                  <input
                    type="text"
                    name="amount"
                    inputMode="numeric"
                    required
                    value={editAmount}
                    onChange={(event) =>
                      setEditAmount(
                        formatAmountInput(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-12 pr-4"
                  />
                </div>
              </div>

              {editType === "IN" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Donatur / Sumber Dana
                  </label>

                  <input
                    type="text"
                    name="donorName"
                    required
                    maxLength={180}
                    defaultValue={
                      editItem.donorName ??
                      ""
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Program
                </label>

                <select
                  name="programId"
                  value={editProgramId}
                  onChange={(event) =>
                    setEditProgramId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
                >
                  <option value="other">
                    Umum
                  </option>

                  {programs.map(
                    (program) => (
                      <option
                        key={program.id}
                        value={program.id}
                        disabled={
                          program.status ===
                            "INACTIVE" &&
                          program.id !==
                            editItem.programId
                        }
                      >
                        {program.name}
                        {program.status ===
                        "INACTIVE"
                          ? " (Nonaktif)"
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Keterangan
                </label>

                <textarea
                  name="description"
                  required
                  rows={4}
                  maxLength={1000}
                  defaultValue={
                    editItem.description
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    setEditItem(null)
                  }
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {isUpdating
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>

            <h2
              id="delete-title"
              className="mt-4 text-lg font-bold text-slate-900"
            >
              Hapus transaksi?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Transaksi sebesar{" "}
              <strong>
                {formatCurrency(
                  Number(
                    deleteItem.amount,
                  ),
                )}
              </strong>{" "}
              akan dihapus dari saldo,
              dashboard, riwayat aktif, dan
              transparansi publik.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Data tidak dihapus permanen.
              Sistem menggunakan soft delete
              dan audit log tetap tersimpan.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  setDeleteItem(null)
                }
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {isDeleting
                  ? "Menghapus..."
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}