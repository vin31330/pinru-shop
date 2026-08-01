"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { Activity } from "@/types/activity";
import { getActivityPriceText } from "@/lib/activityPresentation";
import { rememberReturnPosition } from "@/lib/returnPosition";

export default function ActivityCard({ activity, href }: { activity: Activity; href?: string }) {
  return (
    <Link
      href={href || `/activities/${encodeURIComponent(activity.id)}`}
      onClick={() =>
        rememberReturnPosition(
          href || `/activities/${encodeURIComponent(activity.id)}`,
        )
      }
      className="activity-card-v18 block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <ProductImage
        src={activity.imageUrl}
        alt={activity.name}
        fallbackLabel="活動圖片"
        className="aspect-square w-full sm:aspect-[16/7]"
      />
      <div className="min-w-0 flex-1 p-5">
        <div className="text-sm font-black text-rose-600">限時活動</div>
        <h3 className="mt-1 line-clamp-2 text-xl font-black leading-8">{activity.name}</h3>
        {activity.subtitle && <p className="mt-2 line-clamp-2 text-base leading-6 text-slate-600">{activity.subtitle}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0 text-2xl font-black leading-tight text-rose-600">
            {getActivityPriceText(activity)}
          </div>
          <span className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-base font-black leading-none text-white">立即參加</span>
        </div>
      </div>
    </Link>
  );
}
