import { NextRequest, NextResponse } from "next/server";
import { hasAvailableCoupons, validateCoupon } from "@/lib/coupons";
import { getPublishedProducts } from "@/lib/products";
import type { CartItem } from "@/types/product";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ available: await hasAvailableCoupons() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { code?: string; items?: CartItem[] };
    const products = await getPublishedProducts();
    const result = await validateCoupon(
      typeof body.code === "string" ? body.code : "",
      Array.isArray(body.items) ? body.items : [],
      products,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "目前無法確認優惠碼，請稍後再試。" }, { status: 500 });
  }
}
