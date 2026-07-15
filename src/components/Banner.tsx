export default function Banner() {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-500 p-6 text-white shadow-lg">
      <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
        本月精選
      </span>
      <h1 className="mt-4 text-3xl font-black">實用好物，線上慢慢挑</h1>
      <p className="mt-3 max-w-xl leading-7 text-emerald-50">
        看照片、影片與商品介紹，喜歡就加入購物車，再透過 LINE 官方帳號送出訂單。
      </p>
    </section>
  );
}
