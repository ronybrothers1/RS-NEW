"use client";

import Link from "next/link";
import { useState } from "react";

interface SiteLogoProps {
  name: string;
}

export default function SiteLogo({ name }: SiteLogoProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <Link href="/" className="flex items-center gap-3">
      {hasError ? (
        <>
          <div className="w-10 h-10 bg-teal-700 text-white rounded-lg flex items-center justify-center font-bold text-lg">YRS</div>
          <span className="font-bold text-xl text-white ml-3">Ruang Sejahtera</span>
        </>
      ) : (
        <img 
          src="/logo.jpeg" 
          alt={`Logo ${name}`} 
          className="h-12 w-auto object-contain mix-blend-screen"
          title={name}
          onError={() => setHasError(true)}
        />
      )}
    </Link>
  );
}
