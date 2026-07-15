import Banner from "@/components/Banner";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductSection from "@/components/ProductSection";
import { getPublishedProducts } from "@/lib/products";

const categories = [
  { id: "cat-1", name: "鍋具", emoji: "🍳" },
  { id: "cat-2", name: "保鮮盒", emoji: "🥣" },
  { id: "cat-3", name: "保溫杯", emoji: "🥤" },
  { id: "cat-4", name: "五金用品", emoji: "🔧" },
  { id: "cat-5", name: "廚房用品", emoji: "🍴" },
  { id: "cat-6", name: "居家用品", emoji: "🏠" },
];

export default function Home() {
  const allProducts = getPublishedProducts();
  const deals = allProducts.filter((product) => product.limitedOffer);
  const hot = allProducts.filter((product) => product.featured);
  const newProducts = allProducts.filter((product) => product.isNew);

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
