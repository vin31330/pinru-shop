"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type VideoInfo =
  | {
      kind: "youtube";
      playUrl: string;
      thumbnailUrl: string;
    }
  | {
      kind: "drive";
      playUrl: string;
      thumbnailUrl: string;
    }
  | {
      kind: "native";
      playUrl: string;
      thumbnailUrl?: string;
    }
  | {
      kind: "link";
      playUrl: string;
      thumbnailUrl?: string;
    };

function getYoutubeId(url: string): string {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? "";
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
  const pathMatch = url.match(/\/file\/d\/([^/?]+)/);

  if (pathMatch) {
    return pathMatch[1];
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") ?? "";
  } catch {
    return "";
  }
}

function resolveVideo(url: string): VideoInfo {
  const youtubeId = getYoutubeId(url);

  if (youtubeId) {
    return {
      kind: "youtube",
      playUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  const driveId = getGoogleDriveFileId(url);

  if (
    driveId &&
    (url.includes("drive.google.com") ||
      url.includes("googleusercontent.com"))
  ) {
    return {
      kind: "drive",
      playUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveId}&sz=w500`,
    };
  }

  if (/\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(url)) {
    return {
      kind: "native",
      playUrl: url,
    };
  }

  return {
    kind: "link",
    playUrl: url,
  };
}

function withPlaybackSession(url: string, sessionKey: string): string {
  if (!sessionKey) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("pinruVideoSession", sessionKey);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}pinruVideoSession=${encodeURIComponent(sessionKey)}`;
  }
}

function VideoThumbnail({
  url,
  label,
}: {
  url: string;
  label: string;
}) {
  const video = resolveVideo(url);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900">
      {video.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnailUrl}
          alt={label}
          className="h-full w-full object-cover"
        />
      ) : video.kind === "native" ? (
        <video
          src={video.playUrl}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-950" />
      )}

      <div className="absolute inset-0 grid place-items-center bg-black/20">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 pl-0.5 text-xl text-slate-900 shadow">
          ▶
        </span>
      </div>
    </div>
  );
}

