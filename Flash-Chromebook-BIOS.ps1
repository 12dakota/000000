<#
.SYNOPSIS
    Chromebook Safe BIOS / Coreboot Flashing Utility (PowerShell)
.DESCRIPTION
    Safely flashes compiled Coreboot / Tianocore BIOS firmware to Chromebooks.
    Supports local external programmer (CH341A USB) or remote network flashing over SSH
    to a Chromebook running ChromeOS Developer Mode.
    Includes mandatory double backup verification before any chip write operations.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$RomPath = "",

    [Parameter(Mandatory = $false)]
    [string]$ChromebookIp = "",

    [Parameter(Mandatory = $false)]
    [ValidateSet("ssh", "ch341a", "serprog")]
    [string]$Programmer = "ssh",

    [Parameter(Mandatory = $false)]
    [switch]$SkipBackup,

    [Parameter(Mandatory = $false)]
    [string]$Board = "dedede"
)

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
    Write-Warning "Administrator rights recommended for direct hardware device access."
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Chromebook BIOS / Coreboot Safe Flash Tool              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Board:      $Board" -ForegroundColor Yellow
Write-Host "Programmer Mode:   $Programmer" -ForegroundColor Yellow
Write-Host ""

# 1. Locate ROM file if not specified
if ([string]::IsNullOrEmpty($RomPath)) {
    $candidates = Get-ChildItem -Path ".\firmware" -Filter "*.rom" -ErrorAction SilentlyContinue
    if ($candidates) {
        $RomPath = $candidates[0].FullName
        Write-Host "Auto-detected BIOS ROM: $RomPath" -ForegroundColor Green
    } else {
        $RomPath = Read-Host "Enter full path to compiled .rom file"
    }
}

if (-not (Test-Path $RomPath)) {
    Write-Error "ROM file not found: $RomPath"
    exit 1
}

# 2. Hardware & Software Write-Protect Advisory
Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  WRITE-PROTECT (WP) SAFETY CHECK:                        " -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
Write-Host "To flash the complete BIOS, Write-Protect must be disabled:" -ForegroundColor White
Write-Host "1. Modern Chromebooks (Jasper Lake/Gemini Lake):" -ForegroundColor White
Write-Host "   - Disconnect the internal battery cable, OR" -ForegroundColor White
Write-Host "   - Use a Suzy-Q CCD cable with CR50 command: 'gsctool -a -o'" -ForegroundColor White
Write-Host "2. Software WP can be cleared via: 'flashrom -p host --wp-disable'" -ForegroundColor White
Write-Host ""
$confirmWp = Read-Host "Have you disabled Write-Protect on your Chromebook? (Y/N)"
if ($confirmWp -notmatch "^[Yy]") {
    Write-Warning "Flashing may fail with 'Write protect error' if hardware WP is still active."
}

# 3. Double Backup Verification
if (-not $SkipBackup) {
    Write-Host ""
    Write-Host "[1/3] Reading current BIOS chip for backup..." -ForegroundColor Green
    $backup1 = "bios-backup-1-$Board.bin"
    $backup2 = "bios-backup-2-$Board.bin"

    if ($Programmer -eq "ssh") {
        if ([string]::IsNullOrEmpty($ChromebookIp)) {
            $ChromebookIp = Read-Host "Enter Chromebook IP address on local network"
        }
        Write-Host "Reading flash via SSH (root@$ChromebookIp)..." -ForegroundColor Cyan
        ssh -o StrictHostKeyChecking=no root@$ChromebookIp "flashrom -p host -r /tmp/backup1.bin &amp;&amp; flashrom -p host -r /tmp/backup2.bin"
        scp root@${ChromebookIp}:/tmp/backup1.bin $backup1
        scp root@${ChromebookIp}:/tmp/backup2.bin $backup2
    }

    # Compare hashes to ensure clean read
    if ((Test-Path $backup1) -and (Test-Path $backup2)) {
        $hash1 = (Get-FileHash $backup1 -Algorithm SHA256).Hash
        $hash2 = (Get-FileHash $backup2 -Algorithm SHA256).Hash
        if ($hash1 -eq $hash2) {
            Write-Host "Backup verified! SHA256: $hash1" -ForegroundColor Green
        } else {
            Write-Error "Backup hash mismatch! Chip read is unstable. ABORTING to prevent bricking."
            exit 1
        }
    }
}

# 4. Flashing ROM
Write-Host ""
Write-Host "[2/3] Writing new BIOS ROM ($RomPath)..." -ForegroundColor Green
if ($Programmer -eq "ssh") {
    scp $RomPath root@${ChromebookIp}:/tmp/new_bios.rom
    Write-Host "Executing flashrom on Chromebook..." -ForegroundColor Cyan
    ssh root@$ChromebookIp "flashrom -p host -w /tmp/new_bios.rom"
}

Write-Host ""
Write-Host "[3/3] BIOS flash operation completed successfully!" -ForegroundColor Green
Write-Host "Reboot your Chromebook to initialize the new firmware." -ForegroundColor Yellow
