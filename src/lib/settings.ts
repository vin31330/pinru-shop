import { readSheet, SHEET_NAMES, valueFrom } from "@/lib/googleSheets";

export type SiteSettings = {
  homeBannerCount: number;
  homeActivityCount: number;
  homeHotCount: number;
  homeNewCount: number;
  homeNewMax: number;
  newProductDays: number;
  homeCategoryCount: number;
  productPageSize: number;
  searchPageSize: number;
};

const DEFAULT_SETTINGS: SiteSettings = {
  homeBannerCount: 5,
  homeActivityCount: 5,
  homeHotCount: 5,
  homeNewCount: 5,
  homeNewMax: 20,
  newProductDays: 30,
  homeCategoryCount: 8,
  productPageSize: 20,
  searchPageSize: 20,
};

function positiveInteger(value: string, fallback: number): number {
  const parsed = Math.floor(Number(value.replace(/[,\s]/g, "")));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await readSheet(SHEET_NAMES.settings).catch(() => []);
  const values = new Map<string, string>();

  for (const row of rows) {
    const enabled = valueFrom(row, ["顯示狀態"]);
    if (["false", "no", "n", "0", "否", "不顯示", "隱藏", "停用"].includes(enabled.trim().toLowerCase())) {
      continue;
    }

    const key = valueFrom(row, ["設定鍵", "Key", "設定名稱"]).trim();
    if (!key) continue;
    values.set(key.toLowerCase(), valueFrom(row, ["設定值", "Value", "值"]));
  }

  const read = (key: string, fallback: number) =>
    positiveInteger(values.get(key.toLowerCase()) ?? "", fallback);

  return {
    homeBannerCount: read("HomeBannerCount", DEFAULT_SETTINGS.homeBannerCount),
    homeActivityCount: read("HomeActivityCount", DEFAULT_SETTINGS.homeActivityCount),
    homeHotCount: read("HomeHotCount", DEFAULT_SETTINGS.homeHotCount),
    homeNewCount: read("HomeNewCount", DEFAULT_SETTINGS.homeNewCount),
    homeNewMax: read("HomeNewMax", DEFAULT_SETTINGS.homeNewMax),
    newProductDays: read("NewProductDays", DEFAULT_SETTINGS.newProductDays),
    homeCategoryCount: read("HomeCategoryCount", DEFAULT_SETTINGS.homeCategoryCount),
    productPageSize: read("ProductPageSize", DEFAULT_SETTINGS.productPageSize),
    searchPageSize: read("SearchPageSize", DEFAULT_SETTINGS.searchPageSize),
  };
}
