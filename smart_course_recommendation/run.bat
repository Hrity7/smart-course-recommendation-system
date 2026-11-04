@echo off
title Smart Course Recommendation System - AI Edition
echo ==========================================================
echo   Smart Course Recommendation System (Python + AI + Tkinter)
echo ==========================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in your system PATH.
    pause
    exit /b 1
)

if not exist ".venv" (
    echo [1/3] Creating virtual environment...
    python -m venv .venv
)

echo [2/3] Activating virtual environment and checking dependencies...
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo [3/3] Launching Smart Course Recommendation System...
python main.py
pause
