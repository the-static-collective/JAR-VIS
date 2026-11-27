@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or later is required. See README.md.
  exit /b 2
)
node "%~dp0caravan.mjs" %*
