"use client";

import { useMemo, useState } from "react";

function getGoogleDriveFileId(url: string): string {
  const pathMatch = url.match(/\/file\/d\/([^/?]+)/);
  if (pathMatch) return pathMatch[1];

  const lh3Match = url.match(/googleusercontent\.com\/d\/([^=/?]+)/);
  if (lh3Match) return lh3Match[1];

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") ?? "";
  } catch {
    return "";
  }
}

function unwrapImageFormula(value: string): string {
  const formulaUrl = value.match(/(?:IMAGE|HYPERLINK)\s*\(\s*["'](https?:\/\/[^"']+)["']/i)?.[1];
  if (formulaUrl) return formulaUrl;
  return value;
}

function buildImageCandidates(src?: string): string[] {
  const value = unwrapImageFormula(src?.trim() ?? "").replace(/&amp;/g, "&");
  if (!value) return [];

  const candidates = [value];
  const driveId = getGoogleDriveFileId(value);

  if (driveId) {
    candidates.push(
      `https://lh3.googleusercontent.com/d/${driveId}=w1600`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`,
      `https://drive.usercontent.google.com/download?id=${driveId}&export=view`,
    );
  }

  return Array.from(new Set(candidates));
}

function ImageRenderer({
  src,
  alt,
  className,
  fallbackLabel,
}: {
  src?: string;
  alt: string;
  className: string;
  fallbackLabel: string;
}) {
  const candidates = useMemo(() => buildImageCandidates(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const currentSrc = candidates[candidateIndex];

  function handleError() {
    setCandidateIndex((index) =>
      index < candidates.length - 1 ? index + 1 : candidates.length,
    );
  }

  if (!currentSrc) {
    return (
      <div className={`grid place-items-center overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 text-slate-400 ${className}`}>
        <div className="text-center">
          <div className="text-4xl">📦</div>
          <div className="mt-2 text-xs font-bold">{fallbackLabel}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${src}-${candidateIndex}`}
        src={currentSrc}
        alt={alt}
        onError={handleError}
        decoding="async"
        loading="lazy"
        referrerPolicy="no-referrer"
        className="block h-full w-full object-contain"
      />
    </div>
  );
}

export default function ProductImage({
  src,
  alt,
  className = "",
  fallbackLabel = "商品圖片",
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const normalizedSrc = src?.trim() ?? "";

  return (
    <ImageRenderer
      key={normalizedSrc || "empty-image"}
      src={normalizedSrc}
      alt={alt}
      className={className}
      fallbackLabel={fallbackLabel}
    />
  );
}
