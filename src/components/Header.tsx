"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { HeaderBackButton } from "@/components/BackButton";
import CartCount from "@/components/CartCount";
import { HeaderHomeButton, HomeButtonLink } from "@/components/FloatingHomeButton";

type HeaderProps = {
  showHomeButton?: boolean;
  showBackButton?: boolean;
  mobileBackButton?: boolean;
  backFallbackHref?: string;
  backLabel?: string;
  backForceFallback?: boolean;
};

const navigationItems = [
  { label: "點我回首頁", href: "/", group: "main" },
  { label: "優惠活動", href: "/activities", group: "main" },
  { label: "熱銷商品", href: "/products?section=hot", group: "main" },
  { label: "新品推薦", href: "/products?section=new", group: "main" },
  { label: "查看全部商品", href: "/products?view=all", group: "main" },
  { label: "平底鍋、炒鍋、湯鍋", href: "/products?category=平底鍋、炒鍋、湯鍋", group: "category" },
  { label: "保溫杯、水壺、玻璃壺、咖啡杯", href: "/products?category=保溫杯、水壺、玻璃壺、咖啡杯", group: "category" },
  { label: "便當盒、保鮮盒、手提袋、保溫袋", href: "/products?category=便當盒、保鮮盒、手提袋、保溫袋", group: "category" },
  { label: "廚房器具", href: "/products?category=廚房器具", group: "category" },
  { label: "按摩系列、保養品、個人清潔", href: "/products?category=按摩系列、保養品、個人清潔", group: "category" },
  { label: "清潔用品", href: "/products?category=清潔用品", group: "category" },
  { label: "瓦斯爐、刀具、砧板", href: "/products?category=瓦斯爐、刀具、砧板", group: "category" },
  { label: "生活小物", href: "/products?category=生活小物", group: "category" },
] as const;

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
  backForceFallback = false,
}: HeaderProps) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const lineUrl =
    process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL ||
    "https://line.me/R/ti/p/@284eiqba";

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function search(event: FormEvent) {
    event.preventDefault();
    setMenuOpen(false);
    router.push(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : "/products");
  }

  function navigateFromMenu(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setMenuOpen(false);

    const needsExactReturn =
      href === "/products?view=all" || href.includes("category=");

    if (!needsExactReturn) return;

    event.preventDefault();

    const current = new URL(window.location.href);
    current.searchParams.delete("returnTo");
    const returnTo = `${current.pathname}${current.search}${current.hash}`;

    const target = new URL(href, window.location.origin);
    target.searchParams.set("returnTo", returnTo);
    router.push(`${target.pathname}${target.search}${target.hash}`);
  }

  return (
    <>
      <header
        data-site-header
        className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
          <button
            type="button"
            aria-label="開啟網站導覽"
            aria-expanded={menuOpen}
            aria-controls="site-navigation-drawer"
            title="網站導覽"
            onClick={() => setMenuOpen(true)}
            className="grid h-12 w-12 shrink-0 touch-manipulation place-items-center rounded-full bg-slate-100 text-2xl font-black transition hover:bg-slate-200 active:bg-slate-300"
          >
            ☰
          </button>

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
                forceFallback={backForceFallback}
              />
            </div>
            <div className="hidden px-3 pb-2 md:flex min-[1200px]:hidden">
              <HomeButtonLink />
            </div>
          </>
        ) : showBackButton ? (
          <HeaderBackButton
            fallbackHref={backFallbackHref}
            label={backLabel}
            forceFallback={backForceFallback}
          />
        ) : (
          showHomeButton && <HeaderHomeButton />
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button
            type="button"
            aria-label="關閉網站導覽"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/45"
          />
          <aside
            id="site-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="網站導覽"
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-[390px] flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-xl font-black text-emerald-700">世界好用</div>
                <div className="mt-0.5 text-sm font-bold text-slate-500">快速前往網站各區</div>
              </div>
              <button
                type="button"
                aria-label="關閉導覽"
                onClick={() => setMenuOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-2xl font-black text-slate-700"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="網站主要導覽">
              {navigationItems.map((item, index) => {
                const showDivider = item.group === "category" && navigationItems[index - 1]?.group !== "category";
                return (
                  <div key={item.label}>
                    {showDivider && (
                      <div className="mb-2 mt-3 border-t border-slate-200 px-3 pt-4 text-sm font-black text-slate-500">
                        商品分類
                      </div>
                    )}
                    <Link
                      href={item.href}
                      onClick={(event) => navigateFromMenu(event, item.href)}
                      className={`flex min-h-12 items-center justify-between rounded-xl px-4 py-3 font-black transition active:bg-emerald-100 ${
                        item.group === "main"
                          ? "text-base text-slate-900 hover:bg-emerald-50"
                          : "text-[15px] leading-6 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span aria-hidden="true" className="text-emerald-600">›</span>
                    </Link>
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
