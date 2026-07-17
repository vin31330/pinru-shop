import {
  isExplicitlyHidden,
  normalizePublicUrl,
  readSheet,
  SHEET_NAMES,
  toBoolean,
  valueFrom,
} from "@/lib/googleSheets";
import {
  PricingPlan,
  PricingPlanOption,
  Product,
  ProductMedia,
  ProductOption,
} from "@/types/product";

function splitTags(value: string): string[] {
  return value.split(/[,，、|]/).map((tag) => tag.trim()).filter(Boolean);
}

function parsePrice(value: string): number {
  const normalized = value.replace(/,/g, "");
  const match = normalized.match(/(?:\+?\s*1\s*(?:個|件|組)?\s*[=＝:]?\s*)\$?\s*(\d+(?:\.\d+)?)/);
  if (match) return Number(match[1]);
  const numbers = Array.from(normalized.matchAll(/\d+(?:\.\d+)?/g))
    .map((item) => Number(item[0]))
    .filter((number) => Number.isFinite(number) && number > 0);
  return numbers[0] ?? 0;
}

function parseNumber(value: string): number {
  const parsed = Number(value.replace(/[,元$\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mediaType(displayType: string, imageUrl: string, videoUrl: string): "image" | "video" {
  const normalized = displayType.trim().toLowerCase();
  return normalized.includes("video") || normalized.includes("影片") || (!imageUrl && Boolean(videoUrl))
    ? "video"
    : "image";
}

export async function getPublishedProducts(): Promise<Product[]> {
  const [productRows, mediaRows, optionRows, pricingRows, pricingOptionRows] = await Promise.all([
    readSheet(SHEET_NAMES.products),
    readSheet(SHEET_NAMES.media).catch(() => []),
    readSheet(SHEET_NAMES.options).catch(() => []),
    readSheet(SHEET_NAMES.pricingPlans).catch(() => []),
    readSheet(SHEET_NAMES.pricingPlanOptions).catch(() => []),
  ]);

  const mediaByProduct = new Map<string, ProductMedia[]>();
  for (const row of mediaRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) continue;
    const productId = valueFrom(row, ["商品ID"]);
    if (!productId) continue;
    const imageUrl = normalizePublicUrl(valueFrom(row, ["網站圖片網址"])) || normalizePublicUrl(valueFrom(row, ["圖片連結"]));
    const videoUrl = normalizePublicUrl(valueFrom(row, ["影片連結"]));
    const type = mediaType(valueFrom(row, ["顯示類型"]), imageUrl, videoUrl);
    const url = type === "video" ? videoUrl : imageUrl;
    if (!url) continue;
    const item: ProductMedia = {
      id: valueFrom(row, ["媒體ID"]) || `${productId}-${mediaByProduct.get(productId)?.length ?? 0}`,
      type,
      url,
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
      thumbnailUrl: normalizePublicUrl(valueFrom(row, ["影片縮圖網址"])) || undefined,
    };
    const current = mediaByProduct.get(productId) ?? [];
    current.push(item);
    mediaByProduct.set(productId, current);
  }

  const optionsByProduct = new Map<string, Map<string, { values: string[]; order: number }>>();
  for (const row of optionRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) continue;
    const productId = valueFrom(row, ["商品ID"]);
    const groupName = valueFrom(row, ["規格群組", "選項名稱", "規格名稱"]);
    const optionValue = valueFrom(row, ["規格值", "選項值", "規格內容"]);
    if (!productId || !groupName || !optionValue) continue;
    const groups = optionsByProduct.get(productId) ?? new Map<string, { values: string[]; order: number }>();
    const group = groups.get(groupName) ?? { values: [], order: Number(valueFrom(row, ["顯示順序"])) || 999 };
    if (!group.values.includes(optionValue)) group.values.push(optionValue);
    group.order = Math.min(group.order, Number(valueFrom(row, ["顯示順序"])) || 999);
    groups.set(groupName, group);
    optionsByProduct.set(productId, groups);
  }

  const optionPricesByPlan = new Map<string, PricingPlanOption[]>();
  for (const row of pricingOptionRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) continue;
    const planId = valueFrom(row, ["方案ID"]);
    const id = valueFrom(row, ["方案規格價格ID"]);
    const groupName = valueFrom(row, ["規格群組"]);
    const optionValue = valueFrom(row, ["規格值"]);
    const price = parseNumber(valueFrom(row, ["方案價格"]));
    if (!planId || !id || !groupName || !optionValue || price <= 0) continue;
    const item: PricingPlanOption = {
      id,
      groupName,
      optionValue,
      price,
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
    };
    const current = optionPricesByPlan.get(planId) ?? [];
    current.push(item);
    optionPricesByPlan.set(planId, current);
  }

  const pricingByProduct = new Map<string, PricingPlan[]>();
  for (const row of pricingRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) continue;
    const productId = valueFrom(row, ["商品ID"]);
    const id = valueFrom(row, ["方案ID"]);
    const name = valueFrom(row, ["方案名稱"]);
    const quantity = Number(valueFrom(row, ["需要件數"]));
    const price = parseNumber(valueFrom(row, ["方案價格"]));
    if (!productId || !id || !name || !Number.isFinite(quantity) || quantity < 1 || price <= 0) continue;
    const plan: PricingPlan = {
      id,
      name,
      quantity,
      price,
      isDefault: toBoolean(valueFrom(row, ["是否預設"])),
      selectOptionsPerItem: toBoolean(valueFrom(row, ["是否逐件選規格"])),
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
      optionPrices: (optionPricesByPlan.get(id) ?? []).sort((a, b) => a.order - b.order),
    };
    const current = pricingByProduct.get(productId) ?? [];
    current.push(plan);
    pricingByProduct.set(productId, current);
  }

  return productRows
    .map((row): Product | null => {
      const id = valueFrom(row, ["商品ID"]);
      const name = valueFrom(row, ["商品名稱"]);
      if (!id || !name || isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) return null;
      const tags = splitTags(valueFrom(row, ["商品標籤"]));
      const media = (mediaByProduct.get(id) ?? []).sort((a, b) => a.order - b.order);
      const groupMap = optionsByProduct.get(id);
      const options: ProductOption[] = groupMap
        ? Array.from(groupMap.entries())
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([groupName, group]) => ({ name: groupName, values: group.values }))
        : [];
      const pricingPlans = (pricingByProduct.get(id) ?? []).sort((a, b) => a.order - b.order);
      const defaultPlan = pricingPlans.find((plan) => plan.isDefault) ?? pricingPlans[0];
      const rawSalePrice = valueFrom(row, ["商品特價"]);
      return {
        id,
        name,
        description: valueFrom(row, ["商品說明"]),
        category: valueFrom(row, ["商品分類"]),
        tags,
        price: defaultPlan?.price ?? parsePrice(valueFrom(row, ["商品售價"])),
        salePrice: rawSalePrice ? parsePrice(rawSalePrice) : undefined,
        mainImage:
          normalizePublicUrl(valueFrom(row, ["網站主要圖片網址"])) ||
          normalizePublicUrl(valueFrom(row, ["主要圖片"])) ||
          media.find((item) => item.type === "image")?.url ||
          undefined,
        media,
        options,
        pricingPlans,
        published: true,
        featured: toBoolean(valueFrom(row, ["熱銷推薦"])) || tags.some((tag) => tag.includes("熱銷")),
        isNew: toBoolean(valueFrom(row, ["新品"])) || tags.some((tag) => tag.includes("新品")),
        limitedOffer: toBoolean(valueFrom(row, ["限時優惠"])) || tags.some((tag) => tag.includes("限時優惠")),
      };
    })
    .filter((product): product is Product => product !== null);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getPublishedProducts();
  return products.find((product) => product.id === id);
}
