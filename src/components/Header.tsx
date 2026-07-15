"use client";

import { useState } from "react";

export default function Header() {
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          aria-label="開啟選單"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl"
        >
          ☰
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black tracking-tight text-emerald-700">
            品儒生活館
          </div>
          <div className="text-xs text-slate-500">鍋具・五金・生活百貨</div>
        </div>

        <button
          aria-label="購物車"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-xl text-white shadow-sm"
        >
          🛒
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
            0
          </span>
        </button>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6">
        <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-inner">
          <span aria-hidden="true">🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋商品名稱、分類或關鍵字"
            className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      <nav className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-2 text-sm sm:px-6">
          {["限時優惠", "熱銷商品", "新品", "全部分類"].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700"
            >
              {item}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
