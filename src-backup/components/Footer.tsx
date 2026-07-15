export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-center sm:px-6">
        <div className="text-lg font-black text-emerald-700">品儒生活館</div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          商品資訊以網站與 LINE 官方帳號確認為準。
        </p>
        <button className="mt-4 rounded-2xl bg-[#06C755] px-5 py-3 font-bold text-white">
          聯繫 LINE 官方帳號
        </button>
        <div className="mt-5 text-xs text-slate-400">
          © 2026 品儒生活館
        </div>
      </div>
    </footer>
  );
}
