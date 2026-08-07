"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { addProductToCart, makeCartId } from "@/lib/cart";
import {
  getOrdinaryProductOptions,
  getOriginalGroupPrice,
  getProductPricingPlans,
  resolveProductPrice,
} from "@/lib/pricingEngine";
import type { PricingPlan, Product, ProductOption } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");
type ItemSelections = Record<string, string>[];

function createSelections(quantity: number, options: ProductOption[]): ItemSelections {
  return Array.from({ length: quantity }, () =>
    Object.fromEntries(
      options.map((option) => [option.name, option.values[0] ?? ""]),
    ),
  );
}

function resizeSelections(
  current: ItemSelections,
  quantity: number,
  options: ProductOption[],
): ItemSelections {
  const defaults = Object.fromEntries(
    options.map((option) => [option.name, option.values[0] ?? ""]),
  );

  return Array.from({ length: quantity }, (_, index) => ({
    ...defaults,
    ...(current[index] ?? {}),
  }));
}

function selectionsForPlan(
  plan: PricingPlan,
  groupQuantity: number,
): number {
  if (!plan.selectOptionsPerItem) return 1;
  return plan.quantity === 1 ? groupQuantity : plan.quantity;
}

function getBundleColorOption(plan: PricingPlan, options: ProductOption[]): ProductOption | undefined {
  if (!plan.selectOptionsPerItem || plan.quantity <= 1) return undefined;
  if (!/(包色|全色|全花色|全款)/.test(plan.name)) return undefined;

  const colorOption = options.find((option) => /(顏色|花色|色系|色號)/.test(option.name));
  if (!colorOption || colorOption.values.length !== plan.quantity) return undefined;
  return colorOption;
}

function createSelectionsForPlan(plan: PricingPlan, quantity: number, options: ProductOption[]): ItemSelections {
  const selections = createSelections(quantity, options);
  const colorOption = getBundleColorOption(plan, options);
  if (!colorOption) return selections;

  return selections.map((selection, index) => ({
    ...selection,
    [colorOption.name]: colorOption.values[index] ?? colorOption.values[0] ?? "",
  }));
}

