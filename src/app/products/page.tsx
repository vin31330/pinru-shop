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
    const searchable = [
      product.name,
      product.description,
      product.category,
      ...product.tags,
    ]
      .join(" ")
      .toLowerCase();

    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesCategory = !category || product.category === category;

    return matchesKeyword && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-7">
        <h1 className="text-2xl font-black">全部商品</h1>
        <p className="mt-1 text-sm text-slate-500">
          共 {products.length} 項商品
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
