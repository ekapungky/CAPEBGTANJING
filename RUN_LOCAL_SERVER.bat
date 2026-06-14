@echo off
cd /d "%~dp0"
echo Running local server for Jogja After Dark Full Bruno...
echo Open http://localhost:8000 in your browser.
python -m http.server 8000
pause
