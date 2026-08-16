import type { CouponValidationResult } from "@/types/coupon";

const COUPON_KEY = "pinru-shop-applied-coupon";

export type AppliedCoupon = {
  code: string;
  id: string;
  name: string;
  description: string;
  discountAmount: number;
  finalTotal: number;
  eligibleSubtotal: number;
};

export function loadAppliedCoupon(): AppliedCoupon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppliedCoupon>;
    if (!parsed.code || !parsed.id || !parsed.name) return null;
    return {
      code: String(parsed.code),
      id: String(parsed.id),
      name: String(parsed.name),
      description: String(parsed.description || ""),
      discountAmount: Number(parsed.discountAmount || 0),
      finalTotal: Number(parsed.finalTotal || 0),
      eligibleSubtotal: Number(parsed.eligibleSubtotal || 0),
    };
  } catch {
    return null;
  }
}

export function saveAppliedCoupon(result: CouponValidationResult) {
  if (typeof window === "undefined" || !result.ok || !result.coupon) return;
  const value: AppliedCoupon = {
    code: result.coupon.code,
    id: result.coupon.id,
    name: result.coupon.name,
    description: result.coupon.description || "",
    discountAmount: Number(result.discountAmount || 0),
    finalTotal: Number(result.finalTotal || 0),
    eligibleSubtotal: Number(result.eligibleSubtotal || 0),
  };
  localStorage.setItem(COUPON_KEY, JSON.stringify(value));
}

export function clearAppliedCoupon() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COUPON_KEY);
}

export async function requestCouponValidation(code: string, items: unknown[]): Promise<CouponValidationResult> {
  const response = await fetch("/api/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, items }),
    cache: "no-store",
  });
  const result = await response.json() as CouponValidationResult;
  if (!response.ok && !result.message) {
    return { ok: false, message: "目前無法確認優惠碼，請稍後再試。" };
  }
  return result;
}
