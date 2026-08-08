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
import {
  getEligiblePromotionBenefitQuantity,
  getPromotionalTriggerThreshold,
} from "@/lib/promotionEngine";
import type { Activity, ActivityProduct } from "@/types/activity";
import { takePendingActivityProductSelection } from "@/lib/activitySelectionBridge";

const currency = new Intl.NumberFormat("zh-TW");

function normalized(value: string) {
  return value.trim().toUpperCase().replace(/[\s_-]/g, "");
}

function isBuyGet(activity: Activity) {
  const type = normalized(activity.type);
  return type.includes("BUYGET") || activity.type.includes("買") || activity.type.includes("送");
}

function isTrigger(relation: ActivityProduct) {
  const role = normalized(relation.role);
  return role.includes("TRIGGER") || relation.role.includes("觸發") || relation.role.includes("指定");
}

function isGift(relation: ActivityProduct) {
  const role = normalized(relation.role);
  return role.includes("REWARD") || role.includes("GIFT") || relation.role.includes("贈品");
}

function isAddon(relation: ActivityProduct) {
  const role = normalized(relation.role);
  return role.includes("ADDON") || relation.role.includes("加購");
}

function ProductChoiceCard({
  relation,
  selected,
  label,
  priceLabel,
  priceMode = "activity",
  onSelect,
  disabled,
  onConfigure,
  selectedOptions,
  compact = false,
}: {
  relation: ActivityProduct;
  selected: boolean;
  label: string;
  priceLabel: string;
  priceMode?: "product" | "activity";
  onSelect: () => void;
  disabled?: boolean;
  onConfigure: () => void;
  selectedOptions?: Record<string, string>;
  compact?: boolean;
}) {
  const purchase = getActivityPurchase(relation.product);
  const selectedPurchase = selectedOptions
    ? getActivityPurchase(relation.product, selectedOptions)
    : purchase;
  const hasChoices = hasActivityPurchaseChoices(relation.product);
  const regular = selectedPurchase.originalPrice;
  const productPrice = selected ? selectedPurchase.price : (relation.product.salePrice ?? relation.product.price);
  const productOriginalPrice = selected ? selectedPurchase.originalPrice : (relation.product.basePrice ?? relation.product.price);
  const productHasSalePrice = productOriginalPrice > productPrice;

  return (
    <div className={`w-full rounded-2xl border-2 transition ${compact ? "p-3 sm:p-4" : "p-4"} ${
      selected
        ? "border-emerald-600 bg-emerald-50 shadow-sm"
        : "border-slate-200 bg-white"
    }`}>
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className="w-full touch-manipulation text-left disabled:cursor-wait disabled:opacity-60"
      >
        <div className={compact ? "flex gap-3 sm:gap-4" : "flex gap-4"}>
          <ProductImage
            src={relation.product.mainImage}
            alt={relation.product.name}
            className={compact ? "h-16 w-16 shrink-0 rounded-xl sm:h-28 sm:w-28" : "h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28"}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                {label}
              </span>
              <span className={`text-xl ${selected ? "text-emerald-600" : "text-slate-300"}`}>
                {selected ? "✓" : "○"}
              </span>
            </div>
            <h3 className={compact ? "mt-1 text-base font-black leading-5 text-slate-900 sm:mt-2 sm:text-lg sm:leading-6" : "mt-2 text-lg font-black leading-6 text-slate-900"}>
              {relation.product.name}
            </h3>
            {priceMode === "product" ? (
              productHasSalePrice ? (
                <div className={compact ? "mt-1 sm:mt-2" : "mt-2"}>
                  <div className="text-sm text-slate-400 line-through">
                    原價 NT${currency.format(productOriginalPrice)}
                  </div>
                  <div className="text-xl font-black text-rose-600">
                    NT${currency.format(productPrice)}
                  </div>
                </div>
              ) : (
                <div className={compact ? "mt-1 text-lg font-black text-rose-600 sm:mt-2 sm:text-xl" : "mt-2 text-xl font-black text-rose-600"}>
                  NT${currency.format(productPrice)}
                </div>
              )
            ) : priceLabel === "免費" ? (
              <div className={compact ? "mt-1 sm:mt-2" : "mt-2"}>
                <span className="text-sm text-slate-400 line-through">原價 NT${currency.format(regular)}</span>
                <div className={compact ? "text-lg font-black text-rose-600 sm:text-xl" : "text-xl font-black text-rose-600"}>活動贈品 NT$0</div>
              </div>
            ) : (
              <div className={compact ? "mt-1 sm:mt-2" : "mt-2"}>
                <span className="text-sm text-slate-400 line-through">原價 NT${currency.format(regular)}</span>
                <div className={compact ? "text-lg font-black text-rose-600 sm:text-xl" : "text-xl font-black text-rose-600"}>{priceLabel}</div>
              </div>
            )}
            {selected && selectedOptions && (
              <div className={compact ? "mt-1 rounded-xl bg-white/80 px-2 py-1.5 text-xs font-bold leading-5 text-slate-600 sm:mt-2 sm:px-3 sm:py-2 sm:text-sm sm:leading-6" : "mt-2 rounded-xl bg-white/80 px-3 py-2 text-sm font-bold leading-6 text-slate-600"}>
                {getActivityPurchaseSummary(relation.product, selectedOptions)}
              </div>
            )}
          </div>
        </div>
      </button>
      {hasChoices && <button
        type="button"
        onClick={onConfigure}
        className={compact ? "mt-2 min-h-10 w-full rounded-xl bg-emerald-600 px-3 py-2 text-center text-sm font-black text-white active:bg-emerald-700 sm:mt-3 sm:min-h-12 sm:px-4 sm:py-3 sm:text-base" : "mt-3 min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 text-center font-black text-white active:bg-emerald-700"}
      >
        {selected ? "修改尺寸／規格" : "選尺寸／規格"}
      </button>}
    </div>
  );
}

