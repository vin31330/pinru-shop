import { unstable_cache } from "next/cache";
import {
  isExplicitlyHidden,
  normalizePublicUrl,
  readSheet,
  SHEET_NAMES,
  toBoolean,
  valueFrom,
} from "@/lib/googleSheets";
import { getHomepageProductEntries } from "@/lib/homepage";
import { getSiteSettings } from "@/lib/settings";
import { getPurchasablePriceCandidates } from "@/lib/pricingEngine";
import {
  PricingPlan,
  PricingPlanOption,
  Product,
  ProductMedia,
  ProductOption,
} from "@/types/product";

function splitTags(value: string): string[] {
  return value
    .split(/[,，、|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parsePrice(value: string): number {
  const normalized = value.replace(/[,元$\s]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumber(value: string): number {
  const parsed = Number(value.replace(/[,元$\s]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

type OfferStatus = "none" | "upcoming" | "active" | "ended";

function parseSheetDate(value: string, endOfDay = false): Date | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const dateOnly = normalized.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    );
  }

  const parsed = new Date(normalized.replace(/-/g, "/"));
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function getOfferStatus(
  limitedOffer: boolean,
  startValue: string,
  endValue: string,
  now = new Date(),
): OfferStatus {
  if (!limitedOffer) return "none";

  const start = parseSheetDate(startValue);
  const end = parseSheetDate(endValue, true);

  if (start && now < start) return "upcoming";
  if (end && now > end) return "ended";
  return "active";
}

function mediaType(
  displayType: string,
  imageUrl: string,
  videoUrl: string,
): "image" | "video" {
  const normalized = displayType.trim().toLowerCase();

  return normalized.includes("video") ||
    normalized.includes("影片") ||
    (!imageUrl && Boolean(videoUrl))
    ? "video"
    : "image";
}

async function buildPublishedProducts(): Promise<Product[]> {
  const [
    productRows,
    mediaRows,
    optionRows,
    pricingRows,
    pricingOptionRows,
    homepageEntries,
    settings,
  ] = await Promise.all([
    readSheet(SHEET_NAMES.products),
    readSheet(SHEET_NAMES.media).catch(() => []),
    readSheet(SHEET_NAMES.options).catch(() => []),
    readSheet(SHEET_NAMES.pricingPlans).catch(() => []),
    readSheet(SHEET_NAMES.pricingPlanOptions).catch(() => []),
    getHomepageProductEntries(),
    getSiteSettings(),
  ]);

  const hotOrderByProduct = new Map<string, number>();

  for (const entry of homepageEntries) {
    const section = entry.section.trim();

    if (section.includes("熱銷")) {
      const current = hotOrderByProduct.get(entry.productId);

      hotOrderByProduct.set(
        entry.productId,
        current === undefined
          ? entry.order
          : Math.min(current, entry.order),
      );
    }

  }

  const mediaByProduct = new Map<string, ProductMedia[]>();

  for (const row of mediaRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) {
      continue;
    }

    const productId = valueFrom(row, ["商品ID"]);

    if (!productId) {
      continue;
    }

    const imageUrl =
      normalizePublicUrl(valueFrom(row, ["網站圖片網址"])) ||
      normalizePublicUrl(valueFrom(row, ["圖片連結"]));

    const videoUrl = normalizePublicUrl(
      valueFrom(row, ["影片連結"]),
    );

    const type = mediaType(
      valueFrom(row, ["顯示類型"]),
      imageUrl,
      videoUrl,
    );

    const url = type === "video" ? videoUrl : imageUrl;

    if (!url) {
      continue;
    }

    const item: ProductMedia = {
      id:
        valueFrom(row, ["媒體ID"]) ||
        `${productId}-${mediaByProduct.get(productId)?.length ?? 0}`,
      type,
      url,
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
      thumbnailUrl:
        normalizePublicUrl(valueFrom(row, ["影片縮圖網址"])) ||
        undefined,
    };

    const current = mediaByProduct.get(productId) ?? [];

    current.push(item);
    mediaByProduct.set(productId, current);
  }

  const optionsByProduct = new Map<
    string,
    Map<string, { values: string[]; order: number }>
  >();

  for (const row of optionRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) {
      continue;
    }

    const productId = valueFrom(row, ["商品ID"]);

    const groupName = valueFrom(row, [
      "規格群組",
      "選項名稱",
      "規格名稱",
    ]);

    const optionValue = valueFrom(row, [
      "規格值",
      "選項值",
      "規格內容",
    ]);

    if (!productId || !groupName || !optionValue) {
      continue;
    }

    const groups =
      optionsByProduct.get(productId) ??
      new Map<string, { values: string[]; order: number }>();

    const group = groups.get(groupName) ?? {
      values: [],
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
    };

    if (!group.values.includes(optionValue)) {
      group.values.push(optionValue);
    }

    group.order = Math.min(
      group.order,
      Number(valueFrom(row, ["顯示順序"])) || 999,
    );

    groups.set(groupName, group);
    optionsByProduct.set(productId, groups);
  }

  const optionPricesByPlan = new Map<
    string,
    PricingPlanOption[]
  >();

  for (const row of pricingOptionRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) {
      continue;
    }

    const planId = valueFrom(row, ["方案ID"]);
    const id = valueFrom(row, ["方案規格價格ID"]);
    const groupName = valueFrom(row, ["規格群組"]);
    const optionValue = valueFrom(row, ["規格值"]);
    const price = parseNumber(valueFrom(row, ["方案價格"]));
    const originalPrice = parseNumber(valueFrom(row, ["方案原價"]));

    if (
      !planId ||
      !id ||
      !groupName ||
      !optionValue ||
      price <= 0
    ) {
      continue;
    }

    const item: PricingPlanOption = {
      id,
      groupName,
      optionValue,
      price,
      originalPrice: originalPrice > price ? originalPrice : undefined,
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
    };

    const current = optionPricesByPlan.get(planId) ?? [];

    current.push(item);
    optionPricesByPlan.set(planId, current);
  }

  const pricingByProduct = new Map<string, PricingPlan[]>();

  for (const row of pricingRows) {
    if (isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))) {
      continue;
    }

    const productId = valueFrom(row, ["商品ID"]);
    const id = valueFrom(row, ["方案ID"]);
    const name = valueFrom(row, ["方案名稱"]);
    const quantity = Number(valueFrom(row, ["需要件數"]));
    const price = parseNumber(valueFrom(row, ["方案價格"]));

    if (
      !productId ||
      !id ||
      !name ||
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      price <= 0
    ) {
      continue;
    }

    const plan: PricingPlan = {
      id,
      name,
      quantity,
      price,
      isDefault: toBoolean(valueFrom(row, ["是否預設"])),
      selectOptionsPerItem: toBoolean(
        valueFrom(row, ["是否逐件選規格"]),
      ),
      order: Number(valueFrom(row, ["顯示順序"])) || 999,
      optionPrices: (
        optionPricesByPlan.get(id) ?? []
      ).sort((a, b) => a.order - b.order),
    };

    const current = pricingByProduct.get(productId) ?? [];

    current.push(plan);
    pricingByProduct.set(productId, current);
  }

  return productRows
    .map((row): Product | null => {
      const id = valueFrom(row, ["商品ID"]);
      const name = valueFrom(row, ["商品名稱"]);

      if (
        !id ||
        !name ||
        isExplicitlyHidden(valueFrom(row, ["顯示狀態"]))
      ) {
        return null;
      }

      const tags = splitTags(
        valueFrom(row, ["商品標籤"]),
      );

      const media = (
        mediaByProduct.get(id) ?? []
      ).sort((a, b) => a.order - b.order);

      const groupMap = optionsByProduct.get(id);

      const options: ProductOption[] = groupMap
        ? Array.from(groupMap.entries())
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([groupName, group]) => ({
              name: groupName,
              values: group.values,
            }))
        : [];

      const pricingPlans = (
        pricingByProduct.get(id) ?? []
      ).sort((a, b) => a.order - b.order);

      const productPrice = parsePrice(
        valueFrom(row, ["商品售價"]),
      );

      const rawSalePrice = valueFrom(row, ["商品特價"]);
      const configuredSalePrice = rawSalePrice ? parsePrice(rawSalePrice) : 0;
      // 「限時優惠」只能由 Products 的同名欄位明確開啟。
      // 商品標籤、特價或價格方案都不能自行觸發限時優惠顯示。
      const limitedOffer = toBoolean(valueFrom(row, ["限時優惠"]));
      const offerStartDate = valueFrom(row, ["優惠開始日期"]);
      const offerEndDate = valueFrom(row, ["優惠結束日期"]);
      const offerStatus = getOfferStatus(
        limitedOffer,
        offerStartDate,
        offerEndDate,
      );
      const salePriceActive = !limitedOffer || offerStatus === "active";
      const effectiveSalePrice =
        salePriceActive && configuredSalePrice > 0
          ? configuredSalePrice
          : 0;

      // 商品卡與商品頁標題價格只顯示「目前有效的所有可購買方式中的最低價」。
      // 限時特價尚未開始或已結束時，不會納入最低價與購物車價格。
      const candidatePrices = getPurchasablePriceCandidates(
        productPrice,
        effectiveSalePrice,
        pricingPlans,
      );

      const lowestPrice = candidatePrices.length
        ? Math.min(...candidatePrices)
        : 0;

      return {
        id,
        name,
        subtitle: valueFrom(row, ["商品副標題"]) || undefined,
        description: valueFrom(row, ["商品說明"]),
        category: valueFrom(row, [
          "分類ID",
          "商品分類",
        ]),
        tags,

        price: lowestPrice,
        basePrice: productPrice > 0 ? productPrice : undefined,

        // 有價格方案時，商品卡只顯示最低價，不另外顯示刪除線原價。
        // 沒有方案的有效特價商品，保留原價＋特價顯示。
        salePrice:
          pricingPlans.length === 0 &&
          effectiveSalePrice > 0 &&
          productPrice > effectiveSalePrice
            ? effectiveSalePrice
            : undefined,

        mainImage:
          normalizePublicUrl(
            valueFrom(row, ["網站主要圖片網址"]),
          ) ||
          normalizePublicUrl(
            valueFrom(row, ["主要圖片"]),
          ) ||
          media.find((item) => item.type === "image")?.url ||
          undefined,

        media,
        options,
        pricingPlans,
        published: true,

        createdAt: valueFrom(row, ["建立日期"]),

        // 熱銷商品只由 HomepageSections 控制，避免商品標籤或舊欄位誤判。
        featured: hotOrderByProduct.has(id),

        featuredOrder: hotOrderByProduct.get(id),

        isNew: (() => {
          const createdAt = parseSheetDate(valueFrom(row, ["建立日期"]));
          if (!createdAt) return false;

          const cutoff = new Date();
          cutoff.setHours(0, 0, 0, 0);
          cutoff.setDate(cutoff.getDate() - settings.newProductDays);

          return createdAt.getTime() >= cutoff.getTime();
        })(),

        limitedOffer,
        offerActive: limitedOffer && offerStatus === "active",
        offerStatus,
        offerStartDate: offerStartDate || undefined,
        offerEndDate: offerEndDate || undefined,
      };
    })
    .filter(
      (product): product is Product =>
        product !== null,
    )
    .sort((a, b) => {
      const aTime = a.createdAt
        ? new Date(
            a.createdAt.replace(/-/g, "/"),
          ).getTime()
        : 0;

      const bTime = b.createdAt
        ? new Date(
            b.createdAt.replace(/-/g, "/"),
          ).getTime()
        : 0;

      return (
        bTime - aTime ||
        b.id.localeCompare(a.id, "zh-Hant", {
          numeric: true,
        })
      );
    });
}


const getPublishedProductsCached = unstable_cache(
  buildPublishedProducts,
  ["pinru-published-products-v6-1"],
  { revalidate: 60 },
);

export async function getPublishedProducts(): Promise<Product[]> {
  return getPublishedProductsCached();
}

export async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const products = await getPublishedProducts();

  return products.find(
    (product) => product.id === id,
  );
}
