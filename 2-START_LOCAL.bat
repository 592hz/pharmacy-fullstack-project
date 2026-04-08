@echo off
title Pharmacy Fullstack System (LOCAL)
color 0B

echo [1/3] Dang chuan bi he thong...
:: Kiem tra neu pm2 ton tai thi xoa, khong thi bo qua
call pm2 delete all >nul 2>&1

echo [2/3] Dang khoi chay cac thanh phan (Tranh tat cua so nay)...

:: Khoi chay Backend trong cua so moi
echo (+) Bat Server Backend (Cong 5000)...
start "Pharmacy BACKEND" cmd /k "color 0E && cd backend && npm run dev"

:: Khoi chay Frontend trong cua so moi
echo (+) Bat Server Frontend (Cong 3000)...
start "Pharmacy FRONTEND" cmd /k "color 0A && cd frontend && npm run dev"

echo.
echo [3/3] DANG DOI HE THONG KHOI DONG (15 giay)...
echo --------------------------------------------------
echo Vui long kien nhan cho mot chut de he thong sang sang.
timeout /t 15 /nobreak >nul

echo.
echo ==================================================
echo HTTHONG DA SAN SANG!
echo ==================================================
echo Truy cap tren may nay tai: http://localhost:3000
echo.
echo Luu y: KHONG TAT 2 CUA SO MAU DEN (BACKEND VA FRONTEND)
echo De dung tu dien thoai hoac may khac, hay tra cuu dia chi IP (Vi du: http://192.168.1.xxx:3000)
echo.
pause
