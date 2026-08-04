"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HomepageBanner } from "@/lib/banners";

type Props = {
  banners: HomepageBanner[];
};

export default function Banner({ banners }: Props) {
  const slides = banners;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const active = slides[activeIndex] ?? slides[0];
  const external = /^(https?:\/\/|mailto:|tel:)/i.test(active.href);

  function previous() {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function next() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  const buttonClass =
    "mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/70 bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:mt-5 sm:min-h-12 sm:px-6 sm:py-3 sm:text-base";

  return (
    <section
      className="hero-banner-v18 relative min-h-[280px] overflow-hidden rounded-2xl bg-white shadow-md sm:min-h-[300px] lg:min-h-[320px]"
      aria-label="首頁活動 Banner"
    >
      {active.imageUrl ? (
        <div
          data-banner-background
          className="absolute inset-0 overflow-hidden bg-white"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.imageUrl}
            alt=""
            data-banner-image="full"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="hero-cookware" aria-hidden="true">
          <span className="hero-pot">🍲</span>
          <span className="hero-pan">🍳</span>
          <span className="hero-knife">🔪</span>
        </div>
      )}

      <div
        data-banner-mobile-overlay
        className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-[280px] max-w-xl flex-col justify-end px-5 pb-16 pt-20 sm:min-h-[300px] sm:px-8 sm:pb-16 sm:pt-16 lg:min-h-[320px] lg:max-w-2xl lg:px-10 lg:pb-16 lg:pt-16">
        <p className="text-sm font-black tracking-[0.14em] text-emerald-200 sm:text-base lg:text-emerald-100">世界好用精選</p>
        {active.title && (
          <h1 className="mt-2 max-w-[92%] whitespace-pre-line text-[2rem] font-black leading-[1.1] text-white drop-shadow-sm sm:mt-3 sm:text-[2.25rem] lg:text-[2.6rem]">
            {active.title}
          </h1>
        )}
        {active.subtitle && (
          <p className="mt-2 max-w-[95%] whitespace-pre-line text-base font-bold leading-6 text-white/95 sm:mt-3 sm:text-lg sm:leading-7 lg:max-w-[85%]">
            {active.subtitle}
          </p>
        )}
        {active.buttonText &&
          (external ? (
            <a href={active.href} target="_blank" rel="noreferrer" className={buttonClass}>
              {active.buttonText}<span aria-hidden="true">→</span>
            </a>
          ) : (
            <Link href={active.href} className={buttonClass}>
              {active.buttonText}<span aria-hidden="true">→</span>
            </Link>
          ))}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-black tracking-[0.08em] text-emerald-700 shadow sm:bottom-4 sm:text-sm">
        往下滑看更多商品 ↓
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="上一張 Banner"
            className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-3xl font-black text-stone-700 shadow transition hover:bg-white sm:grid"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="下一張 Banner"
            className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-3xl font-black text-stone-700 shadow transition hover:bg-white sm:grid"
          >
            ›
          </button>
          <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-14" aria-label="Banner 頁次">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`顯示第 ${index + 1} 張 Banner`}
                aria-current={index === activeIndex}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-emerald-600" : "w-2.5 bg-white/90 shadow"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
