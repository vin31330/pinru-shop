import type { Metadata } from "next";
import ProductsPage from "@/app/products/page";
import { getPublishedProducts } from "@/lib/products";
import { absoluteShareImage, DEFAULT_SHARE_IMAGE, SITE_NAME, cleanDescription } from "@/lib/shareMetadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const products = await getPublishedProducts();
  const firstNew = products.find((product) => product.isNew && !product.activityExclusive);
  const title = "新品推薦";
  const description = "看看最近加入的新品推薦，挑選最新商品。";
  const image = firstNew?.mainImage || DEFAULT_SHARE_IMAGE;
  return {
    title,
    description: cleanDescription(description),
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: "https://pinru-shop.netlify.app/new",
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteShareImage(image), width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [absoluteShareImage(image)] },
  };
}

export default function NewProductsPage() {
  return ProductsPage({ searchParams: Promise.resolve({ section: "new" }) });
}
