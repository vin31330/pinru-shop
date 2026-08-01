@echo off
chcp 65001 >nul
echo ========================================
echo 世界好用 小新和品儒 - 正式建置檢查
echo ========================================
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo [失敗] 正式建置未通過，請保留上方錯誤訊息。
  pause
  exit /b 1
)

echo.
echo [完成] 正式建置成功。
pause
