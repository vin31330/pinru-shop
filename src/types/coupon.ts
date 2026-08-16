export type CouponType = "FIXED_OFF" | "PERCENT_OFF";
export type CouponScope = "ALL" | "PRODUCTS" | "CATEGORIES";
export type CouponRelation = "INCLUDE" | "EXCLUDE";

export type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minSpend?: number;
  maxDiscount?: number;
  scope: CouponScope;
  maxUses?: number;
  usedCount: number;
  combinableWithActivities: boolean;
  startDate?: string;
  endDate?: string;
  published: boolean;
};

export type CouponProductRule = {
  couponId: string;
  productId: string;
  relation: CouponRelation;
  published: boolean;
};

export type CouponCategoryRule = {
  couponId: string;
  categoryId: string;
  relation: CouponRelation;
  published: boolean;
};

export type CouponValidationResult = {
  ok: boolean;
  message: string;
  coupon?: Pick<Coupon, "id" | "code" | "name" | "description">;
  eligibleSubtotal?: number;
  discountAmount?: number;
  finalTotal?: number;
};