export default function ProductGallery({
  productName,
  media,
}: {
  productName: string;
  /**
   * 保留此參數以相容目前 page.tsx，但商品詳情頁不會使用商品總表主圖。
   */
  mainImage?: string;
  media: ProductMedia[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [videoSessionKey, setVideoSessionKey] = useState("");
  const activePlayerHost = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastSwipeAt = useRef(0);
  const suppressImageClick = useRef(false);

  const items = useMemo<GalleryItem[]>(() => {
    const result: GalleryItem[] = [];

    for (const item of media ?? []) {
      if (!item?.url) continue;

      if (item.type === "image") {
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
  }, [media]);

  const current = items[currentIndex] ?? items[0];

  useEffect(() => {
    let sessionSequence = 0;

    function stopActivePlayer() {
      const player = activePlayerHost.current?.querySelector<
        HTMLIFrameElement | HTMLVideoElement
      >("[data-active-video-player]");

      if (player instanceof HTMLVideoElement) {
        player.pause();
        player.removeAttribute("src");
        player.load();
      } else if (player instanceof HTMLIFrameElement) {
        player.src = "about:blank";
      }
    }

    function startFreshPlayerSession() {
      sessionSequence += 1;
      setVideoSessionKey(`${Date.now()}-${sessionSequence}`);
      setInteractive(true);
    }

    function handlePageShow() {
      startFreshPlayerSession();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        startFreshPlayerSession();
      } else {
        stopActivePlayer();
        setInteractive(false);
      }
    }

    setCurrentIndex(0);
    setFullscreen(false);
    startFreshPlayerSession();
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopActivePlayer();
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [productName]);

  useEffect(() => {
    if (!fullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFullscreen(false);
      }

      if (event.key === "ArrowRight") {
        setCurrentIndex((index) => (index + 1) % items.length);
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex(
          (index) => (index - 1 + items.length) % items.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullscreen, items.length]);


  function goTo(index: number) {
    setCurrentIndex((index + items.length) % items.length);
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function previous() {
    goTo(currentIndex - 1);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest("[data-gallery-control]")) {
      pointerStart.current = null;
      return;
    }
    pointerStart.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    suppressImageClick.current = false;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== event.pointerId) return;

    const differenceX = start.x - event.clientX;
    const differenceY = start.y - event.clientY;
    performSwipe(differenceX, differenceY);
  }

  function handlePointerCancel() {
    pointerStart.current = null;
    suppressImageClick.current = false;
  }

  function performSwipe(differenceX: number, differenceY: number) {
    const isHorizontalSwipe =
      Math.abs(differenceX) >= 36 &&
      Math.abs(differenceX) > Math.abs(differenceY);
    if (!isHorizontalSwipe) return;

    const now = Date.now();
    if (now - lastSwipeAt.current < 300) return;
    lastSwipeAt.current = now;
    suppressImageClick.current = true;
    if (differenceX > 0) {
      next();
    } else {
      previous();
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const point = event.touches[0];
    touchStart.current = point
      ? { x: point.clientX, y: point.clientY }
      : null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    const point = event.changedTouches[0];
    if (!start || !point) return;
    performSwipe(start.x - point.clientX, start.y - point.clientY);
  }

  function handleTouchCancel() {
    touchStart.current = null;
  }

  function openFullscreen() {
    if (suppressImageClick.current) {
      suppressImageClick.current = false;
      return;
    }
    setFullscreen(true);
  }

  function activateCurrentMedia(event?: React.SyntheticEvent<HTMLElement>) {
    const target = event?.target as Element | undefined;
    if (target?.closest("[data-gallery-control]")) return;

    if (suppressImageClick.current) {
      suppressImageClick.current = false;
      return;
    }

    if (current.type === "image") openFullscreen();
  }

  function handleStageKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (current.type !== "image") return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activateCurrentMedia(event);
  }

  function renderVideo(
    item: Extract<GalleryItem, { type: "video" }>,
    fullscreenMode: boolean,
  ) {
    const { url } = item;
    const video = resolveVideo(url);
    const frameClass = fullscreenMode
      ? "aspect-video max-h-[82vh] w-full"
      : "h-full w-full";

    if (!interactive) {
      return (
        <div className="grid h-full w-full place-items-center bg-slate-900 text-base font-black text-white">
          影片載入中…
        </div>
      );
    }

    if (video.kind === "youtube" || video.kind === "drive") {
      return (
        <iframe
          key={`${item.id}-${videoSessionKey}`}
          src={withPlaybackSession(video.playUrl, videoSessionKey)}
          title={`${productName} 商品影片`}
          data-active-video-player
          className={`${frameClass} border-0 bg-black`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          allowFullScreen
        />
      );
    }

    if (video.kind === "native") {
      return (
        <video
          key={`${item.id}-${videoSessionKey}`}
          src={video.playUrl}
          data-active-video-player
          controls
          playsInline
          preload="metadata"
          className={`${frameClass} bg-black object-contain`}
        />
      );
    }

    return (
      <div className="grid h-full w-full place-items-center bg-slate-900 p-6">
        <a
          href={video.playUrl}
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
            className="h-full w-full rounded-2xl bg-transparent"
          />
        );
      }

      return (
        <div className="relative block h-full w-full cursor-zoom-in">
          <ProductImage
            src={current.url}
            alt={`${productName} ${current.label}`}
            className="h-full w-full rounded-none"
          />
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/65 px-4 py-2 text-sm font-black text-white">
            點擊放大圖片
          </span>
        </div>
      );
    }

    return renderVideo(current, fullscreenMode);
  }

  return (
    <>
      <section
        data-product-gallery
        data-interactive-ready={interactive ? "true" : "false"}
        className="product-interaction-layer min-w-0 max-w-full overflow-hidden"
      >
        <div
          data-product-gallery-stage
          data-current-media-type={current.type}
          data-current-media-index={currentIndex}
          className="relative aspect-square w-full touch-pan-y overflow-hidden rounded-3xl bg-white shadow-sm"
          role="button"
          tabIndex={interactive ? 0 : -1}
          aria-label={
            current.type === "image"
              ? `放大${productName}商品圖片`
              : `${productName}商品影片`
          }
          onClick={activateCurrentMedia}
          onKeyDown={handleStageKeyDown}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onTouchStartCapture={handleTouchStart}
          onTouchEndCapture={handleTouchEnd}
          onTouchCancelCapture={handleTouchCancel}
        >
          <div ref={activePlayerHost} className="h-full w-full overflow-hidden">
            {renderCurrent()}
          </div>

          {items.length > 1 && (
            <>
              <button
                type="button"
                data-gallery-control
                onClick={previous}
                className="absolute left-3 top-1/2 z-10 grid h-11 w-11 touch-manipulation -translate-y-1/2 place-items-center rounded-full bg-black/55 text-2xl font-black text-white disabled:opacity-50"
                aria-label="上一個商品媒體"
              >
                ‹
              </button>

              <button
                type="button"
                data-gallery-control
                onClick={next}
                className="absolute right-3 top-1/2 z-10 grid h-11 w-11 touch-manipulation -translate-y-1/2 place-items-center rounded-full bg-black/55 text-2xl font-black text-white disabled:opacity-50"
                aria-label="下一個商品媒體"
              >
                ›
              </button>

              <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white">
                {currentIndex + 1} / {items.length}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-2">
          {items.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              data-gallery-control
              data-gallery-thumbnail={index}
              data-gallery-media-type={item.type}
              onClick={() => goTo(index)}
              className={`relative h-20 w-20 shrink-0 touch-manipulation overflow-hidden rounded-xl border-2 bg-white disabled:opacity-60 ${
                index === currentIndex
                  ? "border-emerald-600"
                  : "border-slate-200"
              }`}
            >
              {item.type === "image" ? (
                <ProductImage
                  src={item.url}
                  alt={`${productName} 縮圖`}
                  className="h-full w-full rounded-none"
                />
              ) : (
                <VideoThumbnail
                  url={item.url}
                  label={`${productName}影片縮圖`}
                />
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
          className="fixed inset-x-0 top-0 z-[100] flex h-dvh items-center justify-center bg-black/95 p-4"
          onClick={() => setFullscreen(false)}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onTouchStartCapture={handleTouchStart}
          onTouchEndCapture={handleTouchEnd}
          onTouchCancelCapture={handleTouchCancel}
        >
          <button
            type="button"
            data-gallery-control
            onClick={(event) => {
              event.stopPropagation();
              setFullscreen(false);
            }}
            className="gallery-close-button absolute right-4 z-50 inline-flex min-h-12 min-w-24 touch-manipulation items-center justify-center gap-2 rounded-full border-2 border-white bg-white px-4 text-base font-black text-slate-900 shadow-2xl"
            aria-label="關閉放大圖片"
          >
            <span className="text-2xl leading-none" aria-hidden="true">×</span>
            關閉
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                data-gallery-control
                onClick={(event) => {
                  event.stopPropagation();
                  previous();
                }}
                className="absolute left-3 top-1/2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-3xl font-black text-white sm:left-6"
                aria-label="上一張圖片"
              >
                ‹
              </button>

              <button
                type="button"
                data-gallery-control
                onClick={(event) => {
                  event.stopPropagation();
                  next();
                }}
                className="absolute right-3 top-1/2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-3xl font-black text-white sm:right-6"
                aria-label="下一張圖片"
              >
                ›
              </button>

              <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-bold text-white">
                {currentIndex + 1} / {items.length}
              </div>
            </>
          )}

          <div
            className="h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl pt-14"
            onClick={(event) => event.stopPropagation()}
          >
            {renderCurrent(true)}
          </div>
        </div>
      )}
    </>
  );
}
