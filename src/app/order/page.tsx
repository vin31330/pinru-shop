"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductImage from "@/components/ProductImage";
import { clearCart, loadCart, reconcileCart, saveCart } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import { Activity } from "@/types/activity";
import { CartItem, Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");
const ORDER_DRAFT_KEY = "pinru-shop-order-draft";
const PENDING_ORDER_KEY = "pinru-shop-pending-order";
const PENDING_ORDER_MAX_AGE = 24 * 60 * 60 * 1000;

type PendingOrder = {
  clientRequestId: string;
  fingerprint: string;
  createdAt: string;
};

type Shipping = "7-11貨到付款" | "全家貨到付款" | "郵局貨到付款" | "市場取貨";
type OrderDraft = {
  name: string;
  phone: string;
  shipping: Shipping;
  store: string;
  address: string;
  market: string;
  note: string;
};

const emptyDraft: OrderDraft = {
  name: "",
  phone: "",
  shipping: "7-11貨到付款",
  store: "",
  address: "",
  market: "",
  note: "",
};

function normalizeCustomer(draft: OrderDraft): OrderDraft {
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    shipping: draft.shipping,
    store:
      draft.shipping === "7-11貨到付款" || draft.shipping === "全家貨到付款"
        ? draft.store.trim()
        : "",
    address: draft.shipping === "郵局貨到付款" ? draft.address.trim() : "",
    market: draft.shipping === "市場取貨" ? draft.market.trim() : "",
    note: draft.note.trim(),
  };
}

