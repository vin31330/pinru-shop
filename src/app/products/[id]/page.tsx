import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartPanel from "@/components/AddToCartPanel";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductGallery from "@/components/ProductGallery";
import { getProductById } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const currency = new Intl.NumberFormat("zh-TW");

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(decodeURIComponent(id));

  if (!product) {
    notFound();
  }

  const media = Array.isArray(product.media)
    ? product.media
    : [];

  const tags = Array.isArray(product.tags)
    ? product.tags
    : [];

  const options = Array.isArray(product.options)
    ? product.options
    : [];

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/products"
          className="font-bold text-emerald-700"
        >
          ← 返回全部商品
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ProductGallery
            productName={product.name}
            mainImage={product.mainImage}
            media={media}
          />

          <section>
            {tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-black">
              {product.name}
            </h1>

            <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
              {product.description ||
                "商品詳細內容請洽 LINE 官方帳號。"}
            </p>

            <div className="my-5">
              {product.salePrice ? (
                <>
                  <div className="text-sm text-slate-400 line-through">
                    原價 NT${currency.format(product.price)}
                  </div>

                  <div className="text-3xl font-black text-rose-600">
                    特價 NT$
                    {currency.format(product.salePrice)}
                  </div>
                </>
              ) : (
                <div className="text-3xl font-black text-emerald-700">
                  NT${currency.format(product.price)}
                </div>
              )}
            </div>

            <AddToCartPanel
              product={{
                ...product,
                media,
                tags,
                options,
              }}
            />
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
