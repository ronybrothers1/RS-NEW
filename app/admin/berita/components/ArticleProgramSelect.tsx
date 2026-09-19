"use client";

import {
  updateBeritaProgram,
} from "@/app/actions/berita";
import {
  useEffect,
  useState,
  useTransition,
} from "react";

type ProgramOption = {
  id: string;
  name: string;
};

type Props = {
  articleId: string;
  articleTitle: string;
  currentProgramId: string | null;
  currentProgramName: string | null;
  programs: ProgramOption[];
};

export default function ArticleProgramSelect({
  articleId,
  articleTitle,
  currentProgramId,
  currentProgramName,
  programs,
}: Props) {
  const [
    selected,
    setSelected,
  ] =
    useState(
      currentProgramId ?? "",
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  useEffect(() => {
    setSelected(
      currentProgramId ?? "",
    );

    setError(
      null,
    );

    setSaved(
      false,
    );
  }, [
    currentProgramId,
  ]);

  const currentIsActive =
    currentProgramId
      ? programs.some(
          (program) =>
            program.id ===
            currentProgramId,
        )
      : true;

  function handleChange(
    value: string,
  ) {
    const previous =
      selected;

    setSelected(
      value,
    );

    setError(
      null,
    );

    setSaved(
      false,
    );

    startTransition(
      async () => {
        const result =
          await updateBeritaProgram(
            articleId,
            value || null,
          );

        if (
          !result.success
        ) {
          setSelected(
            previous,
          );

          setError(
            result.error ??
              "Gagal menyimpan label.",
          );

          return;
        }

        setSaved(
          true,
        );
      },
    );
  }

  return (
    <div className="min-w-[190px]">
      <select
        value={selected}
        disabled={isPending}
        onChange={(event) =>
          handleChange(
            event.target.value,
          )
        }
        aria-label={`Program untuk ${articleTitle}`}
        title={
          error ??
          "Pilih program terkait"
        }
        className={`max-w-[230px] rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition disabled:cursor-wait disabled:opacity-60 ${
          selected
            ? "border-teal-200 bg-teal-50 text-teal-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            : "border-slate-200 bg-slate-100 text-slate-600 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
        }`}
      >
        <option value="">
          Umum / Tidak terkait program
        </option>

        {!currentIsActive &&
          currentProgramId &&
          currentProgramName && (
            <option
              value={
                currentProgramId
              }
              disabled
            >
              {currentProgramName}
              {" — Nonaktif"}
            </option>
          )}

        {programs.map(
          (program) => (
            <option
              key={
                program.id
              }
              value={
                program.id
              }
            >
              {program.name}
            </option>
          ),
        )}
      </select>

      <div
        className="mt-1 min-h-4 text-[11px]"
        aria-live="polite"
      >
        {isPending ? (
          <span className="text-slate-400">
            Menyimpan...
          </span>
        ) : error ? (
          <span className="text-red-600">
            {error}
          </span>
        ) : saved ? (
          <span className="text-emerald-600">
            Tersimpan
          </span>
        ) : null}
      </div>
    </div>
  );
}
