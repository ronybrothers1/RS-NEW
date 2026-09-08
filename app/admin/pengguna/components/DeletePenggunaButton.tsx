"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/app/actions/pengguna";

export default function DeletePenggunaButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.")) {
      startTransition(async () => {
        const res = await deleteUser(id);
        if (res?.error) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
      title="Hapus Pengguna"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
