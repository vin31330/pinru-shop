import assert from "node:assert/strict";
import {
  buildDefaultProductPurchase,
  getPurchasablePriceCandidates,
  resolveProductPrice,
} from "../src/lib/pricingEngine.ts";
import { applyPromotionDiscount } from "../src/lib/promotionEngine.ts";

function product(overrides = {}) {
  return {
    id: "P-001",
    name: "測試商品",
    description: "",
    category: "",
    tags: [],
    price: 100,
    basePrice: 100,
    media: [],
    options: [],
    pricingPlans: [],
    published: true,
    ...overrides,
  };
}

const regular = buildDefaultProductPurchase(product());
assert.equal(regular.price, 100, "單一售價");
assert.equal(regular.originalPrice, 100, "單一售價原價");

const sale = buildDefaultProductPurchase(product({ price: 80, salePrice: 80 }));
assert.equal(sale.price, 80, "長期／有效特價");
assert.equal(sale.originalPrice, 100, "特價保留原價");

const bundlePlan = {
  id: "PLAN-2",
  name: "兩件優惠",
  quantity: 2,
  price: 180,
  isDefault: true,
  selectOptionsPerItem: true,
  order: 1,
  optionPrices: [],
};
assert.deepEqual(
  getPurchasablePriceCandidates(50, 40, [bundlePlan]),
  [180],
  "有方案時不混入無法選購的 Products 基本價或特價",
);

const sizedPlan = {
  ...bundlePlan,
  id: "PLAN-SIZE",
  name: "尺寸方案",
  price: 150,
  optionPrices: [
    { id: "SIZE-M", groupName: "尺寸", optionValue: "中", price: 200, order: 1 },
    { id: "SIZE-L", groupName: "尺寸", optionValue: "大", price: 250, order: 2 },
  ],
};
assert.deepEqual(
  getPurchasablePriceCandidates(100, 0, [sizedPlan]),
  [200, 250],
  "有價格規格時只採真正可選價格",
);

const sizedProduct = product({
  price: 200,
  options: [
    { name: "尺寸", values: ["中", "大"] },
    { name: "顏色", values: ["紅", "藍"] },
  ],
  pricingPlans: [sizedPlan],
});
const defaultSized = buildDefaultProductPurchase(sizedProduct);
assert.equal(defaultSized.price, 200, "預設價格規格");
assert.equal(defaultSized.selectedOptions["方案ID"], "PLAN-SIZE", "保存穩定方案ID");
assert.equal(defaultSized.selectedOptions["第1件-顏色"], "紅", "第一件規格");
assert.equal(defaultSized.selectedOptions["第2件-顏色"], "紅", "第二件規格");

const renamedProduct = product({
  pricingPlans: [{ ...bundlePlan, name: "兩件新版名稱", price: 175 }],
});
const renamedResolution = resolveProductPrice(renamedProduct, {
  方案ID: "PLAN-2",
  購買方案: "兩件舊名稱",
  每組件數: "2",
});
assert.equal(renamedResolution.ok, true, "方案名稱更新後以方案ID重新驗價");
if (renamedResolution.ok) assert.equal(renamedResolution.price, 175);

const invalidPriceOption = resolveProductPrice(sizedProduct, {
  方案ID: "PLAN-SIZE",
  購買方案: "尺寸方案",
  每組件數: "2",
  尺寸: "已刪除尺寸",
  "第1件-顏色": "紅",
  "第2件-顏色": "紅",
});
assert.equal(invalidPriceOption.ok, false, "失效價格規格不可結帳");

assert.equal(applyPromotionDiscount(100, "百分比折扣", 50), 50, "第二件半價");
assert.equal(applyPromotionDiscount(100, "百分比折扣", 90), 10, "第二件一折");
assert.equal(applyPromotionDiscount(100, "固定價格", 39), 39, "固定優惠價");
assert.equal(applyPromotionDiscount(100, "現折金額", 30), 70, "現折金額");
assert.equal(applyPromotionDiscount(100, "免費", 0), 0, "贈品免費");

console.log("V22 Pricing Engine v2：全部價格情境測試通過");
