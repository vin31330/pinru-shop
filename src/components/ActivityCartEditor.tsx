"use client";

import { useState } from "react";
import { replaceActivityCartItem } from "@/lib/activityCart";
import { Activity } from "@/types/activity";
import { CartItem } from "@/types/product";

export default function ActivityCartEditor({
  item,
  activity,
  onClose,
  onSaved,
}: {
  item: CartItem;
  activity: Activity;
  onClose: () => void;
  onSaved: (items: CartItem[]) => void;
}) {
  const [selections, setSelections] = useState(
    (item.activitySelections ?? []).map((selection) => ({
      ...selection,
      selectedOptions: { ...selection.selectedOptions },
    })),
  );

  function updateOption(index: number, key: string, value: string) {
    setSelections((current) =>
      current.map((selection, selectionIndex) =>
        selectionIndex === index
          ? {
              ...selection,
              selectedOptions: { ...selection.selectedOptions, [key]: value },
            }
          : selection,
      ),
    );
  }

  function save() {
    const next = replaceActivityCartItem(item.cartId, activity, selections, item.quantity);
    onSaved(next);
    onClose();
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[100] grid h-dvh place-items-center bg-black/40 p-3 sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)]">
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-rose-600">活動組合</div>
            <h2 className="text-xl font-black">修改規格</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 font-bold text-slate-500">
            關閉
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {selections.map((selection, index) => {
            const product = activity.products.find(
              (relation) => relation.productId === selection.productId,
            )?.product;
            return (
              <div key={`${selection.productId}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                <div className="font-black">
                  第 {index + 1} 件：{selection.productName}
                </div>
                {(product?.options.length ?? 0) > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {product?.options.map((option) => (
                      <label key={option.name} className="block">
                        <span className="mb-1 block text-sm font-bold">{option.name}</span>
                        <select
                          value={selection.selectedOptions[option.name] ?? option.values[0] ?? ""}
                          onChange={(event) => updateOption(index, option.name, event.target.value)}
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
                ) : (
                  <div className="mt-2 text-sm text-slate-500">此商品沒有可修改的規格。</div>
                )}
              </div>
            );
          })}
        </div>
        </div>
        <div className="cart-editor-actions grid shrink-0 gap-3 border-t bg-white px-5 py-4 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="rounded-2xl border px-5 py-3 font-black">
            取消
          </button>
          <button type="button" onClick={save} className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">
            儲存規格
          </button>
        </div>
      </div>
    </div>
  );
}
