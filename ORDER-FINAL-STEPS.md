# 訂單功能最後設定步驟

1. Apps Script 的 API.gs、Router.gs、Orders.gs 儲存後，建立新版本並重新部署 Web App。
2. 執行身分選「我」，存取權選「任何人」。
3. 複製以 `/exec` 結尾的 Web App 網址。
4. 將網址填入 `.env.local` 的 `GOOGLE_APPS_SCRIPT_URL`。
5. 執行 `npm install` 與 `npm run dev`。
6. 建立一筆測試訂單，確認 Orders、OrderItems、Order Item Selections 三張表都有資料。
7. 確認寫入成功後會打開 LINE 官方帳號，訊息已預先填好，再由顧客按「傳送」。

注意：本版已修正 Apps Script `doPost(e)` 的 action 必須放在網址參數中的問題。
