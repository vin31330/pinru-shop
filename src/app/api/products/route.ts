import { NextResponse } from "next/server";
import { getPublishedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getPublishedProducts();
    return NextResponse.json(products, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "無法取得最新商品資料" }, { status: 500 });
  }
}
