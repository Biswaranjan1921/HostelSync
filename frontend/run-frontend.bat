@echo off
cd /d "%~dp0"
echo Starting SmartHostel frontend...
call npm run dev
pause
