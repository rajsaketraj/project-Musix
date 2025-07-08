#!/bin/bash

# Musix Player Development Setup Script
# This script sets up the development environment for Musix Player

echo "🎵 Setting up Musix Player Development Environment"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️  yt-dlp is not installed. Installing..."
    if command -v pip &> /dev/null; then
        pip install yt-dlp
    else
        echo "❌ pip is not installed. Please install yt-dlp manually."
        echo "   Visit: https://github.com/yt-dlp/yt-dlp#installation"
        exit 1
    fi
fi

echo "✅ Prerequisites check complete"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../musix-player
npm install
echo "✅ Frontend dependencies installed"

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

# Backend .env
if [ ! -f "../server/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp ../server/.env.example ../server/.env
    echo "⚠️  Please update the YouTube API key in server/.env"
fi

# Frontend .env
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file..."
    cp .env.example .env
    echo "✅ Frontend .env file created"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get a YouTube Data API v3 key from Google Cloud Console"
echo "2. Update the YOUTUBE_API_KEY in server/.env"
echo "3. Start the backend: cd server && npm run dev"
echo "4. Start the frontend: cd musix-player && npm start"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📚 Documentation:"
echo "   README.md - General information"
echo "   DEPLOYMENT.md - Deployment guide"
echo "   PROJECT_STRUCTURE.md - Project structure"
echo ""
echo "Happy coding! 🚀"
