import { readSheet, toBoolean, valueFrom } from "@/lib/googleSheets";
import type { CartItem, Product } from "@/types/product";
import type {
  Coupon,
  CouponCategoryRule,
  CouponProductRule,
  CouponValidationResult,
} from "@/types/coupon";

function numberOrUndefined(value: string) {
  const normalized = value.replace(/[,，\s]/g, "");
  if (!normalized) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function dateValue(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : undefined;
}

function couponActive(coupon: Coupon, now = Date.now()) {
  if (!coupon.published) return false;
  const start = dateValue(coupon.startDate);
  const end = dateValue(coupon.endDate);
  if (start !== undefined && now < start) return false;
  if (end !== undefined && now > end) return false;
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) return false;
  return true;
}

async function loadCouponDataRaw() {
  const [couponRows, productRows, categoryRows] = await Promise.all([
    readSheet("Coupons"),
    readSheet("Coupon Products"),
    readSheet("Coupon Categories"),
  ]);

  const coupons: Coupon[] = couponRows
    .map((row) => {
      const type = valueFrom(row, ["優惠類型"]).trim().toUpperCase();
      const scope = valueFrom(row, ["適用範圍"]).trim().toUpperCase();
      return {
        id: valueFrom(row, ["優惠碼ID"]),
        code: normalizeCode(valueFrom(row, ["優惠碼"])),
        name: valueFrom(row, ["優惠名稱"]),
        description: valueFrom(row, ["優惠說明"]),
        type: type === "PERCENT_OFF" ? "PERCENT_OFF" : "FIXED_OFF",
        value: numberOrUndefined(valueFrom(row, ["優惠值"])) ?? 0,
        minSpend: numberOrUndefined(valueFrom(row, ["最低消費金額"])),
        maxDiscount: numberOrUndefined(valueFrom(row, ["最高折抵金額"])),
        scope: scope === "PRODUCTS" || scope === "CATEGORIES" ? scope : "ALL",
        maxUses: numberOrUndefined(valueFrom(row, ["總使用次數上限"])),
        usedCount: numberOrUndefined(valueFrom(row, ["已使用次數"])) ?? 0,
        combinableWithActivities: toBoolean(valueFrom(row, ["是否可與活動併用"])),
        startDate: valueFrom(row, ["開始日期"]) || undefined,
        endDate: valueFrom(row, ["結束日期"]) || undefined,
        published: toBoolean(valueFrom(row, ["顯示狀態"])),
      } satisfies Coupon;
    })
    .filter((coupon) => coupon.id && coupon.code && coupon.name && coupon.value >= 0);

  const productRules: CouponProductRule[] = productRows
    .map((row) => ({
      couponId: valueFrom(row, ["優惠碼ID"]),
      productId: valueFrom(row, ["商品ID"]),
      relation: valueFrom(row, ["關係"]).trim().toUpperCase() === "EXCLUDE" ? "EXCLUDE" : "INCLUDE",
      published: toBoolean(valueFrom(row, ["顯示狀態"])),
    } satisfies CouponProductRule))
    .filter((rule) => rule.couponId && rule.productId && rule.published);

  const categoryRules: CouponCategoryRule[] = categoryRows
    .map((row) => ({
      couponId: valueFrom(row, ["優惠碼ID"]),
      categoryId: valueFrom(row, ["分類ID"]),
      relation: valueFrom(row, ["關係"]).trim().toUpperCase() === "EXCLUDE" ? "EXCLUDE" : "INCLUDE",
      published: toBoolean(valueFrom(row, ["顯示狀態"])),
    } satisfies CouponCategoryRule))
    .filter((rule) => rule.couponId && rule.categoryId && rule.published);

  return { coupons, productRules, categoryRules };
}

const loadCouponData = loadCouponDataRaw;

export async function hasAvailableCoupons() {
  try {
    const { coupons } = await loadCouponData();
    return coupons.some((coupon) => couponActive(coupon));
  } catch {
    return false;
  }
}

function itemHasActivity(item: CartItem) {
  return Boolean(
    item.itemType === "activity" ||
    item.activityId ||
    item.selectedOptions?.["活動ID"],
  );
}

