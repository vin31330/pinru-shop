export type ProductOption = { name: string; values: string[] };

export type PricingPlanOption = {
  id: string;
  groupName: string;
  optionValue: string;
  price: number;
  originalPrice?: number;
  order: number;
};

export type PricingPlan = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  isDefault: boolean;
  selectOptionsPerItem: boolean;
  order: number;
  optionPrices: PricingPlanOption[];
};

export type ProductMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  order: number;
  thumbnailUrl?: string;
};

export type Product = {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  basePrice?: number;
  salePrice?: number;
  mainImage?: string;
  media: ProductMedia[];
  options: ProductOption[];
  pricingPlans: PricingPlan[];
  published: boolean;
  createdAt?: string;
  featured?: boolean;
  featuredOrder?: number;
  isNew?: boolean;
  limitedOffer?: boolean;
  offerActive?: boolean;
  offerStatus?: "none" | "upcoming" | "active" | "ended";
  offerStartDate?: string;
  offerEndDate?: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  order: number;
  icon?: string;
  href?: string;
};

export type CartItem = {
  itemType?: "product" | "activity";
  cartId: string;
  productId: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  originalUnitPrice?: number;
  quantity: number;
  selectedOptions: Record<string, string>;
  validationStatus?: "valid" | "invalid";
  validationMessage?: string;
  priceChangedFrom?: number;
  activityId?: string;
  activitySelections?: Array<{
    productId: string;
    productName: string;
    imageUrl?: string;
    selectedOptions: Record<string, string>;
  }>;
};
