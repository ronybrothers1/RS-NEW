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
        src="/brand/ruang-sejahtera-logo-outlined.png"
        alt="Ruang Sejahtera"
        width={525}
        height={235}
        priority
        sizes="(max-width: 639px) 134px, 150px"
        className="h-[60px] w-auto object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] sm:h-[68px]"
      />
    </Link>
  );
}
