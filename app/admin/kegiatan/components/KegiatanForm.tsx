"use client";

import { saveKegiatan } from "@/app/actions/kegiatan";
import {
  CalendarDays,
  Loader2,
  MapPin,
  Save,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

type ProgramOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

type InitialActivity = {
  id: string;
  title: string;
  programId: string | null;
  date: string;
  location: string | null;
  description: string | null;
  tiktokUrl: string | null;
  isPublished: boolean;
  archivedAt: string | null;
};

export default function KegiatanForm({
  programs,
  activity,
  defaultDate,
}: {
  programs: ProgramOption[];
  activity?: InitialActivity;
  defaultDate: string;
}) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    saveKegiatan,
    {
      success: false,
      error: null,
    },
  );

  useEffect(() => {
    if (state.success) {
      router.push("/admin/kegiatan");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="id"
        value={activity?.id ?? ""}
      />

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Judul Kegiatan *
        </label>

        <input
          name="title"
          type="text"
          required
          maxLength={180}
          defaultValue={activity?.title ?? ""}
          placeholder="Contoh: Penyaluran Bantuan Air Bersih di Desa..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Program Yayasan *
        </label>

        <select
          name="programId"
          required
          defaultValue={activity?.programId ?? ""}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        >
          <option value="">Pilih program</option>

          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
              {program.status === "INACTIVE"
                ? " — Nonaktif"
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Tanggal Kegiatan *
          </label>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />

            <input
              name="date"
              type="date"
              required
              defaultValue={activity?.date ?? defaultDate}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Lokasi
          </label>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />

            <input
              name="location"
              type="text"
              maxLength={300}
              defaultValue={activity?.location ?? ""}
              placeholder="Desa, kecamatan, kabupaten"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Deskripsi Kegiatan *
        </label>

        <textarea
          name="description"
          required
          rows={7}
          maxLength={5000}
          defaultValue={activity?.description ?? ""}
          placeholder="Jelaskan kegiatan, penerima manfaat, proses penyaluran, dan informasi penting lainnya."
          className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Video TikTok
        </label>

        <div className="relative">
          <Video className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />

          <input
            name="tiktokUrl"
            type="url"
            defaultValue={activity?.tiktokUrl ?? ""}
            placeholder="https://www.tiktok.com/@username/video/1234567890"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Gunakan tautan lengkap video TikTok. Short link seperti
          vt.tiktok.com belum digunakan untuk embed.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Status
        </label>

        <select
          name="status"
          defaultValue={
            activity?.archivedAt
              ? "ARCHIVED"
              : activity?.isPublished
                ? "PUBLISHED"
                : "DRAFT"
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        >
          <option value="DRAFT">Draf</option>
          <option value="PUBLISHED">Dipublikasi</option>
          {activity && (
            <option value="ARCHIVED">Arsip</option>
          )}
        </select>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/kegiatan")}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {activity
                ? "Simpan Perubahan"
                : "Simpan Kegiatan"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
