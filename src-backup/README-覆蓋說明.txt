品儒生活館 V0.4 Google Sheets 串接

本版讀取：
- products
- product Media
- Product Options

操作：
1. 在目前 npm run dev 的 Terminal 按 Ctrl + C。
2. 解壓縮本檔案。
3. 將解壓縮後的 src 資料夾覆蓋到：
   C:\網站專案\pinru-shop\src
4. 將 .env.local.example 複製到專案根目錄，並重新命名成：
   .env.local
5. 執行：
   npm run dev
6. 開啟：
   http://localhost:3000

測試：
- 首頁是否顯示 Google Sheets 真實商品
- 全部商品頁是否正常
- 商品頁圖片、影片、規格是否顯示
- 顯示狀態為 FALSE 的商品是否隱藏
- 熱銷、新品、限時優惠是否依欄位或標籤分類

重要：
- 工作表名稱必須是：
  products
  product Media
  Product Options
- Google Sheets 必須設為「知道連結的任何人：檢視者」。
- 圖片連結必須是外部可公開讀取的網址。
- 若 AppSheet 儲存的是相對路徑而不是公開網址，圖片暫時會顯示替代圖。

正常後：
git add .
git commit -m "Connect Google Sheets products v0.4"
git push
