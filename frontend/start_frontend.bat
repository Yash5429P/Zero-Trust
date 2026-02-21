@echo off
echo ========================================
echo Starting Frontend Server
echo ========================================
cd /d "%~dp0"
echo.
echo Installing dependencies (if needed)...
if not exist "node_modules\" (
    echo Installing npm packages...
    call npm install
)
echo.
echo Starting Vite development server...
echo Frontend will be available at: http://localhost:5173
echo.
call npm run dev
pause
