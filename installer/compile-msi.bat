@echo off
title WiX MSI Installer Compiler
cd /d "%~dp0"
echo ========================================================
echo   Compiling ChromiumOS & BIOS Windows MSI Package
echo ========================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-msi.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] MSI compilation failed.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] Installer compiled successfully!
echo You can now distribute or run ChromiumOS-Toolkit-Setup-*.msi
pause
