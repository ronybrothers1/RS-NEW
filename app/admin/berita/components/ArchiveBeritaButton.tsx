"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { archiveBerita } from "@/app/actions/berita";

export default function ArchiveBeritaButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (
      confirm(
        `Arsipkan "${title}"?\n\nArtikel tidak akan tampil lagi di website publik, tetapi datanya tetap tersimpan.`,
      )
    ) {
      startTransition(async () => {
        await archiveBerita(id);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={isPending}
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
      title="Arsipkan"
      aria-label={`Arsipkan ${title}`}
    >
      <Archive className="h-4 w-4" />
    </button>
  );
}
