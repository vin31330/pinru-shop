import { notFound } from "next/navigation";
import AddToCartPanel from "@/components/AddToCartPanel";
import { FloatingBackButton } from "@/components/BackButton";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductGallery from "@/components/ProductGallery";
import { getProductById } from "@/lib/products";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const currency = new Intl.NumberFormat("zh-TW");

function formatOfferDate(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value.replace(/-/g, "/"));
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(decodeURIComponent(id));

  if (!product) {
    notFound();
  }

  const media = Array.isArray(product.media)
    ? product.media
    : [];

  const tags = Array.isArray(product.tags)
    ? product.tags
    : [];

  // 系統的限時優惠標籤只由 Products「限時優惠」欄位控制，
  // 不讓一般商品標籤產生另一個同名顯示。
  const visibleTags = tags.filter((tag) => !tag.includes("限時優惠"));

  const options = Array.isArray(product.options)
    ? product.options
    : [];

  return (
    <main className="min-h-screen bg-slate-50">
      <Header showBackButton backFallbackHref="/products" />
      <FloatingBackButton fallbackHref="/products" />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ProductGallery
            productName={product.name}
            mainImage={product.mainImage}
            media={media}
          />

          <section>
            {product.limitedOffer && product.offerActive && (
              <div className="mb-3 w-fit rounded-full bg-rose-100 px-3 py-1.5 text-sm font-black text-rose-700">
                限時優惠
              </div>
            )}

            <h1 className="text-3xl font-black">
              {product.name}
            </h1>

            {product.subtitle && (
              <p className="mt-2 text-lg font-bold leading-7 text-slate-500">
                {product.subtitle}
              </p>
            )}

            <div className="my-5">
              {product.salePrice ? (
                <>
                  <div className="text-sm text-slate-400 line-through">
                    原價 NT${currency.format(product.basePrice ?? product.price)}
                  </div>

                  <div className="text-3xl font-black text-rose-600">
                    特價 NT$
                    {currency.format(product.salePrice)}
                  </div>
                </>
              ) : (
                <div className="text-3xl font-black text-emerald-700">
                  NT${currency.format(product.price)}
                </div>
              )}

              {product.limitedOffer && product.offerStatus === "active" && (product.offerStartDate || product.offerEndDate) && (
                <p className="mt-2 text-sm font-bold text-rose-700">
                  優惠期間：
                  {product.offerStartDate ? formatOfferDate(product.offerStartDate) : "現在起"}
                  ～
                  {product.offerEndDate ? formatOfferDate(product.offerEndDate) : "售完為止"}
                </p>
              )}

              {product.limitedOffer && product.offerStatus === "upcoming" && product.offerStartDate && (
                <p className="mt-2 text-sm font-bold text-amber-700">
                  優惠將於 {formatOfferDate(product.offerStartDate)} 開始
                </p>
              )}

              {product.limitedOffer && product.offerStatus === "ended" && (
                <p className="mt-2 text-sm text-slate-500">本商品限時優惠已結束。</p>
              )}
            </div>

            <a
              href="#product-purchase"
              className="mb-5 flex min-h-14 touch-manipulation items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 text-center text-lg font-black text-white active:bg-emerald-700 min-[1200px]:hidden"
            >
              選擇規格、數量並加入購物車 ↓
            </a>

            <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
              {product.description ||
                "商品詳細內容請洽 LINE 官方帳號。"}
            </p>

            {visibleTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <AddToCartPanel
              purchaseId="product-purchase"
              product={{
                ...product,
                media,
                tags,
                options,
              }}
            />
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
