#!/bin/bash
# Run Zero Trust Monitoring System (Linux/Mac)
# This script starts both frontend and backend servers

echo "🚀 Starting Zero Trust Monitoring System..."

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "⚠️  Backend virtual environment not found. Creating..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start Backend in background
echo "📡 Starting Backend Server..."
cd backend
source venv/bin/activate
uvicorn app:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
fi

# Start Frontend in background
echo "🌐 Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers are running!"
echo "📡 Backend: http://localhost:8000"
echo "📡 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Trap Ctrl+C to kill both processes
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for user to stop
wait
