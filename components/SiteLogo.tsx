"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";

interface SiteLogoProps {
  name: string;
}

export default function SiteLogo({ name }: SiteLogoProps) {
  const displayName =
    name.replace(/^Yayasan\s+/i, "").trim() || "Ruang Sejahtera";

  return (
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label={`${name} - Beranda`}
    >
      <div className="w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
        <HeartHandshake className="h-6 w-6" aria-hidden="true" />
      </div>
      <span className="font-bold text-lg sm:text-xl text-white whitespace-nowrap">
        {displayName}
      </span>
    </Link>
  );
}
