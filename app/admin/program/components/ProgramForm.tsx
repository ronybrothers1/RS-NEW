"use client";

import {
  createProgram,
  updateProgram,
} from "@/app/actions/program";
import {
  Activity,
  BookOpen,
  FileText,
  HeartHandshake,
  Leaf,
  Stethoscope,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useState,
} from "react";

const availableIcons = [
  {
    id: "HeartHandshake",
    icon: HeartHandshake,
    label: "Kemanusiaan",
  },
  {
    id: "BookOpen",
    icon: BookOpen,
    label: "Pendidikan",
  },
  {
    id: "Stethoscope",
    icon: Stethoscope,
    label: "Kesehatan",
  },
  {
    id: "Leaf",
    icon: Leaf,
    label: "Lingkungan",
  },
  {
    id: "Users",
    icon: Users,
    label: "Sosial / Komunitas",
  },
  {
    id: "Activity",
    icon: Activity,
    label: "Aktivitas / Darurat",
  },
  {
    id: "FileText",
    icon: FileText,
    label: "Bantuan",
  },
];

type InitialProgram = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  targetAmount: string | null;
};

type Props = {
  initialData?: InitialProgram;
};

function formatRupiah(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("id-ID");
}

export default function ProgramForm({
  initialData,
}: Props) {
  const router = useRouter();

  const isEdit = Boolean(initialData);

  const [selectedIcon, setSelectedIcon] =
    useState(
      initialData?.icon || "HeartHandshake",
    );

  const [targetAmount, setTargetAmount] =
    useState(
      initialData?.targetAmount
        ? formatRupiah(
            initialData.targetAmount,
          )
        : "",
    );

  const [isPending, setIsPending] =
    useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsPending(true);
    setError("");

    const formData = new FormData(
      event.currentTarget,
    );

    formData.set("icon", selectedIcon);

    formData.set(
      "targetAmount",
      targetAmount.replace(/\D/g, ""),
    );

    const result =
      isEdit && initialData
        ? await updateProgram(
            initialData.id,
            formData,
          )
        : await createProgram(formData);

    if (!result.success) {
      setError(
        result.error ||
          "Gagal menyimpan program.",
      );

      setIsPending(false);
      return;
    }

    router.push("/admin/program");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nama Program{" "}
          <span className="text-rose-500">
            *
          </span>
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={180}
          defaultValue={
            initialData?.name || ""
          }
          placeholder="Nama program yayasan"
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">
          Ikon Program{" "}
          <span className="text-rose-500">
            *
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {availableIcons.map(
            ({
              id,
              icon: Icon,
              label,
            }) => {
              const selected =
                selectedIcon === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setSelectedIcon(id)
                  }
                  className={`flex min-h-24 flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                    selected
                      ? "border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/20"
                      : "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:bg-slate-50"
                  }`}
                  aria-pressed={selected}
                >
                  <Icon className="mb-2 h-6 w-6" />

                  <span className="text-xs font-medium leading-tight">
                    {label}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Deskripsi Program
        </label>

        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={1500}
          defaultValue={
            initialData?.description || ""
          }
          placeholder="Jelaskan tujuan, sasaran, dan bentuk bantuan program."
          className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="targetAmount"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Target Dana
          <span className="ml-1 font-normal text-slate-400">
            (Opsional)
          </span>
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-medium text-slate-500">
            Rp
          </span>

          <input
            id="targetAmount"
            type="text"
            inputMode="numeric"
            value={targetAmount}
            onChange={(event) =>
              setTargetAmount(
                formatRupiah(
                  event.target.value,
                ),
              )
            }
            placeholder="0"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-12 pr-4 font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Kosongkan jika program tidak
          menggunakan batas target dana.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/program")
          }
          disabled={isPending}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Menyimpan..."
            : isEdit
              ? "Simpan Perubahan"
              : "Simpan Program"}
        </button>
      </div>
    </form>
  );
}
