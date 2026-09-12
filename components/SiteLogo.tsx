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
        sizes="(max-width: 639px) 134px, 150px"
        className="h-[60px] w-auto object-contain sm:h-[68px]"
      />
    </Link>
  );
}