import {
  isExplicitlyHidden,
  normalizePublicUrl,
  readSheet,
  SHEET_NAMES,
  valueFrom,
} from "@/lib/googleSheets";
import { ProductCategory } from "@/types/product";

export async function getPublishedCategories(): Promise<ProductCategory[]> {
  const rows = await readSheet(SHEET_NAMES.categories).catch(() => []);

  return rows
    .map((row): ProductCategory | null => {
      if (isExplicitlyHidden(valueFrom(row, ["顯示狀態", "顯示"]))) return null;
      const id = valueFrom(row, ["分類ID"]);
      const name = valueFrom(row, ["分類名稱"]);
      if (!name) return null;
      return {
        id: id || name,
        name,
        order: Number(valueFrom(row, ["排序"])) || 999,
        icon: normalizePublicUrl(valueFrom(row, ["圖示"])) || undefined,
      };
    })
    .filter((category): category is ProductCategory => category !== null)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "zh-Hant"));
}
