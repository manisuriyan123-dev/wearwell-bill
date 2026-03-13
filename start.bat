@echo off
echo ========================================
echo WearWell Billing Software
echo ========================================
echo.
echo Checking dependencies...
python -m pip install -r requirements.txt --quiet
echo.
echo Starting server...
echo.
echo Open your browser and go to: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.
python app.py
pause
