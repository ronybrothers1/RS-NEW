"use client";

import { togglePublishKegiatan } from "@/app/actions/kegiatan";
import { Globe2, Loader2 } from "lucide-react";
import { useTransition } from "react";

export default function TogglePublishButton({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      const result = await togglePublishKegiatan(
        id,
        isPublished,
      );

      if (!result.success) {
        window.alert(
          result.error ??
            "Gagal mempublikasikan kegiatan.",
        );
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={isPending}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
      title="Publikasikan"
      aria-label="Publikasikan kegiatan"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Globe2 className="h-4 w-4" />
      )}
    </button>
  );
}
