"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import {
  addCartItems,
  buildProductCartItem,
  loadCart,
  replacePromotionCartGroup,
} from "@/lib/cart";
import { buildDefaultProductPurchase } from "@/lib/pricingEngine";
import type { Activity, ActivityProduct } from "@/types/activity";
import type { Product } from "@/types/product";
import { applyPromotionDiscount, getActivityDiscountMethod, getActivityDiscountValue, getPromotionDescription } from "@/lib/promotionEngine";

const currency = new Intl.NumberFormat("zh-TW");

function defaultPurchase(product: Product) {
  const purchase = buildDefaultProductPurchase(product);
  return {
    price: purchase.price,
    originalPrice: purchase.originalPrice,
    options: purchase.selectedOptions,
  };
}

export default function QuantityDiscountActivitySelector({
  activity,
  editSelectionId,
}: {
  activity: Activity;
  editSelectionId?: string;
}) {
  const router = useRouter();
  const required = Math.max(2, activity.requiredCount || activity.triggerCount || activity.discountItemIndex || 2);
  const discountPosition = Math.min(
    required - 1,
    Math.max(0, (activity.discountItemIndex || required) - 1),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (editSelectionId) {
      const existing = loadCart().filter(
        (item) =>
          item.selectedOptions["活動ID"] === activity.id &&
          item.selectedOptions["活動選擇識別"] === editSelectionId,
      );
      if (existing.length > 0) {
        const nextQuantities: Record<string, number> = {};
        activity.products.forEach((relation) => {
          nextQuantities[relation.id] = existing.filter(
            (item) => item.productId === relation.productId,
          ).length;
        });
        setQuantities(nextQuantities);
        setMessage("已載入購物車中的活動內容，可直接重新搭配商品。");
      } else {
        setMessage("找不到原本的活動內容，請返回購物車後再試一次。");
      }
    }
    setInteractive(true);
  }, [activity.id, activity.products, editSelectionId]);

  const selectedUnits = useMemo(() => {
    const units: Array<{
      relation: ActivityProduct;
      price: number;
      originalPrice: number;
      options: Record<string, string>;
    }> = [];
    for (const relation of activity.products) {
      const count = quantities[relation.id] ?? 0;
      const purchase = defaultPurchase(relation.product);
      for (let i = 0; i < count; i += 1) {
        units.push({
          relation,
          price: purchase.price,
          originalPrice: purchase.originalPrice,
          options: purchase.options,
        });
      }
    }
    return units.sort((a, b) => b.price - a.price);
  }, [activity.products, quantities]);

  const pricedUnits = useMemo(() => selectedUnits.map((unit, index) => {
    const position = index % required;
    const isDiscounted = position === discountPosition;
    return { ...unit, isDiscounted, finalPrice: isDiscounted ? applyPromotionDiscount(unit.price, getActivityDiscountMethod(activity), getActivityDiscountValue(activity)) : unit.price };
  }), [selectedUnits, required, discountPosition, activity]);

  const total = pricedUnits.reduce((sum, unit) => sum + unit.finalPrice, 0);
  const completeGroups = Math.floor(pricedUnits.length / required);
  const remainder = pricedUnits.length % required;

  function change(relation: ActivityProduct, delta: number) {
    setQuantities((current) => {
      const selectedCount = Object.values(current).reduce((sum, value) => sum + value, 0);
      if (delta > 0 && !activity.repeatable && selectedCount >= required) return current;
      const next = Math.max(0, (current[relation.id] ?? 0) + delta);
      const limit = relation.maxPerGroup ?? 99;
      return { ...current, [relation.id]: Math.min(next, limit) };
    });
    setMessage("");
  }

  function submit(goToCart: boolean) {
    if (pricedUnits.length < required) {
      setMessage(`請至少選擇 ${required} 件商品。`);
      return;
    }
    if (remainder !== 0) {
      setMessage(`目前有 ${remainder} 件尚未湊成一組，請再選 ${required - remainder} 件，或減少數量。`);
      return;
    }

    const selectionId =
      editSelectionId ??
      `${activity.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const replacements = pricedUnits.map((unit, index) =>
      buildProductCartItem(
        unit.relation.product,
        1,
        {
          ...unit.options,
          活動ID: activity.id,
          活動名稱: activity.name,
          活動類型: activity.type,
          活動角色: unit.isDiscounted ? "優惠折扣商品" : "優惠原價商品",
          活動選擇識別: selectionId,
          活動件序: String(index + 1),
          活動每組件數: String(required),
          活動折扣方式: getActivityDiscountMethod(activity),
          活動優惠值: String(getActivityDiscountValue(activity)),
        },
        unit.finalPrice,
        unit.originalPrice,
      ),
    );

    if (editSelectionId) {
      replacePromotionCartGroup(editSelectionId, replacements);
    } else {
      addCartItems(replacements);
    }

    if (goToCart || editSelectionId) {
      router.push(`/cart?focus=${encodeURIComponent(`promotion:${selectionId}`)}`);
      return;
    }
    setMessage("第二件優惠活動商品已加入購物車 ✓");
    setQuantities({});
  }

  return (
    <div
      data-activity-interaction
      data-interactive-ready={interactive ? "true" : "false"}
      className="product-interaction-layer space-y-6"
    >
      {!interactive && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700">
          正在啟用活動商品操作……
        </div>
      )}
      {editSelectionId && (
        <div className="rounded-2xl bg-emerald-50 px-5 py-4">
          <div className="font-black text-emerald-800">正在修改購物車活動內容</div>
          <div className="mt-1 text-sm font-bold text-emerald-700">
            儲存後會更新原本的優惠組合，不會新增另一組。
          </div>
        </div>
      )}
      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black">選擇活動商品</h2>
        <p className="mt-2 text-slate-500">每 {required} 件為一組，第 {discountPosition + 1} 件享有優惠。不同商品可混搭{activity.repeatable ? "，可重複套用" : "，每張訂單限用一組"}。</p>
        <div className="mt-3 inline-flex rounded-full bg-rose-50 px-4 py-2 font-black text-rose-700">{getPromotionDescription(activity)}</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {activity.products.map((relation) => {
            const purchase = defaultPurchase(relation.product);
            const quantity = quantities[relation.id] ?? 0;
            return (
              <article key={relation.id} className="rounded-2xl border-2 border-slate-200 p-4">
                <div className="flex gap-4">
                  <ProductImage src={relation.product.mainImage} alt={relation.product.name} className="h-24 w-24 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black">{relation.product.name}</h3>
                    <div className="mt-2 text-xl font-black text-rose-600">NT${currency.format(purchase.price)}</div>
                    <div className="mt-3 inline-flex overflow-hidden rounded-xl border bg-white">
                      <button type="button" disabled={!interactive} onClick={() => change(relation, -1)} className="h-10 w-10 touch-manipulation text-xl font-black disabled:text-slate-300">−</button>
                      <div className="grid h-10 min-w-12 place-items-center border-x font-black">{quantity}</div>
                      <button type="button" disabled={!interactive || (!activity.repeatable && selectedUnits.length >= required) || quantity >= (relation.maxPerGroup ?? 99)} onClick={() => change(relation, 1)} className="h-10 w-10 touch-manipulation text-xl font-black disabled:text-slate-300">＋</button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black">優惠試算</h2>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex justify-between"><span>已選商品</span><b>{pricedUnits.length} 件</b></div>
          <div className="mt-2 flex justify-between"><span>完整優惠組數</span><b>{completeGroups} 組</b></div>
          {remainder > 0 && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 font-bold text-amber-700">還差 {required - remainder} 件可再完成一組優惠</div>}
          {pricedUnits.length > 0 && (
            <div className="mt-4 space-y-2 border-t pt-4">
              {pricedUnits.map((unit, index) => (
                <div key={`${unit.relation.id}-${index}`} className="flex justify-between gap-3 text-sm">
                  <span>{unit.relation.product.name} {unit.isDiscounted ? "（優惠件）" : ""}</span>
                  <span className={unit.isDiscounted ? "font-black text-rose-600" : "font-bold"}>NT${currency.format(unit.finalPrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div><div className="text-sm text-slate-500">活動合計</div><div className="text-3xl font-black text-rose-600">NT${currency.format(total)}</div></div>
          <div className="rounded-full bg-rose-50 px-4 py-2 font-black text-rose-600">{getPromotionDescription(activity)}</div>
        </div>
        {message && <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center font-bold text-amber-700">{message}</div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {editSelectionId ? (
            <>
              <button
                type="button"
                onClick={() => router.push(`/cart?focus=${encodeURIComponent(`promotion:${editSelectionId}`)}`)}
                className="touch-manipulation rounded-2xl border-2 border-slate-300 px-5 py-4 text-lg font-black text-slate-700"
              >
                取消修改
              </button>
              <button
                type="button"
                disabled={!interactive}
                onClick={() => submit(true)}
                className="touch-manipulation rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300"
              >
                儲存修改並返回購物車
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={!interactive} onClick={() => submit(false)} className="touch-manipulation rounded-2xl border-2 border-emerald-600 px-5 py-4 text-lg font-black text-emerald-700 disabled:border-slate-300 disabled:text-slate-400">加入購物車</button>
              <button type="button" disabled={!interactive} onClick={() => submit(true)} className="touch-manipulation rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300">加入並前往購物車</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
