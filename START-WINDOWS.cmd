@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 from https://nodejs.org, then open this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto failed
)
call npm run setup
if errorlevel 1 goto failed
echo Open http://localhost:3100 when the server says Ready.
call npm run dev
exit /b 0
:failed
echo Setup did not finish. Read the message above and see SETUP.txt.
pause
exit /b 1
