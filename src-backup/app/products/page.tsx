import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { getPublishedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { q = "", category = "" } = await searchParams;

  const keyword = q.trim().toLowerCase();
  const selectedCategory = category.trim();

  const allProducts = await getPublishedProducts();

  const products = allProducts.filter((product) => {
    const searchableText = [
      product.name,
      product.description,
      product.category,
      ...product.tags,
    ]
      .join(" ")
      .toLowerCase();

    const matchesKeyword =
      keyword === "" || searchableText.includes(keyword);

    const matchesCategory =
      selectedCategory === "" ||
      product.category === selectedCategory;

    return matchesKeyword && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-black">全部商品</h1>

          <p className="mt-1 text-sm text-slate-500">
            {keyword
              ? `搜尋「${q}」，找到 ${products.length} 項商品`
              : selectedCategory
                ? `${selectedCategory}，共 ${products.length} 項商品`
                : `共 ${products.length} 項商品`}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🔍</div>

            <div className="mt-4 font-bold">
              找不到符合的商品
            </div>

            <p className="mt-2 text-sm text-slate-500">
              請嘗試更換搜尋文字或商品分類。
            </p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}