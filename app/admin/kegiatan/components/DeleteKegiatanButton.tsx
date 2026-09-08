"use client";

import { deleteKegiatan } from "@/app/actions/kegiatan";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";

export default function DeleteKegiatanButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Hapus permanen "${title}"? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteKegiatan(id);

      if (!result.success) {
        window.alert(result.error ?? "Gagal menghapus kegiatan.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      title="Hapus Permanen"
      aria-label={`Hapus permanen ${title}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
