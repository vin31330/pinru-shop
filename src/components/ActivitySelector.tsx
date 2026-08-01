"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import { loadCart } from "@/lib/cart";
import {
  addActivityToCart,
  getActivityCartId,
  replaceActivityCartItem,
} from "@/lib/activityCart";
import { Activity, ActivitySelection } from "@/types/activity";

const currency = new Intl.NumberFormat("zh-TW");

function defaultOptions(activity: Activity, productId: string): Record<string, string> {
  const product = activity.products.find((item) => item.productId === productId)?.product;
  return Object.fromEntries(
    (product?.options ?? []).map((option) => [option.name, option.values[0] ?? ""]),
  );
}

export default function ActivitySelector({
  activity,
  editCartId,
}: {
  activity: Activity;
  editCartId?: string;
}) {
  const router = useRouter();
  const [selections, setSelections] = useState<ActivitySelection[]>([]);
  const [groupQuantity, setGroupQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!editCartId) {
      setInitialized(true);
      return;
    }

    const existing = loadCart().find(
      (item) => item.cartId === editCartId && item.activityId === activity.id,
    );

    if (existing?.activitySelections) {
      setSelections(existing.activitySelections);
      setGroupQuantity(activity.repeatable ? Math.max(1, existing.quantity) : 1);
      setMessage("已載入購物車中的活動內容，可直接更換商品或規格。");
    } else {
      setMessage("找不到原本的活動組合，請重新選擇。");
    }
    setInitialized(true);
  }, [activity.id, activity.repeatable, editCartId]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    selections.forEach((selection) => {
      map.set(selection.productId, (map.get(selection.productId) ?? 0) + 1);
    });
    return map;
  }, [selections]);

  function addProduct(productId: string) {
    const relation = activity.products.find((item) => item.productId === productId);
    if (!relation || selections.length >= activity.requiredCount) return;

    const currentCount = counts.get(productId) ?? 0;
    const limit = relation.maxPerGroup ?? (relation.allowRepeat ? activity.requiredCount : 1);
    if (currentCount >= limit) {
      setMessage(
        relation.allowRepeat
          ? `此商品每組最多選 ${limit} 件。`
          : "此商品不可重複選擇。",
      );
      return;
    }

    setMessage("");
    setSelections((current) => [
      ...current,
      {
        productId,
        productName: relation.product.name,
        imageUrl: relation.product.mainImage,
        selectedOptions: activity.selectOptionsPerItem
          ? defaultOptions(activity, productId)
          : {},
      },
    ]);
  }

  function removeOneProduct(productId: string) {
    setSelections((current) => {
      const index = current.map((item) => item.productId).lastIndexOf(productId);
      if (index < 0) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
    setMessage("");
  }

  function removeSelection(index: number) {
    setSelections((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setMessage("");
  }

  function updateOption(index: number, key: string, value: string) {
    setSelections((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              selectedOptions: { ...item.selectedOptions, [key]: value },
            }
          : item,
      ),
    );
  }

  function submit(goToCart: boolean) {
    if (selections.length !== activity.requiredCount) {
      setMessage(`請選滿 ${activity.requiredCount} 件商品。`);
      return;
    }

    if (editCartId) {
      const cartId = getActivityCartId(activity, selections, groupQuantity);
      replaceActivityCartItem(editCartId, activity, selections, groupQuantity);
      if (goToCart) {
        router.push(`/cart?focus=${encodeURIComponent(cartId)}`);
      } else {
        setMessage("活動組合已更新 ✓");
      }
      return;
    }

    const cartId = getActivityCartId(activity, selections, groupQuantity);
    addActivityToCart(activity, selections, groupQuantity);
    if (goToCart) {
      router.push(`/cart?focus=${encodeURIComponent(cartId)}`);
    } else {
      setMessage("活動組合已加入購物車 ✓");
    }
  }

  if (!initialized) {
    return (
      <div className="rounded-3xl border bg-white p-6 text-center font-bold text-slate-500 shadow-sm">
        正在載入活動內容……
      </div>
    );
  }

  return (
    <div
      data-activity-interaction
      data-interactive-ready="true"
      className="product-interaction-layer rounded-3xl border bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">
            {editCartId ? "修改活動商品" : "挑選活動商品"}
          </h2>
          {editCartId && (
            <p className="mt-1 text-sm text-slate-500">
              可減少原本商品，再改選其他搭配商品。
            </p>
          )}
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 font-black text-emerald-700">
          已選 {selections.length} / {activity.requiredCount} 件
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {activity.products.map((relation) => {
          const count = counts.get(relation.productId) ?? 0;
          const limit = relation.maxPerGroup ?? (relation.allowRepeat ? activity.requiredCount : 1);
          const cannotAdd = selections.length >= activity.requiredCount || count >= limit;

          return (
            <article key={relation.id} className="rounded-2xl border p-3">
              <div className="flex gap-3">
                <ProductImage
                  src={relation.product.mainImage}
                  alt={relation.product.name}
                  className="h-20 w-20 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-black">{relation.product.name}</h3>
                  <div className="mt-1 text-xs text-slate-500">
                    {relation.allowRepeat
                      ? `可重複選擇${relation.maxPerGroup ? `，每組最多 ${relation.maxPerGroup} 件` : ""}`
                      : "每組限選 1 件"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2">
                <span className="text-sm font-bold text-slate-600">選擇數量</span>
                <div className="inline-flex overflow-hidden rounded-xl border bg-white">
                  <button
                    type="button"
                    disabled={count <= 0}
                    onClick={() => removeOneProduct(relation.productId)}
                    className="h-10 w-10 font-black disabled:text-slate-300"
                    aria-label={`減少一件${relation.product.name}`}
                  >
                    −
                  </button>
                  <div className="grid h-10 min-w-12 place-items-center border-x font-black">
                    {count}
                  </div>
                  <button
                    type="button"
                    disabled={cannotAdd}
                    onClick={() => addProduct(relation.productId)}
                    className="h-10 w-10 font-black text-emerald-700 disabled:text-slate-300"
                    aria-label={`增加一件${relation.product.name}`}
                  >
                    ＋
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selections.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-black">已選內容與規格</h3>
          {selections.map((selection, index) => {
            const product = activity.products.find(
              (item) => item.productId === selection.productId,
            )?.product;
            return (
              <div key={`${selection.productId}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black">
                    第 {index + 1} 件：{selection.productName}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelection(index)}
                    className="text-sm font-bold text-rose-500"
                  >
                    移除
                  </button>
                </div>

                {activity.selectOptionsPerItem && (product?.options.length ?? 0) > 0 && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {product?.options.map((option) => (
                      <label key={option.name} className="block">
                        <span className="mb-1 block text-sm font-bold">{option.name}</span>
                        <select
                          value={selection.selectedOptions[option.name] ?? ""}
                          onChange={(event) =>
                            updateOption(index, option.name, event.target.value)
                          }
                          className="h-11 w-full rounded-xl border bg-white px-3"
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
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
        <div>
          <div className="text-sm text-slate-500">每組 {activity.requiredCount} 件</div>
          {!activity.repeatable && <div className="mt-1 text-sm font-bold text-amber-700">每張訂單限用一組</div>}
          <div className="text-2xl font-black text-rose-600">
            NT${currency.format(activity.price * groupQuantity)}
          </div>
        </div>
        <div className="inline-flex overflow-hidden rounded-xl border bg-white">
          <button
            type="button"
            onClick={() => setGroupQuantity((value) => Math.max(1, value - 1))}
            className="h-11 w-11 font-bold"
          >
            −
          </button>
          <div className="grid h-11 min-w-12 place-items-center border-x font-bold">
            {groupQuantity}
          </div>
          <button
            type="button"
            disabled={!activity.repeatable}
            onClick={() => setGroupQuantity((value) => Math.min(99, value + 1))}
            className="h-11 w-11 font-bold disabled:text-slate-300"
          >
            ＋
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center font-bold text-amber-700">
          {message}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {editCartId && (
          <button
            type="button"
            onClick={() =>
              router.push(`/cart?focus=${encodeURIComponent(editCartId)}`)
            }
            className="rounded-2xl border-2 border-slate-300 px-5 py-4 text-lg font-black text-slate-700"
          >
            取消修改
          </button>
        )}
        <button
          type="button"
          onClick={() => submit(Boolean(editCartId))}
          className="rounded-2xl border-2 border-emerald-600 px-5 py-4 text-lg font-black text-emerald-700"
        >
          {editCartId ? "儲存修改並返回購物車" : "加入購物車"}
        </button>
        {!editCartId && (
          <button
            type="button"
            onClick={() => submit(true)}
            className="rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white"
          >
            加入並前往購物車
          </button>
        )}
      </div>
    </div>
  );
}
