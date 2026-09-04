@echo off
:: ============================================================================
:: Flash-ChromiumOS.bat - Windows Quick-Launcher
:: Automatically elevates to Administrator and executes Flash-ChromiumOS.ps1
:: Based on https://github.com/12dakota/Chromeos
:: ============================================================================

title ChromiumOS USB Flasher (12dakota/Chromeos)
color 0b

:: Check for Administrative permissions
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator privileges to write directly to USB drive...
    powershell -Command "Start-Process cmd -ArgumentList '/c ""%~f0""' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
echo =======================================================================
echo   Launching ChromiumOS Windows Flasher (PowerShell)
echo =======================================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Flash-ChromiumOS.ps1"

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Script ended with error code %errorLevel%.
) else (
    echo.
    echo [SUCCESS] Flashing finished.
)

echo.
pause
