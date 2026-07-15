"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { loadCart } from "@/lib/cart";
import { CartItem } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

type Shipping = "7-11貨到付款" | "全家貨到付款" | "郵局貨到付款" | "市場取貨";

export default function OrderPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shipping, setShipping] = useState<Shipping>("7-11貨到付款");

  useEffect(() => setItems(loadCart()), []);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const phone = String(form.get("phone") ?? "");
    const store = String(form.get("store") ?? "");
    const address = String(form.get("address") ?? "");
    const market = String(form.get("market") ?? "");
    const note = String(form.get("note") ?? "");

    const detail = items
      .map((item) => {
        const options = Object.entries(item.selectedOptions)
          .map(([key, value]) => `${key}：${value}`)
          .join("、");

        return `${item.name}${options ? `（${options}）` : ""} × ${item.quantity}，小計 NT$${currency.format(item.unitPrice * item.quantity)}`;
      })
      .join("\n");

    const message = [
      "您好，我要訂購商品：",
      "",
      `姓名：${name}`,
      `電話：${phone}`,
      `寄件方式：${shipping}`,
      store ? `門市名稱：${store}` : "",
      address ? `收件地址：${address}` : "",
      market ? `取貨市場：${market}` : "",
      "",
      "訂購明細：",
      detail,
      "",
      `總金額：NT$${currency.format(totalAmount)}`,
      note ? `備註：${note}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const lineUrl =
      process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL ||
      "https://line.me/R/oaMessage/";

    window.location.href = `${lineUrl}?${encodeURIComponent(message)}`;
  }

  const postalDisabled = totalAmount < 1000;

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <form onSubmit={submit} className="mx-auto max-w-3xl px-4 py-7">
        <h1 className="text-2xl font-black">填寫訂單</h1>

        <div className="mt-6 space-y-4 rounded-3xl bg-white p-5">
          <label className="block">
            <span className="mb-2 block font-bold">姓名</span>
            <input name="name" required className="h-12 w-full rounded-xl border px-3" />
          </label>

          <label className="block">
            <span className="mb-2 block font-bold">電話</span>
            <input name="phone" required className="h-12 w-full rounded-xl border px-3" />
          </label>

          <div>
            <div className="mb-2 font-bold">寄件方式</div>

            {(
              [
                "7-11貨到付款",
                "全家貨到付款",
                "郵局貨到付款",
                "市場取貨",
              ] as Shipping[]
            ).map((value) => (
              <label key={value} className="mb-2 flex items-center gap-2">
                <input
                  type="radio"
                  name="shipping"
                  checked={shipping === value}
                  disabled={value === "郵局貨到付款" && postalDisabled}
                  onChange={() => setShipping(value)}
                />
                {value}
                {value === "郵局貨到付款" && postalDisabled && (
                  <span className="text-sm text-rose-500">滿 NT$1,000 才可選</span>
                )}
              </label>
            ))}
          </div>

          {(shipping === "7-11貨到付款" ||
            shipping === "全家貨到付款") && (
            <label className="block">
              <span className="mb-2 block font-bold">門市名稱</span>
              <input name="store" required className="h-12 w-full rounded-xl border px-3" />
            </label>
          )}

          {shipping === "郵局貨到付款" && (
            <label className="block">
              <span className="mb-2 block font-bold">收件地址</span>
              <input name="address" required className="h-12 w-full rounded-xl border px-3" />
            </label>
          )}

          {shipping === "市場取貨" && (
            <label className="block">
              <span className="mb-2 block font-bold">取貨市場</span>
              <input name="market" required className="h-12 w-full rounded-xl border px-3" />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block font-bold">備註</span>
            <textarea name="note" rows={4} className="w-full rounded-xl border p-3" />
          </label>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5">
          <h2 className="text-xl font-black">購物車明細</h2>

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.cartId} className="border-b pb-3">
                <div className="font-bold">{item.name}</div>
                <div className="text-sm text-slate-500">
                  {Object.entries(item.selectedOptions)
                    .map(([key, value]) => `${key}：${value}`)
                    .join("、")}
                </div>
                <div>
                  × {item.quantity}｜小計 NT$
                  {currency.format(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between text-xl font-black">
            <span>總金額</span>
            <span className="text-rose-600">
              NT${currency.format(totalAmount)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={items.length === 0}
          className="mt-6 w-full rounded-2xl bg-[#06C755] px-5 py-4 text-lg font-black text-white disabled:opacity-50"
        >
          送出訂單到 LINE 官方帳號
        </button>
      </form>

      <Footer />
    </main>
  );
}
