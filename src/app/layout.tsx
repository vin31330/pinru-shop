import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GlobalTicker from "@/components/GlobalTicker";
import "./globals.css";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/shareMetadata";

const siteName = SITE_NAME;
const siteDescription = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL("https://pinru-shop.netlify.app"),

  title: {
    default: siteName,
    template: `%s｜${siteName}`,
  },

  description: siteDescription,
  applicationName: siteName,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico?v=20260807" },
      { url: "/icon-192.png?v=20260807", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=20260807", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=20260807", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico?v=20260807"],
  },

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


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim() || "G-H7SYMPPBX9";
  return (
    <html lang="zh-Hant" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://drive.google.com" />
        <link rel="dns-prefetch" href="https://www.appsheet.com" />
      </head>
      <body>
        {gaId && (
          <Suspense fallback={null}>
            <GoogleAnalytics gaId={gaId} />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <GlobalTicker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
