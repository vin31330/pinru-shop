import type { Activity } from "@/types/activity";

export type PromotionMethod = "PERCENT_OFF" | "FIXED_PRICE" | "FREE" | "AMOUNT_OFF" | "PERCENT_PRICE";

function compact(value: string): string {
  return value.trim().toUpperCase().replace(/[\s_\-－—]/g, "");
}

export function normalizeActivityType(value: string): string {
  const raw = value.trim();
  const key = compact(raw);
  if (key.includes("BUYGET") || (raw.includes("買") && raw.includes("送"))) return "BUY_GET";
  if (key.includes("ADDON") || raw.includes("加價購") || raw.includes("加購")) return "ADD_ON";
  if (
    key.includes("SECONDHALFPRICE") ||
    key.includes("SECONDDISCOUNT") ||
    raw.includes("第二件半價") ||
    raw.includes("第二件折扣") ||
    raw.includes("第二件優惠")
  ) return "SECOND_DISCOUNT";
  if (key.includes("QUANTITYDISCOUNT") || raw.includes("件數優惠") || raw.includes("多件優惠") || raw.includes("指定商品折扣") || raw.includes("商品折扣")) return "QUANTITY_DISCOUNT";
  if (key.includes("MIXMATCH") || raw.includes("任選優惠") || raw.includes("任選")) return "MIX_MATCH";
  if (key.includes("AMOUNTDISCOUNT") || raw.includes("滿額折扣") || raw.includes("滿額優惠")) return "BUY_AMOUNT_DISCOUNT";
  return raw || "MIX_MATCH";
}

export function normalizePromotionMethod(value: string): PromotionMethod {
  const raw = value.trim();
  const key = compact(raw);
  if (key.includes("FREE") || raw.includes("免費") || raw.includes("贈送")) return "FREE";
  if (key.includes("FIXEDPRICE") || raw.includes("固定價格") || raw.includes("固定價")) return "FIXED_PRICE";
  if (key.includes("AMOUNTOFF") || raw.includes("折固定金額") || raw.includes("折價金額") || raw.includes("現折")) return "AMOUNT_OFF";
  if (key.includes("PERCENTPRICE") || raw.includes("支付比例") || raw.includes("折後比例")) return "PERCENT_PRICE";
  if (key.includes("PERCENTOFF") || raw.includes("百分比折扣") || raw.includes("折扣百分比") || raw.includes("打折")) return "PERCENT_OFF";
  return "PERCENT_OFF";
}

export function getActivityDiscountMethod(activity: Activity): PromotionMethod {
  const type = normalizeActivityType(activity.type);
  if (type === "SECOND_DISCOUNT" && !activity.discountMethod.trim()) return "PERCENT_OFF";
  return normalizePromotionMethod(activity.discountMethod);
}

export function getActivityDiscountValue(activity: Activity): number {
  // 優先使用後台設定的「優惠值」。
  // 例如第二件優惠 + PERCENT_OFF + 90 = 第二件折 90%（支付 10%）。
  // 只有舊資料明確寫「第二件半價」且沒有填優惠值時，才回退為 50%。
  const value = Number(activity.discountValue);
  if (Number.isFinite(value) && value > 0) return Math.max(0, value);

  const rawType = compact(activity.type);
  if (rawType.includes("SECONDHALFPRICE") || activity.type.includes("第二件半價")) return 50;
  return 0;
}

/**
 * 買 A 送 B／加價購每取得一份優惠所需的主商品件數。
 * 「需要件數」是目前後台的主要設定；舊資料未填時才沿用「觸發件數」。
 */
export function getPromotionalTriggerThreshold(
  activity: Pick<Activity, "requiredCount" | "triggerCount">,
): number {
  const requiredCount = Math.floor(Number(activity.requiredCount));
  if (Number.isFinite(requiredCount) && requiredCount > 0) return requiredCount;

  const triggerCount = Math.floor(Number(activity.triggerCount));
  if (Number.isFinite(triggerCount) && triggerCount > 0) return triggerCount;

  return 1;
}

/**
 * 依主商品實際件數計算最多可取得的贈品／加購品數量。
 * 可重複套用：每湊滿一組就再取得一份；不可重複：整組最多一份。
 */
export function getEligiblePromotionBenefitQuantity(
  activity: Pick<Activity, "requiredCount" | "triggerCount" | "repeatable">,
  triggerPieceCount: number,
): number {
  const safeTriggerCount = Math.max(0, Math.floor(Number(triggerPieceCount) || 0));
  const completeGroups = Math.floor(
    safeTriggerCount / getPromotionalTriggerThreshold(activity),
  );

  if (completeGroups < 1) return 0;
  return activity.repeatable ? completeGroups : 1;
}

export function applyPromotionDiscount(basePrice: number, methodRaw: string, valueRaw: string | number): number {
  const method = normalizePromotionMethod(methodRaw);
  const numeric = typeof valueRaw === "number" ? valueRaw : Number(valueRaw);
  const value = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  if (method === "FREE") return 0;
  if (method === "FIXED_PRICE") return Math.max(0, Math.round(value));
  if (method === "AMOUNT_OFF") return Math.max(0, Math.round(basePrice - value));
  if (method === "PERCENT_PRICE") return Math.max(0, Math.round(basePrice * Math.min(value, 100) / 100));
  return Math.max(0, Math.round(basePrice * (100 - Math.min(value, 100)) / 100));
}

export function getPromotionDescription(activity: Activity): string {
  const method = getActivityDiscountMethod(activity);
  const value = getActivityDiscountValue(activity);
  const itemIndex = activity.discountItemIndex || activity.requiredCount || activity.triggerCount || 2;
  const isPerItemPromotion = itemIndex <= 1 || (activity.requiredCount || activity.triggerCount || 0) <= 1;

  if (isPerItemPromotion) {
    if (method === "FREE") return "活動商品免費";
    if (method === "FIXED_PRICE") return `活動商品固定 NT$${Math.round(value).toLocaleString("zh-TW")}`;
    if (method === "AMOUNT_OFF") return `活動商品現折 NT$${Math.round(value).toLocaleString("zh-TW")}`;
    if (method === "PERCENT_PRICE") return `活動商品支付 ${value}%（約 ${value} 折）`;
    const payablePercent = Math.max(0, 100 - Math.min(value, 100));
    return `活動商品折扣 ${value}%（支付 ${payablePercent}%）`;
  }

  if (method === "FREE") return `第 ${itemIndex} 件免費`;
  if (method === "FIXED_PRICE") return `第 ${itemIndex} 件固定 NT$${Math.round(value).toLocaleString("zh-TW")}`;
  if (method === "AMOUNT_OFF") return `第 ${itemIndex} 件現折 NT$${Math.round(value).toLocaleString("zh-TW")}`;
  if (method === "PERCENT_PRICE") return `第 ${itemIndex} 件以原價 ${value}% 計算`;
  const payablePercent = Math.max(0, 100 - Math.min(value, 100));
  return `第 ${itemIndex} 件折扣 ${value}%（支付 ${payablePercent}%）`;
}
