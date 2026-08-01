import { Product } from "@/types/product";

export type ActivityProduct = {
  id: string;
  activityId: string;
  productId: string;
  order: number;
  allowRepeat: boolean;
  maxPerGroup?: number;
  role: string;
  activityProductPrice?: number;
  product: Product;
};

export type Activity = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  type: string;
  requiredCount: number;
  triggerCount: number;
  price: number;
  discountMethod: string;
  discountValue: number;
  discountTarget: string;
  discountItemIndex: number;
  repeatable: boolean;
  startDate?: string;
  endDate?: string;
  homeOrder: number;
  imageUrl?: string;
  selectOptionsPerItem: boolean;
  products: ActivityProduct[];
  status: "upcoming" | "active" | "ended";
};

export type ActivitySelection = {
  productId: string;
  productName: string;
  imageUrl?: string;
  selectedOptions: Record<string, string>;
};
