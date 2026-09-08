import type { Metadata } from "next";
import ProductsPage from "@/app/products/page";
import { getPublishedProducts } from "@/lib/products";
import { absoluteShareImage, DEFAULT_SHARE_IMAGE, SITE_NAME, cleanDescription } from "@/lib/shareMetadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const products = await getPublishedProducts();
  const firstHot = [...products]
    .filter((product) => product.featured && !product.activityExclusive)
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))[0];
  const title = "熱銷商品";
  const description = "看看大家喜歡的熱銷商品，方便快速挑選。";
  const image = firstHot?.mainImage || DEFAULT_SHARE_IMAGE;
  return {
    title,
    description: cleanDescription(description),
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: "https://pinru-shop.netlify.app/hot",
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteShareImage(image), width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [absoluteShareImage(image)] },
  };
}

export default function HotProductsPage() {
  return ProductsPage({ searchParams: Promise.resolve({ section: "hot" }) });
}
