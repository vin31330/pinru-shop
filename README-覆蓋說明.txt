品儒生活館 V0.3 商品與購物車

新增功能：
- 全部商品頁
- 搜尋商品
- 商品詳細頁
- 圖片與影片示意區
- 尺寸、顏色等規格選單
- 數量調整
- 原價與特價
- 訪客購物車
- 瀏覽器 Local Storage 保存購物車
- 購物車數量、刪除、小計與總金額

操作：
1. 先按 Ctrl + C 停止 npm run dev。
2. 解壓縮本壓縮檔。
3. 把解壓後的 src 資料夾，覆蓋到：
   C:\網站專案\pinru-shop\src
4. 在 VS Code Terminal 執行：
   npm run dev
5. 打開：
   http://localhost:3000
6. 測試：
   - 首頁點商品
   - 選規格
   - 加入購物車
   - 修改數量
   - 確認總金額
7. 正常後執行：
   git add .
   git commit -m "Add products and guest cart v0.3"
   git push

注意：
目前仍使用示範商品資料。
下一版會加入訂單表單、配送邏輯與 LINE 送單。
