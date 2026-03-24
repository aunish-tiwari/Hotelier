@echo off
REM Quick Start script for Hotel Booking System

echo.
echo ====================================
echo Hotelier - Hotel Booking System
echo Quick Start Setup
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
npm --version
echo.

REM Install backend dependencies
echo ====================================
echo Installing Backend Dependencies...
echo ====================================
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..
echo.

REM Display next steps
echo ====================================
echo Setup Completed Successfully!
echo ====================================
echo.
echo Next Steps:
echo ----------
echo 1. Start Backend Server:
echo    cd backend
echo    npm start
echo    (Server will run on http://localhost:5000)
echo.
echo 2. Open Frontend (in another terminal):
echo    Start a local server:
echo    npx http-server -p 8000
echo.
echo 3. Open in Browser:
echo    http://localhost:8000/frontend/index.html
echo.
echo For Development:
echo   Use "npm run dev" in backend folder for auto-reload
echo.
echo ====================================
echo.
pause
