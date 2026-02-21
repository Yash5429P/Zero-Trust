@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo.
echo Initializing database...
python create_db.py
echo.
echo Creating admin user (if needed)...
python create_admin.py
echo.
echo Starting FastAPI server...
echo Backend will be available at: http://localhost:8000
echo API Docs at: http://localhost:8000/docs
echo.
uvicorn app:app --reload --port 8000
pause
