import Link from "next/link";
import CategorySection from "@/components/CategorySection";
import FloatingHomeButton from "@/components/FloatingHomeButton";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { getPublishedCategories } from "@/lib/categories";
import { getPublishedProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    section?: string;
    page?: string;
  }>;
};

function pageHref({
  q,
  category,
  section,
  page,
}: {
  q: string;
  category: string;
  section: string;
  page: number;
}): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (section) params.set("section", section);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q = "", category = "", section = "", page = "1" } = await searchParams;
  const keyword = q.trim().toLowerCase();
  const [allProducts, sheetCategories, settings] = await Promise.all([
    getPublishedProducts(),
    getPublishedCategories(),
    getSiteSettings(),
  ]);

  const categories =
    sheetCategories.length > 0
      ? sheetCategories
      : Array.from(new Set(allProducts.map((product) => product.category).filter(Boolean))).map(
          (name, index) => ({ id: name, name, order: index + 1 }),
        );

  const filteredProducts = allProducts.filter((product) => {
    const searchable = [product.name, product.description, product.category, ...product.tags]
      .join(" ")
      .toLowerCase();
    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesCategory =
      !category ||
      product.category === category ||
      categories.find((item) => item.id === category)?.name === product.category;
    const matchesSection =
      section === "hot"
        ? product.featured
        : section === "new"
          ? product.isNew
          : section === "offer"
            ? product.limitedOffer && product.offerActive
            : true;
    return matchesKeyword && matchesCategory && matchesSection;
  });

  const orderedProducts =
    section === "hot"
      ? [...filteredProducts].sort(
          (a, b) =>
            (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999) ||
            a.id.localeCompare(b.id, "zh-Hant", { numeric: true }),
        )
      : section === "new"
        ? filteredProducts.slice(0, settings.homeNewMax)
        : filteredProducts;

  const pageSize = keyword ? settings.searchPageSize : settings.productPageSize;
  const requestedPage = Math.max(1, Math.floor(Number(page)) || 1);
  const totalPages = Math.max(1, Math.ceil(orderedProducts.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const products = orderedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pageTitle =
    section === "hot"
      ? "熱銷商品"
      : section === "new"
        ? "新品推薦"
        : section === "offer"
          ? "限時優惠"
          : category
            ? (categories.find((item) => item.id === category)?.name ?? category)
            : "全部商品";

  return (
    <main className="min-h-screen bg-white">
      <Header showHomeButton />
      <FloatingHomeButton />
      <div className="mx-auto max-w-7xl px-4 pb-7 pt-3 md:py-7">
        {!q && !section && (
          <CategorySection
            categories={categories}
            sectionId="商品分類"
          />
        )}
        <section className="pt-2">
          {pageTitle === "熱銷商品" || pageTitle === "新品推薦" || pageTitle === "限時優惠" ? (
            <SectionHeading title={pageTitle} />
          ) : (
            <div className="mb-5">
              <h1 className="text-2xl font-black">{pageTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">共 {orderedProducts.length} 項商品</p>
            </div>
          )}

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center font-bold text-slate-500">
              目前沒有符合條件的商品
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-3" aria-label="商品分頁">
              {currentPage > 1 ? (
                <Link
                  href={pageHref({ q, category, section, page: currentPage - 1 })}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-black text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                >
                  上一頁
                </Link>
              ) : (
                <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 font-black text-slate-400">
                  上一頁
                </span>
              )}
              <span className="font-black text-slate-700">
                第 {currentPage} / {totalPages} 頁
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={pageHref({ q, category, section, page: currentPage + 1 })}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-black text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                >
                  下一頁
                </Link>
              ) : (
                <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 font-black text-slate-400">
                  下一頁
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}
