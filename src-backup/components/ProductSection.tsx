import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";

type ProductSectionProps = {
  title: string;
  icon: string;
  products: Product[];
};

export default function ProductSection({
  title,
  icon,
  products,
}: ProductSectionProps) {
  return (
    <section id={title} className="scroll-mt-40 py-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black sm:text-2xl">
          <span className="mr-2">{icon}</span>
          {title}
        </h2>
        <a href="/products" className="text-sm font-bold text-emerald-700">
          查看全部 →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
