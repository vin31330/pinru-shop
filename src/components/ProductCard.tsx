"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { rememberReturnPosition } from "@/lib/returnPosition";
import { Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

export default function ProductCard({
  product,
  large = false,
  href,
}: {
  product: Product;
  large?: boolean;
  href?: string;
}) {
  const price = product.salePrice ?? product.price;
  const originalPrice = product.basePrice ?? product.price;
  const productHref = href || `/products/${encodeURIComponent(product.id)}`;
  const purchaseHref = `${productHref}#product-purchase`;

  return (
    <article className={`product-card ${large ? "product-card--large" : ""}`}>
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
        ) : product.description ? (
          <p className="mt-1 line-clamp-1 text-base text-slate-500">{product.description}</p>
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
