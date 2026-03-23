"use client";

import { useState } from "react";
import { getClearbitLogo, getGoogleFavicon } from "@/lib/logos";

interface ServiceLogoProps {
  name: string;
  website?: string | null;
  logoUrl?: string | null;
  size?: number;
}

export function ServiceLogo({ name, website, logoUrl, size = 40 }: ServiceLogoProps) {
  const [imgError, setImgError] = useState(0);

  const domain = website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  // Try order: logoUrl → Clearbit → Google Favicon → Initial letter
  const sources = [
    logoUrl,
    domain ? getClearbitLogo(domain) : null,
    domain ? getGoogleFavicon(domain, size) : null,
  ].filter(Boolean) as string[];

  const currentSrc = sources[imgError];

  if (!currentSrc) {
    return (
      <div
        className="rounded-lg bg-[var(--bg-hover)] flex items-center justify-center text-sm font-bold shrink-0"
        style={{ width: size, height: size }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg bg-[var(--bg-hover)] object-contain shrink-0"
      onError={() => setImgError((prev) => prev + 1)}
    />
  );
}
