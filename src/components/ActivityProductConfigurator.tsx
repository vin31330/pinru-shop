"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ActivityProductPurchaseOptions from "@/components/ActivityProductPurchaseOptions";
import { buildActivityPurchaseOptions, getActivityPurchase } from "@/lib/activityPurchase";
import { savePendingActivityProductSelection } from "@/lib/activitySelectionBridge";
import type { Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

export default function ActivityProductConfigurator({
  activityId,
  activityName,
  relationId,
  product,
  returnHref,
}: {
  activityId: string;
  activityName: string;
  relationId: string;
  product: Product;
  returnHref: string;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<Record<string, string>>(() => buildActivityPurchaseOptions(product));
  const purchase = useMemo(() => getActivityPurchase(product, options), [product, options]);

  function confirm() {
    savePendingActivityProductSelection({
      activityId,
      relationId,
      productId: product.id,
      selectedOptions: purchase.options,
      savedAt: Date.now(),
    });
    router.push(returnHref);
  }

  return (
    <div id="activity-product-purchase" className="mt-6 rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-sm">
      <div className="rounded-2xl bg-rose-50 px-4 py-3">
        <div className="text-sm font-black text-rose-700">正在選擇活動商品</div>
        <div className="mt-1 font-black text-slate-900">{activityName}</div>
        <div className="mt-1 text-sm font-bold text-slate-600">先選尺寸／容量／顏色，再回到活動完成優惠。</div>
      </div>

      <ActivityProductPurchaseOptions
        product={product}
        value={options}
        onChange={setOptions}
      />

      <div className="mt-5 flex items-end justify-between gap-4 rounded-2xl bg-slate-50 p-4">
        <div>
          <div className="text-sm text-slate-500">目前選擇價格</div>
          <div className="text-2xl font-black text-rose-600">NT${currency.format(purchase.price)}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">實際折扣／贈品／加購價會依活動規則在活動頁計算。</div>
        </div>
      </div>

      <button
        type="button"
        onClick={confirm}
        className="mt-4 min-h-14 w-full touch-manipulation rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white active:bg-emerald-700"
      >
        確定這個尺寸／規格，回到活動
      </button>
    </div>
  );
}
