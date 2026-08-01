# 首頁活動串接修正版

## 本次調整

- HomepageSections 改用正式九欄結構：首頁項目ID、區塊、排序、商品ID、活動ID、顯示狀態、開始日期、結束日期、備註。
- 移除網站對「內容類型、分類ID、連結網址」舊欄位的依賴。
- 首頁活動只讀取 HomepageSections 中「區塊 = 活動」的資料。
- 首頁活動不再於 HomepageSections 沒有有效資料時，自動顯示全部 Activities。
- Activities 顯示狀態關閉或活動日期失效時，首頁不顯示該活動。
- HomepageSections 顯示狀態關閉或日期失效時，首頁不顯示該活動。
- 熱銷商品只讀取 HomepageSections 中「區塊 = 熱銷」的資料並依排序顯示。
- 新品仍由 Products 自動判斷，分類仍由 Categories 管理。

## 驗證

- TypeScript `tsc --noEmit` 已通過。
- 此執行環境缺少 Next.js Linux SWC 套件，無法完成 `next build`；Windows 本機執行 `npm run build` 可進行完整建置驗證。
