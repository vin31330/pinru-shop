"use client";

import { useState } from "react";

export default function ProductImage({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`grid place-items-center overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 text-slate-400 ${className}`}
      >
        <div className="text-center">
          <div className="text-5xl">📦</div>
          <div className="mt-2 text-xs font-bold">商品圖片</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </div>
  );
}