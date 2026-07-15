const SHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ??
  "17Bv1TJ5YMh6diWQKV-rauBLzZn5GB-jFZ20gGr8b5Js";

export const SHEET_NAMES = {
  products: "products",
  media: "product Media",
  options: "Product Options",
} as const;

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);

  return rows;
}

function cleanCell(value: string) {
  return value.replace(/^\uFEFF/, "").trim();
}

export async function readSheet(
  sheetName: string,
): Promise<Record<string, string>[]> {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "text/csv,text/plain,*/*" },
  });

  if (!response.ok) {
    throw new Error(
      `無法讀取工作表「${sheetName}」，HTTP ${response.status}。`,
    );
  }

  const csv = await response.text();

  if (
    csv.includes("<!DOCTYPE html") ||
    csv.includes("ServiceLogin") ||
    csv.includes("accounts.google.com")
  ) {
    throw new Error(`工作表「${sheetName}」目前不是公開可讀取狀態。`);
  }

  const rows = parseCsv(csv).map((row) => row.map(cleanCell));

  const headerIndex = rows.findIndex((row) =>
    row.some((cell) =>
      ["商品ID", "媒體ID", "規格ID", "分類ID", "訂單ID"].includes(cell),
    ),
  );

  const effectiveHeaderIndex = headerIndex >= 0 ? headerIndex : 0;
  const headers = rows[effectiveHeaderIndex] ?? [];

  return rows.slice(effectiveHeaderIndex + 1).map((cells) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        cleanCell(cells[index] ?? ""),
      ]),
    ),
  );
}

export function valueFrom(
  row: Record<string, string>,
  aliases: string[],
): string {
  for (const alias of aliases) {
    const exact = row[alias];
    if (exact !== undefined && exact !== "") return exact;

    const matchedKey = Object.keys(row).find(
      (key) => key.trim().toLowerCase() === alias.trim().toLowerCase(),
    );

    if (matchedKey && row[matchedKey] !== "") return row[matchedKey];
  }

  return "";
}

export function toBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return [
    "true",
    "yes",
    "y",
    "1",
    "是",
    "顯示",
    "顯示中",
    "上架",
    "上架中",
    "啟用",
    "公開",
  ].includes(normalized);
}

export function isExplicitlyHidden(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return [
    "false",
    "no",
    "n",
    "0",
    "否",
    "不顯示",
    "隱藏",
    "下架",
    "停用",
    "未公開",
  ].includes(normalized);
}

export function normalizePublicUrl(value: string): string {
  const url = value.trim();

  if (!url || url === "找不到檔案") return "";

  if (/^https?:\/\//i.test(url)) return url;

  return "";
}
