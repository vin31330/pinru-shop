"use client";

import { useEffect, useMemo, useState } from "react";
import { makeCartId, replaceCartItem } from "@/lib/cart";
import {
  getOrdinaryProductOptions,
  getOriginalGroupPrice,
  getProductPricingPlans,
  resolveProductPrice,
} from "@/lib/pricingEngine";
import type { CartItem, Product, ProductOption } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");
type ItemSelections = Record<string, string>[];

function createSelections(quantity: number, options: ProductOption[], item: CartItem): ItemSelections {
  return Array.from({ length: quantity }, (_, index) =>
    Object.fromEntries(
      options.map((option) => [
        option.name,
        item.selectedOptions[`第${index + 1}件-${option.name}`] ?? option.values[0] ?? "",
      ]),
    ),
  );
}

export default function CartItemEditor({
  item,
  product,
  onClose,
  onSaved,
}: {
  item: CartItem;
  product: Product;
  onClose: () => void;
  onSaved: (items: CartItem[], savedCartId: string) => void;
}) {
  const plans = useMemo(() => getProductPricingPlans(product), [product]);
  const initialPlan = plans.find((plan) => plan.id === item.selectedOptions["方案ID"])
    ?? plans.find((plan) => plan.name === item.selectedOptions["購買方案"])
    ?? plans[0];
  const [planId, setPlanId] = useState(initialPlan.id);
  const selectedPlan = plans.find((plan) => plan.id === planId) ?? plans[0];
  const perItemOptions = getOrdinaryProductOptions(product, selectedPlan);
  const initialPriceOption = selectedPlan.optionPrices.find(
    (entry) => item.selectedOptions[entry.groupName] === entry.optionValue,
  );
  const [priceOptionId, setPriceOptionId] = useState(initialPriceOption?.id ?? selectedPlan.optionPrices[0]?.id ?? "");
  const [groupQuantity, setGroupQuantity] = useState(item.quantity);
  const [selections, setSelections] = useState<ItemSelections>(() =>
    createSelections(initialPlan.quantity, perItemOptions, item),
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function changePlan(nextPlanId: string) {
    const nextPlan = plans.find((plan) => plan.id === nextPlanId) ?? plans[0];
    const nextOptions = getOrdinaryProductOptions(product, nextPlan);
    setPlanId(nextPlan.id);
    setPriceOptionId(nextPlan.optionPrices[0]?.id ?? "");
    setSelections(createSelections(nextPlan.quantity, nextOptions, item));
  }

  function updateSelection(index: number, name: string, value: string) {
    setSelections((current) =>
      current.map((selection, selectionIndex) =>
        selectionIndex === index ? { ...selection, [name]: value } : selection,
      ),
    );
  }

  function save() {
    const priceOption = selectedPlan.optionPrices.find((entry) => entry.id === priceOptionId);
    const activityMetadata = Object.fromEntries(
      Object.entries(item.selectedOptions).filter(([key]) => key.startsWith("活動")),
    );
    const selectedOptions: Record<string, string> = {
      方案ID: selectedPlan.id,
      購買方案: selectedPlan.name,
      每組件數: String(selectedPlan.quantity),
      ...activityMetadata,
    };
    if (priceOption) selectedOptions[priceOption.groupName] = priceOption.optionValue;
    selections.forEach((selection, index) => {
      Object.entries(selection).forEach(([name, value]) => {
        selectedOptions[`第${index + 1}件-${name}`] = value;
      });
    });
    const promotionRole = item.selectedOptions["活動角色"] ?? "";
    const keepActivityPrice = [
      "贈品商品",
      "加購商品",
      "優惠折扣商品",
    ].includes(promotionRole);
    const unitPrice = keepActivityPrice
      ? item.unitPrice
      : priceOption?.price ?? selectedPlan.price;
    const priceResolution = resolveProductPrice(product, selectedOptions);
    const replacement: CartItem = {
      itemType: item.itemType,
      cartId: makeCartId(product.id, selectedOptions),
      productId: product.id,
      activityId: item.activityId,
      name: product.name,
      imageUrl: product.mainImage,
      unitPrice,
      originalUnitPrice: priceResolution.ok
        ? priceResolution.originalPrice
        : Math.max(unitPrice, item.originalUnitPrice ?? unitPrice),
      quantity: Math.max(1, groupQuantity),
      selectedOptions,
      activitySelections: item.activitySelections,
      validationStatus: "valid",
    };
    onSaved(replaceCartItem(item.cartId, replacement), replacement.cartId);
    onClose();
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] flex h-dvh items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`修改 ${product.name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="text-sm font-bold text-emerald-700">修改購物車商品</div>
            <h2 className="truncate text-xl font-black">{product.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉修改視窗"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border text-2xl font-black leading-none text-slate-600 transition hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <h3 className="font-black">購買方案</h3>
            {plans.map((plan) => (
              <label key={plan.id} className={`flex cursor-pointer justify-between rounded-2xl border-2 p-4 ${plan.id === selectedPlan.id ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}>
                <span><input type="radio" checked={plan.id === selectedPlan.id} onChange={() => changePlan(plan.id)} /> <b>{plan.name}</b>（{plan.quantity} 件）</span>
                <b>{plan.optionPrices.length ? "依規格計價" : `NT$${currency.format(plan.price)}`}</b>
              </label>
            ))}
          </div>

          {selectedPlan.optionPrices.length > 0 && (
            <div className="mt-5 space-y-3">
              <h3 className="font-black">價格規格</h3>
              {selectedPlan.optionPrices.map((entry) => (
                <label key={entry.id} className={`flex cursor-pointer justify-between rounded-2xl border-2 p-4 ${entry.id === priceOptionId ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}>
                  <span><input type="radio" checked={entry.id === priceOptionId} onChange={() => setPriceOptionId(entry.id)} /> {entry.groupName}：{entry.optionValue}</span>
                  <span className="shrink-0 text-right">
                    {getOriginalGroupPrice(product, selectedPlan, entry) > entry.price ? (
                      <>
                        <span className="block text-xs font-bold text-slate-400 line-through">
                          原價 NT${currency.format(getOriginalGroupPrice(product, selectedPlan, entry))}
                        </span>
                        <b className="block text-rose-600">特價 NT${currency.format(entry.price)}</b>
                      </>
                    ) : (
                      <b>NT${currency.format(entry.price)}</b>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}

          {perItemOptions.length > 0 && (
            <div className="mt-5 space-y-4">
              <h3 className="font-black">每件商品規格</h3>
              {selections.map((selection, index) => (
                <div key={index} className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 font-black text-emerald-700">第 {index + 1} 件</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {perItemOptions.map((option) => (
                      <label key={option.name}>
                        <span className="mb-1 block text-sm font-bold">{option.name}</span>
                        <select value={selection[option.name] ?? ""} onChange={(event) => updateSelection(index, option.name, event.target.value)} className="h-12 w-full rounded-xl border bg-white px-3">
                          {option.values.map((value) => <option key={value}>{value}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <span className="font-bold">購買組數</span>
            <div className="inline-flex overflow-hidden rounded-xl border bg-white">
              <button type="button" onClick={() => setGroupQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 font-bold">−</button>
              <div className="grid h-10 min-w-12 place-items-center border-x font-bold">{groupQuantity}</div>
              <button type="button" onClick={() => setGroupQuantity((value) => value + 1)} className="h-10 w-10 font-bold">＋</button>
            </div>
          </div>
        </div>

        <div className="cart-editor-actions grid shrink-0 grid-cols-2 gap-3 border-t bg-white px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-2xl border px-5 py-3.5 font-black text-slate-700">
            取消並關閉
          </button>
          <button type="button" onClick={save} className="rounded-2xl bg-emerald-600 px-5 py-3.5 font-black text-white">
            儲存修改
          </button>
        </div>
      </div>
    </div>
  );
}
