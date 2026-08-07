import Image from "next/image";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { ProductCategory } from "@/types/product";

type FallbackKind = "bottle" | "lunchbox" | "cleaning" | "utensils" | "care" | "pan" | "basket" | "knife" | "box";

function fallbackKind(name: string): FallbackKind {
  if (/便當|保鮮|餐盒|收納盒|手提袋|保溫袋/.test(name)) return "lunchbox";
  if (/保溫|水壺|玻璃|咖啡|杯|瓶/.test(name)) return "bottle";
  if (/清潔|洗衣|掃除|刷/.test(name)) return "cleaning";
  if (/廚房|餐具|器具/.test(name)) return "utensils";
  if (/按摩|保健|個人|美容|保養|香水/.test(name)) return "care";
  if (/鍋|炒鍋|湯鍋|平底/.test(name)) return "pan";
  if (/生活|雜貨|小物|收納/.test(name)) return "basket";
  if (/瓦斯|爐|刀|砧板/.test(name)) return "knife";
  return "box";
}

function CoffeeCupIcon() {
  return (
    <span className="relative grid h-full w-full place-items-center" aria-hidden="true">
      <span className="text-4xl leading-none">☕</span>
    </span>
  );
}

function CleaningSpongeIcon() {
  return (
    <span className="relative grid h-full w-full place-items-center" aria-hidden="true">
      <span className="text-4xl leading-none">🧽</span>
      <span className="absolute right-1 top-1 text-lg leading-none">🫧</span>
    </span>
  );
}

function CuteFallbackIcon({ name }: { name: string }) {
  const kind = fallbackKind(name);
  const symbols: Record<FallbackKind, string> = {
    bottle: "🧃",
    lunchbox: "🍱",
    cleaning: "🧴",
    utensils: "🍴",
    care: "🧴",
    pan: "🍳",
    basket: "🧺",
    knife: "🔪",
    box: "📦",
  };

  return <span className={`category-fallback category-fallback--${kind}`}>{symbols[kind]}</span>;
}

export default function CategorySection({
  categories,
  showHeading = true,
  className = "",
  sectionId = "商品分類",
  viewAllHref = "/products",
}: {
  categories: ProductCategory[];
  showHeading?: boolean;
  className?: string;
  sectionId?: string;
  viewAllHref?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section
      id={sectionId}
      className={`home-section scroll-mt-32 border-t border-slate-200 ${className}`.trim()}
    >
      {showHeading && <SectionHeading title="商品分類" href={viewAllHref} />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.href || `/products?category=${encodeURIComponent(category.id)}`}
            className="category-tile group"
          >
            <span className="category-tile-icon" aria-hidden="true">
              {/便當|保鮮|餐盒|收納盒|手提袋|保溫袋/.test(category.name) ? (
                category.icon ? (
                  <Image
                    src={category.icon}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <CuteFallbackIcon name={category.name} />
                )
              ) : /保溫|水壺|玻璃|咖啡|杯|瓶/.test(category.name) ? (
                <CoffeeCupIcon />
              ) : /清潔用品/.test(category.name) ? (
                <CleaningSpongeIcon />
              ) : category.icon ? (
                <Image
                  src={category.icon}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              ) : (
                <CuteFallbackIcon name={category.name} />
              )}
            </span>
            <span className="category-tile-name">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
