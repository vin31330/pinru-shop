export type ProductOption = { name: string; values: string[] };

export type PricingPlanOption = {
  id: string;
  groupName: string;
  optionValue: string;
  price: number;
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
  description: string;
  category: string;
  tags: string[];
  price: number;
  salePrice?: number;
  mainImage?: string;
  media: ProductMedia[];
  options: ProductOption[];
  pricingPlans: PricingPlan[];
  published: boolean;
  featured?: boolean;
  isNew?: boolean;
  limitedOffer?: boolean;
};

export type CartItem = {
  cartId: string;
  productId: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: Record<string, string>;
};
