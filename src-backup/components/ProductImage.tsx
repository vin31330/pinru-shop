"use client";

import { useState } from "react";

type ProductImageProps = {
  src?: string;
  alt: string;
  className?: string;
};

export default function ProductImage({
  src,
  alt,
  className = "",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br from-amber-50 to-orange-100 text-center text-slate-400 ${className}`}
      >
        <div>
          <div className="text-5xl">📦</div>
          <div className="mt-2 text-xs font-bold">
            商品圖片
          </div>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}