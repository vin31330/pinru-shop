const SHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ??
  "1GN9Yh1LWbp7X7ptzxFVs33NYnqOhAXM4jj_PxTq7TIc";

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
      `無法讀取工作表「${sheetName}」，HTTP ${response.status}。請確認試算表已設為知道連結的任何人可檢視。`,
    );
  }

  const csv = await response.text();

  if (
    csv.includes("<!DOCTYPE html") ||
    csv.includes("ServiceLogin") ||
    csv.includes("accounts.google.com")
  ) {
    throw new Error(
      `工作表「${sheetName}」目前不是公開可讀取狀態。`,
    );
  }

  const rows = parseCsv(csv);
  const headers = rows[0]?.map((header) => header.trim()) ?? [];

  return rows.slice(1).map((cells) =>
    Object.fromEntries(
      headers.map((header, index) => [header, (cells[index] ?? "").trim()]),
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
  return ["true", "yes", "y", "1", "是", "顯示", "上架"].includes(
    value.trim().toLowerCase(),
  );
}

export function toNumber(value: string): number {
  const normalized = value.replace(/[,$NT元\s]/gi, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function normalizePublicUrl(value: string): string {
  const url = value.trim();
  if (!url) return "";

  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }

  try {
    const parsed = new URL(url);
    const id = parsed.searchParams.get("id");
    if (id && parsed.hostname.includes("drive.google.com")) {
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }
  } catch {
    return url;
  }

  return url;
}