function eligibleForCoupon(
  item: CartItem,
  coupon: Coupon,
  productMap: Map<string, Product>,
  productRules: CouponProductRule[],
  categoryRules: CouponCategoryRule[],
) {
  const productRuleSet = productRules.filter((rule) => rule.couponId === coupon.id);
  const categoryRuleSet = categoryRules.filter((rule) => rule.couponId === coupon.id);

  // EXCLUDE 永遠優先。
  if (productRuleSet.some((rule) => rule.relation === "EXCLUDE" && rule.productId === item.productId)) {
    return false;
  }

  const product = productMap.get(item.productId);
  if (product) {
    const productCategory = product.category;
    if (categoryRuleSet.some((rule) => rule.relation === "EXCLUDE" && rule.categoryId === productCategory)) {
      return false;
    }
  }

  if (coupon.scope === "ALL") return true;
  if (coupon.scope === "PRODUCTS") {
    return productRuleSet.some((rule) => rule.relation === "INCLUDE" && rule.productId === item.productId);
  }
  if (coupon.scope === "CATEGORIES") {
    if (!product) return false;
    return categoryRuleSet.some(
      (rule) => rule.relation === "INCLUDE" && rule.categoryId === product.category,
    );
  }
  return false;
}

export async function validateCoupon(
  code: string,
  items: CartItem[],
  products: Product[],
): Promise<CouponValidationResult> {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return { ok: false, message: "請輸入優惠碼。" };

  let data;
  try {
    data = await loadCouponData();
  } catch {
    return { ok: false, message: "目前無法確認優惠碼，請稍後再試。" };
  }

  const coupon = data.coupons.find((candidate) => candidate.code === normalizedCode);
  if (!coupon || !coupon.published) return { ok: false, message: "找不到此優惠碼。" };

  const couponSummary = {
    id: coupon.id,
    code: coupon.code,
    name: coupon.name,
    description: coupon.description,
  };

  const now = Date.now();
  const start = dateValue(coupon.startDate);
  const end = dateValue(coupon.endDate);
  if (start !== undefined && now < start) return { ok: false, message: "此優惠碼尚未開始。" };
  if (end !== undefined && now > end) return { ok: false, message: "此優惠碼已結束。" };
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: "此優惠碼已達使用上限。" };
  }

  if (!coupon.combinableWithActivities && items.some(itemHasActivity)) {
    return {
      ok: false,
      message: "此優惠碼無法與目前活動優惠同時使用。",
      coupon: couponSummary,
    };
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const eligibleItems = items.filter((item) =>
    item.validationStatus !== "invalid" &&
    eligibleForCoupon(item, coupon, productMap, data.productRules, data.categoryRules),
  );
  const eligibleSubtotal = eligibleItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  if (eligibleSubtotal <= 0) {
    return {
      ok: false,
      message: "目前購物車內沒有適用此優惠碼的商品。",
      coupon: couponSummary,
      eligibleSubtotal,
    };
  }

  if (coupon.minSpend !== undefined && eligibleSubtotal + 0.0001 < coupon.minSpend) {
    const short = Math.max(0, coupon.minSpend - eligibleSubtotal);
    return {
      ok: false,
      message: `此優惠碼滿 NT$${Math.ceil(coupon.minSpend).toLocaleString("zh-TW")} 才能使用，目前還差 NT$${Math.ceil(short).toLocaleString("zh-TW")}。`,
      coupon: couponSummary,
      eligibleSubtotal,
    };
  }

  let discountAmount = coupon.type === "PERCENT_OFF"
    ? eligibleSubtotal * Math.max(0, Math.min(100, 100 - coupon.value)) / 100
    : coupon.value;
  discountAmount = Math.max(0, Math.min(eligibleSubtotal, discountAmount));
  if (coupon.maxDiscount !== undefined) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  discountAmount = Math.round(discountAmount);

  const cartSubtotal = items
    .filter((item) => item.validationStatus !== "invalid")
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  return {
    ok: true,
    message: "優惠碼已套用。",
    coupon: couponSummary,
    eligibleSubtotal,
    discountAmount,
    finalTotal,
  };
}
