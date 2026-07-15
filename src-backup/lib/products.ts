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

  // 優先讀取「+1=1000」或「1個1000」中的單件價格。
  const quantityOneMatch = normalized.match(
    /(?:\+?\s*1\s*(?:個|件|組)?\s*[=＝:]?\s*)\$?\s*(\d+(?:\.\d+)?)/,
  );

  if (quantityOneMatch) {
    return Number(quantityOneMatch[1]);
  }

  // 找不到單件格式時，取文字中第一個合理金額。
  const numbers = Array.from(normalized.matchAll(/\d+(?:\.\d+)?/g))
    .map((match) => Number(match[0]))
    .filter((number) => Number.isFinite(number) && number > 0);

  return numbers[0] ?? 0;
}

function detectMediaType(
  displayType: string,
  imageUrl: string,
  videoUrl: string,
): "image" | "video" {
  const normalized = displayType.trim().toLowerCase();

  if (
    normalized.includes("video") ||
    normalized.includes("影片") ||
    (!imageUrl && Boolean(videoUrl))
  ) {
    return "video";
  }

  return "image";
}

function normalizeAppSheetMediaUrl(value: string): string {
  const url = value.trim();

  if (!url) return "";

  // 完整網址可直接使用。
  if (/^https?:\/\//i.test(url)) {
    return normalizePublicUrl(url);
  }

  // AppSheet 相對路徑目前無法從公開網站直接讀取。
  // 先回傳空字串，網站會顯示商品圖片替代圖。
  return "";
}

export async function getPublishedProducts(): Promise<Product[]> {
  const [productRows, mediaRows, optionRows] = await Promise.all([
    readSheet(SHEET_NAMES.products),
    readSheet(SHEET_NAMES.media).catch(() => []),
    readSheet(SHEET_NAMES.options).catch(() => []),
  ]);

  const mediaByProduct = new Map<string, ProductMedia[]>();

  for (const row of mediaRows) {
    const productId = valueFrom(row, ["商品ID", "Product ID", "productId"]);
    if (!productId) continue;

    const imageValue = valueFrom(row, ["圖片連結", "圖片網址", "Image URL"]);
    const videoValue = valueFrom(row, ["影片連結", "影片網址", "Video URL"]);
    const displayType = valueFrom(row, ["顯示類型", "媒體類型", "Type"]);
    const type = detectMediaType(displayType, imageValue, videoValue);
    const rawUrl = type === "video" ? videoValue : imageValue;
    const url = normalizeAppSheetMediaUrl(rawUrl);

    // 影片若是完整網址才加入；相對圖片路徑暫時略過。
    if (!url) continue;

    const orderText = valueFrom(row, ["顯示順序", "排序", "Order"]);
    const order = Number(orderText) || 999;

    const media: ProductMedia = {
      id:
        valueFrom(row, ["媒體ID", "Media ID"]) ||
        `${productId}-${mediaByProduct.get(productId)?.length ?? 0}`,
      type,
      url,
      order,
    };

    const current = mediaByProduct.get(productId) ?? [];
    current.push(media);
    mediaByProduct.set(productId, current);
  }

  const optionsByProduct = new Map<string, Map<string, string[]>>();

  for (const row of optionRows) {
    const productId = valueFrom(row, ["商品ID", "Product ID", "productId"]);
    const optionName = valueFrom(row, [
      "選項名稱",
      "規格名稱",
      "選單名稱",
      "Option Name",
    ]);
    const optionValue = valueFrom(row, [
      "選項值",
      "規格內容",
      "選項內容",
      "Option Value",
    ]);

    if (!productId || !optionName || !optionValue) continue;

    const productOptions =
      optionsByProduct.get(productId) ?? new Map<string, string[]>();
    const values = productOptions.get(optionName) ?? [];

    if (!values.includes(optionValue)) {
      values.push(optionValue);
    }

    productOptions.set(optionName, values);
    optionsByProduct.set(productId, productOptions);
  }

  const products = productRows
    .map((row): Product | null => {
      const id = valueFrom(row, ["商品ID", "Product ID", "id"]);
      const name = valueFrom(row, ["商品名稱", "品名", "Product Name"]);

      if (!id || !name) return null;

      const status = valueFrom(row, [
        "顯示狀態",
        "是否上架",
        "Published",
        "Status",
      ]);

      if (isExplicitlyHidden(status)) return null;

      const tags = splitTags(
        valueFrom(row, ["商品標籤", "標籤", "Tags"]),
      );

      const media = (mediaByProduct.get(id) ?? []).sort(
        (a, b) => a.order - b.order,
      );

      const rawMainImage = valueFrom(row, [
        "主要圖片",
        "主圖",
        "Main Image",
      ]);

      const optionMap = optionsByProduct.get(id);
      const options: ProductOption[] = optionMap
        ? Array.from(optionMap.entries()).map(([optionName, values]) => ({
            name: optionName,
            values,
          }))
        : [];

      const rawPrice = valueFrom(row, [
        "商品售價",
        "商品價格",
        "原價",
        "Price",
      ]);

      const rawSalePrice = valueFrom(row, [
        "商品特價",
        "特價價格",
        "Sale Price",
      ]);

      const featuredValue = valueFrom(row, [
        "熱銷推薦",
        "是否熱銷",
        "Featured",
      ]);

      const newValue = valueFrom(row, ["新品", "是否新品", "New"]);

      const limitedOfferValue = valueFrom(row, [
        "限時優惠",
        "是否限時優惠",
        "Limited Offer",
      ]);

      return {
        id,
        name,
        description: valueFrom(row, [
          "商品說明",
          "商品介紹",
          "Description",
        ]),
        category: valueFrom(row, [
          "商品分類",
          "分類",
          "Category",
        ]),
        tags,
        price: parsePrice(rawPrice),
        salePrice: rawSalePrice ? parsePrice(rawSalePrice) : undefined,
        mainImage:
          normalizeAppSheetMediaUrl(rawMainImage) ||
          media.find((item) => item.type === "image")?.url ||
          undefined,
        media,
        options,
        published: true,
        featured:
          toBoolean(featuredValue) ||
          tags.some((tag) => tag.includes("熱銷")),
        isNew:
          toBoolean(newValue) ||
          tags.some((tag) => tag.includes("新品")),
        limitedOffer:
          toBoolean(limitedOfferValue) ||
          tags.some((tag) => tag.includes("限時優惠")),
      };
    })
    .filter((product): product is Product => product !== null);

  return products;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getPublishedProducts();
  return products.find((product) => product.id === id);
}
