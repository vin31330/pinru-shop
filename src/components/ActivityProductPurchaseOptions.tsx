"use client";

import {
  buildActivityPurchaseOptions,
  getActivityPurchase,
} from "@/lib/activityPurchase";
import {
  getOrdinaryProductOptions,
  getProductPricingPlans,
} from "@/lib/pricingEngine";
import type { Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

export default function ActivityProductPurchaseOptions({
  product,
  value,
  onChange,
  compact = false,
}: {
  product: Product;
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  compact?: boolean;
}) {
  const plans = getProductPricingPlans(product);
  const purchase = getActivityPurchase(product, value);
  const plan = purchase.plan;
  const priceOption = plan.optionPrices.find(
    (item) => value[item.groupName] === item.optionValue,
  ) ?? plan.optionPrices[0];
  const ordinaryOptions = getOrdinaryProductOptions(product, plan);

  function changePlan(planId: string) {
    onChange(buildActivityPurchaseOptions(product, planId));
  }

  function changePriceOption(groupName: string, optionValue: string) {
    onChange({ ...value, [groupName]: optionValue });
  }

  function changeOrdinaryOption(pieceIndex: number, groupName: string, optionValue: string) {
    onChange({ ...value, [`第${pieceIndex}件-${groupName}`]: optionValue });
  }

  const hasChoices = plans.length > 1 || plan.optionPrices.length > 0 || ordinaryOptions.length > 0;
  if (!hasChoices) return null;

  return (
    <div className={`${compact ? "mt-3" : "mt-4"} rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-black text-emerald-800">選擇尺寸／規格</span>
        <span className="text-sm font-black text-rose-600">NT${currency.format(purchase.price)}</span>
      </div>

      {plans.length > 1 && (
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600">購買方案</span>
          <select
            value={plan.id}
            onChange={(event) => changePlan(event.target.value)}
            className="h-11 w-full rounded-xl border bg-white px-3 font-bold"
          >
            {plans.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}（{item.quantity}件）
              </option>
            ))}
          </select>
        </label>
      )}

      {plan.optionPrices.length > 0 && (
        <label className="mt-2 block">
          <span className="mb-1 block text-xs font-bold text-slate-600">尺寸／容量</span>
          <select
            value={priceOption?.optionValue ?? ""}
            onChange={(event) => changePriceOption(plan.optionPrices[0].groupName, event.target.value)}
            className="h-11 w-full rounded-xl border bg-white px-3 font-bold"
          >
            {plan.optionPrices.map((item) => (
              <option key={item.id} value={item.optionValue}>
                {item.groupName}：{item.optionValue}｜NT${currency.format(item.price)}
              </option>
            ))}
          </select>
        </label>
      )}

      {ordinaryOptions.length > 0 && (
        <div className="mt-2 grid gap-2">
          {Array.from({ length: Math.max(1, plan.quantity) }, (_, pieceIndex) => (
            <div key={pieceIndex} className="grid gap-2 sm:grid-cols-2">
              {ordinaryOptions.map((option) => {
                const key = `第${pieceIndex + 1}件-${option.name}`;
                return (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-600">
                      {plan.quantity > 1 ? `第 ${pieceIndex + 1} 件・` : ""}{option.name}
                    </span>
                    <select
                      value={value[key] ?? option.values[0] ?? ""}
                      onChange={(event) => changeOrdinaryOption(pieceIndex + 1, option.name, event.target.value)}
                      className="h-11 w-full rounded-xl border bg-white px-3 font-bold"
                    >
                      {option.values.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
