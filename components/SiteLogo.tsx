"use client";

import Image from "next/image";
import Link from "next/link";

interface SiteLogoProps {
  name: string;
}

export default function SiteLogo({ name }: SiteLogoProps) {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center"
      aria-label={`${name} - Beranda`}
    >
      <Image
        src="/brand/ruang-sejahtera-logo.png"
        alt="Ruang Sejahtera"
        width={1100}
        height={500}
        priority
        className="h-11 w-auto max-w-[165px] object-contain sm:h-12 sm:max-w-[210px]"
      />
    </Link>
  );
}