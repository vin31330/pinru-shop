"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { productDescriptionText } from "@/lib/productDescriptionText";
import { rememberReturnPosition } from "@/lib/returnPosition";
import { productPath } from "@/lib/paths";
import { Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

function HotRankLabel({ rank }: { rank: number }) {
  const podiumStyles = [
    {
      title: "熱銷冠軍",
      background: "linear-gradient(90deg, #fde9a9 0%, #fff8dc 64%, #ffffff 100%)",
      accent: "#9a6700",
      text: "#694500",
      border: "#ddb94f",
    },
    {
      title: "熱銷亞軍",
      background: "linear-gradient(90deg, #dce3eb 0%, #f4f7fa 64%, #ffffff 100%)",
      accent: "#475569",
      text: "#334155",
      border: "#a8b4c3",
    },
    {
      title: "熱銷季軍",
      background: "linear-gradient(90deg, #f6c89f 0%, #fff0e2 64%, #ffffff 100%)",
      accent: "#9a4f20",
      text: "#743918",
      border: "#d89b6c",
    },
  ];

  const podium = podiumStyles[rank - 1];
  const title = podium?.title ?? "熱銷排行";
  const background = podium?.background ?? "linear-gradient(90deg, #dfe7ff 0%, #f1f4ff 64%, #ffffff 100%)";
  const accent = podium?.accent ?? "#4338ca";
  const text = podium?.text ?? "#312e81";
  const border = podium?.border ?? "#a5b4fc";

  return (
    <div
      aria-label={`熱銷第 ${rank} 名`}
      className="flex h-10 items-center justify-between border-b px-2.5 sm:px-3"
      style={{ background, borderColor: border, color: text }}
    >
      <span className="flex min-w-0 items-center gap-2 text-[13px] font-black tracking-wide sm:text-sm">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rotate-45 rounded-[2px]"
          style={{ background: accent }}
        />
        <span className="truncate">{title}</span>
      </span>
      <span
        className="ml-2 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black tracking-wide text-white shadow-sm sm:text-xs"
        style={{ background: accent, borderColor: accent }}
      >
        NO.{rank}
      </span>
    </div>
  );
}

export default function ProductCard({
  product,
  large = false,
  href,
  rank,
}: {
  product: Product;
  large?: boolean;
  href?: string;
  rank?: number;
}) {
  const price = product.salePrice ?? product.price;
  const originalPrice = product.basePrice ?? product.price;
  const productHref = href || productPath(product.id, product.name);
  const purchaseHref = `${productHref}#product-purchase`;
  const descriptionPreview = productDescriptionText(product.description);

  return (
    <article className={`product-card ${large ? "product-card--large" : ""}`}>
      {rank && rank > 0 ? <HotRankLabel rank={rank} /> : null}
      <Link
        href={productHref}
        onClick={() => rememberReturnPosition(productHref)}
        className="block"
      >
        <ProductImage
          src={product.mainImage}
          alt={product.name}
          className={`w-full bg-white ${large ? "aspect-[1/1.08]" : "aspect-square"}`}
        />
      </Link>
      <div className="flex min-h-[184px] flex-col p-4">
        {product.limitedOffer && product.offerActive && (
          <div className="mb-2 w-fit rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">
            限時優惠
          </div>
        )}
        <Link
          href={productHref}
          onClick={() => rememberReturnPosition(productHref)}
          className="line-clamp-2 min-h-14 text-lg font-black leading-7 text-slate-900"
        >
          {product.name}
        </Link>
        {product.subtitle ? (
          <p className="mt-1 line-clamp-2 text-base leading-6 text-slate-500">
            {product.subtitle}
          </p>
        ) : descriptionPreview ? (
          <p className="mt-1 line-clamp-1 text-base text-slate-500">{descriptionPreview}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {product.salePrice ? (
            <div>
              <div className="text-xs text-slate-400 line-through">
                NT${currency.format(originalPrice)}
              </div>
              <div className="text-[28px] font-black leading-tight text-rose-600">NT${currency.format(price)}</div>
            </div>
          ) : (
            <div className="text-[28px] font-black leading-tight text-rose-600">NT${currency.format(price)}</div>
          )}
          <Link
            aria-label={`查看 ${product.name}`}
            href={purchaseHref}
            onClick={() => rememberReturnPosition(purchaseHref)}
            title="選擇商品"
            className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-xl shadow-sm hover:border-emerald-500 min-[1200px]:grid"
          >
            🛒
          </Link>
        </div>
        <Link
          aria-label={`選擇 ${product.name} 並加入購物車`}
          href={purchaseHref}
          onClick={() => rememberReturnPosition(purchaseHref)}
          className="mt-3 flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-xl bg-emerald-600 px-2 py-2.5 text-center text-base font-black leading-5 text-white active:bg-emerald-700 min-[1200px]:hidden"
        >
          <span aria-hidden="true">🛒</span>
          <span>選擇商品</span>
        </Link>
      </div>
    </article>
  );
}
