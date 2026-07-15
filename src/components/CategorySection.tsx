import Link from "next/link";

export default function CategorySection({
  categories,
}: {
  categories: string[];
}) {
  if (categories.length === 0) return null;

  return (
    <section id="全部分類" className="scroll-mt-40 py-7">
      <h2 className="mb-4 text-xl font-black">📂 全部分類</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category}
            href={`/products?category=${encodeURIComponent(category)}`}
            className="rounded-2xl border bg-white p-4 text-center font-bold shadow-sm"
          >
            {category}
          </Link>
        ))}
      </div>
    </section>
  );
}
