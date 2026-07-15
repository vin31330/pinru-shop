type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  emoji: string;
};

type ProductSectionProps = {
  title: string;
  icon: string;
  products: Product[];
  showSalePrice?: boolean;
};

const currency = new Intl.NumberFormat("zh-TW");

export default function ProductSection({
  title,
  icon,
  products,
  showSalePrice = false,
}: ProductSectionProps) {
  return (
    <section id={title} className="scroll-mt-40 py-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black sm:text-2xl">
          <span className="mr-2">{icon}</span>
          {title}
        </h2>
        <button className="text-sm font-bold text-emerald-700">查看全部 →</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const activePrice =
            showSalePrice && product.salePrice ? product.salePrice : product.price;

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="grid aspect-square place-items-center bg-gradient-to-br from-amber-50 to-orange-100 text-6xl">
                {product.emoji}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 min-h-12 font-bold leading-6">
                  {product.name}
                </h3>

                {showSalePrice && product.salePrice ? (
                  <div className="mt-2">
                    <div className="text-xs text-slate-400 line-through">
                      NT${currency.format(product.price)}
                    </div>
                    <div className="text-lg font-black text-rose-600">
                      NT${currency.format(activePrice)}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-lg font-black text-emerald-700">
                    NT${currency.format(activePrice)}
                  </div>
                )}

                <button className="mt-3 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white">
                  加入購物車
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
