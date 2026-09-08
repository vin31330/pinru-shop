import type { Metadata } from "next";
import ProductsPage from "@/app/products/page";
import { absoluteShareImage, DEFAULT_SHARE_IMAGE, SITE_NAME, cleanDescription } from "@/lib/shareMetadata";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "商品分類",
  description: "瀏覽世界好用 小新和品儒的商品分類。",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://pinru-shop.netlify.app/categories",
    siteName: SITE_NAME,
    title: "商品分類",
    description: cleanDescription("瀏覽世界好用 小新和品儒的商品分類。"),
    images: [{ url: absoluteShareImage(DEFAULT_SHARE_IMAGE), width: 1200, height: 630, alt: "商品分類" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "商品分類",
    description: "瀏覽世界好用 小新和品儒的商品分類。",
    images: [absoluteShareImage(DEFAULT_SHARE_IMAGE)],
  },
};

export default function CategoriesPage() {
  return ProductsPage({ searchParams: Promise.resolve({}) });
}
