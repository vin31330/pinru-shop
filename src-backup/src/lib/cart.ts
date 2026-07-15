import { CartItem, Product } from "@/types/product";

const CART_KEY = "pinru-shop-cart";

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("pinru-cart-updated"));
}

export function buildCartId(
  productId: string,
  selectedOptions: Record<string, string>,
) {
  const optionText = Object.entries(selectedOptions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return `${productId}::${optionText}`;
}

export function addProductToCart(
  product: Product,
  quantity: number,
  selectedOptions: Record<string, string>,
) {
  const items = loadCart();
  const cartId = buildCartId(product.id, selectedOptions);
  const existing = items.find((item) => item.cartId === cartId);
  const unitPrice = product.salePrice ?? product.price;

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      cartId,
      productId: product.id,
      name: product.name,
      imageUrl: product.mainImage,
      unitPrice,
      quantity,
      selectedOptions,
    });
  }

  saveCart(items);
}
