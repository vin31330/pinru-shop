import type { Metadata } from "next";
import ActivityCard from "@/components/ActivityCard";
import FloatingHomeButton from "@/components/FloatingHomeButton";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getPublishedActivities } from "@/lib/activities";
import { absoluteShareImage, SITE_NAME, cleanDescription } from "@/lib/shareMetadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const activities = await getPublishedActivities({ includeUpcoming: true });
  const firstActivity = activities[0];
  const title = "優惠活動";
  const description = "看看目前的優惠活動，挑選適合您的活動組合。";
  const image = firstActivity?.imageUrl;

  return {
    title,
    description: cleanDescription(description),
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: "https://pinru-shop.netlify.app/activities",
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteShareImage(image), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteShareImage(image)],
    },
  };
}

export default async function ActivitiesPage() {
  const activities = await getPublishedActivities({ includeUpcoming: true });
  return (
    <main className="min-h-screen bg-slate-50">
      <Header showHomeButton />
      <FloatingHomeButton />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-3 md:py-8">
        <h1 className="text-3xl font-black">優惠活動</h1>
        <p className="mt-2 text-slate-500">挑選喜歡的商品，組成活動優惠組合。</p>
        {activities.length === 0 ? (
          <div className="mt-7 rounded-3xl bg-white p-10 text-center text-slate-500">目前沒有公開中的活動。</div>
        ) : (
          <div className="activity-list-grid mt-7 grid grid-cols-2 gap-3 sm:gap-5">{activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div>
        )}
      </div>
      <Footer />
    </main>
  );
}
