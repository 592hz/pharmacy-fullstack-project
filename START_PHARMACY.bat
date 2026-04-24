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
echo [3/4] DOI HE THONG KHOI DONG (Checking Ports)...
echo --------------------------------------------------
echo (+) Dang cho Backend (5000) va Frontend (3000) san sang...

:WAIT_LOOP
set /a count+=1
if %count% gtr 60 (
    echo [!] Loi: He thong khong the khoi dong sau 60 giay.
    echo Vui long kiem tra cua so Backend va Frontend de xem loi.
    pause
    exit /b
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
set frontend_ready=%ERRORLEVEL%
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
set backend_ready=%ERRORLEVEL%

if %frontend_ready% equ 0 if %backend_ready% equ 0 (
    echo [OK] Ca hai dich vu da san sang!
    goto :START_TUNNEL
)

timeout /t 2 /nobreak >nul
goto :WAIT_LOOP

:START_TUNNEL
echo.
echo [4/4] DANG KET NOI VOI INTERNET (Tunnel: happy2102.io.vn)...
echo --------------------------------------------------
:: Su dung cau hinh cuc bo de fix loi 502 (localhost vs 127.0.0.1)
where cloudflared >nul 2>&1
if %ERRORLEVEL% equ 0 (
    cloudflared --config config.yml tunnel run
) else if exist "cloudflared.exe" (
    .\cloudflared.exe --config config.yml tunnel run
) else (
    echo [!] Loi: Khong tim thay Cloudflared.
    echo Vui long tai cloudflared.exe ve thu muc nay.
)

pause
