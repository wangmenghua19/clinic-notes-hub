@echo off
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && python -m uvicorn app.main:app --reload"

echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo Servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
