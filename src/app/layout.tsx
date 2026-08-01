import type { Metadata } from "next";
import "./globals.css";

const siteName = "世界好用 小新和品儒";
const siteDescription =
  "世界好用 小新和品儒｜鍋具、五金、生活百貨，市場精選商品，提供多元商品與優惠活動，線上快速下單。";
const siteUrl = "https://pinru-shop.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteName,
    template: `%s｜${siteName}`,
  },

  description: siteDescription,
  applicationName: siteName,

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },

  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteName}｜鍋具、五金、生活百貨`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
