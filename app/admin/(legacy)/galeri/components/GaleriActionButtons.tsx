"use client";

import { useTransition } from "react";
import { deleteGaleri, togglePublishGaleri } from "@/app/actions/galeri";
import { Eye, EyeOff, Trash2 } from "lucide-react";

export default function GaleriActionButtons({ id, isPublished }: { id: string, isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await togglePublishGaleri(id, isPublished);
    });
  };

  const handleDelete = () => {
    if (confirm("Hapus media ini secara permanen?")) {
      startTransition(async () => {
        await deleteGaleri(id);
      });
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
        title={isPublished ? "Sembunyikan" : "Tampilkan Publik"}
      >
        {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors disabled:opacity-50"
        title="Hapus"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
