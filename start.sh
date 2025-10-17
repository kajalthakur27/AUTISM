#!/bin/bash

# Quick Start Script for Autism Screening Tool
# Run this to start both backend and frontend

echo "🚀 Starting Autism Screening Tool..."
echo ""

# Start Backend
echo "📡 Starting Backend..."
cd /home/sama/Autism/backend
npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start Frontend
echo "🎨 Starting Frontend..."
cd /home/sama/Autism/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Application is starting!"
echo ""
echo "📍 Backend: http://localhost:5000"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "📋 To stop:"
echo "   Press Ctrl+C in each terminal"
echo "   Or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎉 Open http://localhost:5173 in your browser!"

# Wait for user interrupt
wait
