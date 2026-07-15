import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "品儒生活館",
  description: "鍋具、五金與生活百貨線上商品目錄",
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
