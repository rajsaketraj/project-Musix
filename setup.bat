@echo off
setlocal

echo 🎵 Setting up Musix Player Development Environment
echo ==================================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

:: Check if yt-dlp is installed
yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  yt-dlp is not installed. Please install it manually.
    echo    Visit: https://github.com/yt-dlp/yt-dlp#installation
    echo    Or use: pip install yt-dlp
    pause
    exit /b 1
)

echo ✅ Prerequisites check complete

:: Install backend dependencies
echo 📦 Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

:: Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\musix-player
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

:: Create environment files if they don't exist
echo 🔧 Setting up environment files...

:: Backend .env
if not exist "..\server\.env" (
    echo 📝 Creating backend .env file...
    copy "..\server\.env.example" "..\server\.env"
    echo ⚠️  Please update the YouTube API key in server\.env
)

:: Frontend .env
if not exist ".env" (
    echo 📝 Creating frontend .env file...
    copy ".env.example" ".env"
    echo ✅ Frontend .env file created
)

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Get a YouTube Data API v3 key from Google Cloud Console
echo 2. Update the YOUTUBE_API_KEY in server\.env
echo 3. Start the backend: cd server ^&^& npm run dev
echo 4. Start the frontend: cd musix-player ^&^& npm start
echo.
echo 🌐 The application will be available at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
echo 📚 Documentation:
echo    README.md - General information
echo    DEPLOYMENT.md - Deployment guide
echo    PROJECT_STRUCTURE.md - Project structure
echo.
echo Happy coding! 🚀
pause
