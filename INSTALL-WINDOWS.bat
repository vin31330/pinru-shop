@echo off
chcp 65001 >nul
echo ========================================
echo 世界好用 小新和品儒 - 安裝網站套件
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo [錯誤] 找不到 Node.js，請先安裝 Node.js 22 LTS 或更新版本。
  pause
  exit /b 1
)

call npm install
if errorlevel 1 (
  echo.
  echo [失敗] npm install 發生錯誤。
  pause
  exit /b 1
)

echo.
echo [完成] 套件安裝成功，接著可執行 START-WINDOWS.bat。
pause
