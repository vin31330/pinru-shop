export type ProductOption = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  salePrice?: number;
  imageEmoji: string;
  images: string[];
  videos: string[];
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
  imageEmoji: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: Record<string, string>;
};
