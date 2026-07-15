import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { getPublishedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { q = "", category = "" } = await searchParams;
  const keyword = q.trim().toLowerCase();

  const products = (await getPublishedProducts()).filter((product) => {
    const matchesKeyword =
      !keyword ||
      [product.name, product.description, product.category, ...product.tags]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    const matchesCategory = !category || product.category === category;
    return matchesKeyword && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-black">全部商品</h1>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? `搜尋「${q}」，找到 ${products.length} 項商品`
              : `共 ${products.length} 項商品`}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            找不到商品，請確認 Google Sheets 的顯示狀態與欄位內容。
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
