import {
  normalizePublicUrl,
  readSheet,
  SHEET_NAMES,
  toBoolean,
  toNumber,
  valueFrom,
} from "@/lib/googleSheets";
import { Product, ProductMedia, ProductOption } from "@/types/product";

function splitTags(value: string) {
  return value
    .split(/[,，、|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function detectMediaType(value: string): "image" | "video" {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("video") || normalized.includes("影片")
    ? "video"
    : "image";
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

    const imageUrl = valueFrom(row, ["圖片連結", "圖片網址", "Image URL"]);
    const videoUrl = valueFrom(row, ["影片連結", "影片網址", "Video URL"]);
    const rawType = valueFrom(row, ["顯示類型", "媒體類型", "Type"]);
    const type = rawType
      ? detectMediaType(rawType)
      : videoUrl
        ? "video"
        : "image";
    const rawUrl = type === "video" ? videoUrl : imageUrl;
    if (!rawUrl) continue;

    const media: ProductMedia = {
      id:
        valueFrom(row, ["媒體ID", "Media ID"]) ||
        `${productId}-${mediaByProduct.get(productId)?.length ?? 0}`,
      type,
      url: normalizePublicUrl(rawUrl),
      order: toNumber(valueFrom(row, ["顯示順序", "排序", "Order"])) || 999,
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
    if (!values.includes(optionValue)) values.push(optionValue);
    productOptions.set(optionName, values);
    optionsByProduct.set(productId, productOptions);
  }

  return productRows
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

      const tags = splitTags(
        valueFrom(row, ["商品標籤", "標籤", "Tags"]),
      );
      const featuredValue = valueFrom(row, [
        "熱銷推薦",
        "是否熱銷",
        "Featured",
      ]);
      const newValue = valueFrom(row, ["新品", "是否新品", "New"]);
      const offerValue = valueFrom(row, [
        "限時優惠",
        "是否限時優惠",
        "Limited Offer",
      ]);

      const optionMap = optionsByProduct.get(id);
      const options: ProductOption[] = optionMap
        ? Array.from(optionMap.entries()).map(([optionName, values]) => ({
            name: optionName,
            values,
          }))
        : [];

      const media = (mediaByProduct.get(id) ?? []).sort(
        (a, b) => a.order - b.order,
      );
      const mainImage = normalizePublicUrl(
        valueFrom(row, ["主要圖片", "主圖", "Main Image"]),
      );

      return {
        id,
        name,
        description: valueFrom(row, [
          "商品說明",
          "商品介紹",
          "Description",
        ]),
        category: valueFrom(row, ["商品分類", "分類", "Category"]),
        tags,
        price: toNumber(
          valueFrom(row, ["商品售價", "商品價格", "原價", "Price"]),
        ),
        salePrice:
          toNumber(
            valueFrom(row, ["商品特價", "特價價格", "Sale Price"]),
          ) || undefined,
        mainImage:
          mainImage ||
          media.find((item) => item.type === "image")?.url ||
          undefined,
        media,
        options,
        published: status === "" ? true : toBoolean(status),
        featured:
          toBoolean(featuredValue) ||
          tags.some((tag) => tag.includes("熱銷")),
        isNew:
          toBoolean(newValue) || tags.some((tag) => tag.includes("新品")),
        limitedOffer:
          toBoolean(offerValue) ||
          tags.some((tag) => tag.includes("限時優惠")),
      };
    })
    .filter((product): product is Product => Boolean(product?.published));
}

export async function getProductById(id: string) {
  const products = await getPublishedProducts();
  return products.find((product) => product.id === id);
}
