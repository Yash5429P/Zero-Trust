@echo off
cls
echo =========================================
echo Zero Trust Monitoring System
echo Full-Stack Auto Launcher
echo =========================================
echo.
echo Starting Backend and Frontend servers...
echo.

cd /d "%~dp0"

REM Start Backend in new window
echo [1/2] Launching Backend Server...
start "Zero Trust - Backend" cmd /k "cd backend && start_backend.bat"

REM Wait 3 seconds
timeout /t 3 /nobreak >nul

REM Start Frontend in new window  
echo [2/2] Launching Frontend Server...
start "Zero Trust - Frontend" cmd /k "cd frontend && start_frontend.bat"

echo.
echo =========================================
echo Done!
echo =========================================
echo.
echo Two windows have been opened:
echo   - Backend Server (http://localhost:8000)
echo   - Frontend Server (http://localhost:5173)
echo.
echo Close this window or press any key...
pause >nul
