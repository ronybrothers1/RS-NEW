"use client";

import { Check, Copy, MessageCircle, Send, Share2 } from "lucide-react";
import { useState } from "react";

type ShareActionsProps = {
  title: string;
  url: string;
  className?: string;
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2";

export function ShareActions({
  title,
  url,
  className = "",
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      icon: <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <span
          aria-hidden="true"
          className="flex h-4 w-4 items-center justify-center text-base font-black leading-none"
        >
          f
        </span>
      ),
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <span
          aria-hidden="true"
          className="flex h-4 w-4 items-center justify-center text-xs font-black"
        >
          X
        </span>
      ),
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <Send className="h-4 w-4 shrink-0" aria-hidden="true" />,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Salin tautan:", url);
    }
  }

  return (
    <section
      aria-label="Bagikan"
      className={`border-b border-slate-200 pb-7 ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Share2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>Bagikan</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {shareLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass}
              aria-label={`Bagikan ke ${item.label}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}

          <button
            type="button"
            onClick={copyLink}
            className={buttonClass}
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span aria-live="polite">
              {copied ? "Tersalin" : "Salin tautan"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
