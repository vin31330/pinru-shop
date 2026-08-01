import { CartItem } from "@/types/product";

export type ShippingMethod = "7-11貨到付款" | "全家貨到付款" | "郵局貨到付款" | "市場取貨";

export type OrderCustomer = {
  name: string;
  phone: string;
  shipping: ShippingMethod;
  store: string;
  address: string;
  market: string;
  note: string;
};

export type CreateOrderPayload = {
  clientRequestId: string;
  customer: OrderCustomer;
  items: CartItem[];
  totalAmount: number;
  lineMessage: string;
  submittedAt: string;
};

export type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  duplicate: boolean;
  orderSummary: string;
};

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as {
    ok?: boolean;
    orderId?: string;
    orderNumber?: string;
    duplicate?: boolean;
    orderSummary?: string;
    message?: string;
  };

  if (!response.ok || !result.ok || !result.orderId) {
    throw new Error(result.message || "訂單寫入 Google Sheets 失敗。");
  }

  return {
    orderId: result.orderId,
    orderNumber: result.orderNumber || result.orderId,
    duplicate: Boolean(result.duplicate),
    orderSummary: result.orderSummary || "",
  };
}

export function buildLineOrderUrl(lineId: string, message: string): string {
  // oaMessage 必須使用官方帳號完整 LINE ID（包含 @），再進行百分比編碼。
  const trimmedId = lineId.trim();

  if (!trimmedId) {
    throw new Error("尚未設定 LINE 官方帳號 ID。");
  }

  const normalizedId = trimmedId.startsWith("@") ? trimmedId : `@${trimmedId}`;

  return `https://line.me/R/oaMessage/${encodeURIComponent(normalizedId)}/?${encodeURIComponent(message)}`;
}
