#!/bin/bash

# InvestIQ Chat Integration Startup Script
# This script sets up and starts both frontend and backend servers

echo "🚀 InvestIQ Chat Integration Startup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Must run from InvestX Labs root directory${NC}"
    exit 1
fi

echo "📦 Step 1: Installing Backend Dependencies"
echo "==========================================="
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing..."
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi
cd ..

echo ""
echo "🔑 Step 2: Check Backend Configuration"
echo "======================================"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No backend/.env file found${NC}"
    echo "Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and add your OPENROUTER_API_KEY${NC}"
    echo "   Get your key from: https://openrouter.ai/keys"
    echo ""
    read -p "Press Enter after you've added your API key to backend/.env..."
fi

# Check if API key is set
if grep -q "your_openrouter_api_key_here" backend/.env; then
    echo -e "${RED}❌ API key not configured in backend/.env${NC}"
    echo "Please edit backend/.env and replace 'your_openrouter_api_key_here' with your actual key"
    exit 1
fi

echo -e "${GREEN}✅ Backend configuration ready${NC}"

echo ""
echo "🔑 Step 3: Check Frontend Configuration"
echo "======================================="
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env not accessible (gitignored)${NC}"
    echo "Please ensure frontend/.env contains:"
    echo "   REACT_APP_BACKEND_URL=http://localhost:5001"
fi

echo -e "${GREEN}✅ Frontend configuration ready${NC}"

echo ""
echo "🚀 Step 4: Starting Backend Server"
echo "==================================="
cd backend
echo "Starting on http://localhost:5001..."
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend server running on http://localhost:5001${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ INTEGRATION READY"
echo "==================="
echo ""
echo -e "${GREEN}Backend:${NC} http://localhost:5001"
echo -e "${GREEN}Frontend:${NC} http://localhost:3002 (already running)"
echo ""
echo "📊 Test the integration:"
echo "1. Open http://localhost:3002 in your browser"
echo "2. Navigate to the Chat page"
echo "3. Send a message: 'What is diversification?'"
echo "4. You should see a personalized educational response within 5 seconds"
echo ""
echo "🛑 To stop the backend server, press Ctrl+C"
echo ""

# Keep script running
wait $BACKEND_PID
