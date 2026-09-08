"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteBerita } from "@/app/actions/berita";

export default function DeleteBeritaButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
      startTransition(async () => {
        await deleteBerita(id);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
      title="Hapus"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
