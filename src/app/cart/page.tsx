"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import CartItemEditor from "@/components/CartItemEditor";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductImage from "@/components/ProductImage";
import {
  clearCart,
  loadCart,
  reconcileCart,
  removeInvalidCartItems,
  saveCart,
} from "@/lib/cart";
import { Activity } from "@/types/activity";
import { CartItem, Product } from "@/types/product";

const currency = new Intl.NumberFormat("zh-TW");

type CartDisplayGroup = {
  key: string;
  activityId?: string;
  activityName?: string;
  activityType?: string;
  selectionId?: string;
  items: CartItem[];
};

const CART_EDIT_RETURN_KEY = "pinru-shop-cart-edit-return";

function jumpToScroll(top: number) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, top);
  window.requestAnimationFrame(() => {
    root.style.scrollBehavior = previous;
  });
}

function jumpByScroll(delta: number) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollBy(0, delta);
  window.requestAnimationFrame(() => {
    root.style.scrollBehavior = previous;
  });
}

function isPromotionalItem(item: CartItem) {
  return Boolean(item.selectedOptions["活動ID"] && item.selectedOptions["活動角色"]);
}

function activityTypeLabel(type = "") {
  const normalized = type.toUpperCase().replace(/[\s_-]/g, "");
  if (normalized.includes("BUYGET") || type.includes("買") || type.includes("送")) return "買 A 送 B";
  if (normalized.includes("ADDON") || type.includes("加價購")) return "加價購";
  if (normalized.includes("SECONDHALFPRICE") || normalized.includes("SECONDDISCOUNT") || type.includes("第二件半價") || type.includes("第二件折扣")) return "第二件優惠";
  if (normalized.includes("SECONDDISCOUNT") || normalized.includes("QUANTITYDISCOUNT") || type.includes("件數優惠")) return "多件優惠";
  return "優惠活動";
}

function isAddOnActivity(type = "") {
  const normalized = type.toUpperCase().replace(/[\s_-]/g, "");
  return normalized.includes("ADDON") || type.includes("加價購");
}

function activityRoleLabel(role = "") {
  if (role.includes("觸發")) return "主商品";
  if (role.includes("贈品")) return "免費贈品";
  if (role.includes("加購")) return "優惠加購品";
  if (role.includes("折扣")) return "優惠件";
  if (role.includes("原價")) return "活動商品";
  return role || "活動商品";
}

