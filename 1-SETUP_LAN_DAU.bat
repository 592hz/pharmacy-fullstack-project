@echo off
title Cai dat He Thong (Lan dau)
color 0A

echo ==================================================
echo DANG TIEN HANH CAI DAT KHOI TAO HE THONG (CHAY 1 LAN)
echo Vui long dam bao may tinh da co ket noi Internet!
echo Yeu cau phai cai dat Node.js truoc.
echo ==================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [LOI] CHUA CAI DAT NODE.JS!
    echo Vui long tai va cai dat Node.js tu https://nodejs.org roi chay lai file nay.
    pause
    exit
)

echo [1/2] Dang tai thu vien cho SERVER (Backend)...
cd backend
call npm install
cd ..

echo.
echo [2/3] Dang tai thu vien cho GIAO DIEN (Frontend)...
cd frontend
call npm install --legacy-peer-deps
cd ..

echo.
echo [3/3] Dang kiem tra va tai Cloudflared (de truy cap tu xa)...
if not exist "cloudflared.exe" (
    echo (+) Dang tai Cloudflared...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    if %errorlevel% neq 0 (
        echo [CANH BAO] Khong the tai Cloudflared tu dong. Khach hang can tai thu cong neu muon dung tinh nang truy cap tu xa.
    ) else (
        echo (+) Da tai Cloudflared thanh cong.
    )
) else (
    echo (+) Cloudflared da ton tai.
)

echo.
echo ==================================================
echo HOAN TAT CAI DAT!
echo Ban co the chay file "START_PHARMACY.bat" de bat dau su dung.
echo ==================================================
pause
