export const SITE_URL = "https://pinru-shop.netlify.app";
export const DEFAULT_SHARE_IMAGE = "/og-image-orange-v2.png";
export const SITE_NAME = "世界好用 小新和品儒";
export const SITE_DESCRIPTION =
  "世界好用 小新和品儒｜鍋具、五金、生活百貨，市場精選商品，提供多元商品與優惠活動，線上快速下單。";

export function absoluteShareImage(image?: string): string {
  const value = String(image || "").trim();
  if (!value) return new URL(DEFAULT_SHARE_IMAGE, SITE_URL).toString();

  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return new URL(DEFAULT_SHARE_IMAGE, SITE_URL).toString();
  }
}

export function cleanDescription(value: string | undefined, fallback = SITE_DESCRIPTION): string {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}
