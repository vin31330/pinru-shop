import { loadCart, makeCartId, replaceCartItem, saveCart } from "@/lib/cart";
import { resolveProductPrice } from "@/lib/pricingEngine";
import { Activity, ActivitySelection } from "@/types/activity";
import { CartItem } from "@/types/product";

function buildActivityCartItem(
  activity: Activity,
  selections: ActivitySelection[],
  groupQuantity: number,
): CartItem {
  const selectedOptions: Record<string, string> = {
    活動方案: `${activity.requiredCount}件 NT$${activity.price}`,
    活動內容: selections.map((item) => item.productName).join("、"),
  };

  selections.forEach((selection, index) => {
    Object.entries(selection.selectedOptions).forEach(([key, value]) => {
      selectedOptions[`第${index + 1}件-${selection.productName}-${key}`] = value;
    });
  });

  const signature = selections
    .map((item) => `${item.productId}:${JSON.stringify(item.selectedOptions)}`)
    .join("|");
  const productId = `activity:${activity.id}`;
  const cartId = makeCartId(productId, {
    ...selectedOptions,
    活動選擇識別: signature,
  });
  const originalUnitPrice = selections.reduce((sum, selection) => {
    const product = activity.products.find(
      (relation) => relation.productId === selection.productId,
    )?.product;
    if (!product) return sum;
    const resolved = resolveProductPrice(product, selection.selectedOptions);
    return sum + (resolved.ok ? resolved.originalPrice : (product.basePrice ?? product.price));
  }, 0);

  return {
    itemType: "activity",
    cartId,
    productId,
    activityId: activity.id,
    name: activity.name,
    imageUrl: activity.imageUrl,
    unitPrice: activity.price,
    originalUnitPrice: Math.max(activity.price, originalUnitPrice),
    quantity: Math.max(1, groupQuantity),
    selectedOptions,
    activitySelections: selections,
    validationStatus: "valid",
  };
}

export function getActivityCartId(
  activity: Activity,
  selections: ActivitySelection[],
  groupQuantity = 1,
) {
  return buildActivityCartItem(activity, selections, groupQuantity).cartId;
}

export function addActivityToCart(
  activity: Activity,
  selections: ActivitySelection[],
  groupQuantity = 1,
) {
  const nextItem = buildActivityCartItem(activity, selections, groupQuantity);
  const items = loadCart();
  const existing = items.find((item) => item.cartId === nextItem.cartId);

  if (existing) {
    existing.quantity += nextItem.quantity;
    existing.unitPrice = activity.price;
    existing.imageUrl = activity.imageUrl;
    existing.activitySelections = selections;
    existing.selectedOptions = nextItem.selectedOptions;
  } else {
    items.push(nextItem);
  }

  saveCart(items);
  return items;
}

export function replaceActivityCartItem(
  oldCartId: string,
  activity: Activity,
  selections: ActivitySelection[],
  groupQuantity = 1,
) {
  const nextItem = buildActivityCartItem(activity, selections, groupQuantity);
  return replaceCartItem(oldCartId, nextItem);
}
