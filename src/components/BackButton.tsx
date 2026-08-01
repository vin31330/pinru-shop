"use client";

import { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { restoreReturnPositionAfterBack } from "@/lib/returnPosition";

export default function BackButton({
  fallbackHref = "/",
  label = "返回上一頁",
  className = "",
}: {
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (window.history.length > 1) {
      restoreReturnPositionAfterBack();
      window.history.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <a
      href={fallbackHref}
      onClick={goBack}
      data-qa-back-button
      className={`inline-flex min-h-11 touch-manipulation items-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2 font-black text-slate-700 shadow-sm transition hover:border-emerald-500 hover:text-emerald-700 ${className}`.trim()}
    >
      <span aria-hidden="true">←</span>
      {label}
    </a>
  );
}

export function HeaderBackButton({
  fallbackHref,
  label,
}: {
  fallbackHref: string;
  label?: string;
}) {
  return (
    <div
      data-header-back-button-row
      className="flex px-3 pb-2 min-[1200px]:hidden"
    >
      <BackButton fallbackHref={fallbackHref} label={label} />
    </div>
  );
}

export function FloatingBackButton({
  fallbackHref,
  label,
}: {
  fallbackHref: string;
  label?: string;
}) {
  return (
    <div className="pointer-events-none hidden h-6 min-[1200px]:block">
      <BackButton
        fallbackHref={fallbackHref}
        label={label}
        className="pointer-events-auto fixed left-3 top-[5.25rem] z-[45]"
      />
    </div>
  );
}
