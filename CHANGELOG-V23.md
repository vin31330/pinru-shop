# V23 公開測試版（Netlify）

基礎版本：V22.2

## 本版調整

- 保留 V22.2 已完成的商品、活動、價格方案、購物車及訂單功能。
- 新增 `netlify.toml`，指定 Node.js 20 與正式建置命令。
- 新增基本安全回應標頭。
- 新增 Netlify 環境變數與部署操作說明。
- 專案版本更新為 `23.0.0`。
- 移除交付 ZIP 內的 `.git`、`.next` 與 `node_modules`，避免舊電腦環境套件影響雲端建置。

## 公開測試規則

- 測試訂單姓名請統一填寫：`測試－姓名`
- 測試手機、平板及電腦。
- 測試商品頁、活動頁、規格與數量、購物車、訂單送出、LINE 開啟及 Sheets 寫入。
- 發現問題後以 V23.1、V23.2 方式修正；網址可維持不變。

## 建置檢查紀錄

原始 V22.2 ZIP 已確認包含完整 `src`、`apps-script`、`public`、設定檔及 lockfile。

在交付環境執行 production build 時，因環境無法取得 Linux 專用的 `@next/swc-linux-x64-gnu@16.2.10` 套件而中止。此問題不是 TypeScript 或網站程式錯誤；Netlify 正常連線至 npm registry 時會依 lockfile 安裝對應平台套件並執行建置。正式部署仍需以 Netlify 的建置結果作最後確認。
