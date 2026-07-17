"use client";

import { useEffect, useMemo, useState } from "react";
import { addProductToCart } from "@/lib/cart";
import { PricingPlan, Product, ProductOption } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");
type ItemSelections = Record<string, string>[];

function createSelections(quantity: number, options: ProductOption[]): ItemSelections {
  return Array.from({ length: quantity }, () =>
    Object.fromEntries(
      options.map((option) => [option.name, option.values[0] ?? ""]),
    ),
  );
}

export default function AddToCartPanel({ product }: { product: Product }) {
  const fallbackPlan: PricingPlan = useMemo(
    () => ({
      id: "legacy-single",
      name: "一件",
      quantity: 1,
      price: product.salePrice ?? product.price,
      isDefault: true,
      selectOptionsPerItem: true,
      order: 1,
      optionPrices: [],
    }),
    [product.price, product.salePrice],
  );

  const plans = product.pricingPlans.length > 0 ? product.pricingPlans : [fallbackPlan];
  const initialPlan = plans.find((plan) => plan.isDefault) ?? plans[0];
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan.id);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? initialPlan;

  const priceGroups = useMemo(
    () => Array.from(new Set(selectedPlan.optionPrices.map((item) => item.groupName))),
    [selectedPlan.optionPrices],
  );

  const perItemOptions = useMemo(
    () => product.options.filter((option) => !priceGroups.includes(option.name)),
    [product.options, priceGroups],
  );

  const [selectedPriceOptionId, setSelectedPriceOptionId] = useState(
    selectedPlan.optionPrices[0]?.id ?? "",
  );
  const [selections, setSelections] = useState<ItemSelections>(() =>
    createSelections(selectedPlan.quantity, perItemOptions),
  );
  const [groupQuantity, setGroupQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSelectedPriceOptionId(selectedPlan.optionPrices[0]?.id ?? "");
  }, [selectedPlan.id, selectedPlan.optionPrices]);

  useEffect(() => {
    setSelections(createSelections(selectedPlan.quantity, perItemOptions));
  }, [selectedPlan.id, selectedPlan.quantity, perItemOptions]);

  const selectedPriceOption = selectedPlan.optionPrices.find(
    (item) => item.id === selectedPriceOptionId,
  );
  const selectedGroupPrice = selectedPriceOption?.price ?? selectedPlan.price;

  function updateSelection(itemIndex: number, groupName: string, value: string) {
    setSelections((current) =>
      current.map((item, index) =>
        index === itemIndex ? { ...item, [groupName]: value } : item,
      ),
    );
  }

  function add() {
    const selectedOptions: Record<string, string> = {
      購買方案: selectedPlan.name,
      每組件數: String(selectedPlan.quantity),
    };

    if (selectedPriceOption) {
      selectedOptions[selectedPriceOption.groupName] = selectedPriceOption.optionValue;
    }

    selections.forEach((item, index) => {
      Object.entries(item).forEach(([groupName, value]) => {
        selectedOptions[`第${index + 1}件-${groupName}`] = value;
      });
    });

    addProductToCart(
      { ...product, price: selectedGroupPrice, salePrice: undefined },
      groupQuantity,
      selectedOptions,
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-black">購買方案</h2>
        <div className="mt-3 grid gap-2">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 ${
                selectedPlan.id === plan.id
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pricing-plan"
                  checked={selectedPlan.id === plan.id}
                  onChange={() => setSelectedPlanId(plan.id)}
                />
                <span>
                  <span className="block font-black">{plan.name}</span>
                  <span className="text-sm text-slate-500">共 {plan.quantity} 件</span>
                </span>
              </span>
              <span className="text-lg font-black text-rose-600">
                {plan.optionPrices.length > 0
                  ? "依規格計價"
                  : `NT$${currency.format(plan.price)}`}
              </span>
            </label>
          ))}
        </div>
      </div>

      {selectedPlan.optionPrices.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-black">選擇價格規格</h2>
          <p className="mt-1 text-sm text-slate-500">
            這個尺寸或容量會套用到整組商品。
          </p>
          <div className="mt-3 grid gap-2">
            {selectedPlan.optionPrices.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 ${
                  selectedPriceOptionId === item.id
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="pricing-option"
                    checked={selectedPriceOptionId === item.id}
                    onChange={() => setSelectedPriceOptionId(item.id)}
                  />
                  <span className="font-black">
                    {item.groupName}：{item.optionValue}
                  </span>
                </span>
                <span className="text-lg font-black text-rose-600">
                  NT${currency.format(item.price)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {perItemOptions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-black">選擇每件商品規格</h2>
          <div className="mt-3 space-y-4">
            {selections.map((selection, itemIndex) => (
              <div key={itemIndex} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 font-black text-emerald-700">
                  第 {itemIndex + 1} 件
                </div>
                <div className="space-y-3">
                  {perItemOptions.map((option) => (
                    <label key={option.name} className="block">
                      <span className="mb-1.5 block text-sm font-bold">
                        {option.name}
                      </span>
                      <select
                        value={selection[option.name] ?? ""}
                        onChange={(event) =>
                          updateSelection(itemIndex, option.name, event.target.value)
                        }
                        className="h-12 w-full rounded-xl border bg-white px-3"
                      >
                        {option.values.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 font-bold">購買組數</div>
        <div className="inline-flex overflow-hidden rounded-xl border">
          <button
            type="button"
            onClick={() => setGroupQuantity((value) => Math.max(1, value - 1))}
            className="h-11 w-11 text-xl font-bold"
          >
            −
          </button>
          <div className="grid h-11 min-w-12 place-items-center border-x font-bold">
            {groupQuantity}
          </div>
          <button
            type="button"
            onClick={() => setGroupQuantity((value) => value + 1)}
            className="h-11 w-11 text-xl font-bold"
          >
            ＋
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          共 {selectedPlan.quantity * groupQuantity} 件商品
        </p>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          {selectedPlan.name} × {groupQuantity} 組
        </div>
        {selectedPriceOption && (
          <div className="mt-1 text-sm text-slate-600">
            {selectedPriceOption.groupName}：{selectedPriceOption.optionValue}
          </div>
        )}
        <div className="mt-1 text-2xl font-black text-rose-600">
          NT${currency.format(selectedGroupPrice * groupQuantity)}
        </div>
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white"
      >
        {added ? "已加入購物車 ✓" : "加入購物車"}
      </button>
    </div>
  );
}
