import type { PricingPlan, Product, ProductOption } from "@/types/product";
import {
  getDefaultPricingPlan,
  getOrdinaryProductOptions,
  getProductPricingPlans,
  resolveProductPrice,
} from "@/lib/pricingEngine";

function bundleColorOption(plan: PricingPlan, options: ProductOption[]): ProductOption | undefined {
  if (!plan.selectOptionsPerItem || plan.quantity <= 1) return undefined;
  if (!/(包色|全色|全花色|全款)/.test(plan.name)) return undefined;
  const option = options.find((item) => /(顏色|花色|色系|色號)/.test(item.name));
  if (!option || option.values.length !== plan.quantity) return undefined;
  return option;
}


export function hasActivityPurchaseChoices(product: Product): boolean {
  const plans = getProductPricingPlans(product);
  if (plans.length > 1) return true;
  return plans.some((plan) =>
    plan.optionPrices.length > 0 || getOrdinaryProductOptions(product, plan).length > 0,
  );
}

export function buildActivityPurchaseOptions(product: Product, planId?: string): Record<string, string> {
  const plan = product.pricingPlans.find((item) => item.id === planId)
    ?? getDefaultPricingPlan(product);
  const priceOption = plan.optionPrices[0];
  const options: Record<string, string> = {
    方案ID: plan.id,
    購買方案: plan.name,
    每組件數: String(plan.quantity),
  };

  if (priceOption) options[priceOption.groupName] = priceOption.optionValue;

  const ordinaryOptions = getOrdinaryProductOptions(product, plan);
  const autoColor = bundleColorOption(plan, ordinaryOptions);
  for (let index = 1; index <= Math.max(1, plan.quantity); index += 1) {
    for (const option of ordinaryOptions) {
      const value = autoColor?.name === option.name
        ? autoColor.values[index - 1] ?? autoColor.values[0] ?? ""
        : option.values[0] ?? "";
      options[`第${index}件-${option.name}`] = value;
    }
  }
  return options;
}

export function getActivityPurchase(product: Product, selectedOptions?: Record<string, string>) {
  const options = selectedOptions && Object.keys(selectedOptions).length > 0
    ? selectedOptions
    : buildActivityPurchaseOptions(product);
  const resolution = resolveProductPrice(product, options);
  if (resolution.ok) {
    return {
      options,
      price: resolution.price,
      originalPrice: resolution.originalPrice,
      plan: resolution.plan,
      priceOption: resolution.priceOption,
    };
  }

  const fallbackOptions = buildActivityPurchaseOptions(product);
  const fallback = resolveProductPrice(product, fallbackOptions);
  if (!fallback.ok) {
    return {
      options: fallbackOptions,
      price: product.salePrice ?? product.basePrice ?? product.price,
      originalPrice: product.basePrice ?? product.price,
      plan: getDefaultPricingPlan(product),
      priceOption: undefined,
    };
  }
  return {
    options: fallbackOptions,
    price: fallback.price,
    originalPrice: fallback.originalPrice,
    plan: fallback.plan,
    priceOption: fallback.priceOption,
  };
}

export function getActivityPurchaseSummary(product: Product, selectedOptions?: Record<string, string>): string {
  const purchase = getActivityPurchase(product, selectedOptions);
  const options = purchase.options;
  const parts: string[] = [];
  const planName = options["購買方案"]?.trim();
  if (planName) parts.push(planName);

  for (const [key, value] of Object.entries(options)) {
    if (!value || ["方案ID", "購買方案", "每組件數"].includes(key) || key.startsWith("活動")) continue;
    const pieceMatch = key.match(/^第(\d+)件-(.+)$/);
    const label = pieceMatch
      ? purchase.plan.quantity > 1
        ? `第${pieceMatch[1]}件 ${pieceMatch[2]}`
        : pieceMatch[2]
      : key;
    const text = `${label}：${value}`;
    if (!parts.includes(text)) parts.push(text);
  }
  return parts.join("｜") || "標準規格";
}
