import type {
  PricingPlan,
  PricingPlanOption,
  Product,
  ProductOption,
} from "@/types/product";

export type ProductPriceResolution =
  | {
      ok: true;
      plan: PricingPlan;
      price: number;
      originalPrice: number;
      priceOption?: PricingPlanOption;
    }
  | {
      ok: false;
      error: string;
    };

function positive(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function getStandaloneProductPrice(product: Product): number {
  return positive(product.salePrice)
    ?? positive(product.basePrice)
    ?? positive(product.price)
    ?? 0;
}

export function createFallbackPricingPlan(product: Product): PricingPlan {
  return {
    id: "legacy-single",
    name: "一件",
    quantity: 1,
    price: getStandaloneProductPrice(product),
    isDefault: true,
    selectOptionsPerItem: true,
    order: 1,
    optionPrices: [],
  };
}

export function getProductPricingPlans(product: Product): PricingPlan[] {
  return product.pricingPlans.length > 0
    ? product.pricingPlans
    : [createFallbackPricingPlan(product)];
}

export function getDefaultPricingPlan(product: Product): PricingPlan {
  const plans = getProductPricingPlans(product);
  return plans.find((plan) => plan.isDefault) ?? plans[0];
}

export function getPriceGroupNames(plan: PricingPlan): string[] {
  return Array.from(new Set(plan.optionPrices.map((option) => option.groupName)));
}

export function getOrdinaryProductOptions(
  product: Product,
  plan: PricingPlan,
): ProductOption[] {
  const priceGroups = new Set(getPriceGroupNames(plan));
  return product.options.filter((option) => !priceGroups.has(option.name));
}

export function getPlanPurchasablePrices(plan: PricingPlan): number[] {
  const prices = plan.optionPrices.length > 0
    ? plan.optionPrices.map((option) => option.price)
    : [plan.price];
  return prices.map(positive).filter((price): price is number => price !== undefined);
}

export function getPurchasablePriceCandidates(
  productPrice: number,
  salePrice: number,
  pricingPlans: PricingPlan[],
): number[] {
  if (pricingPlans.length > 0) {
    return pricingPlans.flatMap(getPlanPurchasablePrices);
  }

  return [salePrice, productPrice]
    .map(positive)
    .filter((price): price is number => price !== undefined);
}

function selectedPlanFor(
  product: Product,
  selectedOptions: Record<string, string>,
): PricingPlan | undefined {
  const plans = getProductPricingPlans(product);
  const selectedPlanId = selectedOptions["方案ID"]?.trim();
  if (selectedPlanId) {
    return plans.find((plan) => plan.id === selectedPlanId);
  }

  const selectedPlanName = selectedOptions["購買方案"]?.trim();
  if (selectedPlanName) {
    return plans.find((plan) => plan.name === selectedPlanName);
  }

  return plans.find((plan) => plan.isDefault) ?? plans[0];
}

function selectedPriceOptionFor(
  plan: PricingPlan,
  selectedOptions: Record<string, string>,
): PricingPlanOption | undefined {
  if (plan.optionPrices.length === 0) return undefined;

  return plan.optionPrices.find(
    (option) => selectedOptions[option.groupName] === option.optionValue,
  );
}

function validateOrdinaryOptions(
  product: Product,
  plan: PricingPlan,
  selectedOptions: Record<string, string>,
): string | undefined {
  const ordinaryOptions = getOrdinaryProductOptions(product, plan);
  if (ordinaryOptions.length === 0) return undefined;

  for (let pieceIndex = 1; pieceIndex <= Math.max(1, plan.quantity); pieceIndex += 1) {
    for (const option of ordinaryOptions) {
      const firstPieceValue = selectedOptions[`第1件-${option.name}`];
      const selectedValue = selectedOptions[`第${pieceIndex}件-${option.name}`]
        ?? selectedOptions[option.name]
        ?? firstPieceValue;

      if (!selectedValue || !option.values.includes(selectedValue)) {
        return `原本選擇的第 ${pieceIndex} 件「${option.name}」規格已失效，請重新選擇。`;
      }
    }
  }

  return undefined;
}

export function resolveProductPrice(
  product: Product,
  selectedOptions: Record<string, string>,
): ProductPriceResolution {
  const plan = selectedPlanFor(product, selectedOptions);
  if (!plan) {
    return { ok: false, error: "原本選擇的購買方案已刪除，請重新選擇。" };
  }

  const storedQuantity = Number(selectedOptions["每組件數"]);
  if (
    Number.isFinite(storedQuantity) &&
    storedQuantity > 0 &&
    storedQuantity !== plan.quantity
  ) {
    return { ok: false, error: "原本購買方案的件數已更新，請重新選擇。" };
  }

  const priceOption = selectedPriceOptionFor(plan, selectedOptions);
  if (plan.optionPrices.length > 0 && !priceOption) {
    return { ok: false, error: "原本選擇的價格規格已刪除，請重新選擇。" };
  }

  const price = positive(priceOption?.price ?? plan.price);
  if (!price) {
    return { ok: false, error: "商品價格設定不完整，請聯絡店家。" };
  }

  const optionError = validateOrdinaryOptions(product, plan, selectedOptions);
  if (optionError) return { ok: false, error: optionError };

  const basePerPiece = positive(product.basePrice);
  const baseGroupPrice = basePerPiece ? basePerPiece * Math.max(1, plan.quantity) : price;

  return {
    ok: true,
    plan,
    price,
    originalPrice: Math.max(price, baseGroupPrice),
    priceOption,
  };
}

export function buildDefaultProductPurchase(product: Product) {
  const plan = getDefaultPricingPlan(product);
  const priceOption = plan.optionPrices[0];
  const selectedOptions: Record<string, string> = {
    方案ID: plan.id,
    購買方案: plan.name,
    每組件數: String(plan.quantity),
  };

  if (priceOption) {
    selectedOptions[priceOption.groupName] = priceOption.optionValue;
  }

  const ordinaryOptions = getOrdinaryProductOptions(product, plan);
  for (let pieceIndex = 1; pieceIndex <= Math.max(1, plan.quantity); pieceIndex += 1) {
    for (const option of ordinaryOptions) {
      selectedOptions[`第${pieceIndex}件-${option.name}`] = option.values[0] ?? "";
    }
  }

  const resolution = resolveProductPrice(product, selectedOptions);
  const price = resolution.ok ? resolution.price : priceOption?.price ?? plan.price;
  const originalPrice = resolution.ok ? resolution.originalPrice : price;

  return {
    plan,
    priceOption,
    price,
    originalPrice,
    selectedOptions,
  };
}
