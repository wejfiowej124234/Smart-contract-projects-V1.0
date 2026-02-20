@echo off
cd /d "%~dp0.."
powershell -ExecutionPolicy Bypass -File "%~dp0local-restart.ps1"
pause
