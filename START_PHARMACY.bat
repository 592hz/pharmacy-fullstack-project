@echo off
title Pharmacy Fullstack System

echo [1/3] Dang chuan bi he thong...
:: Dung PM2 neu no dang chay ngam de giai phong cong
call pm2 delete all >nul 2>&1

echo [2/3] Dang khoi chay cac thanh phan...

:: Khởi chạy Backend trong cửa sổ mới
echo (+) Bat Backend (Cong 5000)...
start "Pharmacy BACKEND" cmd /k "cd backend && npm run dev"

:: Khởi chạy Frontend trong cửa sổ mới (Cong 3000)
echo (+) Bat Frontend (Cong 3000)...
start "Pharmacy FRONTEND" cmd /k "cd frontend && npm run dev"

echo.
echo [3/3] DANG DOI HE THONG KHOI DONG (30 giay)...
echo --------------------------------------------------
echo Vui long kien nhan cho mot chut de he thong sang sang.
:: Đợi 30 giây
timeout /t 30 /nobreak

echo.
echo DANG KET NOI VOI INTERNET (Dung cong 3000)...
echo --------------------------------------------------
:: Ép dùng 127.0.0.1 và cổng 3000
cloudflared tunnel --url http://127.0.0.1:3000

pause
