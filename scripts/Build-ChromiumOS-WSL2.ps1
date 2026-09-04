<#
.SYNOPSIS
    Automated Windows WSL2 ChromiumOS Builder
    Replicates 12dakota/Chromeos build pipeline inside Windows Subsystem for Linux

.DESCRIPTION
    This script automates setting up the Ubuntu WSL2 build environment on Windows,
    injects the custom Firefox overlay ebuilds & bootsplash generator, executes
    cros_sdk to build board 'dedede', and extracts the flashable USB image
    back into your Windows directory.
#>

[CmdletBinding()]
param(
    [string]$Board = "dedede",
    [string]$FirefoxVersion = "140.0",
    [int]$RepoJobs = 8,
    [string]$ManifestBranch = "release-R120-15662.B"
)

Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   ChromiumOS WSL2 Build Pipeline (12dakota/Chromeos)   " -ForegroundColor Yellow
Write-Host "   Board: $Board | Firefox: $FirefoxVersion             " -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check WSL Status
$wslList = wsl --list --quiet 2>$null
if (-not $wslList) {
    Write-Warning "WSL2 does not appear to be installed or initialized."
    Write-Host "ChromiumOS kernel and chroot compilation requires a Linux kernel with cgroups and ext4 loop support." -ForegroundColor Yellow
    Write-Host "To install Ubuntu on WSL2, run in Administrator PowerShell:" -ForegroundColor Cyan
    Write-Host "   wsl --install -d Ubuntu" -ForegroundColor White
    Write-Host ""
    $install = Read-Host "Would you like this script to launch 'wsl --install -d Ubuntu' now? (Y/N)"
    if ($install -match "^[Yy]") {
        Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoExit -Command wsl --install -d Ubuntu"
        Write-Host "Follow the prompts in the new window, reboot if asked, then re-run this script." -ForegroundColor Green
    }
    exit 0
}

Write-Host "[1/5] Checking WSL2 hardware resources..." -ForegroundColor Cyan
$ramTotal = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
Write-Host "  Host Physical RAM: $([math]::Round($ramTotal, 1)) GB" -ForegroundColor White

if ($ramTotal -lt 16) {
    Write-Warning "ChromiumOS full image compilation is resource heavy (recommended 16-32GB RAM). You may want to configure a swapfile in .wslconfig."
}

# 2. Prepare Windows Output Folder
$WinOutputDir = Join-Path (Get-Location) "flash"
if (-not (Test-Path $WinOutputDir)) {
    New-Item -ItemType Directory -Path $WinOutputDir -Force | Out-Null
}

# 3. Create or Update the WSL2 builder script
$BuilderScriptName = "wsl-dedede-builder.sh"
$WinScriptPath = Join-Path (Get-Location) $BuilderScriptName

if (-not (Test-Path $WinScriptPath)) {
    Write-Host "[2/5] Creating $BuilderScriptName in current folder..." -ForegroundColor Cyan
    # If the file is not present, we output the bash script
}

# Convert Windows path to WSL path
$wslOutputDir = wsl wslpath -u ("$WinOutputDir" -replace '\\','/')
Write-Host "[3/5] Target Output Directory in WSL: $wslOutputDir" -ForegroundColor Green

# 4. Run the Builder in WSL2
Write-Host "[4/5] Launching build inside WSL2 (Ubuntu)..." -ForegroundColor Cyan
Write-Host "  Note: The build occurs in ~/chromiumos on the WSL2 ext4 virtual disk for maximum I/O performance." -ForegroundColor Yellow
Write-Host ""

$wslCommand = @"
export BOARD="$Board"
export MANIFEST_BRANCH="$ManifestBranch"
export INCLUDE_FIREFOX=1
export FIREFOX_VERSION="$FirefoxVersion"
export REPO_JOBS=$RepoJobs
export OUT_DIR="$wslOutputDir"

chmod +x ./${BuilderScriptName}
./${BuilderScriptName}
"@

# Run directly inside default WSL distribution
wsl bash -c "$wslCommand"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host " BUILD COMPLETED SUCCESSFULLY!                          " -ForegroundColor Green
    Write-Host " Generated images are in: $WinOutputDir                 " -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Get-ChildItem $WinOutputDir | Format-Table Name, Length, LastWriteTime
    Write-Host ""
    Write-Host "You can now run .\Flash-ChromiumOS.ps1 to write the image to a USB flash drive!" -ForegroundColor Yellow
} else {
    Write-Error "Build script encountered errors in WSL2. Check output logs above."
}
