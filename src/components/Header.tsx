"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { HeaderBackButton } from "@/components/BackButton";
import CartCount from "@/components/CartCount";
import { HeaderHomeButton, HomeButtonLink } from "@/components/FloatingHomeButton";

type HeaderProps = {
  showHomeButton?: boolean;
  showBackButton?: boolean;
  mobileBackButton?: boolean;
  backFallbackHref?: string;
  backLabel?: string;
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export default function Header({
  showHomeButton = false,
  showBackButton = false,
  mobileBackButton = false,
  backFallbackHref = "/",
  backLabel,
}: HeaderProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const lineUrl =
    process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL ||
    "https://line.me/R/ti/p/@284eiqba";

  function search(event: FormEvent) {
    event.preventDefault();
    router.push(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : "/products");
  }

  return (
    <header
      data-site-header
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
        <Link
          href="/"
          aria-label="回到首頁"
          title="回到首頁"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-2xl font-black transition hover:bg-slate-200"
        >
          ☰
        </Link>

        <Link href="/" className="min-w-0 shrink-0">
          <div className="truncate text-xl font-black tracking-tight text-emerald-700 lg:text-2xl">
            世界好用 小新和品儒
          </div>
          <div className="text-xs text-slate-500 lg:text-sm">鍋具・五金・生活百貨</div>
        </Link>

        <form onSubmit={search} className="hidden min-w-0 flex-1 md:block">
          <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white pl-4 pr-1 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋商品名稱、分類或關鍵字"
              aria-label="搜尋商品"
              className="w-full bg-transparent text-base outline-none"
            />
            <button
              type="submit"
              aria-label="搜尋"
              className="grid h-10 w-12 shrink-0 touch-manipulation place-items-center rounded-lg text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        <a
          href={lineUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1 font-black text-slate-900 transition hover:bg-slate-50 md:flex-row md:gap-2 md:px-2 md:py-1.5"
          aria-label="開啟 LINE 官方帳號"
        >
          <Image
            src="/line-brand-icon.png"
            alt="LINE 官方帳號"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="text-[11px] font-black leading-none md:hidden">LINE客服</span>
          <span className="hidden lg:inline">LINE</span>
        </a>

        <Link
          href="/cart"
          className="relative flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1 font-black text-slate-900 transition hover:bg-slate-50 md:flex-row md:gap-2 md:px-2 md:py-1.5"
        >
          <span className="text-3xl" aria-hidden="true">🛒</span>
          <span className="text-[11px] font-black leading-none md:hidden">購物車</span>
          <span className="hidden lg:inline">購物車</span>
          <CartCount />
        </Link>
      </div>

      <form onSubmit={search} className="px-4 pb-3 md:hidden">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 rounded-xl border border-slate-300 bg-white pl-4 pr-1 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋商品名稱、分類或關鍵字"
            aria-label="搜尋商品"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          <button
            type="submit"
            aria-label="搜尋"
            className="grid h-12 w-14 shrink-0 touch-manipulation place-items-center rounded-xl text-slate-700 transition active:bg-emerald-100 active:text-emerald-800"
          >
            <SearchIcon />
          </button>
        </div>
      </form>

      {mobileBackButton ? (
        <>
          <div className="md:hidden">
            <HeaderBackButton
              fallbackHref={backFallbackHref}
              label={backLabel}
            />
          </div>
          <div className="hidden px-3 pb-2 md:flex min-[1200px]:hidden">
            <HomeButtonLink />
          </div>
        </>
      ) : showBackButton ? (
        <HeaderBackButton fallbackHref={backFallbackHref} label={backLabel} />
      ) : (
        showHomeButton && <HeaderHomeButton />
      )}
    </header>
  );
}
