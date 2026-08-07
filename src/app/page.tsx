import ActivityCard from "@/components/ActivityCard";
import Banner from "@/components/Banner";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HomeShortcutNav from "@/components/HomeShortcutNav";
import ProductSection from "@/components/ProductSection";
import SectionHeading from "@/components/SectionHeading";
import { getPublishedActivities } from "@/lib/activities";
import { getPublishedCategories } from "@/lib/categories";
import { displayCategoryName } from "@/lib/categoryLabels";
import { getPublishedBanners } from "@/lib/banners";
import { getHomepageEntries } from "@/lib/homepage";
import { getPublishedProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { ProductCategory } from "@/types/product";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, activities, sheetCategories, banners, settings, homepageEntries] =
    await Promise.all([
      getPublishedProducts(),
      getPublishedActivities(),
      getPublishedCategories(),
      getPublishedBanners(),
      getSiteSettings(),
      getHomepageEntries(),
    ]);

  const productMap = new Map(products.map((product) => [product.id, product]));
  const activityMap = new Map(activities.map((activity) => [activity.id, activity]));

  const categories: ProductCategory[] =
    sheetCategories.length > 0
      ? sheetCategories
      : Array.from(new Set(products.map((product) => product.category).filter(Boolean))).map(
          (name, index) => ({ id: name, name: displayCategoryName(name), order: index + 1 }),
        );

  // 熱銷商品只由 HomepageSections 控制，依「排序」由小到大。
  // Products 已關閉或不存在時，該筆不顯示。
  const hot = homepageEntries
    .filter((entry) => entry.section === "熱銷" && entry.productId)
    .map((entry) => productMap.get(entry.productId))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  // 新品由 Products 自動判斷最近天數，並維持建立日期新到舊。
  const newProducts = products
    .filter((product) => product.isNew)
    .slice(0, settings.homeNewMax);

  // 首頁活動只由 HomepageSections 控制，不再退回顯示所有 Activities。
  // 因 activityMap 只包含目前啟用且日期有效的活動，所以 Activities 關閉後會立即消失。
  const homeActivities = homepageEntries
    .filter((entry) => entry.section === "活動" && entry.activityId)
    .map((entry) => activityMap.get(entry.activityId))
    .filter((activity): activity is NonNullable<typeof activity> => Boolean(activity));

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto max-w-7xl px-3 pb-10 sm:px-4">
        <HomeShortcutNav />
        <Banner banners={banners.slice(0, settings.homeBannerCount)} />

        {homeActivities.length > 0 && (
          <section id="優惠活動" className="home-section scroll-mt-32">
            <SectionHeading title="優惠活動" href="/activities" />
            <div className="home-activity-grid grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {homeActivities.slice(0, settings.homeActivityCount).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </section>
        )}

        <ProductSection
          title="熱銷商品"
          products={hot}
          large
          limit={settings.homeHotCount}
        />
        <ProductSection
          title="新品推薦"
          products={newProducts}
          limit={settings.homeNewCount}
        />
        <CategorySection
          categories={categories.slice(0, settings.homeCategoryCount)}
          viewAllHref="/products?view=all"
        />
      </div>
      <Footer />
    </main>
  );
}
