import { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "P001",
    name: "鈦合金炒鍋",
    description:
      "輕量好拿、導熱快速，適合日常煎炒。實際商品內容與規格以 LINE 官方帳號確認為準。",
    category: "鍋具",
    tags: ["限時優惠", "熱銷"],
    price: 3980,
    salePrice: 2990,
    imageEmoji: "🍳",
    images: ["主圖", "側面", "鍋底", "使用示意"],
    videos: ["商品介紹影片"],
    options: [
      { name: "尺寸", values: ["32cm", "36cm", "40cm"] },
      { name: "顏色", values: ["黑色", "銀色"] },
    ],
    published: true,
    featured: true,
    limitedOffer: true,
  },
  {
    id: "P002",
    name: "備長炭湯鍋",
    description:
      "適合燉湯、煮麵與家庭料理，鍋身容量充足，日常使用方便。",
    category: "鍋具",
    tags: ["熱銷"],
    price: 2680,
    imageEmoji: "🍲",
    images: ["主圖", "鍋蓋", "內鍋"],
    videos: ["商品操作影片"],
    options: [{ name: "尺寸", values: ["24cm", "28cm", "32cm"] }],
    published: true,
    featured: true,
  },
  {
    id: "P003",
    name: "耐熱玻璃保鮮盒",
    description:
      "透明盒身方便辨識內容物，可用於日常分裝與冰箱收納。",
    category: "保鮮盒",
    tags: ["新品"],
    price: 720,
    imageEmoji: "🥣",
    images: ["主圖", "盒蓋", "堆疊示意"],
    videos: [],
    options: [{ name: "容量", values: ["小", "中", "大"] }],
    published: true,
    isNew: true,
  },
  {
    id: "P004",
    name: "真空保溫杯",
    description:
      "適合日常外出使用，杯身簡潔，方便攜帶。",
    category: "保溫杯",
    tags: ["新品", "限時優惠"],
    price: 790,
    salePrice: 590,
    imageEmoji: "🥤",
    images: ["主圖", "杯蓋", "顏色展示"],
    videos: ["保溫效果介紹"],
    options: [
      { name: "容量", values: ["500ml", "750ml"] },
      { name: "顏色", values: ["黑色", "白色", "粉色"] },
    ],
    published: true,
    isNew: true,
    limitedOffer: true,
  },
  {
    id: "P005",
    name: "多功能料理夾",
    description:
      "夾取、翻面與分菜都方便，適合居家料理使用。",
    category: "廚房用品",
    tags: ["熱銷"],
    price: 250,
    imageEmoji: "🥢",
    images: ["主圖", "握把", "夾頭"],
    videos: [],
    options: [],
    published: true,
    featured: true,
  },
  {
    id: "P006",
    name: "廚房收納架",
    description:
      "協助整理鍋蓋、砧板與常用廚房用品，讓檯面更整齊。",
    category: "居家用品",
    tags: ["新品"],
    price: 980,
    imageEmoji: "🏠",
    images: ["主圖", "側面", "收納示意"],
    videos: [],
    options: [{ name: "顏色", values: ["白色", "黑色"] }],
    published: true,
    isNew: true,
  },
];

export function getPublishedProducts() {
  return products.filter((product) => product.published);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id && product.published);
}
