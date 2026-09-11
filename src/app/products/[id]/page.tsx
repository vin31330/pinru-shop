import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartPanel from "@/components/AddToCartPanel";
import ActivityProductConfigurator from "@/components/ActivityProductConfigurator";
import { FloatingBackButton } from "@/components/BackButton";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductGallery from "@/components/ProductGallery";
import RichProductDescription from "@/components/RichProductDescription";
import { getProductById } from "@/lib/products";
import { activityPath, FRIENDLY_PATHS } from "@/lib/paths";
import { getActivityById } from "@/lib/activities";
import { absoluteShareImage, SITE_NAME, cleanDescription } from "@/lib/shareMetadata";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(decodeURIComponent(id));
  if (!product) return {};

  const title = product.name;
  const description = cleanDescription(product.subtitle || product.description, `${product.name}｜世界好用 小新和品儒`);
  const image = product.mainImage || product.media.find((item) => item.type === "image")?.url;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: `https://pinru-shop.netlify.app/products/${encodeURIComponent(product.id)}`,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteShareImage(image), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteShareImage(image)],
    },
  };
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ activity?: string; relation?: string; returnTo?: string }>;
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

export async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const product = await getProductById(decodeURIComponent(id));

  if (!product) {
    notFound();
  }

  const activity = query.activity
    ? await getActivityById(decodeURIComponent(query.activity))
    : undefined;
  const activityRelation = activity?.products.find(
    (item) => item.id === query.relation && item.productId === product.id,
  );
  const activityReturnHref = query.returnTo?.startsWith("/")
    ? query.returnTo
    : activity
      ? activityPath(activity.id, activity.name)
      : FRIENDLY_PATHS.allProducts;
  const exclusiveActivityHref =
    product.activityExclusive && product.exclusiveActivityId
      ? activityPath(
          product.exclusiveActivityId,
          product.exclusiveActivityName || "優惠活動",
        )
      : undefined;
  const isExclusiveCatalogView = Boolean(exclusiveActivityHref && !activityRelation);
  const hasValidPrice = Number.isFinite(product.price) && product.price > 0;

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
      <Header showBackButton backFallbackHref={activityRelation ? activityReturnHref : FRIENDLY_PATHS.allProducts} />
      <FloatingBackButton fallbackHref={activityRelation ? activityReturnHref : FRIENDLY_PATHS.allProducts} />

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

            {isExclusiveCatalogView ? (
              <div
                id="product-purchase"
                className="my-5 rounded-3xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-amber-50 p-5 shadow-sm"
              >
                <div className="text-sm font-black tracking-wide text-rose-700">
                  活動期間限定
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  目前為活動限定商品
                </div>
                <p className="mt-2 leading-7 text-slate-700">
                  此商品目前只在「{product.exclusiveActivityName || "優惠活動"}」提供活動價購買，一般商品頁暫停下單。
                </p>
                <Link
                  href={exclusiveActivityHref!}
                  className="mt-4 flex min-h-14 touch-manipulation items-center justify-center rounded-2xl bg-rose-600 px-5 py-4 text-center text-lg font-black text-white shadow-sm transition hover:bg-rose-700 active:bg-rose-800"
                >
                  前往優惠活動購買 →
                </Link>
              </div>
            ) : (
            <div className="my-5">
              {!hasValidPrice ? (
                <div className="text-xl font-black text-amber-700">
                  請選擇規格
                </div>
              ) : product.salePrice ? (
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
            )}

            {!isExclusiveCatalogView && (
              <a
                href="#product-purchase"
                className="mb-5 flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-center text-lg font-black text-white active:bg-emerald-700 min-[1200px]:hidden"
              >
                <span aria-hidden="true">🛒</span>
                <span>選擇規格、數量並加入購物車 ↓</span>
              </a>
            )}

            <RichProductDescription description={product.description} />

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

            {activity && activityRelation ? (
              <ActivityProductConfigurator
                activityId={activity.id}
                activityName={activity.name}
                relationId={activityRelation.id}
                returnHref={activityReturnHref}
                product={{
                  ...product,
                  media,
                  tags,
                  options,
                }}
              />
            ) : isExclusiveCatalogView ? null : (
              <AddToCartPanel
                purchaseId="product-purchase"
                product={{
                  ...product,
                  media,
                  tags,
                  options,
                }}
              />
            )}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default ProductPage;
