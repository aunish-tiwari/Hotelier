#!/bin/bash

# Quick Start script for Hotel Booking System

echo ""
echo "===================================="
echo "Hotelier - Hotel Booking System"
echo "Quick Start Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js is installed"
node --version
npm --version
echo ""

# Install backend dependencies
echo "===================================="
echo "Installing Backend Dependencies..."
echo "===================================="
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install backend dependencies"
    exit 1
fi
echo "[OK] Backend dependencies installed"
cd ..
echo ""

# Display next steps
echo "===================================="
echo "Setup Completed Successfully!"
echo "===================================="
echo ""
echo "Next Steps:"
echo "----------"
echo "1. Start Backend Server:"
echo "   cd backend"
echo "   npm start"
echo "   (Server will run on http://localhost:5000)"
echo ""
echo "2. Open Frontend (in another terminal):"
echo "   Start a local server:"
echo "   npx http-server -p 8000"
echo ""
echo "3. Open in Browser:"
echo "   http://localhost:8000/frontend/index.html"
echo ""
echo "For Development:"
echo "  Use 'npm run dev' in backend folder for auto-reload"
echo ""
echo "===================================="
echo ""
