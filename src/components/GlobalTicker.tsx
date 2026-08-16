"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type TickerSettings = {
  announcementTickerEnabled: boolean;
  announcementTickerText: string;
  announcementTickerSpeed: number;
};

const EMPTY_SETTINGS: TickerSettings = {
  announcementTickerEnabled: false,
  announcementTickerText: "",
  announcementTickerSpeed: 28,
};

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const raw = String(value ?? "").trim().toLowerCase();
  return ["true", "yes", "y", "1", "是", "顯示", "啟用", "開啟"].includes(raw);
}

function toSpeed(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 28;
  return Math.max(10, Math.min(120, Math.round(parsed)));
}

function shouldShowTicker(pathname: string): boolean {
  const path = decodeURIComponent(pathname || "/").replace(/\/+$/, "") || "/";

  // 只在指定的五類頁面顯示跑馬燈。
  if (path === "/" || path === "/home/首頁") return true;
  if (path === "/activities" || path === "/activities/all/優惠活動") return true;
  if (path === "/products" || path === "/products/all/查看全部商品") return true;
  if (path === "/products/hot/熱銷商品") return true;
  if (path === "/products/new/新品推薦") return true;

  return false;
}

export default function GlobalTicker() {
  const pathname = usePathname();
  const tickerRef = useRef<HTMLDivElement | null>(null);
  const [settings, setSettings] = useState<TickerSettings>(EMPTY_SETTINGS);

  const showOnCurrentPage = shouldShowTicker(pathname || "/");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/settings?t=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;

      const data = (await response.json()) as Record<string, unknown>;
      setSettings({
        announcementTickerEnabled: toBoolean(data.announcementTickerEnabled),
        announcementTickerText: String(data.announcementTickerText ?? "").trim(),
        announcementTickerSpeed: toSpeed(data.announcementTickerSpeed),
      });
    } catch {
      // Keep the last successfully loaded ticker state if the network is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();

    const timer = window.setInterval(() => {
      void refresh();
    }, 60_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const handleFocus = () => void refresh();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  const text = settings.announcementTickerText.trim();
  const shouldRender = showOnCurrentPage && settings.announcementTickerEnabled && Boolean(text);

  useEffect(() => {
    const root = document.documentElement;

    if (!shouldRender) {
      root.style.removeProperty("--global-ticker-height");
      return;
    }

    const element = tickerRef.current;
    if (!element) return;

    const updateHeight = () => {
      root.style.setProperty("--global-ticker-height", `${element.getBoundingClientRect().height}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
      root.style.removeProperty("--global-ticker-height");
    };
  }, [shouldRender, text]);

  if (!shouldRender) return null;

  return (
    <div
      ref={tickerRef}
      className="global-ticker"
      role="status"
      aria-label="網站公告"
    >
      <div
        className="global-ticker-track"
        style={{ "--ticker-duration": `${settings.announcementTickerSpeed}s` } as CSSProperties}
      >
        <span className="global-ticker-item">📢 {text}</span>
        <span className="global-ticker-item" aria-hidden="true">📢 {text}</span>
      </div>
    </div>
  );
}
