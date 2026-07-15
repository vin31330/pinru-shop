"use client";

import { useMemo, useState } from "react";
import { addProductToCart } from "@/lib/cart";
import { Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

export default function AddToCartPanel({ product }: { product: Product }) {
  const initialOptions = useMemo(
    () =>
      Object.fromEntries(
        product.options.map((option) => [option.name, option.values[0] ?? ""]),
      ),
    [product.options],
  );

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(initialOptions);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const activePrice = product.salePrice ?? product.price;

  function handleAdd() {
    addProductToCart(product, quantity, selectedOptions);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {product.options.map((option) => (
        <label key={option.name} className="mb-4 block">
          <span className="mb-2 block font-bold">{option.name}</span>
          <select
            value={selectedOptions[option.name]}
            onChange={(event) =>
              setSelectedOptions((current) => ({
                ...current,
                [option.name]: event.target.value,
              }))
            }
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none"
          >
            {option.values.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}

      <div className="mb-5">
        <div className="mb-2 font-bold">數量</div>
        <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="h-11 w-11 text-xl font-bold"
          >
            −
          </button>
          <div className="grid h-11 min-w-12 place-items-center border-x border-slate-300 font-bold">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => setQuantity((value) => value + 1)}
            className="h-11 w-11 text-xl font-bold"
          >
            ＋
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl bg-slate-50 p-4">
        {product.salePrice && (
          <div className="text-sm text-slate-400 line-through">
            原價 NT${currency.format(product.price)}
          </div>
        )}
        <div className="text-2xl font-black text-rose-600">
          NT${currency.format(activePrice * quantity)}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white"
      >
        {added ? "已加入購物車 ✓" : "加入購物車"}
      </button>

      <a
        href="#"
        className="mt-3 block w-full rounded-2xl bg-[#06C755] px-5 py-4 text-center text-lg font-black text-white"
      >
        聯繫 LINE 官方帳號
      </a>
    </div>
  );
}
