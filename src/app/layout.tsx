import type { Metadata } from "next";
import "./globals.css";

const siteName = "世界好用 小新和品儒";
const siteDescription =
  "世界好用 小新和品儒｜鍋具、五金、生活百貨，市場精選商品，提供多元商品與優惠活動，線上快速下單。";

export const metadata: Metadata = {
  metadataBase: new URL("https://pinru-shop.netlify.app"),

  title: {
    default: siteName,
    template: `%s｜${siteName}`,
  },

  description: siteDescription,
  applicationName: siteName,

  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://pinru-shop.netlify.app",
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: "/og-image-orange-v2.png",
        width: 1200,
        height: 630,
        alt: "世界好用 小新和品儒",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og-image-orange-v2.png"],
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