export default function PromotionalActivitySelector({
  activity,
  editSelectionId,
}: {
  activity: Activity;
  editSelectionId?: string;
}) {
  const router = useRouter();
  const buyGet = isBuyGet(activity);
  const triggerProducts = useMemo(
    () => activity.products.filter(isTrigger),
    [activity.products],
  );
  const benefitProducts = useMemo(() => {
    const matched = activity.products.filter((item) => (buyGet ? isGift(item) : isAddon(item)));
    if (matched.length > 0) return matched;

    // 後台若商品角色尚未完全一致，仍把非主商品視為贈品／加購品，避免前台整區空白。
    return activity.products.filter((item) => !isTrigger(item));
  }, [activity.products, buyGet]);

  const initialTrigger = triggerProducts[0]?.id ?? "";
  const initialBenefit = benefitProducts[0]?.id ?? "";
  const [triggerId, setTriggerId] = useState(initialTrigger);
  const [benefitId, setBenefitId] = useState(initialBenefit);
  const [includeAddon, setIncludeAddon] = useState(!buyGet && benefitProducts.length > 0);
  const [quantity, setQuantity] = useState(Math.max(1, activity.triggerCount || 1));
  const [addonQuantity, setAddonQuantity] = useState(1);
  const [triggerOptions, setTriggerOptions] = useState<Record<string, string>>(
    triggerProducts[0] ? buildActivityPurchaseOptions(triggerProducts[0].product) : {},
  );
  const [benefitOptions, setBenefitOptions] = useState<Record<string, string>>(
    benefitProducts[0] ? buildActivityPurchaseOptions(benefitProducts[0].product) : {},
  );
  const [message, setMessage] = useState("");
  const [interactive, setInteractive] = useState(false);
  const [configureTarget, setConfigureTarget] = useState<{ role: "trigger" | "benefit"; relation: ActivityProduct } | null>(null);

  useEffect(() => {
    if (editSelectionId) {
      const existing = loadCart().filter(
        (item) =>
          item.selectedOptions["活動ID"] === activity.id &&
          item.selectedOptions["活動選擇識別"] === editSelectionId,
      );
      const mainItem = existing.find(
        (item) => item.selectedOptions["活動角色"] === "觸發商品",
      );
      const benefitItem = existing.find((item) =>
        ["贈品商品", "加購商品"].includes(
          item.selectedOptions["活動角色"] ?? "",
        ),
      );
      const mainRelation = triggerProducts.find(
        (relation) => relation.productId === mainItem?.productId,
      );
      const benefitRelation = benefitProducts.find(
        (relation) => relation.productId === benefitItem?.productId,
      );

      if (mainItem && mainRelation) {
        setTriggerId(mainRelation.id);
        setTriggerOptions(Object.fromEntries(Object.entries(mainItem.selectedOptions).filter(([key]) => !key.startsWith("活動"))));
        setQuantity(
          Math.max(
            Math.max(1, activity.triggerCount || 1),
            mainItem.quantity,
          ),
        );
        if (benefitItem && benefitRelation) {
          setBenefitId(benefitRelation.id);
          setBenefitOptions(Object.fromEntries(Object.entries(benefitItem.selectedOptions).filter(([key]) => !key.startsWith("活動"))));
          setIncludeAddon(true);
          setAddonQuantity(Math.max(1, benefitItem.quantity));
        } else if (!buyGet) {
          setIncludeAddon(false);
        }
        setMessage("已載入購物車中的活動內容，可直接修改。");
      } else {
        setMessage("找不到原本的活動內容，請返回購物車後再試一次。");
      }
    }
    setInteractive(true);
  }, [
    activity.id,
    activity.triggerCount,
    benefitProducts,
    buyGet,
    editSelectionId,
    triggerProducts,
  ]);

  useEffect(() => {
    const pending = takePendingActivityProductSelection(activity.id);
    if (!pending) return;
    const triggerRelation = triggerProducts.find((item) => item.id === pending.relationId);
    if (triggerRelation && triggerRelation.productId === pending.productId) {
      setTriggerId(triggerRelation.id);
      setTriggerOptions(pending.selectedOptions);
      setMessage(`已選好「${triggerRelation.product.name}」的尺寸／規格 ✓`);
      return;
    }
    const benefitRelation = benefitProducts.find((item) => item.id === pending.relationId);
    if (benefitRelation && benefitRelation.productId === pending.productId) {
      setBenefitId(benefitRelation.id);
      setBenefitOptions(pending.selectedOptions);
      if (!buyGet) setIncludeAddon(true);
      setMessage(`已選好「${benefitRelation.product.name}」的尺寸／規格 ✓`);
    }
  }, [activity.id, benefitProducts, buyGet, triggerProducts]);

  const trigger = triggerProducts.find((item) => item.id === triggerId);
  const benefit = benefitProducts.find((item) => item.id === benefitId);
  const triggerPurchase = trigger ? getActivityPurchase(trigger.product, triggerOptions) : undefined;
  const triggerPrice = triggerPurchase?.price ?? 0;
  const triggerUnitsPerQuantity = Math.max(
    1,
    Number(triggerPurchase?.options["每組件數"]) || 1,
  );
  const triggerThreshold = getPromotionalTriggerThreshold(activity);
  const minimumTriggerQuantity = Math.max(
    1,
    Math.ceil(triggerThreshold / triggerUnitsPerQuantity),
  );
  const triggerPieceCount = quantity * triggerUnitsPerQuantity;
  const eligibleBenefitQuantity = getEligiblePromotionBenefitQuantity(
    activity,
    triggerPieceCount,
  );
  const benefitPrice = benefit
    ? benefit.activityProductPrice ?? activity.discountValue ?? 0
    : 0;
  const shouldIncludeBenefit = buyGet ? Boolean(benefit) : includeAddon && Boolean(benefit);
  const benefitQuantity = shouldIncludeBenefit
    ? buyGet
      ? eligibleBenefitQuantity
      : Math.min(Math.max(1, addonQuantity), eligibleBenefitQuantity)
    : 0;
  const total = triggerPrice * quantity + benefitPrice * benefitQuantity;

  useEffect(() => {
    setQuantity((current) => Math.max(minimumTriggerQuantity, current));
  }, [minimumTriggerQuantity]);

  useEffect(() => {
    setAddonQuantity((current) =>
      Math.min(Math.max(1, current), Math.max(1, eligibleBenefitQuantity)),
    );
  }, [eligibleBenefitQuantity]);

  function submit(goToCart: boolean) {
    if (!trigger) {
      setMessage("請先選擇要購買的指定商品。");
      return;
    }
    if (buyGet && benefitProducts.length > 0 && !benefit) {
      setMessage("請先選擇一項免費贈品。");
      return;
    }
    if (!buyGet && includeAddon && !benefit) {
      setMessage("請先選擇一項加購商品，或取消加購。");
      return;
    }
    if (shouldIncludeBenefit && benefitQuantity < 1) {
      setMessage(`主商品需滿 ${triggerThreshold} 件才可使用這項優惠。`);
      return;
    }

    const activitySelectionId =
      editSelectionId ??
      `${activity.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const main = getActivityPurchase(trigger.product, triggerOptions);
    const replacements = [
      buildProductCartItem(
        trigger.product,
        quantity,
        {
          ...main.options,
          活動ID: activity.id,
          活動名稱: activity.name,
          活動類型: activity.type,
          活動角色: "觸發商品",
          活動選擇識別: activitySelectionId,
        },
        main.price,
        main.originalPrice,
      ),
    ];

    if (shouldIncludeBenefit && benefit) {
      const benefitPurchase = getActivityPurchase(benefit.product, benefitOptions);
      replacements.push(
        buildProductCartItem(
          benefit.product,
          benefitQuantity,
          {
            ...benefitPurchase.options,
            活動ID: activity.id,
            活動名稱: activity.name,
            活動類型: activity.type,
            活動角色: buyGet ? "贈品商品" : "加購商品",
            活動選擇識別: activitySelectionId,
          },
          buyGet ? 0 : benefitPrice,
          benefitPurchase.originalPrice,
        ),
      );
    }

    if (editSelectionId) {
      replacePromotionCartGroup(editSelectionId, replacements);
    } else {
      addCartItems(replacements);
    }

    if (goToCart || editSelectionId) {
      router.push(`/cart?focus=${encodeURIComponent(`promotion:${activitySelectionId}`)}`);
      return;
    }
    setMessage(
      buyGet
        ? `主商品與 ${benefitQuantity} 個贈品已加入購物車 ✓`
        : includeAddon
          ? `主商品與 ${benefitQuantity} 個加購品已加入購物車 ✓`
          : "主商品已加入購物車 ✓",
    );
  }

  function cancelEdit() {
    router.push(
      editSelectionId
        ? `/cart?focus=${encodeURIComponent(`promotion:${editSelectionId}`)}`
        : "/cart",
    );
  }

  return (
    <div
      data-activity-interaction
      data-interactive-ready={interactive ? "true" : "false"}
      className="product-interaction-layer space-y-6"
    >
      <ActivityProductOptionModal
        open={Boolean(configureTarget)}
        product={configureTarget?.relation.product}
        initialValue={configureTarget?.role === "trigger" ? triggerOptions : benefitOptions}
        title={configureTarget?.role === "trigger" ? "選擇主商品尺寸／規格" : buyGet ? "選擇贈品尺寸／規格" : "選擇加購商品尺寸／規格"}
        confirmLabel="儲存這個規格"
        onClose={() => setConfigureTarget(null)}
        onConfirm={(selectedOptions) => {
          if (!configureTarget) return;
          if (configureTarget.role === "trigger") {
            setTriggerId(configureTarget.relation.id);
            setTriggerOptions(selectedOptions);
          } else {
            setBenefitId(configureTarget.relation.id);
            setBenefitOptions(selectedOptions);
            if (!buyGet) setIncludeAddon(true);
          }
          setMessage(`「${configureTarget.relation.product.name}」規格已選好 ✓`);
          setConfigureTarget(null);
        }}
      />
      {!interactive && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700">
          正在啟用活動商品操作……
        </div>
      )}
      {editSelectionId && (
        <div className="rounded-2xl bg-emerald-50 px-5 py-4">
          <div className="font-black text-emerald-800">正在修改購物車活動內容</div>
          <div className="mt-1 text-sm font-bold text-emerald-700">
            儲存後會更新原本的活動組合，不會新增另一組。
          </div>
        </div>
      )}
      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-lg font-black text-white">1</span>
          <div>
            <h2 className="text-xl font-black">選購指定商品</h2>
            <p className="mt-1 text-sm text-slate-500">先選擇要購買的主商品。</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {triggerProducts.map((relation) => (
            <ProductChoiceCard
              key={relation.id}
              relation={relation}
              onConfigure={() => setConfigureTarget({ role: "trigger", relation })}
              selected={triggerId === relation.id}
              selectedOptions={triggerId === relation.id ? triggerOptions : undefined}
              label="購買這項商品"
              priceLabel={`NT$${currency.format(getActivityPurchase(relation.product).price)}`}
              priceMode="product"
              disabled={!interactive}
              onSelect={() => {
                setTriggerId(relation.id);
                setTriggerOptions(buildActivityPurchaseOptions(relation.product));
                setMessage("");
              }}
            />
          ))}
        </div>

        {trigger && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
            <div>
              <div className="font-black">購買數量</div>
              <div className="mt-1 text-sm text-slate-500">
                每滿 {triggerThreshold} 件可取得 1 份優惠
                {activity.repeatable ? "，可重複計算" : "，整張訂單最多 1 份"}
              </div>
            </div>
            <div className="inline-flex overflow-hidden rounded-xl border bg-white">
              <button type="button" disabled={!interactive} onClick={() => setQuantity((value) => Math.max(minimumTriggerQuantity, value - 1))} className="h-11 w-11 touch-manipulation text-xl font-black disabled:text-slate-300">−</button>
              <div className="grid h-11 min-w-14 place-items-center border-x font-black">{quantity}</div>
              <button type="button" disabled={!interactive} onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="h-11 w-11 touch-manipulation text-xl font-black disabled:text-slate-300">＋</button>
            </div>
          </div>
        )}
      </section>

      <section className={`rounded-3xl border bg-white p-4 shadow-sm sm:p-6 ${!trigger ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-500 text-base font-black text-white sm:h-10 sm:w-10 sm:text-lg">2</span>
          <div>
            <h2 className="text-xl font-black">{buyGet ? "選擇免費贈品" : "優惠加購"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {buyGet
                ? activity.repeatable
                  ? `每滿 ${triggerThreshold} 件主商品，自動增加 1 個免費贈品。`
                  : "符合活動條件可獲得 1 個免費贈品，本活動不重複套用。"
                : activity.repeatable
                  ? `每滿 ${triggerThreshold} 件主商品，最多可加購 1 個優惠商品。`
                  : "不加購也可以直接購買主商品；本活動最多加購 1 個。"}
            </p>
          </div>
        </div>

        {!buyGet && trigger && (
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-amber-50 p-3 sm:mt-5 sm:p-4">
            <span>
              <span className="block font-black text-amber-800">我要使用加價購優惠</span>
              <span className="mt-0.5 block text-xs text-amber-700 sm:mt-1 sm:text-sm">已預先選好優惠商品，不需要時可取消勾選</span>
            </span>
            <input
              type="checkbox"
              disabled={!interactive}
              checked={includeAddon}
              onChange={(event) => {
                setIncludeAddon(event.target.checked);
                if (event.target.checked && !benefitId && benefitProducts.length > 0) {
                  setBenefitId(benefitProducts[0].id);
                  setBenefitOptions(buildActivityPurchaseOptions(benefitProducts[0].product));
                }
              }}
              className="h-6 w-6"
            />
          </label>
        )}

        {trigger && (buyGet || includeAddon) && (
          <div className="mt-4 sm:mt-5">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {benefitProducts.map((relation) => (
                <ProductChoiceCard
                  key={relation.id}
                  relation={relation}
                  onConfigure={() => setConfigureTarget({ role: "benefit", relation })}
                  selected={benefitId === relation.id}
                  selectedOptions={benefitId === relation.id ? benefitOptions : undefined}
                  compact
                  label={buyGet ? "免費贈品" : "優惠加購"}
                  priceLabel={buyGet ? "免費" : `加購價 NT$${currency.format(relation.activityProductPrice ?? activity.discountValue ?? 0)}`}
                  disabled={!interactive}
                  onSelect={() => {
                    setBenefitId(relation.id);
                    setBenefitOptions(buildActivityPurchaseOptions(relation.product));
                    setMessage("");
                  }}
                />
              ))}
            </div>

            {benefit && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-3 sm:mt-4 sm:flex-wrap sm:gap-4 sm:p-4">
                <div>
                  <div className="font-black text-emerald-800">
                    {buyGet ? "免費贈品數量" : "加購數量"}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-emerald-700 sm:mt-1 sm:text-sm">
                    目前主商品共 {triggerPieceCount} 件，最多可使用 {eligibleBenefitQuantity} 份優惠
                  </div>
                </div>
                {buyGet ? (
                  <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-base font-black text-rose-600 sm:px-5 sm:py-3 sm:text-lg">
                    自動贈送 {benefitQuantity} 個
                  </div>
                ) : (
                  <div className="inline-flex overflow-hidden rounded-xl border bg-white">
                    <button
                      type="button"
                      disabled={!interactive || addonQuantity <= 1}
                      onClick={() => setAddonQuantity((value) => Math.max(1, value - 1))}
                      className="h-10 w-10 touch-manipulation text-lg font-black disabled:text-slate-300 sm:h-11 sm:w-11 sm:text-xl"
                      aria-label="減少加購數量"
                    >
                      −
                    </button>
                    <div className="grid h-10 min-w-12 place-items-center border-x font-black sm:h-11 sm:min-w-14">
                      {benefitQuantity}
                    </div>
                    <button
                      type="button"
                      disabled={!interactive || addonQuantity >= eligibleBenefitQuantity}
                      onClick={() => setAddonQuantity((value) => Math.min(eligibleBenefitQuantity, value + 1))}
                      className="h-10 w-10 touch-manipulation text-lg font-black text-emerald-700 disabled:text-slate-300 sm:h-11 sm:w-11 sm:text-xl"
                      aria-label="增加加購數量"
                    >
                      ＋
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!trigger && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-center font-bold text-slate-500">請先完成步驟一</div>
        )}
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-800 text-lg font-black text-white">3</span>
          <h2 className="text-xl font-black">購買內容確認</h2>
        </div>

        <div className="mt-5 divide-y rounded-2xl bg-slate-50 px-4">
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <div className="text-sm text-slate-500">主商品</div>
              <div className="font-black">{trigger?.product.name ?? "尚未選擇"} {trigger ? `× ${quantity}` : ""}</div>
              {trigger && <div className="mt-1 text-sm font-bold leading-6 text-slate-600">{getActivityPurchaseSummary(trigger.product, triggerOptions)}</div>}
            </div>
            <div className="font-black">NT${currency.format(triggerPrice * quantity)}</div>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <div className="text-sm text-slate-500">{buyGet ? "免費贈品" : "優惠加購"}</div>
              <div className="font-black">
                {shouldIncludeBenefit && benefit
                  ? `${benefit.product.name} × ${benefitQuantity}`
                  : buyGet
                    ? "尚未選擇"
                    : "不加購"}
              </div>
              {shouldIncludeBenefit && benefit && <div className="mt-1 text-sm font-bold leading-6 text-slate-600">{getActivityPurchaseSummary(benefit.product, benefitOptions)}</div>}
            </div>
            <div className={`font-black ${buyGet && benefit ? "text-rose-600" : ""}`}>
              {buyGet && benefit
                ? "NT$0"
                : shouldIncludeBenefit
                  ? `NT$${currency.format(benefitPrice * benefitQuantity)}`
                  : "—"}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">合計金額</div>
            <div className="text-3xl font-black text-rose-600">NT${currency.format(total)}</div>
          </div>
          {buyGet && benefit && <div className="rounded-full bg-rose-50 px-4 py-2 font-black text-rose-600">贈品免費</div>}
        </div>

        {message && <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center font-bold text-amber-700">{message}</div>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {editSelectionId ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
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