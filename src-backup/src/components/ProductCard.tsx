import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

export default function ProductCard({ product }: { product: Product }) {
  const activePrice = product.salePrice ?? product.price;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link href={`/products/${encodeURIComponent(product.id)}`}>
        <ProductImage
          src={product.mainImage}
          alt={product.name}
          className="aspect-square w-full"
        />
      </Link>

      <div className="p-3">
        <div className="mb-2 flex min-h-6 flex-wrap gap-1">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          href={`/products/${encodeURIComponent(product.id)}`}
          className="line-clamp-2 min-h-12 font-bold leading-6"
        >
          {product.name}
        </Link>

        {product.salePrice ? (
          <div className="mt-2">
            <div className="text-xs text-slate-400 line-through">
              NT${currency.format(product.price)}
            </div>
            <div className="text-lg font-black text-rose-600">
              NT${currency.format(activePrice)}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-lg font-black text-emerald-700">
            NT${currency.format(activePrice)}
          </div>
        )}

        <Link
          href={`/products/${encodeURIComponent(product.id)}`}
          className="mt-3 block w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white"
        >
          查看商品
        </Link>
      </div>
    </article>
  );
}