export default function AddToCartPanel({
  product,
  purchaseId = "product-purchase",
}: {
  product: Product;
  purchaseId?: string;
}) {
  const router = useRouter();
  const controlId = useId();
  const plans = useMemo(
    () => getProductPricingPlans(product),
    [product],
  );
  const initialPlan = plans.find((plan) => plan.isDefault) ?? plans[0];
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan.id);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? initialPlan;

  const perItemOptions = useMemo(
    () => getOrdinaryProductOptions(product, selectedPlan),
    [product, selectedPlan],
  );

  const [selectedPriceOptionId, setSelectedPriceOptionId] = useState(
    selectedPlan.optionPrices[0]?.id ?? "",
  );
  const [selections, setSelections] = useState<ItemSelections>(() =>
    createSelectionsForPlan(
      selectedPlan,
      selectionsForPlan(selectedPlan, 1),
      perItemOptions,
    ),
  );
  const [groupQuantity, setGroupQuantity] = useState(1);
  const bundleColorOption = useMemo(
    () => getBundleColorOption(selectedPlan, perItemOptions),
    [selectedPlan, perItemOptions],
  );
  const [added, setAdded] = useState(false);
  const [lastCartId, setLastCartId] = useState("");
  const [actionError, setActionError] = useState("");
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    setInteractive(true);
  }, []);

  useEffect(() => {
    setSelectedPriceOptionId(selectedPlan.optionPrices[0]?.id ?? "");
  }, [selectedPlan.id, selectedPlan.optionPrices]);

  useEffect(() => {
    setGroupQuantity(1);
    setSelections(
      createSelectionsForPlan(
        selectedPlan,
        selectedPlan.selectOptionsPerItem ? selectedPlan.quantity : 1,
        perItemOptions,
      ),
    );
    setAdded(false);
    setActionError("");
  }, [
    selectedPlan.id,
    selectedPlan.quantity,
    selectedPlan.selectOptionsPerItem,
    perItemOptions,
  ]);

  useEffect(() => {
    if (
      selectedPlan.quantity !== 1 ||
      !selectedPlan.selectOptionsPerItem
    ) return;
    setSelections((current) =>
      resizeSelections(current, groupQuantity, perItemOptions),
    );
  }, [
    groupQuantity,
    selectedPlan.quantity,
    selectedPlan.selectOptionsPerItem,
    perItemOptions,
  ]);

  const selectedPriceOption =
    selectedPlan.optionPrices.find(
      (item) => item.id === selectedPriceOptionId,
    ) ?? selectedPlan.optionPrices[0];
  const selectedGroupPrice = selectedPriceOption?.price ?? selectedPlan.price;
  const selectedGroupOriginalPrice = getOriginalGroupPrice(
    product,
    selectedPlan,
    selectedPriceOption,
  );

  function updateSelection(itemIndex: number, groupName: string, value: string) {
    setAdded(false);
    setActionError("");
    setSelections((current) =>
      current.map((item, index) =>
        index === itemIndex ? { ...item, [groupName]: value } : item,
      ),
    );
  }

  function add(goToCart = false) {
    setAdded(false);
    setActionError("");

    const requiredSelectionCount = selectionsForPlan(
      selectedPlan,
      groupQuantity,
    );
    const normalizedSelections = resizeSelections(
      selections,
      requiredSelectionCount,
      perItemOptions,
    );
    const hasMissingOption = normalizedSelections.some((selection) =>
      perItemOptions.some((option) => !selection[option.name]),
    );

    if (hasMissingOption) {
      setActionError("請先完成所有商品規格的選擇。");
      return;
    }

    const baseOptions: Record<string, string> = {
      方案ID: selectedPlan.id,
      購買方案: selectedPlan.name,
      每組件數: String(selectedPlan.quantity),
    };

    if (selectedPriceOption) {
      baseOptions[selectedPriceOption.groupName] = selectedPriceOption.optionValue;
    }

    try {
      // 單件且逐件選規格：每一件依自己的規格分開加入購物車。
      // 相同規格會合併數量，不同顏色／規格不會互相覆蓋。
      if (
        selectedPlan.quantity === 1 &&
        selectedPlan.selectOptionsPerItem &&
        perItemOptions.length > 0
      ) {
        let focusCartId = "";

        normalizedSelections.forEach((selection) => {
          const selectedOptions: Record<string, string> = { ...baseOptions };
          Object.entries(selection).forEach(([groupName, value]) => {
            selectedOptions[`第1件-${groupName}`] = value;
          });

          focusCartId = makeCartId(product.id, selectedOptions);
          const priceResolution = resolveProductPrice(product, selectedOptions);
          addProductToCart(
            product,
            1,
            selectedOptions,
            selectedGroupPrice,
            priceResolution.ok ? priceResolution.originalPrice : selectedGroupPrice,
          );
        });

        setLastCartId(focusCartId);
        if (goToCart) {
          router.push(`/cart?focus=${encodeURIComponent(focusCartId)}`);
          return;
        }

        setAdded(true);
        window.setTimeout(() => setAdded(false), 2200);
        return;
      }

      const selectedOptions: Record<string, string> = { ...baseOptions };
      const selectionsToStore = selectedPlan.selectOptionsPerItem
        ? normalizedSelections
        : Array.from(
            { length: selectedPlan.quantity },
            () => normalizedSelections[0] ?? {},
          );

      selectionsToStore.forEach((item, index) => {
        Object.entries(item).forEach(([groupName, value]) => {
          selectedOptions[`第${index + 1}件-${groupName}`] = value;
        });
      });

      const cartId = makeCartId(product.id, selectedOptions);
      setLastCartId(cartId);
      const priceResolution = resolveProductPrice(product, selectedOptions);
      addProductToCart(
        product,
        groupQuantity,
        selectedOptions,
        selectedGroupPrice,
        priceResolution.ok ? priceResolution.originalPrice : selectedGroupPrice,
      );

      if (goToCart) {
        router.push(`/cart?focus=${encodeURIComponent(cartId)}`);
        return;
      }

      setAdded(true);
      window.setTimeout(() => setAdded(false), 2200);
    } catch {
      setActionError(
        "目前無法把商品存進購物車，請重新整理頁面後再試一次。",
      );
    }
  }

  return (
    <div
      id={purchaseId}
      data-product-purchase
      data-interactive-ready={interactive ? "true" : "false"}
      className="product-interaction-layer scroll-mt-40 rounded-3xl border bg-white p-4 shadow-sm sm:p-5 md:scroll-mt-24"
    >
      {!interactive && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700">
          正在啟用商品操作……
        </div>
      )}
      <div>
        <h2 className="text-xl font-black">購買方案</h2>
        <div className="mt-3 grid gap-2">
          {plans.map((plan, planIndex) => {
            const inputId = `${controlId}-plan-${planIndex}`;
            return (
            <label
              key={plan.id}
              htmlFor={inputId}
              className={`flex min-h-16 cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-2xl border-2 p-3 sm:p-4 ${
                selectedPlan.id === plan.id
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  id={inputId}
                  type="radio"
                  disabled={!interactive}
                  name={`${controlId}-pricing-plan`}
                  checked={selectedPlan.id === plan.id}
                  onChange={() => {
                    setSelectedPlanId(plan.id);
                    setAdded(false);
                    setActionError("");
                  }}
                  className="h-5 w-5 shrink-0 accent-emerald-600"
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
            );
          })}
        </div>
      </div>

      {selectedPlan.optionPrices.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-black">選擇價格規格</h2>
          <p className="mt-1 text-sm text-slate-500">
            這個尺寸或容量會套用到整組商品。
          </p>
          <div className="mt-3 grid gap-2">
            {selectedPlan.optionPrices.map((item, optionIndex) => {
              const inputId = `${controlId}-price-${optionIndex}`;
              return (
              <label
                key={item.id}
                htmlFor={inputId}
                className={`flex min-h-16 cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-2xl border-2 p-3 sm:p-4 ${
                  selectedPriceOption?.id === item.id
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    id={inputId}
                  type="radio"
                  disabled={!interactive}
                    name={`${controlId}-pricing-option`}
                    checked={selectedPriceOption?.id === item.id}
                    onChange={() => {
                      setSelectedPriceOptionId(item.id);
                      setAdded(false);
                      setActionError("");
                    }}
                    className="h-5 w-5 shrink-0 accent-emerald-600"
                  />
                  <span className="font-black">
                    {item.groupName}：{item.optionValue}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {item.originalPrice && item.originalPrice > item.price ? (
                    <>
                      <span className="block text-sm font-bold text-slate-400 line-through">
                        原價 NT${currency.format(item.originalPrice)}
                      </span>
                      <span className="block text-lg font-black text-rose-600">
                        特價 NT${currency.format(item.price)}
                      </span>
                    </>
                  ) : (
                    <span className="block text-lg font-black text-rose-600">
                      NT${currency.format(item.price)}
                    </span>
                  )}
                </span>
              </label>
              );
            })}
          </div>
        </div>
      )}

      {perItemOptions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-black">
            {selectedPlan.selectOptionsPerItem
              ? selections.length > 1
                ? "選擇每件商品規格"
                : "選擇商品規格"
              : "選擇整組商品規格"}
          </h2>
          {bundleColorOption ? (
            <p className="mt-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              包色方案已自動帶入全部顏色，不需要再一個一個選色。
            </p>
          ) : !selectedPlan.selectOptionsPerItem ? (
            <p className="mt-1 text-sm text-slate-500">
              選好的規格會套用到這一組的每一件商品。
            </p>
          ) : null}
          <div className="mt-3 space-y-4">
            {selections.map((selection, itemIndex) => (
              <div key={itemIndex} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 font-black text-emerald-700">
                  {selectedPlan.selectOptionsPerItem
                    ? `第 ${itemIndex + 1} 件`
                    : "整組共用規格"}
                </div>
                <div className="space-y-3">
                  {perItemOptions.map((option) =>
                    bundleColorOption?.name === option.name ? (
                      <div key={option.name} className="block">
                        <span className="mb-1.5 block text-sm font-bold">
                          {option.name}
                        </span>
                        <div className="flex h-12 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-base font-black text-emerald-800">
                          {selection[option.name] ?? ""}
                        </div>
                      </div>
                    ) : (
                      <label key={option.name} className="block">
                        <span className="mb-1.5 block text-sm font-bold">
                          {option.name}
                        </span>
                        <select
                          disabled={!interactive}
                          value={selection[option.name] ?? ""}
                          onChange={(event) =>
                            updateSelection(itemIndex, option.name, event.target.value)
                          }
                          className="h-12 w-full rounded-xl border bg-white px-3 text-base"
                        >
                          {option.values.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 font-bold">
          {selectedPlan.quantity === 1 ? "購買數量" : "購買組數"}
        </div>
        <div className="inline-flex overflow-hidden rounded-xl border">
          <button
            type="button"
            disabled={!interactive}
            onClick={() => {
              setGroupQuantity((value) => Math.max(1, value - 1));
              setAdded(false);
              setActionError("");
            }}
            className="h-12 w-12 touch-manipulation text-xl font-bold disabled:text-slate-300"
            aria-label="減少購買數量"
          >
            −
          </button>
          <div className="grid h-12 min-w-12 place-items-center border-x font-bold">
            {groupQuantity}
          </div>
          <button
            type="button"
            disabled={!interactive}
            onClick={() => {
              setGroupQuantity((value) => Math.min(99, value + 1));
              setAdded(false);
              setActionError("");
            }}
            className="h-12 w-12 touch-manipulation text-xl font-bold disabled:text-slate-300"
            aria-label="增加購買數量"
          >
            ＋
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          共 {selectedPlan.quantity * groupQuantity} 件商品
          {selectedPlan.quantity === 1 &&
          selectedPlan.selectOptionsPerItem &&
          perItemOptions.length > 0
            ? "，每件都可以分別選擇規格"
            : ""}
        </p>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          {selectedPlan.quantity === 1
            ? `${selectedPlan.name} × ${groupQuantity} 件`
            : `${selectedPlan.name} × ${groupQuantity} 組`}
        </div>
        {selectedPriceOption && (
          <div className="mt-1 text-sm text-slate-600">
            {selectedPriceOption.groupName}：{selectedPriceOption.optionValue}
          </div>
        )}
        {selectedGroupOriginalPrice > selectedGroupPrice && (
          <div className="mt-2 text-sm font-bold text-slate-400 line-through">
            原價 NT${currency.format(selectedGroupOriginalPrice * groupQuantity)}
          </div>
        )}
        <div className="mt-1 text-2xl font-black text-rose-600">
          {selectedGroupOriginalPrice > selectedGroupPrice ? "特價 " : ""}
          NT${currency.format(selectedGroupPrice * groupQuantity)}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!interactive}
          onClick={() => add(false)}
          data-qa-add-cart="stay"
          className="min-h-14 w-full touch-manipulation rounded-2xl border-2 border-emerald-600 bg-white px-5 py-4 text-lg font-black text-emerald-700 active:bg-emerald-50 disabled:border-slate-300 disabled:text-slate-400"
        >
          {added ? "已加入購物車 ✓" : "加入購物車"}
        </button>
        <button
          type="button"
          disabled={!interactive}
          onClick={() => add(true)}
          data-qa-add-cart="go"
          className="min-h-14 w-full touch-manipulation rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white active:bg-emerald-700 disabled:bg-slate-300"
        >
          加入並查看購物車
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700"
        >
          {actionError}
        </div>
      )}

      {added && (
        <div
          aria-live="polite"
          className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700"
        >
          商品已加入購物車，
          <Link href={lastCartId ? `/cart?focus=${encodeURIComponent(lastCartId)}` : "/cart"} className="underline underline-offset-2">
            前往查看
          </Link>
        </div>
      )}
    </div>
  );
}