export default function OrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft);
  const [checking, setChecking] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitLockRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ORDER_DRAFT_KEY);
      if (saved) setDraft({ ...emptyDraft, ...JSON.parse(saved) });
    } catch {}

    const current = loadCart();
    setItems(current);
    Promise.all([
      fetch("/api/products").then((response) => { if (!response.ok) throw new Error(); return response.json() as Promise<Product[]>; }),
      fetch("/api/activities").then((response) => { if (!response.ok) throw new Error(); return response.json() as Promise<Activity[]>; }),
    ])
      .then(([products, activities]) => {
        const next = reconcileCart(current, products, activities);
        saveCart(next);
        setItems(next);
        if (next.some((item) => item.validationStatus === "invalid")) {
          setValidationError("購物車內有下架或規格失效的商品，請返回購物車處理後再送出。");
        }
      })
      .catch(() => setValidationError("目前無法確認最新商品資料，為避免價格錯誤，暫時不能送出訂單。"))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const validItems = items.filter((item) => item.validationStatus !== "invalid");
  const totalAmount = useMemo(
    () => validItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [validItems],
  );

  function update<K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSubmitError("");
  }

  function createClientRequestId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `order-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function buildOrderFingerprint(customer: OrderDraft) {
    return JSON.stringify({
      customer,
      totalAmount,
      items: validItems.map((item) => ({
        cartId: item.cartId,
        productId: item.productId,
        activityId: item.activityId || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions,
        activitySelections: item.activitySelections || [],
      })),
    });
  }

  function getOrCreatePendingOrder(fingerprint: string): PendingOrder {
    try {
      const saved = localStorage.getItem(PENDING_ORDER_KEY);
      if (saved) {
        const pending = JSON.parse(saved) as PendingOrder;
        const createdAt = new Date(pending.createdAt).getTime();
        const isFresh = Number.isFinite(createdAt) && Date.now() - createdAt < PENDING_ORDER_MAX_AGE;

        if (pending.clientRequestId && pending.fingerprint === fingerprint && isFresh) {
          return pending;
        }
      }
    } catch {}

    const pending: PendingOrder = {
      clientRequestId: createClientRequestId(),
      fingerprint,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pending));
    return pending;
  }

  function clearPendingOrder(clientRequestId: string) {
    try {
      const saved = localStorage.getItem(PENDING_ORDER_KEY);
      if (!saved) return;

      const pending = JSON.parse(saved) as PendingOrder;
      if (pending.clientRequestId === clientRequestId) {
        localStorage.removeItem(PENDING_ORDER_KEY);
      }
    } catch {
      localStorage.removeItem(PENDING_ORDER_KEY);
    }
  }

  function buildOrderMessage(customer: OrderDraft, orderId?: string) {
    const detail = validItems
      .map((item) => {
        if (item.itemType === "activity" && item.activitySelections) {
          const activityDetail = item.activitySelections.map((selection, index) => {
            const options = Object.entries(selection.selectedOptions).map(([key, value]) => `${key}：${value}`).join("、");
            return `  第${index + 1}件：${selection.productName}${options ? `（${options}）` : ""}`;
          }).join("\n");
          return `${item.name} × ${item.quantity} 組，單組 NT$${currency.format(item.unitPrice)}\n${activityDetail}\n小計 NT$${currency.format(item.unitPrice * item.quantity)}`;
        }
        const options = Object.entries(item.selectedOptions)
          .filter(([key]) => key !== "活動選擇識別")
          .map(([key, value]) => `${key}：${value}`)
          .join("、");
        return `${item.name}${options ? `（${options}）` : ""} × ${item.quantity}，小計 NT$${currency.format(item.unitPrice * item.quantity)}`;
      })
      .join("\n\n");

    return [
      "您好，我要訂購商品：",
      orderId ? `訂單編號：${orderId}` : "",
      "",
      `收件人姓名：${customer.name}`,
      `收件人電話：${customer.phone}`,
      `取貨方式：${customer.shipping}`,
      customer.store ? `門市名稱：${customer.store}` : "",
      customer.address ? `收件地址：${customer.address}` : "",
      customer.market ? `取貨市場：${customer.market}` : "",
      "",
      "訂購明細：",
      detail,
      "",
      `總金額：NT$${currency.format(totalAmount)}`,
      customer.note ? `備註：${customer.note}` : "",
    ].filter(Boolean).join("\n");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking || submitting || submitLockRef.current || validationError || items.length === 0) return;

    const customer = normalizeCustomer(draft);

    const confirmed = window.confirm(
      "確定送出訂單嗎？\n\n送出後會前往 LINE，請再按一次傳送。",
    );
    if (!confirmed) return;

    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    const fingerprint = buildOrderFingerprint(customer);
    const pendingOrder = getOrCreatePendingOrder(fingerprint);

    try {
      const baseMessage = buildOrderMessage(customer);
      const result = await createOrder({
        clientRequestId: pendingOrder.clientRequestId,
        customer,
        items: validItems,
        totalAmount,
        lineMessage: baseMessage,
        submittedAt: pendingOrder.createdAt,
      });

      // 完整訂單內容已寫入 Google Sheets。
      // LINE 網址若帶入完整商品明細，商品多時會超過伺服器網址長度限制，
      // 因而出現 414 Request-URI Too Large。
      // 這裡只帶入簡短的訂單通知，店家可用訂單編號到 Sheets 查看完整內容。
      const lineMessage = [
        "您好，我已送出網站訂單。",
        `訂單編號：${result.orderNumber}`,
        `收件人：${customer.name}`,
        `總金額：NT$${currency.format(totalAmount)}`,
        result.duplicate ? "此訂單已成功建立，系統未重複新增。" : "",
        "麻煩幫我確認訂單，謝謝。",
      ].filter(Boolean).join("\n");

      clearPendingOrder(pendingOrder.clientRequestId);
      localStorage.removeItem(ORDER_DRAFT_KEY);
      clearCart();

      sessionStorage.setItem(
        "pinru-shop-order-success",
        JSON.stringify({
          orderNumber: result.orderNumber,
          customerName: customer.name,
          totalAmount,
          lineMessage,
          duplicate: result.duplicate,
          createdAt: new Date().toISOString(),
        }),
      );

      router.replace("/order-success");
    } catch (error) {
      // 發生逾時或網路錯誤時保留 pending 資料。
      // 使用者再次送出相同內容會沿用同一個 clientRequestId，避免新增第二張訂單。
      setSubmitError(error instanceof Error ? error.message : "送出訂單失敗，請稍後再試。");
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }

  const postalDisabled = totalAmount < 1000;

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <form data-order-form onSubmit={submit} noValidate className="mx-auto max-w-3xl px-4 py-7">
        <Link href="/cart" className="inline-flex rounded-xl border border-emerald-600 px-4 py-2 font-black text-emerald-700">
          ← 返回購物車繼續選購
        </Link>
        <h1 className="mt-5 text-2xl font-black">填寫訂單</h1>
        <p className="mt-2 text-sm text-slate-500">返回購物車修改商品時，已填寫的訂購資料會自動保留，不需要重新填寫。</p>
        {checking && <div className="mt-4 rounded-2xl bg-amber-50 p-4 font-bold text-amber-700">正在再次確認商品與最新價格……</div>}
        {validationError && <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-bold text-rose-700">{validationError} <Link href="/cart" className="underline">返回購物車</Link></div>}
        {submitError && <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-bold text-rose-700">{submitError}</div>}

        <div className="mt-6 space-y-5 rounded-3xl bg-white p-5">
          <div>
            <div className="mb-3 font-black">取貨方式</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["7-11貨到付款", "全家貨到付款", "郵局貨到付款", "市場取貨"] as Shipping[]).map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${
                    draft.shipping === value ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <input
                    type="radio"
                    className="mt-1"
                    checked={draft.shipping === value}
                    onChange={() => update("shipping", value)}
                    name="shipping"
                  />
                  <span>
                    <span className="block font-bold">{value}</span>
                    {value === "郵局貨到付款" && (
                      <span className={`mt-1 block text-sm ${postalDisabled ? "text-rose-500" : "text-emerald-700"}`}>
                        滿 NT$1,000 免費配送
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {(draft.shipping === "7-11貨到付款" || draft.shipping === "全家貨到付款") && (
            <label className="block">
              <span className="mb-2 block font-bold">門市名稱</span>
              <input id="order-store" name="store" value={draft.store} onChange={(e) => update("store", e.target.value)} className="h-12 w-full rounded-xl border px-3" />
            </label>
          )}

          {draft.shipping === "郵局貨到付款" && (
            <label className="block">
              <span className="mb-2 block font-bold">收件地址</span>
              <input id="order-address" name="address" autoComplete="street-address" value={draft.address} onChange={(e) => update("address", e.target.value)} className="h-12 w-full rounded-xl border px-3" />
            </label>
          )}

          {draft.shipping === "市場取貨" ? (
            <>
              <label className="block">
                <span className="mb-2 block font-bold">取貨市場</span>
                <input id="order-market" name="market" value={draft.market} onChange={(e) => update("market", e.target.value)} className="h-12 w-full rounded-xl border px-3" />
              </label>
              <label className="block">
                <span className="mb-2 block font-bold">收件人姓名</span>
                <input id="order-name" name="name" autoComplete="name" value={draft.name} onChange={(e) => update("name", e.target.value)} className="h-12 w-full rounded-xl border px-3" />
              </label>
              <label className="block">
                <span className="mb-2 block font-bold">收件人電話</span>
                <input id="order-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(e) => update("phone", e.target.value)} className="h-12 w-full rounded-xl border px-3" />
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="mb-2 block font-bold">收件人姓名</span>
                <input id="order-name" name="name" autoComplete="name" value={draft.name} onChange={(e) => update("name", e.target.value)} className="h-12 w-full rounded-xl border px-3" />
              </label>
              <label className="block">
                <span className="mb-2 block font-bold">收件人電話</span>
                <input id="order-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(e) => update("phone", e.target.value)} className="h-12 w-full rounded-xl border px-3" />
              </label>
            </>
          )}

          <label className="block">
            <span className="mb-2 block font-bold">備註</span>
            <textarea name="note" value={draft.note} onChange={(e) => update("note", e.target.value)} rows={4} className="w-full rounded-xl border p-3" />
          </label>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5">
          <h2 className="text-xl font-black">購物車明細</h2>
          <div className="mt-4 space-y-3">
            {validItems.map((item) => {
              const itemHref = item.itemType === "activity" && item.activityId
                ? `/activities/${encodeURIComponent(item.activityId)}`
                : `/products/${encodeURIComponent(item.productId)}`;

              return (
                <div key={item.cartId} className="flex gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                  <Link href={itemHref} aria-label={`查看${item.name}`} className="shrink-0">
                    <ProductImage src={item.imageUrl} alt={item.name} className="h-[60px] w-[60px] rounded-xl" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={itemHref} className="font-bold transition hover:text-emerald-700 hover:underline">
                      {item.name}
                    </Link>
                    {item.itemType === "activity" && item.activitySelections ? (
                      <div className="mt-1 text-sm text-slate-500">
                        {item.activitySelections.map((selection, index) => (
                          <div key={`${selection.productId}-${index}`}>
                            第 {index + 1} 件：{selection.productName}
                            {Object.keys(selection.selectedOptions).length
                              ? `（${Object.entries(selection.selectedOptions).map(([key, value]) => `${key}：${value}`).join("、")}）`
                              : ""}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-slate-500">
                        {Object.entries(item.selectedOptions)
                          .filter(([key]) => key !== "活動選擇識別")
                          .map(([key, value]) => `${key}：${value}`)
                          .join("、")}
                      </div>
                    )}
                    <div className="mt-1 text-sm">數量：{item.quantity}</div>
                    <div className="mt-1 font-bold">小計 NT${currency.format(item.unitPrice * item.quantity)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-xl font-black"><span>總金額</span><span className="text-rose-600">NT${currency.format(totalAmount)}</span></div>
        </div>

        <div className="mt-6 space-y-3">
          <button type="submit" disabled={items.length === 0 || checking || submitting || Boolean(validationError)} className="w-full rounded-2xl bg-[#06C755] px-5 py-4 text-lg font-black text-white disabled:opacity-50">
            {submitting ? "正在寫入訂單……" : "送出訂單"}
          </button>
          <p className="text-center text-sm text-slate-500">訂單建立成功後，可在完成頁一鍵前往 LINE 通知店家。</p>
        </div>
      </form>
      <Footer />
    </main>
  );
}
