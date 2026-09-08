"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { togglePublishKegiatan } from "@/app/actions/kegiatan";

export default function TogglePublishButton({ id, isPublished }: { id: string, isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await togglePublishKegiatan(id, isPublished);
    });
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`p-1.5 rounded-md transition-colors ${
        isPublished 
          ? 'text-teal-600 hover:bg-teal-50' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
      }`}
      title={isPublished ? "Sembunyikan" : "Publikasikan"}
    >
      {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}
