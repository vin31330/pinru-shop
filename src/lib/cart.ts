import type { Activity } from "@/types/activity";
import type { CartItem, Product } from "@/types/product";
import {
  buildDefaultProductPurchase,
  resolveProductPrice,
} from "@/lib/pricingEngine";
import {
  applyPromotionDiscount,
  getActivityDiscountMethod,
  getActivityDiscountValue,
  getEligiblePromotionBenefitQuantity,
  getPromotionalTriggerThreshold,
  normalizeActivityType,
} from "@/lib/promotionEngine";

const CART_KEY = "pinru-shop-cart";
const CART_EVENT = "pinru-cart-updated";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.cartId === "string" &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice) &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    !!item.selectedOptions &&
    typeof item.selectedOptions === "object"
  );
}

export function makeCartId(
  productId: string,
  selectedOptions: Record<string, string>,
): string {
  const optionKey = Object.entries(selectedOptions)
    .sort(([a], [b]) => a.localeCompare(b, "zh-Hant"))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
  return `${productId}::${optionKey}`;
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

export function buildProductCartItem(
  product: Product,
  quantity: number,
  selectedOptions: Record<string, string>,
  explicitUnitPrice?: number,
  explicitOriginalUnitPrice?: number,
): CartItem {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const resolution = resolveProductPrice(product, selectedOptions);
  const standardPrice = resolution.ok
    ? resolution.price
    : product.salePrice ?? product.basePrice ?? product.price;
  const unitPrice = explicitUnitPrice ?? standardPrice;
  const originalUnitPrice = explicitOriginalUnitPrice
    ?? (resolution.ok ? resolution.originalPrice : Math.max(unitPrice, standardPrice));
  return {
    cartId: makeCartId(product.id, selectedOptions),
    productId: product.id,
    name: product.name,
    imageUrl: product.mainImage,
    unitPrice,
    originalUnitPrice: Math.max(unitPrice, originalUnitPrice),
    quantity: safeQuantity,
    selectedOptions,
    validationStatus: "valid",
  };
}

export function addCartItems(additions: CartItem[]): CartItem[] {
  const items = loadCart();

  additions.forEach((addition) => {
    const existing = items.find((item) => item.cartId === addition.cartId);
    if (existing) {
      existing.quantity += addition.quantity;
      existing.unitPrice = addition.unitPrice;
      existing.imageUrl = addition.imageUrl;
      existing.selectedOptions = addition.selectedOptions;
      existing.activitySelections = addition.activitySelections;
      existing.validationStatus = "valid";
      delete existing.validationMessage;
      delete existing.priceChangedFrom;
    } else {
      items.push(addition);
    }
  });

  saveCart(items);
  return items;
}

export function addProductToCart(
  product: Product,
  quantity: number,
  selectedOptions: Record<string, string>,
  explicitUnitPrice?: number,
  explicitOriginalUnitPrice?: number,
) {
  return addCartItems([
    buildProductCartItem(
      product,
      quantity,
      selectedOptions,
      explicitUnitPrice,
      explicitOriginalUnitPrice,
    ),
  ]);
}

export function replaceCartItem(oldCartId: string, replacement: CartItem): CartItem[] {
  const current = loadCart();
  const oldIndex = current.findIndex((item) => item.cartId === oldCartId);
  if (oldIndex < 0) {
    current.push(replacement);
    saveCart(current);
    return current;
  }

  const duplicateIndex = current.findIndex(
    (item, index) => index !== oldIndex && item.cartId === replacement.cartId,
  );

  if (duplicateIndex >= 0) {
    const duplicate = current[duplicateIndex];
    const merged: CartItem = {
      ...duplicate,
      ...replacement,
      quantity: duplicate.quantity + replacement.quantity,
      validationStatus: "valid",
      validationMessage: undefined,
      priceChangedFrom: undefined,
    };
    const insertIndex = Math.min(oldIndex, duplicateIndex);
    const next = current.filter((_, index) => index !== oldIndex && index !== duplicateIndex);
    next.splice(insertIndex, 0, merged);
    saveCart(next);
    return next;
  }

  const next = [...current];
  next.splice(oldIndex, 1, replacement);
  saveCart(next);
  return next;
}

export function replacePromotionCartGroup(
  oldSelectionId: string,
  replacements: CartItem[],
): CartItem[] {
  const current = loadCart();
  const groupIndexes = current
    .map((item, index) =>
      item.selectedOptions["活動選擇識別"] === oldSelectionId ? index : -1,
    )
    .filter((index) => index >= 0);

  if (groupIndexes.length === 0) {
    return addCartItems(replacements);
  }

  const insertIndex = groupIndexes[0];
  const next = current.filter(
    (item) => item.selectedOptions["活動選擇識別"] !== oldSelectionId,
  );
  next.splice(insertIndex, 0, ...replacements);
  saveCart(next);
  return next;
}

function invalid(item: CartItem, message: string): CartItem {
  return {
    ...item,
    validationStatus: "invalid",
    validationMessage: message,
  };
}

export function reconcileCart(items: CartItem[], products: Product[], activities?: Activity[]): CartItem[] {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    if (item.itemType === "activity" || item.productId.startsWith("activity:")) {
      if (!activities) return { ...item, validationStatus: "valid", validationMessage: undefined };
      const activity = activities.find((candidate) => candidate.id === item.activityId);
      if (!activity) return invalid(item, "此活動已下架，無法結帳。");
      if (activity.status !== "active") return invalid(item, activity.status === "upcoming" ? "此活動尚未開始。" : "此活動已結束。");
      if (!item.activitySelections || item.activitySelections.length !== activity.requiredCount) return invalid(item, "活動商品件數不正確，請重新選擇。");
      if (!activity.repeatable && item.quantity > 1) return invalid(item, "此活動每張訂單只能使用一組。");
      const allowed = new Map(activity.products.map((relation) => [relation.productId, relation]));
      const counts = new Map<string, number>();
      let originalGroupPrice = 0;
      for (const selection of item.activitySelections) {
        const relation = allowed.get(selection.productId);
        if (!relation) return invalid(item, `活動商品「${selection.productName}」已下架。`);
        const count = (counts.get(selection.productId) ?? 0) + 1;
        counts.set(selection.productId, count);
        const limit = relation.maxPerGroup ?? (relation.allowRepeat ? activity.requiredCount : 1);
        if (count > limit) return invalid(item, `活動商品「${selection.productName}」超過可選數量。`);
        if (activity.selectOptionsPerItem) {
          for (const option of relation.product.options) {
            const selected = selection.selectedOptions[option.name];
            if (!selected || !option.values.includes(selected)) return invalid(item, `活動商品「${selection.productName}」的規格已失效。`);
          }
        }
        originalGroupPrice += buildDefaultProductPurchase(relation.product).originalPrice;
      }
      const previousPrice = item.unitPrice;
      return {
        ...item,
        name: activity.name,
        imageUrl: activity.imageUrl,
        unitPrice: activity.price,
        originalUnitPrice: Math.max(activity.price, originalGroupPrice),
        validationStatus: "valid",
        validationMessage: undefined,
        priceChangedFrom: previousPrice !== activity.price ? previousPrice : undefined,
      };
    }
    const product = productMap.get(item.productId);
    if (!product) return invalid(item, "此商品目前已下架，無法結帳。 ");

    const promotionActivityId = item.selectedOptions["活動ID"];
    const promotionRole = item.selectedOptions["活動角色"];
    if (promotionActivityId && activities) {
      const activity = activities.find((candidate) => candidate.id === promotionActivityId);
      if (!activity) return invalid(item, "此優惠活動已下架，請重新選購。");
      if (activity.status !== "active") {
        return invalid(item, activity.status === "upcoming" ? "此優惠活動尚未開始。" : "此優惠活動已結束。");
      }
      const relation = activity.products.find((candidate) => candidate.productId === item.productId);
      if (!relation) return invalid(item, "此商品已不在原優惠活動中，請重新選購。");
      const selectionId = item.selectedOptions["活動選擇識別"];
      if (!selectionId) return invalid(item, "此優惠組合識別已失效，請重新選購。");
      const samePromotionGroup = items.filter(
        (candidate) =>
          candidate.selectedOptions["活動ID"] === promotionActivityId &&
          candidate.selectedOptions["活動選擇識別"] === selectionId,
      );

      if (promotionRole === "優惠原價商品" || promotionRole === "優惠折扣商品") {
        const required = Math.max(1, Number(item.selectedOptions["活動每組件數"]) || activity.requiredCount || activity.triggerCount || 1);
        const sameGroup = samePromotionGroup.filter((candidate) =>
          (candidate.selectedOptions["活動角色"] === "優惠原價商品" || candidate.selectedOptions["活動角色"] === "優惠折扣商品")
        );
        if (
          sameGroup.length < required ||
          sameGroup.length % required !== 0 ||
          (!activity.repeatable && sameGroup.length !== required)
        ) {
          return invalid(item, `第二件優惠商品必須每 ${required} 件為完整一組，請重新選購。`);
        }
        const expectedDiscountedCount = sameGroup.length / required;
        const discountedCount = sameGroup.filter(
          (candidate) => candidate.selectedOptions["活動角色"] === "優惠折扣商品",
        ).length;
        if (discountedCount !== expectedDiscountedCount) {
          return invalid(item, "優惠商品件序不正確，請重新選購。");
        }

        const resolved = resolveProductPrice(product, item.selectedOptions);
        if (!resolved.ok) return invalid(item, resolved.error);
        const discountMethod = getActivityDiscountMethod(activity);
        const discountValue = getActivityDiscountValue(activity);
        const latestPrice = promotionRole === "優惠折扣商品"
          ? applyPromotionDiscount(resolved.price, discountMethod, discountValue)
          : resolved.price;
        const previousPrice = item.unitPrice;
        return {
          ...item,
          name: product.name,
          imageUrl: product.mainImage,
          unitPrice: latestPrice,
          originalUnitPrice: resolved.originalPrice,
          selectedOptions: {
            ...item.selectedOptions,
            方案ID: resolved.plan.id,
            購買方案: resolved.plan.name,
            每組件數: String(resolved.plan.quantity),
            活動每組件數: String(required),
            活動折扣方式: discountMethod,
            活動優惠值: String(discountValue),
          },
          validationStatus: "valid",
          validationMessage: undefined,
          priceChangedFrom: previousPrice !== latestPrice ? previousPrice : undefined,
        };
      }

      if (promotionRole === "贈品商品" || promotionRole === "加購商品") {
        const triggerPieceCount = samePromotionGroup.reduce(
          (total, candidate) =>
            candidate.selectedOptions["活動角色"] === "觸發商品"
              ? total + candidate.quantity * Math.max(1, Number(candidate.selectedOptions["每組件數"]) || 1)
              : total,
          0,
        );
        const hasTriggerProduct = samePromotionGroup.some(
          (candidate) =>
            candidate.selectedOptions["活動角色"] === "觸發商品" &&
            candidate.validationStatus !== "invalid",
        );
        if (
          !hasTriggerProduct ||
          triggerPieceCount < getPromotionalTriggerThreshold(activity)
        ) {
          return invalid(item, promotionRole === "贈品商品" ? "缺少符合活動的主商品，贈品無法結帳。" : "缺少符合活動的主商品，加購品無法結帳。");
        }

        const benefitItems = samePromotionGroup.filter((candidate) =>
          ["贈品商品", "加購商品"].includes(
            candidate.selectedOptions["活動角色"] ?? "",
          ),
        );
        const selectedBenefitQuantity = benefitItems.reduce(
          (total, candidate) => total + Math.max(1, candidate.quantity),
          0,
        );
        const eligibleBenefitQuantity = getEligiblePromotionBenefitQuantity(
          activity,
          triggerPieceCount,
        );
        if (selectedBenefitQuantity > eligibleBenefitQuantity) {
          return invalid(
            item,
            `主商品每滿 ${getPromotionalTriggerThreshold(activity)} 件可使用 1 份優惠，目前最多 ${eligibleBenefitQuantity} 份。`,
          );
        }
        if (
          promotionRole === "贈品商品" &&
          normalizeActivityType(activity.type) === "BUY_GET" &&
          selectedBenefitQuantity !== eligibleBenefitQuantity
        ) {
          return invalid(item, "贈品數量與主商品可取得的優惠組數不一致，請重新選購。");
        }
      }

      if (promotionRole === "贈品商品") {
        const resolved = resolveProductPrice(product, item.selectedOptions);
        if (!resolved.ok) return invalid(item, resolved.error);
        return {
          ...item,
          name: product.name,
          imageUrl: product.mainImage,
          unitPrice: 0,
          originalUnitPrice: resolved.originalPrice,
          validationStatus: "valid",
          validationMessage: undefined,
          priceChangedFrom: undefined,
        };
      }

      if (promotionRole === "加購商品") {
        const resolved = resolveProductPrice(product, item.selectedOptions);
        if (!resolved.ok) return invalid(item, resolved.error);
        const latestPrice = relation.activityProductPrice ?? activity.discountValue;
        if (!(latestPrice >= 0)) return invalid(item, "加購價格設定不完整，請重新選購。");
        const previousPrice = item.unitPrice;
        return {
          ...item,
          name: product.name,
          imageUrl: product.mainImage,
          unitPrice: latestPrice,
          originalUnitPrice: Math.max(latestPrice, resolved.originalPrice),
          validationStatus: "valid",
          validationMessage: undefined,
          priceChangedFrom: previousPrice !== latestPrice ? previousPrice : undefined,
        };
      }

      if (promotionRole === "觸發商品") {
        const activityType = normalizeActivityType(activity.type);
        const hasConfiguredGift = activity.products.some(
          (candidate) => candidate.role.includes("贈品") || candidate.role.toUpperCase().includes("GIFT"),
        );
        const hasGift = samePromotionGroup.some(
          (candidate) => candidate.selectedOptions["活動角色"] === "贈品商品",
        );
        if (activityType === "BUY_GET" && hasConfiguredGift && !hasGift) {
          return invalid(item, "買 A 送 B 活動缺少贈品，請重新選購。");
        }
      }
    }

    const resolved = resolveProductPrice(product, item.selectedOptions);
    if (!resolved.ok) return invalid(item, resolved.error);
    const latestPrice = resolved.price;
    const selectedOptions = {
      ...item.selectedOptions,
      方案ID: resolved.plan.id,
      購買方案: resolved.plan.name,
      每組件數: String(resolved.plan.quantity),
    };

    const previousPrice = item.unitPrice;
    const priceChanged = previousPrice !== latestPrice;
    return {
      ...item,
      // 舊版購物車尚未保存方案ID時先保留原 cartId，避免升級後第一次
      // 重新驗價讓「加入並查看購物車」的定位失效。新加入的商品本來就
      // 含方案ID，仍會使用完整的新識別。
      cartId: item.selectedOptions["方案ID"]
        ? makeCartId(product.id, selectedOptions)
        : item.cartId,
      name: product.name,
      imageUrl: product.mainImage,
      unitPrice: latestPrice,
      originalUnitPrice: resolved.originalPrice,
      selectedOptions,
      validationStatus: "valid",
      validationMessage: undefined,
      priceChangedFrom: priceChanged ? previousPrice : undefined,
    };
  });
}

export function removeInvalidCartItems(items: CartItem[]): CartItem[] {
  const next = items.filter((item) => item.validationStatus !== "invalid");
  saveCart(next);
  return next;
}
