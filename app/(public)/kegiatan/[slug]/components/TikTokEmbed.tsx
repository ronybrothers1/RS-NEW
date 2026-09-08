"use client";

import { useEffect, useRef } from 'react';

export default function TikTokEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract video ID from URL
  const extractVideoId = (tiktokUrl: string) => {
    // Matches formats: 
    // https://www.tiktok.com/@user/video/123456789
    // https://vt.tiktok.com/ZS.../
    const match = tiktokUrl.match(/video\/(\d+)/);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(url);

  useEffect(() => {
    // Load TikTok embed script dynamically
    if (videoId) {
      const script = document.createElement('script');
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        // Clean up
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-8 text-center max-w-md w-full">
        <p className="text-slate-500">Video TikTok tidak dapat dimuat. Pastikan URL valid.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline mt-2 inline-block text-sm">
          Buka di TikTok
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[325px] sm:max-w-md mx-auto" ref={containerRef}>
      <blockquote 
        className="tiktok-embed" 
        cite={url} 
        data-video-id={videoId} 
        style={{ maxWidth: '605px', minWidth: '325px' }}
      >
        <section>
          <a target="_blank" title="View on TikTok" href={url} rel="noopener noreferrer">
            Memuat Video TikTok...
          </a>
        </section>
      </blockquote>
    </div>
  );
}
