# 買 A 送 B／加價購活動頁更新

## 新版操作流程

1. 選購指定商品
2. 選擇免費贈品或決定是否加價購
3. 確認購買內容與總金額
4. 加入購物車

## 本次修改

- 新增 `src/components/PromotionalActivitySelector.tsx`
- 更新 `src/app/activities/[id]/page.tsx`
- 更新 `src/lib/cart.ts`
- 贈品以 NT$0 加入購物車
- 加購品依 Activity Products 的「活動商品價格」計價
- 若沒有活動商品價格，改讀 Activities 的「優惠值」
- 購物車重新檢查時保留贈品與加購價格
- 主商品被移除後，贈品／加購品會被標示為無法結帳

## 表格角色文字

Activity Products 的「商品角色」請使用：

- 觸發商品
- 贈品商品
- 加購商品
