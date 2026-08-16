export const FRIENDLY_PATHS = {
  home: "/home/首頁",
  activities: "/activities/all/優惠活動",
  hotProducts: "/products/hot/熱銷商品",
  newProducts: "/products/new/新品推薦",
  allProducts: "/products/all/查看全部商品",
  categories: "/products/categories/商品分類",
} as const;

export function categoryPath(categoryId: string, categoryName: string) {
  return `/products/category/${encodeURIComponent(categoryId)}/${encodeURIComponent(categoryName.trim() || categoryId || "商品分類")}`;
}

export function productPath(productId: string, productName: string) {
  return `/products/${encodeURIComponent(productId)}/${encodeURIComponent(productName.trim() || "商品")}`;
}

export function activityPath(activityId: string, activityName: string) {
  return `/activities/${encodeURIComponent(activityId)}/${encodeURIComponent(activityName.trim() || "優惠活動")}`;
}
