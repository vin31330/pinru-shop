import {
  isExplicitlyHidden,
  normalizePublicUrl,
  readSheet,
  SHEET_NAMES,
  toBoolean,
  valueFrom,
} from "@/lib/googleSheets";
import { getPublishedProducts } from "@/lib/products";
import { Activity, ActivityProduct } from "@/types/activity";
import { normalizeActivityType } from "@/lib/promotionEngine";

function parseNumber(value: string): number {
  const parsed = Number(value.replace(/[,元$\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value: string, endOfDay = false): Date | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const normalized = text.replace(/[年月\.]/g, "/").replace(/日/g, "").replace(/-/g, "/");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && !/\d{1,2}:\d{2}/.test(text)) date.setHours(23, 59, 59, 999);
  return date;
}

function activityStatus(start?: Date, end?: Date): Activity["status"] {
  const now = new Date();
  if (start && now < start) return "upcoming";
  if (end && now > end) return "ended";
  return "active";
}

/**
 * Google Sheets/AppSheet 的圖片欄位可能是：
 * 1. 一般 https 網址
 * 2. =IMAGE("https://...")
 * 3. =HYPERLINK("https://...", "圖片")
 * 4. 前後帶引號或空白的網址
 */
function normalizeActivityImage(value: string): string {
  const text = value.trim();
  if (!text) return "";

  const formulaUrl = text.match(/(?:IMAGE|HYPERLINK)\s*\(\s*["'](https?:\/\/[^"']+)["']/i)?.[1];
  if (formulaUrl) return normalizePublicUrl(formulaUrl.replace(/&amp;/g, "&"));

  const embeddedUrl = text.match(/https?:\/\/[^\s"')]+/i)?.[0];
  if (embeddedUrl) return normalizePublicUrl(embeddedUrl.replace(/&amp;/g, "&"));

  const cleaned = text.replace(/^['"]|['"]$/g, "").replace(/&amp;/g, "&");
  const directUrl = normalizePublicUrl(cleaned);
  if (directUrl) return directUrl;

  // AppSheet 圖片欄位常存成相對路徑，例如：
  // Activities_Images/7fc65ddb.活動圖片.103512.jpg
  // 網站需透過 AppSheet 的 gettablefileurl 才能讀取。
  const appName =
    process.env.NEXT_PUBLIC_APPSHEET_APP_NAME?.trim() ||
    "小新和品儒商品目錄-461155583";
  if (/^(?:Activities_Images|[^/]+_Images)\//i.test(cleaned)) {
    const params = new URLSearchParams({
      appName,
      tableName: "Activities",
      fileName: cleaned,
    });
    return `https://www.appsheet.com/template/gettablefileurl?${params.toString()}`;
  }

  return "";
}

export async function getPublishedActivities(options?: { includeUpcoming?: boolean; includeEnded?: boolean }): Promise<Activity[]> {
  const [activityRows, relationRows, products] = await Promise.all([
    readSheet(SHEET_NAMES.activities).catch(() => []),
    readSheet(SHEET_NAMES.activityProducts).catch(() => []),
    getPublishedProducts(),
  ]);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const relationsByActivity = new Map<string, ActivityProduct[]>();

  for (const row of relationRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) continue;
    const activityId = valueFrom(row, ["活動ID"]);
    const productId = valueFrom(row, ["商品ID"]);
    const product = productMap.get(productId);
    if (!activityId || !productId || !product) continue;
    const max = parseNumber(valueFrom(row, ["每組最多選擇數"]));
    const relation: ActivityProduct = {
      id: valueFrom(row, ["活動商品ID"]) || `${activityId}-${productId}`,
      activityId,
      productId,
      order: parseNumber(valueFrom(row, ["顯示順序"])) || 999,
      allowRepeat: toBoolean(valueFrom(row, ["是否允許重複選"])),
      maxPerGroup: max > 0 ? max : undefined,
      role: valueFrom(row, ["商品角色"]) || "活動商品",
      activityProductPrice: (() => {
        const value = parseNumber(valueFrom(row, ["活動商品價格"]));
        return value > 0 ? value : undefined;
      })(),
      product,
    };
    const list = relationsByActivity.get(activityId) ?? [];
    list.push(relation);
    relationsByActivity.set(activityId, list);
  }

  return activityRows
    .map((row): Activity | null => {
      if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) return null;
      const id = valueFrom(row, ["活動ID"]);
      const name = valueFrom(row, ["活動名稱"]);
      const type = valueFrom(row, ["活動類型"]) || "MIX_MATCH";
      const requiredCount = parseNumber(valueFrom(row, ["需要件數"]));
      const triggerCount = parseNumber(valueFrom(row, ["觸發件數"]));
      const price = parseNumber(valueFrom(row, ["活動價格"]));
      const isMixMatch = normalizeActivityType(type) === "MIX_MATCH";
      if (!id || !name) return null;
      if (isMixMatch && (requiredCount < 1 || price <= 0)) return null;
      const start = parseDate(valueFrom(row, ["活動開始日期"]));
      const end = parseDate(valueFrom(row, ["活動結束日期"]), true);
      const status = activityStatus(start, end);
      if (status === "upcoming" && !options?.includeUpcoming) return null;
      if (status === "ended" && !options?.includeEnded) return null;

      const websiteImage = normalizeActivityImage(valueFrom(row, ["網站活動圖片網址", "活動圖片網址", "網站圖片網址"]));
      const appSheetImage = normalizeActivityImage(valueFrom(row, ["活動圖片", "圖片"]));

      return {
        id,
        name,
        subtitle: valueFrom(row, ["活動副標題"]),
        description: valueFrom(row, ["活動說明"]),
        type,
        requiredCount,
        triggerCount,
        price,
        discountMethod: valueFrom(row, ["優惠方式"]),
        discountValue: parseNumber(valueFrom(row, ["優惠值"])),
        discountTarget: valueFrom(row, ["優惠套用對象"]),
        discountItemIndex: parseNumber(valueFrom(row, ["優惠件序"])),
        repeatable: toBoolean(valueFrom(row, ["是否可重複套用"])),
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
        homeOrder: parseNumber(valueFrom(row, ["首頁排序"])) || 999,
        imageUrl: websiteImage || appSheetImage || undefined,
        selectOptionsPerItem: toBoolean(valueFrom(row, ["是否逐件選規格"])),
        products: (relationsByActivity.get(id) ?? []).sort((a, b) => a.order - b.order),
        status,
      };
    })
    .filter((activity): activity is Activity => activity !== null)
    .sort((a, b) => a.homeOrder - b.homeOrder);
}

export async function getActivityById(id: string): Promise<Activity | undefined> {
  const activities = await getPublishedActivities({ includeUpcoming: true, includeEnded: true });
  return activities.find((activity) => activity.id === id);
}
