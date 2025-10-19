#!/bin/bash

echo "🔄 Autism Screening App - Server Manager"
echo "========================================="

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo "🧹 Cleaning port $port..."
    
    # Kill by port
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Kill by process name
    pkill -f "nodemon.*$port\|ts-node.*$port\|node.*$port" 2>/dev/null || true
    
    sleep 1
    
    # Verify port is free
    if lsof -i:$port >/dev/null 2>&1; then
        echo "⚠️  Port $port still in use. Force killing..."
        fuser -k $port/tcp 2>/dev/null || true
        sleep 2
    fi
    
    if ! lsof -i:$port >/dev/null 2>&1; then
        echo "✅ Port $port is now free"
        return 0
    else
        echo "❌ Failed to free port $port"
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo "🚀 Starting backend server..."
    cd /home/kajal-thakur/Documents/Autism_/autism90/backend
    
    # Kill any existing backend processes
    kill_port 5000
    
    # Start backend
    npm run dev &
    BACKEND_PID=$!
    
    echo "⏳ Waiting for backend to start..."
    sleep 5
    
    # Check if backend is running
    if curl -s http://localhost:5000/health >/dev/null 2>&1; then
        echo "✅ Backend started successfully on port 5000"
        echo "🔗 Backend URL: http://localhost:5000"
        return 0
    else
        echo "❌ Backend failed to start"
        return 1
    fi
}

# Function to start frontend  
start_frontend() {
    echo "🎨 Starting frontend server..."
    cd /home/kajal-thakur/Documents/Autism_/autism90/frontend
    
    # Kill any existing frontend processes
    kill_port 5173
    
    # Start frontend
    npm run dev &
    FRONTEND_PID=$!
    
    echo "⏳ Waiting for frontend to start..."
    sleep 3
    
    echo "✅ Frontend should be starting on port 5173"
    echo "🔗 Frontend URL: http://localhost:5173"
    return 0
}

# Main execution
case "${1:-both}" in
    "backend")
        start_backend
        ;;
    "frontend") 
        start_frontend
        ;;
    "both"|"")
        start_backend
        if [ $? -eq 0 ]; then
            start_frontend
        fi
        ;;
    "clean")
        echo "🧹 Cleaning all ports..."
        kill_port 5000
        kill_port 5173
        echo "✅ All ports cleaned"
        ;;
    *)
        echo "Usage: $0 [backend|frontend|both|clean]"
        echo "  backend  - Start only backend server"
        echo "  frontend - Start only frontend server" 
        echo "  both     - Start both servers (default)"
        echo "  clean    - Clean all ports and stop servers"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo "📍 Backend:  http://localhost:5000"
echo "📍 Frontend: http://localhost:5173"
echo "🎭 Ready for emotion detection testing!"

if [ "${1:-both}" != "clean" ]; then
    echo ""
    echo "💡 To stop servers: ./manage-servers.sh clean"
    echo "💡 Or press Ctrl+C to stop this script"
    
    # Keep script running
    echo "📱 Monitoring servers... (Press Ctrl+C to stop)"
    trap 'echo ""; echo "🛑 Stopping servers..."; kill_port 5000; kill_port 5173; echo "✅ Servers stopped"; exit 0' INT
    
    while true; do
        sleep 5
        # Check if servers are still running
        if ! curl -s http://localhost:5000/health >/dev/null 2>&1; then
            echo "⚠️  Backend appears to be down. Restarting..."
            start_backend
        fi
    done
fi