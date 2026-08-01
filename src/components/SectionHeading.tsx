import Link from "next/link";

const sectionIcons = {
  優惠活動: { symbol: "🎁", label: "優惠活動" },
  熱銷商品: { symbol: "🔥", label: "熱銷商品" },
  新品推薦: { symbol: "NEW", label: "新品推薦" },
  限時優惠: { symbol: "⏰", label: "限時優惠" },
  商品分類: { symbol: "grid", label: "商品分類" },
} as const;

type SectionTitle = keyof typeof sectionIcons;

function FourGridIcon() {
  return (
    <span className="section-four-grid" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export default function SectionHeading({ title, href }: { title: SectionTitle; href?: string }) {
  const icon = sectionIcons[title];
  const linkLabel = title === "商品分類" ? "查看全部商品" : "查看更多";

  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-2xl font-black text-slate-900 sm:gap-3">
        <span aria-hidden="true" className={`section-heading-icon section-heading-icon--${title}`}>
          {icon.symbol === "grid" ? <FourGridIcon /> : icon.symbol}
        </span>
        {icon.label}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-emerald-50 px-3 text-base font-black text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-900"
        >
          {linkLabel} ›
        </Link>
      )}
    </div>
  );
}
