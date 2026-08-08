"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import ActivityProductOptionModal from "@/components/ActivityProductOptionModal";
import {
  addCartItems,
  buildProductCartItem,
  loadCart,
  replacePromotionCartGroup,
} from "@/lib/cart";
import {
  buildActivityPurchaseOptions,
  getActivityPurchase,
  getActivityPurchaseSummary,
  hasActivityPurchaseChoices,
} from "@/lib/activityPurchase";
import type { Activity, ActivityProduct } from "@/types/activity";
import {
  applyPromotionDiscount,
  getActivityDiscountMethod,
  getActivityDiscountValue,
  getPromotionDescription,
  normalizeActivityType,
} from "@/lib/promotionEngine";

const currency = new Intl.NumberFormat("zh-TW");

type SelectedUnit = {
  key: string;
  relationId: string;
  selectedOptions: Record<string, string>;
};

type ModalTarget = {
  relation: ActivityProduct;
  editKey?: string;
  initialValue?: Record<string, string>;
};

function stripActivityFields(options: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(options).filter(([key]) => !key.startsWith("活動")));
}

function normalized(value: string) {
  return value.trim().toUpperCase().replace(/[\s_-]/g, "");
}

export default function QuantityDiscountActivitySelector({
  activity,
  editSelectionId,
}: {
  activity: Activity;
  editSelectionId?: string;
}) {
  const router = useRouter();
  const normalizedType = normalizeActivityType(activity.type);
  const isSecondDiscount = normalizedType === "SECOND_DISCOUNT";
  const required = isSecondDiscount
    ? Math.max(2, activity.requiredCount || 2)
    : Math.max(1, activity.requiredCount || activity.triggerCount || activity.discountItemIndex || 1);
  const discountPosition = isSecondDiscount
    ? 1
    : Math.min(required - 1, Math.max(0, (activity.discountItemIndex || required) - 1));
  const [units, setUnits] = useState<SelectedUnit[]>([]);
  const [message, setMessage] = useState("");
  const [interactive, setInteractive] = useState(false);
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [scrollToKey, setScrollToKey] = useState<string | null>(null);

  useEffect(() => {
    if (editSelectionId) {
      const existing = loadCart().filter(
        (item) => item.selectedOptions["活動ID"] === activity.id && item.selectedOptions["活動選擇識別"] === editSelectionId,
      );
      if (existing.length > 0) {
        setUnits(
          existing.flatMap((item, itemIndex) =>
            Array.from({ length: Math.max(1, item.quantity) }, (_, quantityIndex) => {
              const relation = activity.products.find((candidate) => candidate.productId === item.productId);
              return relation
                ? {
                    key: `${item.cartId}-${itemIndex}-${quantityIndex}`,
                    relationId: relation.id,
                    selectedOptions: stripActivityFields(item.selectedOptions),
                  }
                : null;
            }).filter((item): item is SelectedUnit => Boolean(item)),
          ),
        );
        setMessage("已載入購物車中的活動內容，可直接修改尺寸、規格或商品。");
      }
    }
    setInteractive(true);
  }, [activity.id, activity.products, editSelectionId]);

  useEffect(() => {
    if (!scrollToKey || modalTarget) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`activity-selected-${scrollToKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setScrollToKey(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [modalTarget, scrollToKey, units]);

  const pricedUnits = useMemo(() => {
    const resolved = units
      .map((unit) => {
        const relation = activity.products.find((item) => item.id === unit.relationId);
        if (!relation) return null;
        const purchase = getActivityPurchase(relation.product, unit.selectedOptions);
        return { ...unit, relation, options: purchase.options, price: purchase.price, originalPrice: purchase.originalPrice };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const discountedKeys = new Set<string>();
    const target = normalized(activity.discountTarget || "");

    for (let start = 0; start < resolved.length; start += required) {
      const group = resolved.slice(start, start + required);
      if (group.length < required) continue;

      // 第二件優惠固定套用在每組的「第二件」，不依 LOWEST_PRICE / HIGHEST_PRICE 改變件序。
      // 折扣方式與折扣值仍完全依 Activities 的設定（例如 PERCENT_OFF 90）。
      if (isSecondDiscount) {
        const secondUnit = group[1];
        if (secondUnit) discountedKeys.add(secondUnit.key);
      } else if (target.includes("LOWESTPRICE") || activity.discountTarget.includes("最低")) {
        const lowest = group.reduce((best, item) => item.price < best.price ? item : best, group[0]);
        discountedKeys.add(lowest.key);
      } else if (target.includes("HIGHESTPRICE") || activity.discountTarget.includes("最高")) {
        const highest = group.reduce((best, item) => item.price > best.price ? item : best, group[0]);
        discountedKeys.add(highest.key);
      } else {
        const targetUnit = group[discountPosition];
        if (targetUnit) discountedKeys.add(targetUnit.key);
      }
    }

    return resolved.map((unit) => {
      const isDiscounted = discountedKeys.has(unit.key);
      return {
        ...unit,
        isDiscounted,
        finalPrice: isDiscounted
          ? applyPromotionDiscount(unit.price, getActivityDiscountMethod(activity), getActivityDiscountValue(activity))
          : unit.price,
      };
    });
  }, [units, activity, required, discountPosition]);

  const total = pricedUnits.reduce((sum, unit) => sum + unit.finalPrice, 0);
  const completeGroups = Math.floor(pricedUnits.length / required);
  const remainder = pricedUnits.length % required;

  function countFor(relationId: string) {
    return units.filter((unit) => unit.relationId === relationId).length;
  }

  function canAdd(relation: ActivityProduct) {
    const relationCount = countFor(relation.id);
    const limit = relation.maxPerGroup ?? 99;
    if ((!activity.repeatable && units.length >= required) || relationCount >= limit) {
      setMessage(relationCount >= limit ? `此商品最多可選 ${limit} 件。` : `此活動最多選 ${required} 件。`);
      return false;
    }
    return true;
  }

  function addDefault(relation: ActivityProduct) {
    if (!canAdd(relation)) return;
    const selectedOptions = buildActivityPurchaseOptions(relation.product);
    setUnits((current) => {
      const first = {
        key: `${relation.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        relationId: relation.id,
        selectedOptions,
      };
      // 第二件優惠：客人先選一件，第二件預設帶入完全相同的商品／規格，之後仍可個別修改。
      if (isSecondDiscount && required === 2 && current.length % 2 === 0) {
        const second = {
          ...first,
          key: `${relation.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-second`,
        };
        return [...current, first, second];
      }
      return [...current, first];
    });
    setMessage(isSecondDiscount ? `「${relation.product.name}」第一件與第二件已加入，可個別修改第二件規格 ✓` : `「${relation.product.name}」已加入活動 ✓`);
  }

  function openAdd(relation: ActivityProduct) {
    if (!canAdd(relation)) return;
    if (!hasActivityPurchaseChoices(relation.product)) {
      addDefault(relation);
      return;
    }
    setModalTarget({ relation, initialValue: buildActivityPurchaseOptions(relation.product) });
  }

  function confirmModal(selectedOptions: Record<string, string>) {
    if (!modalTarget) return;
    if (modalTarget.editKey) {
      const editKey = modalTarget.editKey;
      setUnits((current) => current.map((item) => item.key === editKey ? { ...item, selectedOptions } : item));
      setScrollToKey(editKey);
      setMessage(`「${modalTarget.relation.product.name}」規格已更新 ✓`);
    } else {
      const key = `${modalTarget.relation.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setUnits((current) => {
        const first = { key, relationId: modalTarget.relation.id, selectedOptions };
        if (isSecondDiscount && required === 2 && current.length % 2 === 0) {
          const second = {
            ...first,
            key: `${modalTarget.relation.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-second`,
          };
          return [...current, first, second];
        }
        return [...current, first];
      });
      setScrollToKey(key);
      setMessage(isSecondDiscount ? `「${modalTarget.relation.product.name}」第一件與第二件已加入，可個別修改第二件規格 ✓` : `「${modalTarget.relation.product.name}」已加入活動 ✓`);
    }
    setModalTarget(null);
  }

  function removeUnit(key: string) {
    setUnits((current) => current.filter((item) => item.key !== key));
    setMessage("");
  }

  function lineRole(index: number) {
    if (!isSecondDiscount) return "活動商品";
    return index % required === 0 ? "第一件商品（原價）" : "第二件優惠商品";
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

    const selectionId = editSelectionId ?? `${activity.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

    if (editSelectionId) replacePromotionCartGroup(editSelectionId, replacements);
    else addCartItems(replacements);

    if (goToCart || editSelectionId) {
      router.push(`/cart?focus=${encodeURIComponent(`promotion:${selectionId}`)}`);
      return;
    }
    setMessage("活動商品已加入購物車 ✓");
    setUnits([]);
  }

  return (
    <div data-activity-interaction data-interactive-ready={interactive ? "true" : "false"} className="product-interaction-layer space-y-5">
      <ActivityProductOptionModal
        open={Boolean(modalTarget)}
        product={modalTarget?.relation.product}
        initialValue={modalTarget?.initialValue}
        title={modalTarget?.editKey ? "修改尺寸／規格" : "選擇尺寸／規格"}
        confirmLabel={modalTarget?.editKey ? "儲存這個修改" : "加入活動"}
        onClose={() => setModalTarget(null)}
        onConfirm={confirmModal}
      />

      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black">選擇活動商品</h2>
        <p className="mt-2 text-slate-500">有尺寸／規格的商品會直接在活動頁選擇；沒有規格的商品會直接加入。</p>
        <div className="mt-3 inline-flex rounded-full bg-rose-50 px-4 py-2 font-black text-rose-700">{getPromotionDescription(activity)}</div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {activity.products.map((relation) => {
            const quantity = countFor(relation.id);
            const preview = getActivityPurchase(relation.product);
            const selectedForRelation = [...pricedUnits].reverse().find((unit) => unit.relation.id === relation.id);
            const displayPrice = selectedForRelation?.price ?? preview.price;
            const hasChoices = hasActivityPurchaseChoices(relation.product);
            return (
              <article key={relation.id} className="rounded-2xl border-2 border-slate-200 p-4">
                <div className="flex gap-4">
                  <ProductImage src={relation.product.mainImage} alt={relation.product.name} className="h-24 w-24 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black">{relation.product.name}</h3>
                    <div className="mt-2 text-sm text-slate-500">{selectedForRelation ? "目前已選規格價格" : (hasChoices ? "最低／預設方案" : "商品價格")}</div>
                    <div className="text-xl font-black text-rose-600">NT${currency.format(displayPrice)}</div>
                    {quantity > 0 && <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">✓ 已選 {quantity} 件</div>}
                  </div>
                </div>
                <button type="button" onClick={() => openAdd(relation)} className="mt-4 min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 text-center font-black text-white active:bg-emerald-700">
                  {hasChoices ? "選尺寸／規格" : "加入活動"}
                </button>
              </article>
            );
          })}
        </div>

        {pricedUnits.length > 0 && (
          <div className="mt-6 border-t pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">已選商品</h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">共 {pricedUnits.length} 件</span>
            </div>
            <div className="space-y-3">
              {pricedUnits.map((unit, index) => (
                <div id={`activity-selected-${unit.key}`} key={unit.key} className="scroll-mt-28 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {isSecondDiscount && <div className="mb-1 text-sm font-black text-emerald-700">{lineRole(index)}</div>}
                      <div className="font-black">✓ {unit.relation.product.name}</div>
                      <div className="mt-1 text-sm font-bold leading-6 text-slate-600">{getActivityPurchaseSummary(unit.relation.product, unit.options)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        {unit.finalPrice < unit.price && <span className="font-bold text-slate-400 line-through">NT${currency.format(unit.price)}</span>}
                        <span className="text-lg font-black text-rose-600">NT${currency.format(unit.finalPrice)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {hasActivityPurchaseChoices(unit.relation.product) && (
                        <button type="button" onClick={() => setModalTarget({ relation: unit.relation, editKey: unit.key, initialValue: unit.options })} className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-black text-emerald-700">修改</button>
                      )}
                      <button type="button" onClick={() => removeUnit(unit.key)} className="rounded-xl px-3 py-2 text-sm font-black text-rose-500">移除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black">購買內容確認</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isSecondDiscount
            ? "每 2 件為一組：第一件照原價，第二件依後台設定的優惠方式與優惠值計算；第二件可修改成其他尺寸／規格。"
            : "商品名稱、尺寸與規格會和上方「已選商品」完全一致。"}
        </p>
        <div className="mt-4 space-y-3">
          {pricedUnits.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center font-bold text-slate-500">尚未選擇活動商品</div>
          ) : pricedUnits.map((unit, index) => (
            <div key={unit.key} className="rounded-2xl bg-slate-50 p-4">
              {isSecondDiscount && <div className="mb-1 text-sm font-black text-emerald-700">{lineRole(index)}</div>}
              <div className="font-black">{unit.relation.product.name}</div>
              <div className="mt-1 text-sm font-bold leading-6 text-slate-600">{getActivityPurchaseSummary(unit.relation.product, unit.options)}</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-emerald-700">{isSecondDiscount ? lineRole(index) : (unit.isDiscounted ? "活動優惠" : "活動商品")}</span>
                <div className="text-right">
                  {unit.finalPrice < unit.price && <span className="mr-2 text-sm font-bold text-slate-400 line-through">NT${currency.format(unit.price)}</span>}
                  <span className="text-xl font-black text-rose-600">NT${currency.format(unit.finalPrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {remainder > 0 && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 font-bold text-amber-700">還差 {required - remainder} 件可完成一組優惠</div>}
        {completeGroups > 0 && required > 1 && <div className="mt-3 text-sm font-bold text-emerald-700">已完成 {completeGroups} 組活動優惠。</div>}

        <div className="mt-5 flex items-end justify-between gap-4 border-t pt-5">
          <div>
            <div className="text-sm text-slate-500">優惠後合計</div>
            <div className="text-3xl font-black text-rose-600">NT${currency.format(total)}</div>
          </div>
          <div className="rounded-full bg-rose-50 px-4 py-2 font-black text-rose-600">{getPromotionDescription(activity)}</div>
        </div>

        {message && <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center font-bold text-amber-700">{message}</div>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {editSelectionId ? (
            <>
              <button type="button" onClick={() => router.push(`/cart?focus=${encodeURIComponent(`promotion:${editSelectionId}`)}`)} className="rounded-2xl border-2 border-slate-300 px-5 py-4 text-lg font-black text-slate-700">取消修改</button>
              <button type="button" disabled={!interactive} onClick={() => submit(true)} className="rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300">儲存修改並返回購物車</button>
            </>
          ) : (
            <>
              <button type="button" disabled={!interactive} onClick={() => submit(false)} className="rounded-2xl border-2 border-emerald-600 px-5 py-4 text-lg font-black text-emerald-700 disabled:border-slate-300 disabled:text-slate-300">加入購物車</button>
              <button type="button" disabled={!interactive} onClick={() => submit(true)} className="rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300">加入並前往購物車</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
