"use client";

import {
  Activity,
  BookOpen,
  FileText,
  HeartHandshake,
  Leaf,
  Pencil,
  PlayCircle,
  PowerOff,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

import {
  setProgramStatus,
} from "@/app/actions/program";
import {
  formatCurrency,
} from "@/lib/utils";

const iconMap: Record<
  string,
  React.ElementType
> = {
  BookOpen,
  Stethoscope,
  Leaf,
  Users,
  HeartHandshake,
  Activity,
  FileText,
};

export default function ProgramList({
  programs,
}: {
  programs: any[];
}) {
  const router = useRouter();

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  async function changeStatus(
    id: string,
    name: string,
    currentStatus:
      | "ACTIVE"
      | "INACTIVE",
  ) {
    const nextStatus =
      currentStatus === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    const actionText =
      nextStatus === "ACTIVE"
        ? "mengaktifkan kembali"
        : "menonaktifkan";

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin ${actionText} program "${name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(id);

    const result =
      await setProgramStatus(
        id,
        nextStatus,
      );

    if (!result.success) {
      window.alert(
        result.error ||
          "Gagal mengubah status program.",
      );

      setProcessingId(null);
      return;
    }

    router.refresh();
    setProcessingId(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600">
            <tr>
              <th className="w-16 px-6 py-4">
                Ikon
              </th>

              <th className="px-6 py-4">
                Nama Program
              </th>

              <th className="px-6 py-4">
                Target Dana
              </th>

              <th className="px-6 py-4">
                Status
              </th>

              <th className="px-6 py-4 text-right">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {programs.length > 0 ? (
              programs.map((program) => {
                const IconComponent =
                  iconMap[program.icon] ||
                  HeartHandshake;

                const isInactive =
                  program.status ===
                  "INACTIVE";

                const isProcessing =
                  processingId ===
                  program.id;

                return (
                  <tr
                    key={program.id}
                    className={`transition hover:bg-slate-50 ${
                      isInactive
                        ? "bg-slate-50/60"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isInactive
                            ? "bg-slate-200 text-slate-500"
                            : "bg-teal-50 text-teal-600"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className={`font-semibold ${
                          isInactive
                            ? "text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {program.name}
                      </div>

                      {program.description && (
                        <div className="mt-1 max-w-md truncate text-xs text-slate-500">
                          {
                            program.description
                          }
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {program.targetAmount ? (
                        formatCurrency(
                          Number(
                            program.targetAmount,
                          ),
                        )
                      ) : (
                        <span className="font-normal italic text-slate-400">
                          Tidak Terbatas
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {isInactive ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Nonaktif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Aktif
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/program/${program.id}/edit`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sky-50 hover:text-sky-700"
                          title="Edit Program"
                          aria-label={`Edit ${program.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            changeStatus(
                              program.id,
                              program.name,
                              program.status,
                            )
                          }
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isInactive
                              ? "text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                              : "text-slate-400 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                          title={
                            isInactive
                              ? "Aktifkan Program"
                              : "Nonaktifkan Program"
                          }
                          aria-label={
                            isInactive
                              ? `Aktifkan ${program.name}`
                              : `Nonaktifkan ${program.name}`
                          }
                        >
                          {isInactive ? (
                            <PlayCircle className="h-4 w-4" />
                          ) : (
                            <PowerOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-14 text-center"
                >
                  <Activity className="mx-auto mb-3 h-12 w-12 text-slate-300" />

                  <p className="font-medium text-slate-900">
                    Belum ada program
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Tambahkan program pertama
                    Yayasan Ruang Sejahtera.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
