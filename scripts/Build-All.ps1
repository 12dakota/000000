<#
.SYNOPSIS
    Master ChromiumOS & Chromebook BIOS Compilation Pipeline
.DESCRIPTION
    Compiles both the ChromiumOS test/dev image with Mozilla Firefox overlay
    AND the Coreboot / Tianocore BIOS firmware in a single automated flow.
.EXAMPLE
    .\Build-All.ps1 -Board "dedede" -FirefoxVersion "140.0"
#>

[CmdletBinding()]
param(
    [string]$Board = "dedede",
    [string]$FirefoxVersion = "140.0",
    [string]$BiosPayload = "depthcharge",
    [string]$GbbFlags = "0x489",
    [switch]$SkipChromeOS,
    [switch]$SkipBIOS
)

$StartTime = Get-Date

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ChromiumOS + Firefox + Chromebook BIOS Master Pipeline  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Board:                 $Board" -ForegroundColor Yellow
Write-Host "Firefox Version:       $FirefoxVersion" -ForegroundColor Yellow
Write-Host "BIOS Payload:          $BiosPayload" -ForegroundColor Yellow
Write-Host "GBB Flags:             $GbbFlags" -ForegroundColor Yellow
Write-Host ""

# Phase 1: Compile ChromeOS Image with Firefox
if (-not $SkipChromeOS) {
    Write-Host ">>> PHASE 1: Compiling ChromiumOS with Firefox Overlay..." -ForegroundColor Magenta
    $chromeOsScript = Join-Path $PSScriptRoot "scripts\Build-ChromiumOS-WSL2.ps1"
    if (Test-Path $chromeOsScript) {
        & "$chromeOsScript" -Board $Board -FirefoxVersion $FirefoxVersion
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Phase 1 (ChromeOS Image) failed. Aborting."
            exit 1
        }
    } else {
        Write-Warning "ChromeOS build script not found at $chromeOsScript"
    }
}

# Phase 2: Compile Chromebook BIOS Firmware
if (-not $SkipBIOS) {
    Write-Host ""
    Write-Host ">>> PHASE 2: Compiling Chromebook Coreboot/UEFI BIOS..." -ForegroundColor Magenta
    $biosScript = Join-Path $PSScriptRoot "scripts\Build-Chromebook-BIOS.ps1"
    if (Test-Path $biosScript) {
        & "$biosScript" -Board $Board -Payload $BiosPayload -GbbFlags $GbbFlags
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Phase 2 (Chromebook BIOS) failed. Aborting."
            exit 1
        }
    } else {
        Write-Warning "BIOS build script not found at $biosScript"
    }
}

$Elapsed = (Get-Date) - $StartTime
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " MASTER BUILD COMPLETED IN $($Elapsed.ToString('hh\:mm\:ss'))! " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Output Directory: .\flash (ChromeOS image) and .\firmware (BIOS ROM)" -ForegroundColor White
Write-Host "To Flash USB Drive: .\scripts\Flash-ChromiumOS.ps1" -ForegroundColor Yellow
Write-Host "To Flash BIOS ROM:  .\scripts\Flash-Chromebook-BIOS.ps1" -ForegroundColor Yellow
