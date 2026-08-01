完整整合版說明

此壓縮檔不是局部更新檔，而是可直接覆蓋／取代原專案的完整程式碼。
已整合：
1. Promotion Engine v2
2. 首頁限時優惠
3. 商品限時優惠與副標題
4. 首頁捷徑與分類／購物車導覽更新
5. 首頁 Banner 串接 Google Sheets HomepageBanners

使用方式：
1. 備份原本 pinru-shop 資料夾。
2. 解壓縮本檔案。
3. 確認 .env.local 內 Apps Script API 網址正確。
4. 執行 npm install（若 node_modules 已存在可略過）。
5. 執行 npm run dev。

檢查結果：TypeScript `tsc --noEmit` 已通過。
