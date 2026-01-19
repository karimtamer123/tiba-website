@echo off
echo Starting local web server...
echo.
echo Admin page will be available at: http://localhost:8000/admin.html
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause

