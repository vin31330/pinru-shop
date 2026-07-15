"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import CartCount from "@/components/CartCount";

export default function Header() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/products"
          aria-label="全部商品"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl"
        >
          ☰
        </Link>

        <Link href="/" className="min-w-0 flex-1">
          <div className="truncate text-lg font-black tracking-tight text-emerald-700">
            品儒生活館
          </div>
          <div className="text-xs text-slate-500">鍋具・五金・生活百貨</div>
        </Link>

        <Link
          href="/cart"
          aria-label="購物車"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-xl text-white shadow-sm"
        >
          🛒
          <CartCount />
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6"
      >
        <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-inner">
          <span aria-hidden="true">🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋商品名稱、分類或關鍵字"
            className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
          />
        </label>
      </form>

      <nav className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-2 text-sm sm:px-6">
          <Link className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 font-semibold" href="/#限時優惠">
            限時優惠
          </Link>
          <Link className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 font-semibold" href="/#熱銷商品">
            熱銷商品
          </Link>
          <Link className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 font-semibold" href="/#新品">
            新品
          </Link>
          <Link className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 font-semibold" href="/products">
            全部商品
          </Link>
        </div>
      </nav>
    </header>
  );
}
