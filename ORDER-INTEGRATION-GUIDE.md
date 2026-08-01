# 送出訂單整合說明

## 實際流程

1. 顧客在結帳頁按「送出訂單」。
2. 網站先將訂單寫入 Google Sheets。
3. 寫入成功後，網站開啟 LINE 官方帳號聊天室並預先填入完整訂單。
4. 顧客在 LINE 按一次傳送，官方帳號就會收到訂單。

LINE URL Scheme 只能預先填入訊息，瀏覽器不能代替顧客自動按下 LINE 的傳送鍵。

## Apps Script

1. 將 `apps-script/Orders.gs` 加入目前 Apps Script 專案。
2. 將 `apps-script/Router-order-integration.gs` 的 `createOrder` 分支合併進現有 `Router.gs`／`doPost(e)`。
3. 重新部署 Web App：
   - 執行身分：我
   - 存取權：任何人
4. 複製 `/exec` 網址。

## Next.js 環境變數

在 `.env.local` 填入：

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/你的部署ID/exec
NEXT_PUBLIC_LINE_OFFICIAL_ID=@284eiqba
```

修改後重新啟動：

```bash
npm run dev
```

## Google Sheets

首次成功送單時，程式會自動建立：

- Orders
- OrderItems
- Order Item Selections
