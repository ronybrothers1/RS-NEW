"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteBerita } from "@/app/actions/berita";

export default function DeleteBeritaButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      confirm(
        `Hapus permanen "${title}"?\n\nTindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      startTransition(async () => {
        const result = await deleteBerita(id);

        if (!result.success && result.error) {
          alert(result.error);
        }
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      title="Hapus Permanen"
      aria-label={`Hapus permanen ${title}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
