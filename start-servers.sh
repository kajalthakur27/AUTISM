#!/bin/bash

echo "🚀 Starting Autism Screening Application Servers..."

# Kill any existing processes on ports 5000 and 5173
echo "🔄 Cleaning up existing processes..."
pkill -f "nodemon\|ts-node\|node.*5000" 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Check if ports are free
echo "🔍 Checking ports..."
if lsof -i:5000 >/dev/null 2>&1; then
    echo "❌ Port 5000 is still in use. Please run: lsof -ti:5000 | xargs kill -9"
    exit 1
fi

if lsof -i:5173 >/dev/null 2>&1; then
    echo "❌ Port 5173 is still in use. Please run: lsof -ti:5173 | xargs kill -9"
    exit 1
fi

echo "✅ Ports are free. Starting servers..."

# Start backend in background
echo "🔧 Starting backend on port 5000..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend in background
echo "🎨 Starting frontend on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Servers started successfully!"
echo "📍 Backend: http://localhost:5000"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop servers, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  Or use: pkill -f 'nodemon\\|vite'"
echo ""
echo "🎭 Ready to test emotion detection!"

# Keep script running
wait