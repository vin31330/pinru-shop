"use client";

import { useEffect, useState } from "react";
import ActivityProductPurchaseOptions from "@/components/ActivityProductPurchaseOptions";
import ProductImage from "@/components/ProductImage";
import { buildActivityPurchaseOptions, getActivityPurchase } from "@/lib/activityPurchase";
import type { Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

export default function ActivityProductOptionModal({
  open,
  product,
  initialValue,
  title = "選擇尺寸／規格",
  confirmLabel = "加入活動",
  onClose,
  onConfirm,
}: {
  open: boolean;
  product?: Product;
  initialValue?: Record<string, string>;
  title?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (selectedOptions: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !product) return;
    setDraft(
      initialValue && Object.keys(initialValue).length > 0
        ? initialValue
        : buildActivityPurchaseOptions(product),
    );
  }, [open, product, initialValue]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !product) return null;
  const purchase = getActivityPurchase(product, draft);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <div className="text-lg font-black">{title}</div>
            <div className="mt-1 text-sm font-bold text-slate-500">選好後會直接回到目前活動，不會跳頁。</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-2xl font-black" aria-label="關閉">×</button>
        </div>

        <div className="p-5">
          <div className="flex gap-4 rounded-2xl bg-slate-50 p-4">
            <ProductImage src={product.mainImage} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="font-black text-slate-900">{product.name}</div>
              <div className="mt-2 text-sm font-bold text-slate-500">目前選擇價格</div>
              <div className="text-2xl font-black text-rose-600">NT${currency.format(purchase.price)}</div>
            </div>
          </div>

          <ActivityProductPurchaseOptions product={product} value={draft} onChange={setDraft} />

          <div className="sticky bottom-0 -mx-5 mt-5 border-t bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={() => onConfirm(draft)}
              className="min-h-14 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white active:bg-emerald-700"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
