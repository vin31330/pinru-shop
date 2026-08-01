import {
  isExplicitlyHidden,
  normalizePublicUrl,
  readSheet,
  SHEET_NAMES,
  valueFrom,
} from "@/lib/googleSheets";

export type HomepageBanner = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  href: string;
};

function parseDate(value: string, endOfDay = false): Date | undefined {
  const text = value.trim();
  if (!text) return undefined;

  const normalized = text
    .replace(/[年月.]/g, "/")
    .replace(/日/g, "")
    .replace(/-/g, "/");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;

  if (endOfDay && !/\d{1,2}:\d{2}/.test(text)) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function isActiveDateRange(startText: string, endText: string): boolean {
  const now = new Date();
  const start = parseDate(startText);
  const end = parseDate(endText, true);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function normalizeHref(value: string): string {
  const href = value.trim();
  if (!href) return "/products";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  return href.startsWith("/") ? href : `/${href}`;
}

export async function getPublishedBanners(): Promise<HomepageBanner[]> {
  const rows = await readSheet(SHEET_NAMES.homepageBanners).catch(() => []);

  return rows
    .map((row, index): HomepageBanner | null => {
      if (isExplicitlyHidden(valueFrom(row, ["顯示狀態", "顯示"]))) return null;
      if (
        !isActiveDateRange(
          valueFrom(row, ["開始日期"]),
          valueFrom(row, ["結束日期"]),
        )
      ) {
        return null;
      }

      const title = valueFrom(row, ["標題"]);
      const subtitle = valueFrom(row, ["副標題"]);
      const imageUrl = normalizePublicUrl(
        valueFrom(row, ["網站圖片網址", "圖片網址", "圖片"]),
      );
      const buttonText = valueFrom(row, ["按鈕文字"]);
      const href = normalizeHref(valueFrom(row, ["連結", "按鈕連結"]));

      if (!title && !subtitle && !imageUrl) return null;

      return {
        id: valueFrom(row, ["BannerID", "Banner ID", "ID"]) || `banner-${index + 1}`,
        order: Number(valueFrom(row, ["排序"])) || 999,
        title,
        subtitle,
        imageUrl,
        buttonText,
        href,
      };
    })
    .filter((banner): banner is HomepageBanner => banner !== null)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "zh-Hant", { numeric: true }));
}
