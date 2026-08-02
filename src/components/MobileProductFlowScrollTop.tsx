"use client";

import { useEffect } from "react";

/**
 * 手機版商品分類流程在同一個 /products 頁面切換 query 時，
 * 強制回到頁面頂端，避免從最下方分類按鈕切換後仍停留在底部。
 */
export default function MobileProductFlowScrollTop({
  navigationKey,
}: {
  navigationKey: string;
}) {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [navigationKey]);

  return null;
}
