import Banner from "@/components/Banner";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductSection from "@/components/ProductSection";
import { getPublishedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allProducts = await getPublishedProducts();
  const deals = allProducts.filter((product) => product.limitedOffer);
  const hot = allProducts.filter((product) => product.featured);
  const newProducts = allProducts.filter((product) => product.isNew);

  const categories = Array.from(
    new Set(allProducts.map((product) => product.category).filter(Boolean)),
  ).map((name, index) => ({
    id: `category-${index}`,
    name,
    emoji: ["🍳", "🥣", "🥤", "🔧", "🍴", "🏠"][index % 6],
  }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6">
        <Banner />
        <ProductSection title="限時優惠" icon="🔥" products={deals} />
        <ProductSection title="熱銷商品" icon="⭐" products={hot} />
        <ProductSection title="新品" icon="🆕" products={newProducts} />
        <CategorySection categories={categories} />
      </div>
      <Footer />
    </main>
  );
}
