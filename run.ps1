# Run Zero Trust Monitoring System (Windows PowerShell)
# This script starts both frontend and backend servers

Write-Host "Starting Zero Trust Monitoring System..." -ForegroundColor Cyan

# Check if backend virtual environment exists
$backendVenv = "backend\venv\Scripts\Activate.ps1"
if (-not (Test-Path $backendVenv)) {
    Write-Host "Backend virtual environment not found. Creating..." -ForegroundColor Yellow
    cd backend
    python -m venv venv
    & venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    cd ..
}

# Start Backend in new window
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendPath = "$PWD\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\Activate.ps1; Write-Host 'Backend Server Starting...' -ForegroundColor Green; uvicorn app:app --reload --port 8000"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Check if frontend node_modules exists
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Frontend dependencies not found. Installing..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

# Start Frontend in new window
Write-Host "Starting Frontend Server..." -ForegroundColor Blue
$frontendPath = "$PWD\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server Starting...' -ForegroundColor Blue; npm run dev"

Write-Host ""
Write-Host "Servers are starting!" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host ""
Write-Host "Press Ctrl+C in the server windows to stop them." -ForegroundColor Yellow
