import { Activity } from "@/types/activity";
import { getPromotionDescription, normalizeActivityType } from "@/lib/promotionEngine";

const currency = new Intl.NumberFormat("zh-TW");

export function isQuantityDiscountActivity(activity: Activity): boolean {
  const type = normalizeActivityType(activity.type);
  return type === "SECOND_DISCOUNT" || type === "QUANTITY_DISCOUNT";
}

export function isMixMatchActivity(activity: Activity): boolean {
  return normalizeActivityType(activity.type) === "MIX_MATCH";
}

export function getActivityPriceText(activity: Activity): string {
  const type = normalizeActivityType(activity.type);
  if (type === "SECOND_DISCOUNT" || type === "QUANTITY_DISCOUNT") {
    return getPromotionDescription(activity);
  }
  if (type === "MIX_MATCH") {
    return `任選 ${activity.requiredCount} 件 NT$${currency.format(activity.price)}`;
  }
  if (type === "ADD_ON") {
    const prices = activity.products
      .filter((item) => item.role === "加購商品" || item.role === "ADD_ON")
      .map((item) => item.activityProductPrice)
      .filter((value): value is number => typeof value === "number" && value > 0);
    const price = prices.length ? Math.min(...prices) : activity.discountValue;
    return price > 0 ? `加購價 NT$${currency.format(price)}` : "加價購優惠";
  }
  if (type === "BUY_GET") return "買指定商品送贈品";
  return activity.subtitle || activity.name;
}
