export default function Banner() {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-6 text-white shadow-lg sm:p-10">
      <div className="max-w-xl">
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
          本月精選
        </span>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
          實用好物，線上慢慢挑
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50 sm:text-base">
          商品照片、介紹影片與完整規格一次看清楚，喜歡就加入購物車，再透過 LINE 官方帳號送出訂單。
        </p>
        <a
          href="#限時優惠"
          className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 font-bold text-emerald-700 shadow-sm"
        >
          查看限時優惠
        </a>
      </div>
    </section>
  );
}
