"use client";

import { useMemo, useRef, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { ProductMedia } from "@/types/product";

type GalleryItem =
  | {
      id: string;
      type: "image";
      url?: string;
      label: string;
    }
  | {
      id: string;
      type: "video";
      url: string;
      label: string;
    };

type VideoKind =
  | { kind: "youtube"; url: string }
  | { kind: "drive"; url: string }
  | { kind: "native"; url: string }
  | { kind: "link"; url: string };

function parseYoutubeId(url: string): string {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").split("/")[0] ?? "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") ?? "";
      }

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (["shorts", "embed", "live"].includes(parts[0] ?? "")) {
        return parts[1] ?? "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function getGoogleDriveFileId(url: string): string {
  const filePathMatch = url.match(/\/file\/d\/([^/?]+)/);

  if (filePathMatch) {
    return filePathMatch[1];
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") ?? "";
  } catch {
    return "";
  }
}

function resolveVideo(url: string): VideoKind {
  const youtubeId = parseYoutubeId(url);

  if (youtubeId) {
    return {
      kind: "youtube",
      url: `https://www.youtube.com/embed/${youtubeId}?rel=0`,
    };
  }

  const driveId = getGoogleDriveFileId(url);

  if (
    driveId &&
    (url.includes("drive.google.com") || url.includes("googleusercontent.com"))
  ) {
    return {
      kind: "drive",
      url: `https://drive.google.com/file/d/${driveId}/preview`,
    };
  }

  if (/\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(url)) {
    return {
      kind: "native",
      url,
    };
  }

  return {
    kind: "link",
    url,
  };
}

export default function ProductGallery({
  productName,
  mainImage,
  media,
}: {
  productName: string;
  mainImage?: string;
  media: ProductMedia[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const items = useMemo<GalleryItem[]>(() => {
    const result: GalleryItem[] = [];

    if (mainImage) {
      result.push({
        id: "main-image",
        type: "image",
        url: mainImage,
        label: "主要圖片",
      });
    }

    for (const item of media ?? []) {
      if (!item?.url) continue;

      if (item.type === "image") {
        if (item.url === mainImage) continue;

        result.push({
          id: item.id,
          type: "image",
          url: item.url,
          label: "商品圖片",
        });
      } else {
        result.push({
          id: item.id,
          type: "video",
          url: item.url,
          label: "商品影片",
        });
      }
    }

    if (result.length === 0) {
      result.push({
        id: "empty-image",
        type: "image",
        label: "商品圖片",
      });
    }

    return result;
  }, [mainImage, media]);

  const current = items[currentIndex] ?? items[0];

  function goTo(index: number) {
    const normalized = (index + items.length) % items.length;
    setCurrentIndex(normalized);
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function previous() {
    goTo(currentIndex - 1);
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const difference = touchStartX.current - endX;

    if (Math.abs(difference) > 45) {
      difference > 0 ? next() : previous();
    }

    touchStartX.current = null;
  }

  function renderVideo(url: string, fullscreenMode: boolean) {
    const video = resolveVideo(url);
    const frameClass = fullscreenMode
      ? "aspect-video max-h-[82vh] w-full"
      : "h-full w-full";

    if (video.kind === "youtube" || video.kind === "drive") {
      return (
        <iframe
          src={video.url}
          title={`${productName} 商品影片`}
          className={`${frameClass} border-0 bg-black`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (video.kind === "native") {
      return (
        <video
          src={video.url}
          controls
          playsInline
          preload="metadata"
          className={`${frameClass} bg-black object-contain`}
        >
          您的瀏覽器不支援影片播放。
        </video>
      );
    }

    return (
      <div className="grid h-full w-full place-items-center bg-slate-900 p-6 text-center">
        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-white px-5 py-3 font-black text-slate-900"
        >
          ▶ 開啟商品影片
        </a>
      </div>
    );
  }

  function renderCurrent(fullscreenMode = false) {
    if (current.type === "image") {
      if (fullscreenMode) {
        return (
          <ProductImage
            src={current.url}
            alt={`${productName} ${current.label}`}
            className="max-h-[85vh] w-full rounded-2xl"
          />
        );
      }

      return (
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="block h-full w-full"
          aria-label="放大商品圖片"
        >
          <ProductImage
            src={current.url}
            alt={`${productName} ${current.label}`}
            className="h-full w-full rounded-none"
          />
        </button>
      );
    }

    return renderVideo(current.url, fullscreenMode);
  }

  return (
    <>
      <section className="min-w-0 max-w-full overflow-hidden">
        <div
          className="relative aspect-square w-full max-w-full overflow-hidden rounded-3xl bg-white shadow-sm"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-full w-full overflow-hidden">
            {renderCurrent()}
          </div>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                aria-label="上一個媒體"
                className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-2xl font-black text-white backdrop-blur"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={next}
                aria-label="下一個媒體"
                className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-2xl font-black text-white backdrop-blur"
              >
                ›
              </button>

              <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white">
                {currentIndex + 1} / {items.length}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2">
          {items.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${
                index === currentIndex
                  ? "border-emerald-600"
                  : "border-slate-200"
              }`}
              aria-label={`切換到第 ${index + 1} 個媒體`}
            >
              {item.type === "image" ? (
                <ProductImage
                  src={item.url}
                  alt={`${productName} 縮圖`}
                  className="h-full w-full rounded-none"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-slate-900 text-2xl text-white">
                  ▶
                </div>
              )}
            </button>
          ))}
        </div>

        {items.length > 1 && (
          <p className="mt-1 text-center text-xs text-slate-500">
            手機可左右滑動，點縮圖也能切換
          </p>
        )}
      </section>

      {fullscreen && current.type === "image" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-3xl text-white"
            aria-label="關閉放大圖片"
          >
            ×
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-3xl text-white"
                aria-label="上一張"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-3xl text-white"
                aria-label="下一張"
              >
                ›
              </button>
            </>
          )}

          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden">
            {renderCurrent(true)}
          </div>
        </div>
      )}
    </>
  );
}
