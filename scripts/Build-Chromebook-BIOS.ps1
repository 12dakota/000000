<#
.SYNOPSIS
    Chromebook BIOS & Coreboot Firmware Build Pipeline (PowerShell + WSL2)
.DESCRIPTION
    Compiles AP (Application Processor) firmware for board 'dedede'.
    Supports Google Depthcharge payload (ChromeOS bootloader) and Tianocore EDK2 (Full UEFI).
    Injects GBB flags (0x489) and packages custom CBFS bootsplash.
.EXAMPLE
    .\Build-Chromebook-BIOS.ps1
    .\Build-Chromebook-BIOS.ps1 -Board "dedede" -Payload tianocore -GbbFlags "0x489"
#>

[CmdletBinding()]
param(
    [string]$Board = "dedede",
    [ValidateSet("depthcharge", "tianocore", "both")]
    [string]$Payload = "depthcharge",
    [string]$GbbFlags = "0x489",
    [switch]$ForceRebuild,
    [string]$OutputDir = ".\firmware"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Chromebook BIOS / Coreboot Firmware Compiler Pipeline   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Board:         $Board" -ForegroundColor Yellow
Write-Host "Firmware Payload:     $Payload" -ForegroundColor Yellow
Write-Host "GBB Flags:            $GbbFlags" -ForegroundColor Yellow
Write-Host "Firmware Output:      $OutputDir" -ForegroundColor Yellow
Write-Host ""

# Ensure output directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Verify WSL2 environment
Write-Host "[1/4] Verifying Windows Subsystem for Linux (WSL2)..." -ForegroundColor Green
$wslStatus = wsl --status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "WSL is not installed or enabled. Run 'wsl --install -d Ubuntu' and reboot."
    exit 1
}

# Resolve WSL paths
$windowsWorkspace = (Get-Location).Path
$wslWorkspace = wsl wslpath -u "$windowsWorkspace"
$wslOutputDir = wsl wslpath -u (Resolve-Path $OutputDir).Path
$builderScript = "wsl-bios-builder.sh"

Write-Host "[2/4] Preparing Linux BIOS toolchain inside WSL2..." -ForegroundColor Green
# Ensure line endings are Unix LF
wsl bash -c "cd '$wslWorkspace/scripts' && sed -i 's/$//' $builderScript && chmod +x $builderScript"

Write-Host "[3/4] Launching Coreboot & Payload compilation in WSL2..." -ForegroundColor Green
Write-Host "Compiling firmware for $Board (Payload: $Payload)..." -ForegroundColor Cyan

$wslCommand = @"
export BOARD="$Board"
export PAYLOAD="$Payload"
export GBB_FLAGS="$GbbFlags"
export OUTPUT_DIR="$wslOutputDir"
cd '$wslWorkspace/scripts'
./$builderScript
"@

wsl bash -c "$wslCommand"

if ($LASTEXITCODE -ne 0) {
    Write-Error "WSL2 BIOS build process failed. Review log output above."
    exit 1
}

# Check produced ROM
Write-Host "[4/4] Verifying generated BIOS images in $OutputDir..." -ForegroundColor Green
$romFiles = Get-ChildItem -Path $OutputDir -Filter "*.rom" -ErrorAction SilentlyContinue

if ($romFiles) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Chromebook BIOS Firmware Compiled!             " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    foreach ($rom in $romFiles) {
        $sizeMb = [math]::Round($rom.Length / 1MB, 2)
        Write-Host "ROM: $($rom.Name) ($sizeMb MB)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Next Step: Flash to Chromebook using .\Flash-Chromebook-BIOS.ps1" -ForegroundColor Yellow
} else {
    Write-Warning "Build finished without errors but no .rom files were found in $OutputDir."
}
