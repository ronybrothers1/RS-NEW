"use client";

function extractVideoId(url: string) {
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

export default function TikTokPreview({
  url,
}: {
  url: string;
}) {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-center text-sm text-amber-800">
        URL TikTok tidak dapat dipratinjau.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
        <iframe
          src={`https://www.tiktok.com/player/v1/${videoId}`}
          title="Video TikTok kegiatan"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
