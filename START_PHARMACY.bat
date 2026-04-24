@echo off
title Pharmacy Fullstack System

echo [1/4] Dang giai phong cong (Port Cleanup)...
:: Kill processes on port 3000 (Frontend) and 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /F /PID %%a >nul 2>&1

:: Dung PM2 neu no dang chay ngam de giai phong cong
call pm2 delete all >nul 2>&1

echo [2/4] Dang khoi chay cac thanh phan...

:: Khởi chạy Backend trong cửa sổ mới
echo (+) Bat Backend (Cong 5000)...
start "Pharmacy BACKEND" cmd /k "cd backend && npm run dev"

:: Khởi chạy Frontend trong cửa sổ mới (Cong 3000)
echo (+) Bat Frontend (Cong 3000)...
start "Pharmacy FRONTEND" cmd /k "cd frontend && npm run dev"

echo.
echo [3/4] DANG DOI HE THONG KHOI DONG (15 giay)...
echo --------------------------------------------------
echo Vui long kien nhan cho mot chut de he thong sang sang.
:: Đợi 15 giây
timeout /t 15 /nobreak

echo.
echo [4/4] DANG KET NOI VOI INTERNET (Tunnel: happy2102.io.vn)...
echo --------------------------------------------------
:: Su dung Token ban da cung cap
set "TOKEN=eyJhIjoiM2U3YjFiZjJjMDZiNjI4OGIyMTQzZDY2MTViODk5MzUiLCJ0IjoiOWYxZjlkYzQtMTFiYy00YWJiLWIxYmItNDZiZGI3YTdiNjc0IiwicyI6Ik9ERmxaalF4TURVdE1tVTFOUzAwWkRjNExXSmxNREV0WVRSa04yWTNPR1JpTVdJMiJ9"

where cloudflared >nul 2>&1
if %ERRORLEVEL% equ 0 (
    cloudflared tunnel run --token %TOKEN%
) else if exist "cloudflared.exe" (
    .\cloudflared.exe tunnel run --token %TOKEN%
) else (
    echo [!] Loi: Khong tim thay Cloudflared.
    echo Vui long tai cloudflared.exe ve thu muc nay.
)

pause
