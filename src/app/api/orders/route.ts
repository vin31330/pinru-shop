import { NextRequest, NextResponse } from "next/server";
import { getPublishedActivities } from "@/lib/activities";
import { reconcileCart } from "@/lib/cart";
import { getPublishedProducts } from "@/lib/products";
import type { CartItem } from "@/types/product";

export const dynamic = "force-dynamic";

const SHIPPING_METHODS = [
  "7-11貨到付款",
  "全家貨到付款",
  "郵局貨到付款",
  "市場取貨",
] as const;

type ShippingMethod = (typeof SHIPPING_METHODS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maxLength = 500): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.cartId === "string" &&
    typeof value.productId === "string" &&
    typeof value.name === "string" &&
    typeof value.unitPrice === "number" &&
    Number.isFinite(value.unitPrice) &&
    value.unitPrice >= 0 &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    value.quantity <= 99 &&
    isRecord(value.selectedOptions)
  );
}

function normalizeCustomer(value: unknown) {
  if (!isRecord(value)) return { error: "缺少收件人資料。" } as const;

  const shipping = text(value.shipping, 30) as ShippingMethod;
  if (!SHIPPING_METHODS.includes(shipping)) {
    return { error: "請選擇有效的取貨方式。" } as const;
  }

  const name = text(value.name, 80);
  const phone = text(value.phone, 40);
  const store = shipping === "7-11貨到付款" || shipping === "全家貨到付款"
    ? text(value.store, 160)
    : "";
  const address = shipping === "郵局貨到付款" ? text(value.address, 300) : "";
  const market = shipping === "市場取貨" ? text(value.market, 160) : "";

  return {
    customer: {
      name,
      phone,
      shipping,
      store,
      address,
      market,
      note: text(value.note, 1000),
    },
  } as const;
}

export async function POST(request: NextRequest) {
  try {
    const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();

    if (!gasUrl) {
      return errorResponse("尚未設定 GOOGLE_APPS_SCRIPT_URL。", 500);
    }

    const rawBody: unknown = await request.json();
    if (!isRecord(rawBody)) return errorResponse("訂單資料格式不正確。");

    const customerResult = normalizeCustomer(rawBody.customer);
    if ("error" in customerResult) {
      return errorResponse(customerResult.error || "收件人資料格式不正確。");
    }

    const clientRequestId = text(rawBody.clientRequestId, 160);
    if (!clientRequestId) return errorResponse("缺少送單識別碼，請重新送出訂單。");

    if (!Array.isArray(rawBody.items) || rawBody.items.length === 0) {
      return errorResponse("訂單內沒有商品。");
    }
    if (rawBody.items.length > 200 || !rawBody.items.every(isCartItem)) {
      return errorResponse("訂單商品資料格式不正確。");
    }

    // 送到 Apps Script 前，再由伺服器依目前 Sheets 資料重新驗價。
    // 客戶端傳入的金額只用來偵測結帳期間是否有價格變動。
    const [products, activities] = await Promise.all([
      getPublishedProducts(),
      getPublishedActivities({ includeUpcoming: true, includeEnded: true }),
    ]);
    const checkedItems = reconcileCart(rawBody.items, products, activities);
    const invalidItem = checkedItems.find((item) => item.validationStatus === "invalid");
    if (invalidItem) {
      return errorResponse(
        invalidItem.validationMessage || "購物車內有失效商品，請返回購物車重新確認。",
        409,
      );
    }

    const serverTotal = checkedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const clientTotal = Number(rawBody.totalAmount);
    if (!Number.isFinite(clientTotal) || Math.abs(clientTotal - serverTotal) > 0.5) {
      return errorResponse("商品價格已更新，請返回購物車確認最新金額後再送出。", 409);
    }

    // Apps Script 的 doPost(e) 從網址參數 e.parameter.action 讀取路由。
    const endpoint = new URL(gasUrl);
    endpoint.searchParams.set("action", "createOrder");

    const body = {
      clientRequestId,
      customer: customerResult.customer,
      items: checkedItems,
      totalAmount: serverTotal,
      lineMessage: text(rawBody.lineMessage, 20000),
      submittedAt: text(rawBody.submittedAt, 80),
    };

    const response = await fetch(endpoint.toString(), {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseText = await response.text();
    let result: unknown;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Apps Script 回傳非 JSON：${responseText.slice(0, 160)}`);
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "Google Apps Script 寫入失敗。",
          detail: result,
        },
        { status: 502 },
      );
    }

    const normalized = result as {
      ok?: boolean;
      success?: boolean;
      message?: string;
      orderId?: string;
    };

    if (!normalized.ok || !normalized.orderId) {
      return errorResponse(normalized.message || "訂單寫入失敗。", 400);
    }

    return NextResponse.json(normalized);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "送出訂單時發生未知錯誤。",
      },
      { status: 500 },
    );
  }
}
