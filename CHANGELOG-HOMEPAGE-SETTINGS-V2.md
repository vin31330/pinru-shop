# 首頁與 Settings v2.0

## 已完成

- Settings 工作表控制首頁顯示數量。
- 首頁 Banner 讀取 `HomeBannerCount`。
- 首頁優惠活動讀取 `HomeActivityCount`。
- 首頁熱銷商品讀取 `HomeHotCount`。
- 首頁新品推薦讀取 `HomeNewCount`。
- 新品依 Products 的建立日期自動判斷。
- 最近 `NewProductDays` 天內視為新品。
- 新品完整頁最多顯示 `HomeNewMax` 樣。
- 首頁分類讀取 `HomeCategoryCount`。
- HomepageSections 支援讀取「分類ID」與「連結網址」。
- 首頁各區塊按鈕文字維持「查看更多」。

## Settings 建議資料

請在 Settings 工作表加入：

| 設定鍵 | 設定值 | 資料類型 | 顯示狀態 |
|---|---:|---|---|
| HomeBannerCount | 5 | 數字 | 顯示 |
| HomeActivityCount | 5 | 數字 | 顯示 |
| HomeHotCount | 5 | 數字 | 顯示 |
| HomeNewCount | 5 | 數字 | 顯示 |
| HomeNewMax | 20 | 數字 | 顯示 |
| NewProductDays | 30 | 數字 | 顯示 |
| HomeCategoryCount | 8 | 數字 | 顯示 |
| ProductPageSize | 20 | 數字 | 顯示 |
| SearchPageSize | 20 | 數字 | 顯示 |

若 Settings 尚未填寫或讀取失敗，網站會自動使用以上預設值。

## 新品規則

- Products.顯示狀態不可為隱藏或下架。
- Products.建立日期必須是有效日期。
- 最近 30 天內（或 Settings 的 NewProductDays）才算新品。
- 依建立日期由新到舊排列。
- 首頁預設顯示 5 樣。
- 點「查看更多」後最多顯示 20 樣。
