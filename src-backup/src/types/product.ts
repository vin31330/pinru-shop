export type ProductOption = {
  name: string;
  values: string[];
};

export type ProductMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  order: number;
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
