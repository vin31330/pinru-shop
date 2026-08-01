@echo off
chcp 65001 >nul
echo ========================================
echo 世界好用 小新和品儒 V20 - 啟動網站
echo ========================================
echo.
if not exist node_modules (
  echo 第一次啟動，正在安裝網站套件...
  call npm install
  if errorlevel 1 (
    echo.
    echo 套件安裝失敗，請確認已安裝 Node.js 與網路連線。
    pause
    exit /b 1
  )
)
echo 正在建立手機、平板與電腦共用的正式測試版本...
call npm run build
if errorlevel 1 (
  echo.
  echo 網站建置失敗，請將上方錯誤畫面截圖提供給開發人員。
  pause
  exit /b 1
)
echo.
echo 正在啟動網站...
call npm start
pause
