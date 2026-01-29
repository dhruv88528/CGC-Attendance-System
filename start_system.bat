@echo off
echo ===================================================
echo   Starting CGC Attendance System (All Services)
echo ===================================================

echo 1. Starting AI-ML Service (Port 8000)...
start "AI-ML Service" cmd /k "cd ai-ml && python wsgi.py"

echo 2. Starting Backend Service (Port 5001)...
start "Backend Service" cmd /k "cd Backend && npm run dev"

echo 3. Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd Frontend/vite-project && npm run dev"

echo.
echo All services are starting in separate windows.
echo Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo Opening application in browser...
start http://localhost:5173

echo.
echo ===================================================
echo   System is Running! 
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5001
echo   AI-ML:    http://localhost:8000
echo ===================================================
pause
