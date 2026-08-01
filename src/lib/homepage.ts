import {
  isExplicitlyHidden,
  readSheet,
  SHEET_NAMES,
  valueFrom,
} from "@/lib/googleSheets";

export type HomepageEntry = {
  id: string;
  section: string;
  order: number;
  productId: string;
  activityId: string;
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

function normalizeSection(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export async function getHomepageEntries(): Promise<HomepageEntry[]> {
  const rows = await readSheet(SHEET_NAMES.homepageSections).catch(() => []);

  return rows
    .map((row, index): HomepageEntry | null => {
      if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) return null;

      if (
        !isActiveDateRange(
          valueFrom(row, ["開始日期"]),
          valueFrom(row, ["結束日期"]),
        )
      ) {
        return null;
      }

      const section = normalizeSection(valueFrom(row, ["區塊"]));
      const productId = valueFrom(row, ["商品ID"]);
      const activityId = valueFrom(row, ["活動ID"]);

      // 新版 HomepageSections 只管理「熱銷」與「活動」。
      if (section !== "熱銷" && section !== "活動") return null;
      if (section === "熱銷" && !productId) return null;
      if (section === "活動" && !activityId) return null;

      return {
        id: valueFrom(row, ["首頁項目ID", "ID"]) || `home-${index + 1}`,
        section,
        order: Number(valueFrom(row, ["排序"])) || 999,
        productId,
        activityId,
      };
    })
    .filter((entry): entry is HomepageEntry => entry !== null)
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.id.localeCompare(b.id, "zh-Hant", { numeric: true }),
    );
}

export async function getHomepageProductEntries(): Promise<HomepageEntry[]> {
  const entries = await getHomepageEntries();
  return entries.filter(
    (entry) => entry.section === "熱銷" && Boolean(entry.productId),
  );
}

export async function getHomepageActivityEntries(): Promise<HomepageEntry[]> {
  const entries = await getHomepageEntries();
  return entries.filter(
    (entry) => entry.section === "活動" && Boolean(entry.activityId),
  );
}
