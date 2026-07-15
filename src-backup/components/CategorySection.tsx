type Category = {
  id: string;
  name: string;
  emoji: string;
};

export default function CategorySection({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <section id="全部分類" className="scroll-mt-40 py-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black sm:text-2xl">📂 全部分類</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {categories.map((category) => (
          <button
            key={category.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <div className="text-4xl">{category.emoji}</div>
            <div className="mt-2 text-sm font-bold">{category.name}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
