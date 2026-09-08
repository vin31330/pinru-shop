import type { Metadata } from "next";
import ProductsPage from "@/app/products/page";
import { getPublishedCategories } from "@/lib/categories";
import { categoryNameFromSlug } from "@/lib/paths";
import { absoluteShareImage, DEFAULT_SHARE_IMAGE, SITE_NAME, cleanDescription } from "@/lib/shareMetadata";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getPublishedCategories();
  const decodedSlug = decodeURIComponent(slug);
  const resolved = categoryNameFromSlug(decodedSlug) || decodedSlug;
  const category = categories.find((item) => item.id === resolved || item.name === resolved);
  const title = category?.name || resolved || "商品分類";
  const description = `瀏覽「${title}」分類商品。`;
  return {
    title,
    description: cleanDescription(description),
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: `https://pinru-shop.netlify.app/c/${encodeURIComponent(slug)}`,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteShareImage(DEFAULT_SHARE_IMAGE), width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [absoluteShareImage(DEFAULT_SHARE_IMAGE)] },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return ProductsPage({ searchParams: Promise.resolve({ category: decodeURIComponent(slug) }) });
}
