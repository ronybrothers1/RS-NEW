"use client";

import { archiveKegiatan } from "@/app/actions/kegiatan";
import { Archive, Loader2 } from "lucide-react";
import { useTransition } from "react";

export default function ArchiveKegiatanButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    const confirmed = window.confirm(
      `Arsipkan "${title}"? Kegiatan akan hilang dari website publik, tetapi datanya tetap tersimpan.`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await archiveKegiatan(id);

      if (!result.success) {
        window.alert(result.error ?? "Gagal mengarsipkan kegiatan.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={isPending}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
      title="Arsipkan"
      aria-label={`Arsipkan ${title}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
    </button>
  );
}
