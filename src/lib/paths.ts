export const FRIENDLY_PATHS = {
  home: "/",
  activities: "/activities",
  hotProducts: "/hot",
  newProducts: "/new",
  allProducts: "/products",
  categories: "/categories",
} as const;

const CATEGORY_SLUGS: Record<string, string> = {
  "平底鍋、炒鍋、湯鍋": "pot",
  "保溫杯、水壺、玻璃壺、咖啡杯": "bottle",
  "便當盒、保鮮盒": "lunch",
  "便當盒、保鮮盒、手提袋、保溫袋": "lunch",
  "廚房器具": "kitchen",
  "按摩系列、保養品、個人清潔": "care",
  "清潔用品": "cleaning",
  "瓦斯爐、刀具、砧板": "stove",
  "生活小物": "life",
};

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  pot: "平底鍋、炒鍋、湯鍋",
  bottle: "保溫杯、水壺、玻璃壺、咖啡杯",
  lunch: "便當盒、保鮮盒、手提袋、保溫袋",
  kitchen: "廚房器具",
  care: "按摩系列、保養品、個人清潔",
  cleaning: "清潔用品",
  stove: "瓦斯爐、刀具、砧板",
  life: "生活小物",
};

export function categoryPath(categoryId: string, categoryName: string) {
  const name = categoryName.trim();
  const slug = CATEGORY_SLUGS[name] || CATEGORY_SLUGS[categoryId.trim()];
  return `/c/${encodeURIComponent(slug || categoryId.trim() || "category")}`;
}

export function categoryNameFromSlug(slug: string): string {
  return CATEGORY_SLUG_ALIASES[decodeURIComponent(slug).trim().toLowerCase()] || "";
}

export function productPath(productId: string, _productName?: string) {
  return `/products/${encodeURIComponent(productId)}`;
}

export function activityPath(activityId: string, _activityName?: string) {
  return `/a/${encodeURIComponent(activityId)}`;
}
