import Banner from "@/components/Banner";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductSection from "@/components/ProductSection";

const dealProducts = [
  { id: "deal-1", name: "鈦合金炒鍋", price: 3980, salePrice: 2990, emoji: "🍳" },
  { id: "deal-2", name: "保鮮盒組", price: 890, salePrice: 690, emoji: "🥣" },
  { id: "deal-3", name: "不鏽鋼湯鍋", price: 1680, salePrice: 1380, emoji: "🍲" },
  { id: "deal-4", name: "真空保溫杯", price: 790, salePrice: 590, emoji: "🥤" },
];

const hotProducts = [
  { id: "hot-1", name: "備長炭炒鍋", price: 3680, emoji: "🔥" },
  { id: "hot-2", name: "多功能料理鍋", price: 2580, emoji: "⭐" },
  { id: "hot-3", name: "密封保鮮盒", price: 590, emoji: "💛" },
  { id: "hot-4", name: "陶瓷保溫杯", price: 680, emoji: "☕" },
];

const newProducts = [
  { id: "new-1", name: "輕量平底鍋", price: 1880, emoji: "🆕" },
  { id: "new-2", name: "廚房收納架", price: 980, emoji: "🏠" },
  { id: "new-3", name: "耐熱玻璃盒", price: 720, emoji: "✨" },
  { id: "new-4", name: "多用途料理夾", price: 250, emoji: "🥢" },
];

const categories = [
  { id: "cat-1", name: "鍋具", emoji: "🍳" },
  { id: "cat-2", name: "保鮮盒", emoji: "🥣" },
  { id: "cat-3", name: "保溫杯", emoji: "🥤" },
  { id: "cat-4", name: "五金用品", emoji: "🔧" },
  { id: "cat-5", name: "廚房用品", emoji: "🍴" },
  { id: "cat-6", name: "居家用品", emoji: "🏠" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6">
        <Banner />
        <ProductSection
          title="限時優惠"
          icon="🔥"
          products={dealProducts}
          showSalePrice
        />
        <ProductSection title="熱銷商品" icon="⭐" products={hotProducts} />
        <ProductSection title="新品" icon="🆕" products={newProducts} />
        <CategorySection categories={categories} />
      </div>
      <Footer />
    </main>
  );
}
