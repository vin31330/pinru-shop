這是 FINAL 2026-08-07 正式整合版。

請先閱讀：FINAL-DEPLOY-STEPS.txt

重要：
1. 這份 ZIP 直接以 src / public / apps-script / package.json 為第一層，不會再包中文外層資料夾。
2. ZIP 不包含 .git，也不包含 .env.local；覆蓋到你現有專案時，原本 .git 與 .env.local 會保留。
3. 全部修改完成後，只需最後 Push origin 一次，讓 Netlify 正式 Deploy 一次。
