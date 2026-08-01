"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import FloatingHomeButton from "@/components/FloatingHomeButton";
import Header from "@/components/Header";
import { buildLineOrderUrl } from "@/lib/orders";

const currency = new Intl.NumberFormat("zh-TW");
const SUCCESS_KEY = "pinru-shop-order-success";

type OrderSuccessData = {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  lineMessage: string;
  duplicate: boolean;
  createdAt: string;
};

export default function OrderSuccessPage() {
  const [data, setData] = useState<OrderSuccessData | null>(null);
  const [countdown, setCountdown] = useState(1);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SUCCESS_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as OrderSuccessData;
      if (!parsed.orderNumber || !parsed.lineMessage) return;

      setData(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    if (!data) return;

    const lineId = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ID || "@284eiqba";
    const lineUrl = buildLineOrderUrl(lineId, data.lineMessage);

    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      window.location.href = lineUrl;
    }, 1000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [data]);

  function openLine() {
    if (!data) return;

    const lineId = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ID || "@284eiqba";
    window.location.href = buildLineOrderUrl(lineId, data.lineMessage);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header showHomeButton />
      <FloatingHomeButton />
      <section className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            ✓
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-900">訂單送出成功</h1>

          {data ? (
            <>
              <p className="mt-3 text-slate-600">我們已收到您的訂單，請保留以下訂單編號。</p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left">
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="font-bold text-slate-500">訂單編號</span>
                  <span className="break-all text-right text-lg font-black text-emerald-700">{data.orderNumber}</span>
                </div>
                {data.customerName && (
                  <div className="flex items-center justify-between gap-4 border-b py-3">
                    <span className="font-bold text-slate-500">收件人</span>
                    <span className="font-bold">{data.customerName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <span className="font-bold text-slate-500">訂單金額</span>
                  <span className="text-xl font-black text-rose-600">NT${currency.format(data.totalAmount)}</span>
                </div>
              </div>

              {data.duplicate && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 font-bold text-amber-700">
                  此訂單先前已建立，系統沒有重複新增。
                </div>
              )}

              <div className="mt-6 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800">
                {countdown > 0
                  ? `${countdown} 秒後自動前往 LINE`
                  : "正在開啟 LINE…"}
              </div>

              <button
                type="button"
                onClick={openLine}
                className="mt-3 w-full rounded-2xl bg-[#06C755] px-5 py-4 text-lg font-black text-white"
              >
                沒有自動開啟？按這裡前往 LINE
              </button>
              <p className="mt-3 text-sm text-slate-500">進入 LINE 後，請按一次傳送完成通知。</p>
            </>
          ) : (
            <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-700">
              找不到剛才的訂單資料。訂單若已成功送出，仍會保存在店家的訂單表中。
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <Link href="/products" className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white">
              繼續選購
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
