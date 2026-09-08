"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import ActivityProductOptionModal from "@/components/ActivityProductOptionModal";
import ActivityQuantityStepper from "@/components/ActivityQuantityStepper";
import { loadCart } from "@/lib/cart";
import { addActivityToCart, getActivityCartId, replaceActivityCartItem } from "@/lib/activityCart";
import { Activity, ActivitySelection, ActivityProduct } from "@/types/activity";
import { buildActivityPurchaseOptions, getActivityPurchaseSummary, hasActivityPurchaseChoices } from "@/lib/activityPurchase";

const currency = new Intl.NumberFormat("zh-TW");

type ModalTarget = {
  relation: ActivityProduct;
  editIndex?: number;
  initialValue?: Record<string, string>;
};

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
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!editCartId) {
      setInitialized(true);
      return;
    }
    const existing = loadCart().find((item) => item.cartId === editCartId && item.activityId === activity.id);
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
    selections.forEach((selection) => map.set(selection.productId, (map.get(selection.productId) ?? 0) + 1));
    return map;
  }, [selections]);

  useEffect(() => {
    if (scrollToIndex === null || modalTarget) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`activity-mix-selected-${scrollToIndex}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setScrollToIndex(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [modalTarget, scrollToIndex, selections]);

  function openAdd(relation: ActivityProduct) {
    if (selections.length >= activity.requiredCount) {
      setMessage(`已選滿 ${activity.requiredCount} 件。`);
      return;
    }
    const currentCount = counts.get(relation.productId) ?? 0;
    const limit = relation.maxPerGroup ?? (relation.allowRepeat ? activity.requiredCount : 1);
    if (currentCount >= limit) {
      setMessage(relation.allowRepeat ? `此商品每組最多選 ${limit} 件。` : "此商品不可重複選擇。");
      return;
    }
    const selectedOptions = buildActivityPurchaseOptions(relation.product);
    if (!hasActivityPurchaseChoices(relation.product)) {
      const nextIndex = selections.length;
      setSelections((current) => [...current, { productId: relation.productId, productName: relation.product.name, imageUrl: relation.product.mainImage, selectedOptions }]);
      setScrollToIndex(nextIndex);
      setMessage(`「${relation.product.name}」已加入活動 ✓`);
      return;
    }
    setModalTarget({ relation, initialValue: selectedOptions });
  }

  function confirmModal(selectedOptions: Record<string, string>) {
    if (!modalTarget) return;
    const relation = modalTarget.relation;
    if (modalTarget.editIndex !== undefined) {
      const editIndex = modalTarget.editIndex;
      setSelections((current) => current.map((item, index) => index === editIndex ? { ...item, selectedOptions } : item));
      setScrollToIndex(editIndex);
      setMessage(`「${relation.product.name}」規格已更新 ✓`);
    } else {
      const nextIndex = selections.length;
      setSelections((current) => [
        ...current,
        {
          productId: relation.productId,
          productName: relation.product.name,
          imageUrl: relation.product.mainImage,
          selectedOptions,
        },
      ]);
      setScrollToIndex(nextIndex);
      setMessage(`「${relation.product.name}」已加入活動 ✓`);
    }
    setModalTarget(null);
  }

  function removeSelection(index: number) {
    setSelections((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setMessage("");
  }

  function removeLastForProduct(productId: string) {
    setSelections((current) => {
      const index = current.map((item) => item.productId).lastIndexOf(productId);
      return index < 0 ? current : current.filter((_, itemIndex) => itemIndex !== index);
    });
    setMessage("");
  }

  function submit(goToCart: boolean) {
    if (selections.length !== activity.requiredCount) {
      setMessage(`請選滿 ${activity.requiredCount} 件商品。`);
      return;
    }

    if (editCartId) {
      const cartId = getActivityCartId(activity, selections, groupQuantity);
      replaceActivityCartItem(editCartId, activity, selections, groupQuantity);
      if (goToCart) router.push(`/cart?focus=${encodeURIComponent(cartId)}`);
      else setMessage("活動組合已更新 ✓");
      return;
    }

    const cartId = getActivityCartId(activity, selections, groupQuantity);
    addActivityToCart(activity, selections, groupQuantity);
    if (goToCart) router.push(`/cart?focus=${encodeURIComponent(cartId)}`);
    else setMessage("活動組合已加入購物車 ✓");
  }

  if (!initialized) {
    return <div className="rounded-3xl border bg-white p-6 text-center font-bold text-slate-500 shadow-sm">正在載入活動內容……</div>;
  }

  return (
    <div data-activity-interaction data-interactive-ready="true" className="product-interaction-layer rounded-3xl border bg-white p-5 shadow-sm">
      <ActivityProductOptionModal
        open={Boolean(modalTarget)}
        product={modalTarget?.relation.product}
        initialValue={modalTarget?.initialValue}
        title={modalTarget?.editIndex !== undefined
          ? "修改尺寸／規格"
          : modalTarget ? `選擇第 ${(counts.get(modalTarget.relation.productId) ?? 0) + 1} 件規格` : "選擇尺寸／規格"}
        confirmLabel={modalTarget?.editIndex !== undefined ? "儲存這個規格" : "確認加入 1 件"}
        onClose={() => setModalTarget(null)}
        onConfirm={confirmModal}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">{editCartId ? "修改活動商品" : "挑選活動商品"}</h2>
          <p className="mt-1 text-sm text-slate-500">每按一次「＋」就增加一件；有規格的商品才會跳出選擇框。</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 font-black text-emerald-700">已選 {selections.length} / {activity.requiredCount} 件</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {activity.products.map((relation) => {
          const count = counts.get(relation.productId) ?? 0;
          const limit = relation.maxPerGroup ?? (relation.allowRepeat ? activity.requiredCount : 1);
          const cannotAdd = selections.length >= activity.requiredCount || count >= limit;
          return (
            <article key={relation.id} className="rounded-2xl border p-3">
              <div className="flex gap-3">
                <ProductImage src={relation.product.mainImage} alt={relation.product.name} className="h-20 w-20 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-black">{relation.product.name}</h3>
                  <div className="mt-1 text-xs text-slate-500">{relation.allowRepeat ? `可重複選擇${relation.maxPerGroup ? `，每組最多 ${relation.maxPerGroup} 件` : ""}` : "每組限選 1 件"}</div>
                  {count > 0 && <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">✓ 已選 {count} 件</div>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <div>
                  <div className="font-black">選擇數量</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">
                    {hasActivityPurchaseChoices(relation.product) ? "按＋後選擇這一件的規格" : "每按一次＋增加一件"}
                  </div>
                </div>
                <ActivityQuantityStepper
                  value={count}
                  compact
                  decreaseDisabled={count === 0}
                  increaseDisabled={cannotAdd}
                  onDecrease={() => removeLastForProduct(relation.productId)}
                  onIncrease={() => openAdd(relation)}
                />
              </div>
            </article>
          );
        })}
      </div>

      {selections.length > 0 && (
        <div className="mt-6 space-y-3 border-t pt-5">
          <h3 className="font-black">已選商品</h3>
          {selections.map((selection, index) => {
            const relation = activity.products.find((item) => item.productId === selection.productId);
            if (!relation) return null;
            return (
              <div id={`activity-mix-selected-${index}`} key={`${selection.productId}-${index}`} className="scroll-mt-28 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black">✓ {selection.productName}</div>
                    <div className="mt-1 text-sm font-bold leading-6 text-slate-600">{getActivityPurchaseSummary(relation.product, selection.selectedOptions)}</div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {hasActivityPurchaseChoices(relation.product) && <button type="button" onClick={() => setModalTarget({ relation, editIndex: index, initialValue: selection.selectedOptions })} className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-black text-emerald-700">修改</button>}
                    <button type="button" onClick={() => removeSelection(index)} className="rounded-xl px-3 py-2 text-sm font-black text-rose-500">移除</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
        <div>
          <div className="text-sm text-slate-500">每組 {activity.requiredCount} 件</div>
          {!activity.repeatable && <div className="mt-1 text-sm font-bold text-amber-700">每張訂單限用一組</div>}
          <div className="text-2xl font-black text-rose-600">NT${currency.format(activity.price * groupQuantity)}</div>
        </div>
        <ActivityQuantityStepper
          value={groupQuantity}
          compact
          decreaseDisabled={groupQuantity <= 1}
          increaseDisabled={!activity.repeatable || groupQuantity >= 99}
          onDecrease={() => setGroupQuantity((value) => Math.max(1, value - 1))}
          onIncrease={() => setGroupQuantity((value) => Math.min(99, value + 1))}
        />
      </div>

      {message && <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center font-bold text-amber-700">{message}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {editCartId && <button type="button" onClick={() => router.push(`/cart?focus=${encodeURIComponent(editCartId)}`)} className="rounded-2xl border-2 border-slate-300 px-5 py-4 text-lg font-black text-slate-700">取消修改</button>}
        <button type="button" onClick={() => submit(Boolean(editCartId))} className="shopping-action-button flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 text-emerald-700">
          {!editCartId && <span aria-hidden="true">🛒</span>}
          <span>{editCartId ? "儲存修改並返回購物車" : "加入購物車"}</span>
        </button>
        {!editCartId && <button type="button" onClick={() => submit(true)} className="shopping-action-button rounded-2xl bg-[#d62872] text-white shadow-sm transition hover:bg-[#bd1f63] active:bg-[#a91856]">直接購買</button>}
      </div>
    </div>
  );
}
