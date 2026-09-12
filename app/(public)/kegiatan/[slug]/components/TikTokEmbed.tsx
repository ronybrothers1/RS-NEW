"use client";

import { useState } from "react";

function extractVideoId(url: string) {
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

export default function TikTokEmbed({
  url,
}: {
  url: string;
}) {
  const videoId = extractVideoId(url);
  const [isPlayerLoaded, setIsPlayerLoaded] =
    useState(false);

  if (!videoId) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-center">
        <p className="text-sm leading-6 text-amber-800">
          Video TikTok tidak dapat ditampilkan karena tautannya tidak dikenali.
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-teal-700 hover:underline"
        >
          Buka video di TikTok
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        {isPlayerLoaded ? (
          <iframe
            src={`https://www.tiktok.com/player/v1/${videoId}`}
            title="Video TikTok kegiatan"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl ring-1 ring-white/20"
            >
              ▶
            </div>

            <h3 className="mt-5 text-xl font-bold">
              Video TikTok
            </h3>

            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">
              Pemutar video akan dimuat setelah Anda memilih untuk menampilkannya.
            </p>

            <button
              type="button"
              onClick={() => setIsPlayerLoaded(true)}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Tampilkan Video TikTok
            </button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-sm font-semibold text-teal-300 hover:underline"
            >
              Buka langsung di TikTok
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
