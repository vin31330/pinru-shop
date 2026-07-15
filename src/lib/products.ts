import {
  isExplicitlyHidden,
  normalizePublicUrl,
  readSheet,
  SHEET_NAMES,
  toBoolean,
  valueFrom,
} from "@/lib/googleSheets";
import { Product, ProductMedia, ProductOption } from "@/types/product";

function splitTags(value: string): string[] {
  return value
    .split(/[,，、|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parsePrice(value: string): number {
  const normalized = value.replace(/,/g, "");

  const quantityOneMatch = normalized.match(
    /(?:\+?\s*1\s*(?:個|件|組)?\s*[=＝:]?\s*)\$?\s*(\d+(?:\.\d+)?)/,
  );

  if (quantityOneMatch) return Number(quantityOneMatch[1]);

  const numbers = Array.from(normalized.matchAll(/\d+(?:\.\d+)?/g))
    .map((match) => Number(match[0]))
    .filter((number) => Number.isFinite(number) && number > 0);

  return numbers[0] ?? 0;
}

function mediaType(
  displayType: string,
  imageUrl: string,
  videoUrl: string,
): "image" | "video" {
  const normalized = displayType.toLowerCase();

  if (
    normalized.includes("video") ||
    normalized.includes("影片") ||
    (!imageUrl && Boolean(videoUrl))
  ) {
    return "video";
  }

  return "image";
}

export async function getPublishedProducts(): Promise<Product[]> {
  const [productRows, mediaRows, optionRows] = await Promise.all([
    readSheet(SHEET_NAMES.products),
    readSheet(SHEET_NAMES.media).catch(() => []),
    readSheet(SHEET_NAMES.options).catch(() => []),
  ]);

  const mediaByProduct = new Map<string, ProductMedia[]>();

  for (const row of mediaRows) {
    const productId = valueFrom(row, ["商品ID"]);
    if (!productId) continue;

    const imageUrl =
      normalizePublicUrl(valueFrom(row, ["網站圖片網址"])) ||
      normalizePublicUrl(valueFrom(row, ["圖片連結"]));

    const videoUrl = normalizePublicUrl(valueFrom(row, ["影片連結"]));
    const type = mediaType(
      valueFrom(row, ["顯示類型"]),
      imageUrl,
      videoUrl,
    );

    const url = type === "video" ? videoUrl : imageUrl;
    if (!url) continue;

    const media: ProductMedia = {
      id: valueFrom(row, ["媒體ID"]) || `${productId}-${Date.now()}`,
      type,
      url,
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
    };

    const current = mediaByProduct.get(productId) ?? [];
    current.push(media);
    mediaByProduct.set(productId, current);
  }

  const optionsByProduct = new Map<string, Map<string, string[]>>();

  for (const row of optionRows) {
    const productId = valueFrom(row, ["商品ID"]);
    const optionName = valueFrom(row, ["選項名稱", "規格名稱"]);
    const optionValue = valueFrom(row, ["選項值", "規格內容", "選項內容"]);

    if (!productId || !optionName || !optionValue) continue;

    const productOptions =
      optionsByProduct.get(productId) ?? new Map<string, string[]>();

    const values = productOptions.get(optionName) ?? [];
    if (!values.includes(optionValue)) values.push(optionValue);

    productOptions.set(optionName, values);
    optionsByProduct.set(productId, productOptions);
  }

  return productRows
    .map((row): Product | null => {
      const id = valueFrom(row, ["商品ID"]);
      const name = valueFrom(row, ["商品名稱"]);

      if (!id || !name) return null;

      const status = valueFrom(row, ["顯示狀態"]);
      if (isExplicitlyHidden(status)) return null;

      const tags = splitTags(valueFrom(row, ["商品標籤"]));
      const media = (mediaByProduct.get(id) ?? []).sort(
        (a, b) => a.order - b.order,
      );

      const optionMap = optionsByProduct.get(id);
      const options: ProductOption[] = optionMap
        ? Array.from(optionMap.entries()).map(([name, values]) => ({
            name,
            values,
          }))
        : [];

      const mainImage =
        normalizePublicUrl(valueFrom(row, ["網站主要圖片網址"])) ||
        normalizePublicUrl(valueFrom(row, ["主要圖片"])) ||
        media.find((item) => item.type === "image")?.url ||
        undefined;

      const rawSalePrice = valueFrom(row, ["商品特價"]);

      return {
        id,
        name,
        description: valueFrom(row, ["商品說明"]),
        category: valueFrom(row, ["商品分類"]),
        tags,
        price: parsePrice(valueFrom(row, ["商品售價"])),
        salePrice: rawSalePrice ? parsePrice(rawSalePrice) : undefined,
        mainImage,
        media,
        options,
        published: true,
        featured:
          toBoolean(valueFrom(row, ["熱銷推薦"])) ||
          tags.some((tag) => tag.includes("熱銷")),
        isNew:
          toBoolean(valueFrom(row, ["新品"])) ||
          tags.some((tag) => tag.includes("新品")),
        limitedOffer:
          toBoolean(valueFrom(row, ["限時優惠"])) ||
          tags.some((tag) => tag.includes("限時優惠")),
      };
    })
    .filter((product): product is Product => product !== null);
}

export async function getProductById(id: string) {
  const products = await getPublishedProducts();
  return products.find((product) => product.id === id);
}
