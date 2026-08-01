import { notFound } from "next/navigation";
import ActivitySelector from "@/components/ActivitySelector";
import { FloatingBackButton } from "@/components/BackButton";
import PromotionalActivitySelector from "@/components/PromotionalActivitySelector";
import QuantityDiscountActivitySelector from "@/components/QuantityDiscountActivitySelector";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductImage from "@/components/ProductImage";
import { getActivityById } from "@/lib/activities";
import { getActivityPriceText, isMixMatchActivity, isQuantityDiscountActivity } from "@/lib/activityPresentation";

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const activity = await getActivityById(decodeURIComponent(id));
  if (!activity) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <Header showBackButton backFallbackHref="/activities" />
      <FloatingBackButton fallbackHref="/activities" />
      <div className="mx-auto max-w-5xl px-4 py-7">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6 sm:pt-6">
            <ProductImage
              src={activity.imageUrl}
              alt={activity.name}
              fallbackLabel="活動圖片"
              className="h-44 w-full rounded-2xl sm:h-60"
            />
          </div>
          <div className="p-5 sm:p-6">
            <div className="text-sm font-black text-rose-600">限時活動</div>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">{activity.name}</h1>
            {activity.subtitle && (
              <p className="mt-2 text-base text-slate-500 sm:text-lg">
                {activity.subtitle}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-rose-50 px-4 py-2 font-black text-rose-600">
                {getActivityPriceText(activity)}
              </span>
              {(activity.startDate || activity.endDate) && (
                <span className="text-sm text-slate-500">
                  活動期間：
                  {activity.startDate
                    ? dateFormatter.format(new Date(activity.startDate))
                    : "現在"}
                  ～
                  {activity.endDate
                    ? dateFormatter.format(new Date(activity.endDate))
                    : "另行通知"}
                </span>
              )}
            </div>
            {activity.description && (
              <div className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">
                {activity.description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          {activity.status === "ended" ? (
            <div className="rounded-3xl bg-white p-8 text-center font-black text-slate-500">
              此活動已結束
            </div>
          ) : activity.status === "upcoming" ? (
            <div className="rounded-3xl bg-white p-8 text-center font-black text-amber-700">
              此活動尚未開始
            </div>
          ) : activity.products.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center font-black text-slate-500">
              此活動目前沒有可選商品
            </div>
          ) : isMixMatchActivity(activity) ? (
            <ActivitySelector activity={activity} editCartId={query.edit} />
          ) : isQuantityDiscountActivity(activity) ? (
            <QuantityDiscountActivitySelector
              activity={activity}
              editSelectionId={query.edit}
            />
          ) : (
            <PromotionalActivitySelector
              activity={activity}
              editSelectionId={query.edit}
            />
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
