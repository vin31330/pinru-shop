import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { Product } from "@/types/product";

export default function ProductSection({
  title,
  products,
  large = false,
  limit = 5,
  productHrefs,
}: {
  title: "熱銷商品" | "新品推薦" | "限時優惠";
  products: Product[];
  large?: boolean;
  limit?: number;
  productHrefs?: Map<string, string>;
}) {
  if (products.length === 0) return null;

  return (
    <section id={title} className="home-section scroll-mt-32 border-t border-slate-200">
      <SectionHeading
        title={title}
        href={
          title === "新品推薦"
            ? "/products?section=new"
            : title === "限時優惠"
              ? "/products?section=offer"
              : "/products?section=hot"
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {products.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} large={large} href={productHrefs?.get(product.id)} />
        ))}
      </div>
      <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:hidden">
        {products.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} large={large} href={productHrefs?.get(product.id)} />
        ))}
      </div>
      <div className="hidden gap-4 lg:grid lg:grid-cols-5">
        {products.slice(0, limit).map((product) => (
          <ProductCard key={product.id} product={product} large={large} href={productHrefs?.get(product.id)} />
        ))}
      </div>
    </section>
  );
}
