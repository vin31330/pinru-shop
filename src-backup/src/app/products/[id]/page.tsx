import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartPanel from "@/components/AddToCartPanel";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductImage from "@/components/ProductImage";
import { getProductById } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const currency = new Intl.NumberFormat("zh-TW");

function youtubeEmbedUrl(url: string) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(decodeURIComponent(id));

  if (!product) notFound();

  const images = product.media.filter((item) => item.type === "image");
  const videos = product.media.filter((item) => item.type === "video");

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/products"
          className="mb-5 inline-block font-bold text-emerald-700"
        >
          ← 返回全部商品
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <ProductImage
              src={product.mainImage}
              alt={product.name}
              className="aspect-square w-full rounded-3xl shadow-sm"
            />

            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.slice(0, 8).map((image) => (
                  <ProductImage
                    key={image.id}
                    src={image.url}
                    alt={product.name}
                    className="aspect-square w-full rounded-xl border border-slate-200"
                  />
                ))}
              </div>
            )}

            {videos.length > 0 && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black">商品影片</h2>
                <div className="mt-3 space-y-4">
                  {videos.map((video) => {
                    const embed = youtubeEmbedUrl(video.url);
                    return embed ? (
                      <iframe
                        key={video.id}
                        src={embed}
                        title={`${product.name}商品影片`}
                        className="aspect-video w-full rounded-2xl"
                        allowFullScreen
                      />
                    ) : (
                      <a
                        key={video.id}
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl bg-slate-900 p-6 text-center font-bold text-white"
                      >
                        ▶ 開啟商品影片
                      </a>
                    );
                  })}
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
              <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
                {product.description || "商品詳細內容請洽 LINE 官方帳號。"}
              </p>

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
