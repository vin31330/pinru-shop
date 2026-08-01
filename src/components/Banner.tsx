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
    "mt-5 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border border-white/70 bg-emerald-600 px-6 py-3 text-base font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:mt-6";

  return (
    <section
      className="hero-banner-v18 relative min-h-[360px] overflow-hidden rounded-2xl bg-white shadow-md sm:min-h-[390px]"
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
        className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent sm:hidden"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-[360px] max-w-xl flex-col justify-end px-6 pb-10 pt-24 sm:min-h-[390px] sm:justify-center sm:p-10 lg:p-14">
        <p className="text-base font-black tracking-[0.16em] text-emerald-200 sm:text-emerald-700">世界好用精選</p>
        {active.title && (
          <h1 className="mt-3 max-w-[90%] whitespace-pre-line text-[2.5rem] font-black leading-[1.15] text-white drop-shadow-sm sm:text-5xl sm:text-stone-900 sm:drop-shadow-none">
            {active.title}
          </h1>
        )}
        {active.subtitle && (
          <p className="mt-3 max-w-[92%] whitespace-pre-line text-lg font-bold leading-7 text-white/95 sm:mt-4 sm:text-stone-700">
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
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2" aria-label="Banner 頁次">
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
