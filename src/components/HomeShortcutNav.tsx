import Link from "next/link";

const shortcuts = [
  {
    href: "/activities",
    title: "優惠活動",
    subtitle: "超值優惠・限時搶購",
    icon: "🎁",
    className: "shortcut-card--activity",
  },
  {
    href: "/products?section=hot",
    title: "熱銷商品",
    subtitle: "人氣熱銷・必買推薦",
    icon: "🔥",
    className: "shortcut-card--hot",
  },
  {
    href: "/products?section=new",
    title: "新品推薦",
    subtitle: "新品上架・最新精選",
    icon: "NEW",
    className: "shortcut-card--new",
  },
  {
    href: "/products",
    title: "商品分類",
    subtitle: "全部分類・快速選購",
    icon: "grid",
    className: "shortcut-card--category",
  },
] as const;

function GridIcon() {
  return (
    <span className="shortcut-grid-icon" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export default function HomeShortcutNav() {
  return (
    <nav aria-label="首頁快速導覽" className="grid grid-cols-2 gap-3 py-4 sm:py-5 lg:grid-cols-4">
      {shortcuts.map((shortcut) => (
        <Link
          key={shortcut.title}
          href={shortcut.href}
          className={`shortcut-card ${shortcut.className}`}
        >
          <span className="shortcut-card-icon" aria-hidden="true">
            {shortcut.icon === "grid" ? (
              <GridIcon />
            ) : shortcut.icon === "NEW" ? (
              <span className="shortcut-new-badge">NEW</span>
            ) : (
              shortcut.icon
            )}
          </span>
          <span className="min-w-0 flex-1">
            <strong>{shortcut.title}</strong>
            <small>{shortcut.subtitle}</small>
          </span>
          <span className="shortcut-card-arrow" aria-hidden="true">›</span>
        </Link>
      ))}
    </nav>
  );
}