function buildDisplayGroups(items: CartItem[]): CartDisplayGroup[] {
  const groups: CartDisplayGroup[] = [];
  const promotionalGroups = new Map<string, CartDisplayGroup>();

  items.forEach((item, index) => {
    if (!isPromotionalItem(item)) {
      groups.push({ key: `single:${item.cartId}:${index}`, items: [item] });
      return;
    }

    const activityId = item.selectedOptions["活動ID"];
    const selectionId = item.selectedOptions["活動選擇識別"];
    const key = selectionId
      ? `promotion:${selectionId}`
      : `promotion:${activityId}:${item.selectedOptions["活動名稱"]}`;

    let group = promotionalGroups.get(key);
    if (!group) {
      group = {
        key,
        activityId,
        activityName: item.selectedOptions["活動名稱"],
        activityType: item.selectedOptions["活動類型"],
        selectionId,
        items: [],
      };
      promotionalGroups.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  });

  return groups;
}

function CartPageContent() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus") ?? "";
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<CartItem | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState("");
  const completedFocus = useRef("");
  const pendingViewport = useRef<{
    targetFocus?: string;
    targetTop?: number;
    scrollY: number;
  } | null>(null);

  useEffect(() => {
    const current = loadCart();
    setItems(current);
    Promise.all([
      fetch("/api/products", { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("products"); return response.json() as Promise<Product[]>; }),
      fetch("/api/activities", { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("activities"); return response.json() as Promise<Activity[]>; }),
    ])
      .then(([latestProducts, latestActivities]) => {
        setProducts(latestProducts);
        const next = reconcileCart(current, latestProducts, latestActivities);
        saveCart(next);
        setItems(next);
      })
      .catch(() => setCheckError("目前無法確認最新商品資料，請稍後重新整理。"))
      .finally(() => setChecking(false));
  }, []);

  const validItems = items.filter((item) => item.validationStatus !== "invalid");
  const invalidCount = items.length - validItems.length;

  useLayoutEffect(() => {
    const pending = pendingViewport.current;
    if (!pending) return;
    pendingViewport.current = null;

    if (pending.targetFocus) {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-cart-focus]"),
      ).find((element) => element.dataset.cartFocus === pending.targetFocus);
      if (target && pending.targetTop !== undefined) {
        const delta = target.getBoundingClientRect().top - pending.targetTop;
        if (Math.abs(delta) > 0.5) jumpByScroll(delta);
        return;
      }
    }

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    jumpToScroll(Math.min(pending.scrollY, maxScroll));
  }, [items]);

  useEffect(() => {
    if (
      !focus ||
      checking ||
      items.length === 0 ||
      completedFocus.current === focus
    ) return;
    const timer = window.setTimeout(() => {
      try {
        const rawReturn = sessionStorage.getItem(CART_EDIT_RETURN_KEY);
        if (rawReturn) {
          const saved = JSON.parse(rawReturn) as {
            scrollY?: number;
            createdAt?: number;
          };
          sessionStorage.removeItem(CART_EDIT_RETURN_KEY);
          if (
            Number.isFinite(saved.scrollY) &&
            Date.now() - Number(saved.createdAt || 0) < 5 * 60 * 1000
          ) {
            completedFocus.current = focus;
            const maxScroll = Math.max(
              0,
              document.documentElement.scrollHeight - window.innerHeight,
            );
            jumpToScroll(Math.min(Number(saved.scrollY), maxScroll));
            return;
          }
        }
      } catch {
        sessionStorage.removeItem(CART_EDIT_RETURN_KEY);
      }

      const target = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-focus]"))
        .find((element) => element.dataset.cartFocus === focus);
      if (!target) return;
      completedFocus.current = focus;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("cart-focus-highlight");
      window.setTimeout(() => target.classList.remove("cart-focus-highlight"), 2200);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [checking, focus, items]);

  const displayGroups = useMemo(() => buildDisplayGroups(items), [items]);
  const totalCount = useMemo(
    () => validItems.reduce((sum, item) => {
      const unitsPerGroup = item.itemType === "activity"
        ? Math.max(1, item.activitySelections?.length ?? 1)
        : Math.max(1, Number(item.selectedOptions["每組件數"]) || 1);
      return sum + item.quantity * unitsPerGroup;
    }, 0),
    [validItems],
  );
  const totalAmount = useMemo(
    () => validItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [validItems],
  );

  function findCartElement(cartFocus: string) {
    return Array.from(
      document.querySelectorAll<HTMLElement>("[data-cart-focus]"),
    ).find((element) => element.dataset.cartFocus === cartFocus);
  }

  function commitCart(
    next: CartItem[],
    sourceFocus?: string,
    targetFocus = sourceFocus,
  ) {
    const source = sourceFocus ? findCartElement(sourceFocus) : undefined;
    pendingViewport.current = {
      targetFocus,
      targetTop: source?.getBoundingClientRect().top,
      scrollY: window.scrollY,
    };
    setItems(next);
    saveCart(next);
  }

  function update(cartId: string, quantity: number) {
    const next = items.map((item) =>
      item.cartId === cartId
        ? { ...item, quantity: Math.max(1, Math.floor(quantity)) }
        : item,
    );
    commitCart(next, cartId);
  }

  function removeItem(item: CartItem) {
    if (!window.confirm(`確定要刪除「${item.name}」嗎？`)) return;
    const index = items.findIndex((candidate) => candidate.cartId === item.cartId);
    const target = items[index + 1]?.cartId ?? items[index - 1]?.cartId;
    const next = items.filter((candidate) => candidate.cartId !== item.cartId);
    commitCart(next, item.cartId, target);
  }

  function removeGroup(group: CartDisplayGroup) {
    if (!window.confirm(`確定要刪除整組「${group.activityName || "優惠活動"}」嗎？`)) return;
    const ids = new Set(group.items.map((item) => item.cartId));
    const groupIndex = displayGroups.findIndex((candidate) => candidate.key === group.key);
    const target =
      displayGroups[groupIndex + 1]?.key ??
      displayGroups[groupIndex - 1]?.key;
    const next = items.filter((item) => !ids.has(item.cartId));
    commitCart(next, group.key, target);
  }

  function rememberCartEditReturn() {
    try {
      sessionStorage.setItem(
        CART_EDIT_RETURN_KEY,
        JSON.stringify({ scrollY: window.scrollY, createdAt: Date.now() }),
      );
    } catch {
      // 儲存失敗時仍可返回購物車，只是不還原精確捲動位置。
    }
  }

  const editingProduct = editing && editing.itemType !== "activity"
    ? products.find((product) => product.id === editing.productId)
    : undefined;

  function renderItem(item: CartItem, grouped = false) {
    const isInvalid = item.validationStatus === "invalid";
    const promotionRole = item.selectedOptions["活動角色"];
    const planName = item.selectedOptions["購買方案"] ?? "";
    const unitsPerGroup = Math.max(1, Number(item.selectedOptions["每組件數"]) || 1);
    const isSinglePlan = unitsPerGroup === 1;
    const hiddenOptionKeys = new Set([
      "活動選擇識別",
      "活動ID",
      "活動名稱",
      "活動類型",
      "活動角色",
      "活動件序",
      "活動每組件數",
      "活動折扣方式",
      "活動優惠值",
      "方案ID",
      "購買方案",
      "每組件數",
    ]);
    const isGift = promotionRole === "贈品商品";
    const isQuantityPromotion = promotionRole === "優惠原價商品" || promotionRole === "優惠折扣商品";
    const isPromotionBenefit =
      isGift ||
      promotionRole === "加購商品" ||
      isQuantityPromotion;
    const isActivityBundle = item.itemType === "activity";
    const activityUnitsPerGroup = Math.max(
      1,
      item.activitySelections?.length ?? (Number(item.selectedOptions["每組件數"]) || 1),
    );

    return (
      <article
        key={item.cartId}
        data-cart-focus={item.cartId}
        className={`${grouped ? "bg-white p-4 sm:p-5" : "rounded-2xl border bg-white p-4"} ${isInvalid ? "border-rose-300 opacity-80" : ""}`}
      >
        {grouped && promotionRole && (
          <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
            {activityRoleLabel(promotionRole)}
          </div>
        )}
        <div className="flex gap-3">
          <Link
            href={
              item.itemType === "activity" && item.activityId
                ? `/activities/${encodeURIComponent(item.activityId)}`
                : `/products/${encodeURIComponent(item.productId)}`
            }
            aria-label={`查看${item.name}`}
            className="shrink-0"
          >
            <ProductImage src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-xl" />
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="font-black">
              <Link
                href={item.itemType === "activity" && item.activityId ? `/activities/${encodeURIComponent(item.activityId)}` : `/products/${encodeURIComponent(item.productId)}`}
                className="transition hover:text-emerald-700 hover:underline"
              >
                {item.name}
              </Link>
            </h2>
            <div className="mt-1 text-sm text-slate-500">
              {item.itemType === "activity" && item.activitySelections ? (
                <span>
                  {item.activitySelections.map((selection, index) => {
                    const visibleOptions = Object.entries(selection.selectedOptions)
                      .filter(([key]) => key !== "方案ID")
                      .map(([key, value]) => `${key}：${value}`)
                      .join("、");
                    return `第${index + 1}件：${selection.productName}${visibleOptions ? `（${visibleOptions}）` : ""}`;
                  }).join("；")}
                </span>
              ) : (
                <>
                  {!isSinglePlan && planName && (
                    <span className="mr-2 font-bold text-slate-700">{planName}</span>
                  )}
                  {!isSinglePlan && (
                    <span className="mr-2">每組 {unitsPerGroup} 件</span>
                  )}
                  {Object.entries(item.selectedOptions)
                    .filter(([key]) => !hiddenOptionKeys.has(key))
                    .map(([key, value]) => (
                      <span key={key} className="mr-2">{key}：{value}</span>
                    ))}
                </>
              )}
            </div>
            {isInvalid ? (
              <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                {item.validationMessage || "此商品目前無法結帳。"}
              </div>
            ) : (
              <>
                <div className={`mt-2 font-black ${isGift ? "text-rose-600" : "text-emerald-700"}`}>
                  {isGift ? "免費 NT$0" : `NT$${currency.format(item.unitPrice)}`}
                </div>
                {item.priceChangedFrom !== undefined && (
                  <div className="mt-1 text-sm font-bold text-amber-700">
                    價格已由 NT${currency.format(item.priceChangedFrom)} 更新為 NT${currency.format(item.unitPrice)}
                  </div>
                )}
              </>
            )}
          </div>
          {!grouped && (
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-black text-rose-600 transition hover:bg-rose-50"
            >
              刪除
            </button>
          )}
        </div>

        {!isInvalid && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isPromotionBenefit ? (
                <div className={`rounded-xl px-4 py-2 font-black ${isGift ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                  {isGift
                    ? `活動贈品 × ${item.quantity}`
                    : promotionRole === "加購商品"
                      ? `優惠加購品 × ${item.quantity}`
                      : "活動商品 × 1"}
                </div>
              ) : (
                <div>
                  <div className="mb-1 text-sm font-bold text-slate-600">
                    {isActivityBundle || !isSinglePlan ? "購買組數" : "購買數量"}
                  </div>
                  <div className="inline-flex overflow-hidden rounded-xl border bg-white">
                    <button
                      type="button"
                      aria-label={`減少${item.name}數量`}
                      disabled={item.quantity <= 1}
                      onClick={() => update(item.cartId, item.quantity - 1)}
                      className="h-12 w-12 touch-manipulation text-xl font-black disabled:text-slate-300"
                    >
                      −
                    </button>
                    <div className="grid h-12 min-w-14 place-items-center border-x text-lg font-black">{item.quantity}</div>
                    <button
                      type="button"
                      aria-label={`增加${item.name}數量`}
                      onClick={() => update(item.cartId, item.quantity + 1)}
                      className="h-12 w-12 touch-manipulation text-xl font-black text-emerald-700"
                    >
                      ＋
                    </button>
                  </div>
                  {(isActivityBundle || !isSinglePlan) && (
                    <div className="mt-1 text-center text-sm font-bold text-emerald-700">
                      共 {item.quantity * (isActivityBundle ? activityUnitsPerGroup : unitsPerGroup)} 件
                    </div>
                  )}
                </div>
              )}
              {item.itemType === "activity" && item.activityId ? (
                <Link
                  href={`/activities/${encodeURIComponent(item.activityId)}?edit=${encodeURIComponent(item.cartId)}`}
                  onClick={rememberCartEditReturn}
                  className="min-h-12 rounded-xl border border-emerald-600 px-4 py-3 text-center font-black text-emerald-700"
                >
                  修改活動商品
                </Link>
              ) : !isPromotionBenefit ? (
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="min-h-12 rounded-xl border border-emerald-600 px-4 py-3 font-black text-emerald-700"
                >
                  修改規格
                </button>
              ) : null}
            </div>
            <div className="font-black">小計 NT${currency.format(item.unitPrice * item.quantity)}</div>
          </div>
        )}
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-7">
        <BackButton fallbackHref="/products" />
        <div className="mt-5 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black">購物車</h1>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("確定要清空購物車嗎？")) {
                  clearCart();
                  setItems([]);
                }
              }}
              className="min-h-11 rounded-xl px-3 text-sm font-black text-rose-600 transition hover:bg-rose-50"
            >
              清空購物車
            </button>
          )}
        </div>

        {checking && <div className="mt-4 rounded-2xl bg-amber-50 p-4 font-bold text-amber-700">正在確認商品是否仍上架，以及最新價格……</div>}
        {checkError && <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-bold text-rose-700">{checkError}</div>}

        {items.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-10 text-center">
            購物車目前是空的
            <div><Link href="/products" className="mt-5 inline-block rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white">前往選購</Link></div>
          </div>
        ) : (
          <>
            {invalidCount > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700">
                <b>有 {invalidCount} 筆商品已下架或規格失效，不會列入總金額。</b>
                <button
                  type="button"
                  onClick={() => {
                    const next = removeInvalidCartItems(items);
                    pendingViewport.current = { scrollY: window.scrollY };
                    setItems(next);
                  }}
                  className="min-h-12 rounded-xl bg-white px-4 py-3 font-black shadow-sm"
                >
                  移除所有失效商品
                </button>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {displayGroups.map((group) => {
                if (!group.activityId) return renderItem(group.items[0]);
                const groupAmount = group.items
                  .filter((item) => item.validationStatus !== "invalid")
                  .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
                const missingAddon = isAddOnActivity(group.activityType) && !group.items.some(
                  (item) => item.selectedOptions["活動角色"] === "加購商品",
                );
                return (
                  <section key={group.key} data-cart-focus={group.key} className="overflow-hidden rounded-3xl border-2 border-emerald-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 px-5 py-4">
                      <div>
                        <div className="text-sm font-black text-emerald-700">{activityTypeLabel(group.activityType)}</div>
                        <h2 className="mt-1 text-lg font-black text-slate-900">{group.activityName || "優惠活動組合"}</h2>
                        <div className="mt-1 text-sm font-bold text-slate-500">以下商品屬於同一組活動，會一起享有優惠</div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">活動組合小計</div>
                          <div className="font-black text-rose-600">NT${currency.format(groupAmount)}</div>
                        </div>
                        {group.selectionId && group.activityId && (
                          <Link
                            href={`/activities/${encodeURIComponent(group.activityId)}?edit=${encodeURIComponent(group.selectionId)}`}
                            onClick={rememberCartEditReturn}
                            className="min-h-11 rounded-xl border border-emerald-600 bg-white px-3 py-2.5 text-sm font-black text-emerald-700"
                          >
                            修改活動內容
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => removeGroup(group)}
                          className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-black text-rose-600"
                        >
                          整組刪除
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-dashed divide-emerald-200">
                      {group.items.map((item) => renderItem(item, true))}
                    </div>
                    {missingAddon && (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-5 py-4">
                        <div>
                          <div className="font-black text-amber-800">此組目前只加入主商品</div>
                          <div className="mt-1 text-sm font-bold text-amber-700">尚未選擇優惠加購商品，可回活動頁補選。</div>
                        </div>
                        <Link
                          href={`/activities/${encodeURIComponent(group.activityId)}`}
                          className="rounded-xl bg-amber-600 px-4 py-2 font-black text-white"
                        >
                          回活動頁選擇加購品
                        </Link>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm" data-cart-summary>
              <div className="flex justify-between"><span>商品總件數</span><span className="font-bold" data-cart-count={totalCount}>{totalCount} 件</span></div>
              <div className="mt-3 flex justify-between text-xl font-black"><span>商品總金額</span><span className="text-rose-600" data-cart-total={totalAmount}>NT${currency.format(totalAmount)}</span></div>
              {invalidCount > 0 || checking || checkError ? (
                <div className="mt-5 rounded-2xl bg-slate-200 px-5 py-4 text-center font-black text-slate-500">請先處理失效商品並完成最新資料確認</div>
              ) : (
                <Link href="/order" className="mt-5 block rounded-2xl bg-emerald-600 px-5 py-4 text-center text-lg font-black text-white">前往填寫訂單</Link>
              )}
              <Link href="/products" className="mt-3 block rounded-2xl border border-emerald-600 px-5 py-3.5 text-center font-black text-emerald-700">
                繼續選購商品
              </Link>
            </div>
          </>
        )}
      </div>

      {editing && editingProduct && (
        <CartItemEditor
          item={editing}
          product={editingProduct}
          onClose={() => setEditing(null)}
          onSaved={(next, savedCartId) => {
            const source = editing ? findCartElement(editing.cartId) : undefined;
            pendingViewport.current = {
              targetFocus: savedCartId,
              targetTop: source?.getBoundingClientRect().top,
              scrollY: window.scrollY,
            };
            setItems(next);
          }}
        />
      )}
      <Footer />
    </main>
  );
}


export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"><Header /><div className="mx-auto max-w-5xl px-4 py-10 font-bold text-slate-600">購物車載入中……</div><Footer /></div>}>
      <CartPageContent />
    </Suspense>
  );
}
