import Link from "next/link";
import CategorySection from "@/components/CategorySection";
import FloatingHomeButton from "@/components/FloatingHomeButton";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MobileProductFlowScrollTop from "@/components/MobileProductFlowScrollTop";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { getPublishedCategories } from "@/lib/categories";
import { categoryNameAliases, displayCategoryName } from "@/lib/categoryLabels";
import { getPublishedProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    section?: string;
    page?: string;
    view?: string;
    returnTo?: string;
  }>;
};

function pageHref({
  q,
  category,
  section,
  page,
  view,
}: {
  q: string;
  category: string;
  section: string;
  page: number;
  view?: string;
}): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (section) params.set("section", section);
  if (view) params.set("view", view);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}


function safeInternalReturnHref(value: string): string | undefined {
  const href = value.trim();
  if (!href || !href.startsWith("/") || href.startsWith("//")) return undefined;
  return href;
}

function visiblePageNumbers(totalPages: number, currentPage: number): Array<number | "…"> {
  if (totalPages <= 12) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, 2, totalPages - 1, totalPages]);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= totalPages) pages.add(page);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous && page - previous > 1) result.push("…");
    result.push(page);
  });
  return result;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q = "", category = "", section = "", page = "1", view = "", returnTo = "" } = await searchParams;
  const exactReturnHref = safeInternalReturnHref(returnTo);
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
          (name, index) => ({ id: name, name: displayCategoryName(name), order: index + 1 }),
        );

  const selectedCategory = categories.find(
    (item) => item.id === category || item.name === category || categoryNameAliases(item.name).includes(category),
  );
  const selectedCategoryAliases = new Set([
    category,
    ...(selectedCategory ? [selectedCategory.id, selectedCategory.name] : []),
    ...categoryNameAliases(selectedCategory?.name || category),
  ].filter(Boolean));

  const filteredProducts = allProducts.filter((product) => {
    const searchable = [
      product.name,
      product.description,
      product.category,
      displayCategoryName(product.category),
      ...product.tags,
    ]
      .join(" ")
      .toLowerCase();
    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesCategory =
      !category ||
      selectedCategoryAliases.has(product.category) ||
      categoryNameAliases(product.category).some((name) => selectedCategoryAliases.has(name));
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
            ? (selectedCategory?.name ?? displayCategoryName(category))
            : "全部商品";

  const isProductCategoryFlow = !q && !section;
  const mobileShowsBackButton = isProductCategoryFlow && (Boolean(category) || view === "all");
  const mobileCategoriesFirst = isProductCategoryFlow && !category && view !== "all";
  const mobileCategoriesLast = isProductCategoryFlow && !mobileCategoriesFirst;
  const desktopCategoriesFirst = isProductCategoryFlow && view !== "all";

  return (
    <main className="min-h-screen bg-white">
      {isProductCategoryFlow && (
        <MobileProductFlowScrollTop
          navigationKey={`${category}|${view}|${currentPage}`}
        />
      )}
      <Header
        showHomeButton={!mobileShowsBackButton}
        mobileBackButton={mobileShowsBackButton}
        backFallbackHref={exactReturnHref ?? "/products"}
        backLabel="回到上一頁"
        backForceFallback={Boolean(exactReturnHref)}
      />
      <FloatingHomeButton />
      <div className="mx-auto max-w-7xl px-4 pb-7 pt-3 md:py-7">
        {isProductCategoryFlow && (
          <>
            {desktopCategoriesFirst && (
              <div className="hidden md:block">
                <CategorySection
                  categories={categories}
                  sectionId="商品分類-桌面"
                />
              </div>
            )}
            {mobileCategoriesFirst && (
              <div className="md:hidden">
                <CategorySection
                  categories={categories}
                  sectionId="商品分類"
                  viewAllHref="/products?view=all"
                />
              </div>
            )}
          </>
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
            <nav className="mt-8" aria-label="商品分頁">
              <div className="mb-3 text-center text-sm font-bold text-slate-500">
                第 {currentPage} / {totalPages} 頁・可直接點選頁碼
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={pageHref({ q, category, section, page: currentPage - 1, view })}
                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-black text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                  >
                    上一頁
                  </Link>
                ) : (
                  <span className="min-h-11 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-black text-slate-400">
                    上一頁
                  </span>
                )}

                {visiblePageNumbers(totalPages, currentPage).map((pageNumber, index) =>
                  pageNumber === "…" ? (
                    <span key={`ellipsis-${index}`} className="grid h-11 min-w-7 place-items-center font-black text-slate-400">
                      …
                    </span>
                  ) : (
                    <Link
                      key={pageNumber}
                      href={pageHref({ q, category, section, page: pageNumber, view })}
                      aria-current={pageNumber === currentPage ? "page" : undefined}
                      className={`grid h-11 min-w-11 place-items-center rounded-xl border px-3 font-black transition ${
                        pageNumber === currentPage
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  ),
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={pageHref({ q, category, section, page: currentPage + 1, view })}
                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-black text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                  >
                    下一頁
                  </Link>
                ) : (
                  <span className="min-h-11 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-black text-slate-400">
                    下一頁
                  </span>
                )}
              </div>
            </nav>
          )}
        </section>

        {mobileCategoriesLast && (
          <div className="md:hidden">
            <CategorySection
              categories={categories}
              sectionId="商品分類-下方"
              viewAllHref="/products?view=all"
            />
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
