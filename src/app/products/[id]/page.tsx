import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartPanel from "@/components/AddToCartPanel";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getProductById } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const currency = new Intl.NumberFormat("zh-TW");

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Link href="/products" className="mb-5 inline-block font-bold text-emerald-700">
          ← 返回全部商品
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="grid aspect-square place-items-center rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 text-8xl shadow-sm">
              {product.imageEmoji}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <div
                  key={image}
                  className="grid aspect-square place-items-center rounded-xl border border-slate-200 bg-white text-center text-xs font-bold text-slate-500"
                >
                  {index === 0 ? product.imageEmoji : image}
                </div>
              ))}
            </div>

            {product.videos.length > 0 && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black">商品影片</h2>
                <div className="mt-3 grid min-h-44 place-items-center rounded-2xl bg-slate-900 text-center text-white">
                  ▶ {product.videos[0]}
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-5">
              <div className="mb-3 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl font-black">{product.name}</h1>
              <p className="mt-4 leading-7 text-slate-600">{product.description}</p>

              <div className="mt-5">
                {product.salePrice ? (
                  <>
                    <div className="text-sm text-slate-400 line-through">
                      原價 NT${currency.format(product.price)}
                    </div>
                    <div className="text-3xl font-black text-rose-600">
                      特價 NT${currency.format(product.salePrice)}
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-black text-emerald-700">
                    NT${currency.format(product.price)}
                  </div>
                )}
              </div>
            </div>

            <AddToCartPanel product={product} />
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
