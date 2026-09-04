<#
.SYNOPSIS
    Automated Windows MSI Package Compiler for ChromiumOS & BIOS Toolkit
.DESCRIPTION
    Checks for WiX Toolset (v3 candle/light or v4 wix.exe), downloads portable
    WiX binaries if missing, generates config.json, and compiles ChromiumOS-Toolkit-Setup.msi.
.EXAMPLE
    .\build-msi.ps1
    .\build-msi.ps1 -Board "dedede" -FirefoxVersion "140.0"
#>

[CmdletBinding()]
param(
    [string]$Board = "dedede",
    [string]$FirefoxVersion = "140.0",
    [string]$MsiVersion = "1.0.0",
    [string]$OutputFile = "ChromiumOS-Toolkit-Setup-dedede.msi"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ChromiumOS & Chromebook BIOS - Windows MSI Builder      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Board:           $Board" -ForegroundColor Yellow
Write-Host "Firefox Version:        $FirefoxVersion" -ForegroundColor Yellow
Write-Host "MSI Package Output:     $OutputFile" -ForegroundColor Yellow
Write-Host ""

$WorkDir = $PSScriptRoot
Set-Location $WorkDir

# Step 1: Generate config.json with current selections
Write-Host "[1/4] Writing installation manifest config.json..." -ForegroundColor Green
$configObject = @{
    board = $Board
    firefoxVersion = $FirefoxVersion
    buildChromeOS = $true
    buildBios = $true
    biosPayload = "depthcharge"
    gbbFlags = "0x489"
    disableSoftwareWp = $true
    imageType = "test"
    repoJobs = 8
    githubRepo = "https://github.com/12dakota/Chromeos"
    generatedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
}
$configJson = $configObject | ConvertTo-Json -Depth 4
$configJson | Out-File -FilePath (Join-Path $WorkDir "config.json") -Encoding utf8

# Step 2: Ensure wrapper batch launcher exists
Write-Host "[2/4] Generating 1-click launcher batch..." -ForegroundColor Green
$batContent = @"
@echo off
title ChromiumOS & Chromebook BIOS Builder
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ChromiumOS-Builder-GUI.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred running the GUI. Press any key to exit.
    pause >nul
)
"@
$batContent | Out-File -FilePath (Join-Path $WorkDir "ChromiumOS-Builder.bat") -Encoding ascii

# Step 3: Locate or Download WiX Toolset
Write-Host "[3/4] Checking for WiX Toolset..." -ForegroundColor Green
$wixFound = $false
$candlePath = $null
$lightPath = $null

# Check environment PATH
if (Get-Command "candle.exe" -ErrorAction SilentlyContinue) {
    $candlePath = "candle.exe"
    $lightPath = "light.exe"
    $wixFound = $true
} elseif (Test-Path "${env:ProgramFiles(x86)}WiX Toolset v3.11incandle.exe") {
    $candlePath = "${env:ProgramFiles(x86)}WiX Toolset v3.11incandle.exe"
    $lightPath = "${env:ProgramFiles(x86)}WiX Toolset v3.11inlight.exe"
    $wixFound = $true
} elseif (Get-Command "wix.exe" -ErrorAction SilentlyContinue) {
    # WiX v4+
    Write-Host "Found WiX v4 (wix.exe). Compiling via 'wix build'..." -ForegroundColor Cyan
    & wix build -d Board="$Board" -d FirefoxVersion="$FirefoxVersion" Product.wxs -o $OutputFile
    if ($LASTEXITCODE -eq 0 -and (Test-Path $OutputFile)) {
        Write-Host "MSI generated successfully: $OutputFile" -ForegroundColor Green
        exit 0
    }
}

if (-not $wixFound) {
    Write-Host "WiX Toolset not found in PATH or standard Program Files." -ForegroundColor Yellow
    Write-Host "Downloading portable WiX 3.11 binaries from GitHub..." -ForegroundColor Cyan
    $wixToolsDir = Join-Path $WorkDir ".wixtools"
    if (-not (Test-Path $wixToolsDir)) {
        New-Item -ItemType Directory -Path $wixToolsDir -Force | Out-Null
    }
    
    $wixZip = Join-Path $wixToolsDir "wix311-binaries.zip"
    $wixUrl = "https://github.com/wixtoolset/wix3/releases/download/wix3112rtm/wix311-binaries.zip"
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $wixUrl -OutFile $wixZip -UseBasicParsing
        Expand-Archive -Path $wixZip -DestinationPath $wixToolsDir -Force
        $candlePath = Join-Path $wixToolsDir "candle.exe"
        $lightPath = Join-Path $wixToolsDir "light.exe"
        $wixFound = $true
    } catch {
        Write-Warning "Automated WiX download failed: $_"
        Write-Host "Please install WiX via winget: 'winget install WiX' or download from wixtoolset.org" -ForegroundColor Yellow
        exit 1
    }
}

# Step 4: Compile Product.wxs into MSI
Write-Host "[4/4] Compiling Windows Installer Package ($OutputFile)..." -ForegroundColor Green
$wixObj = Join-Path $WorkDir "Product.wixobj"

Write-Host "Running candle.exe..." -ForegroundColor DarkGray
& "$candlePath" -nologo -ext WixUIExtension (Join-Path $WorkDir "Product.wxs") -out $wixObj
if ($LASTEXITCODE -ne 0) {
    Write-Error "Candle compilation failed."
    exit 1
}

Write-Host "Running light.exe to link MSI package..." -ForegroundColor DarkGray
& "$lightPath" -nologo -ext WixUIExtension -sval -out (Join-Path $WorkDir $OutputFile) $wixObj
if ($LASTEXITCODE -ne 0) {
    Write-Error "Light linking failed."
    exit 1
}

if (Test-Path (Join-Path $WorkDir $OutputFile)) {
    $msiSize = (Get-Item (Join-Path $WorkDir $OutputFile)).Length / 1KB
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Windows MSI Installer Created!                 " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "File:       $OutputFile ($([math]::Round($msiSize, 2)) KB)" -ForegroundColor White
    Write-Host "Install:    msiexec /i $OutputFile" -ForegroundColor Yellow
    Write-Host "Silent:     msiexec /i $OutputFile /qn BOARD=$Board FIREFOX_VERSION=$FirefoxVersion" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Error "Failed to produce $OutputFile."
    exit 1
}
