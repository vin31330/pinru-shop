"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CartItemImage from "@/components/CartItemImage";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { loadCart, saveCart } from "@/lib/cart";
import { CartItem } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  function updateQuantity(cartId: string, quantity: number) {
    const next = items
      .map((item) =>
        item.cartId === cartId ? { ...item, quantity: Math.max(0, quantity) } : item,
      )
      .filter((item) => item.quantity > 0);

    setItems(next);
    saveCart(next);
  }

  function removeItem(cartId: string) {
    const next = items.filter((item) => item.cartId !== cartId);
    setItems(next);
    saveCart(next);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-6">
        <h1 className="text-2xl font-black">購物車</h1>
        <p className="mt-1 text-sm text-slate-500">共 {totalCount} 件商品</p>

        {items.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🛒</div>
            <div className="mt-4 font-bold">購物車目前是空的</div>
            <Link
              href="/products"
              className="mt-5 inline-block rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white"
            >
              前往選購
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <article
                  key={item.cartId}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <CartItemImage imageUrl={item.imageUrl} name={item.name} />

                    <div className="min-w-0 flex-1">
                      <h2 className="font-black">{item.name}</h2>
                      <div className="mt-1 text-sm text-slate-500">
                        {Object.entries(item.selectedOptions).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}：{value}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 font-black text-emerald-700">
                        NT${currency.format(item.unitPrice)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.cartId)}
                      className="self-start text-sm font-bold text-rose-500"
                    >
                      刪除
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        className="h-10 w-10 text-lg font-bold"
                      >
                        −
                      </button>
                      <div className="grid h-10 min-w-12 place-items-center border-x border-slate-300 font-bold">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="h-10 w-10 text-lg font-bold"
                      >
                        ＋
                      </button>
                    </div>

                    <div className="text-lg font-black">
                      小計 NT${currency.format(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>商品總數</span>
                <span>{totalCount} 件</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xl font-black">
                <span>商品總金額</span>
                <span className="text-rose-600">
                  NT${currency.format(totalAmount)}
                </span>
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white"
              >
                前往填寫訂單
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
