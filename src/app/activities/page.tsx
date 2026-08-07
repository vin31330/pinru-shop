import ActivityCard from "@/components/ActivityCard";
import FloatingHomeButton from "@/components/FloatingHomeButton";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getPublishedActivities } from "@/lib/activities";

export const revalidate = 60;

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
