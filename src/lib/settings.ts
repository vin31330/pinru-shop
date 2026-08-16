import { unstable_cache } from "next/cache";
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
  announcementTickerEnabled: boolean;
  announcementTickerText: string;
  announcementTickerSpeed: number;
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
  announcementTickerEnabled: false,
  announcementTickerText: "",
  announcementTickerSpeed: 28,
};

function positiveInteger(value: string, fallback: number): number {
  const parsed = Math.floor(Number(value.replace(/[,\s]/g, "")));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function buildSiteSettings(): Promise<SiteSettings> {
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
  const readString = (key: string, fallback = "") =>
    (values.get(key.toLowerCase()) ?? fallback).trim();
  const readBoolean = (key: string, fallback: boolean) => {
    const raw = readString(key).toLowerCase();
    if (!raw) return fallback;
    if (["true", "yes", "y", "1", "是", "顯示", "啟用", "開啟"].includes(raw)) return true;
    if (["false", "no", "n", "0", "否", "不顯示", "停用", "關閉"].includes(raw)) return false;
    return fallback;
  };

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
    announcementTickerEnabled: readBoolean("AnnouncementTickerEnabled", DEFAULT_SETTINGS.announcementTickerEnabled),
    announcementTickerText: readString("AnnouncementTickerText", DEFAULT_SETTINGS.announcementTickerText),
    announcementTickerSpeed: read("AnnouncementTickerSpeed", DEFAULT_SETTINGS.announcementTickerSpeed),
  };
}

const getSiteSettingsCached = unstable_cache(
  buildSiteSettings,
  ["pinru-site-settings-v7-5-2"],
  { revalidate: 60 },
);

export async function getSiteSettings(): Promise<SiteSettings> {
  return getSiteSettingsCached();
}

// Used by endpoints that must reflect Settings immediately instead of reusing
// the persistent Next.js settings cache. The sheet fetch itself still has its
// own short revalidation window.
export async function getSiteSettingsFresh(): Promise<SiteSettings> {
  return buildSiteSettings();
}

