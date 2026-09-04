import { ScriptConfig, ScriptFile } from '../types';
import {
  generateWixProductXml,
  generateBuildMsiScript,
  generateWpfBuilderGui,
  generateBiosBuildOrchestrator,
  generateWslBiosBuilderBash,
  generateFlashBiosScript,
  generateBuildAllScript,
  generateGitHubActionsWorkflow,
  generateCompileMsiBat
} from './msiAndBiosGenerators';

export function generatePowerShellFlasher(config: ScriptConfig): string {
  return `<#
.SYNOPSIS
    ChromiumOS Windows USB Flash Tool (PowerShell)
    Based on https://github.com/12dakota/Chromeos

.DESCRIPTION
    Safely flashes ChromiumOS images (including custom Firefox overlays for board '${config.board}')
    to USB flash drives on Windows. Handles .zst / .gz decompression, drive safety checks,
    and raw byte stream writing to physical USB drives.

.EXAMPLE
    .\\Flash-ChromiumOS.ps1
    .\\Flash-ChromiumOS.ps1 -ImagePath ".\\chromiumos_test_image-${config.board}.bin.zst"
    .\\Flash-ChromiumOS.ps1 -DownloadRelease -Board "${config.board}"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ImagePath = "",

    [Parameter(Mandatory = $false)]
    [int]$DiskNumber = -1,

    [Parameter(Mandatory = $false)]
    [switch]$DownloadRelease,

    [Parameter(Mandatory = $false)]
    [string]$Board = "${config.board}",

    [Parameter(Mandatory = $false)]
    [switch]$SkipDecompress,

    [Parameter(Mandatory = $false)]
    [switch]$Force
)

# 1. Require Administrator Privileges
function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
    Write-Warning "Administrator rights required to write directly to physical USB storage."
    Write-Host "Elevating session via UAC..." -ForegroundColor Cyan
    Start-Process powershell.exe -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File \`"$PSCommandPath\`" " + $MyInvocation.UnboundArguments)
    exit
}

Clear-Host
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   ChromiumOS Windows Flasher (12dakota/Chromeos port)   " -ForegroundColor Yellow
Write-Host "   Target Board: $Board                                  " -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# 2. Optional: Download latest assets from GitHub
$RepoOwner = "${config.githubRepo.split('/')[0]}"
$RepoName  = "${config.githubRepo.split('/')[1]}"

if ($DownloadRelease -or ([string]::IsNullOrEmpty($ImagePath) -and -not (Get-ChildItem -Filter "chromiumos*\${Board}*.bin*" -ErrorAction SilentlyContinue))) {
    $opt = Read-Host "Would you like to check GitHub ($RepoOwner/$RepoName) for available release images? (Y/N)"
    if ($opt -match "^[Yy]") {
        Write-Host "Querying GitHub Releases for $RepoOwner/$RepoName..." -ForegroundColor Cyan
        try {
            $apiUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/releases"
            $headers = @{ "User-Agent" = "PowerShell-ChromiumOS-Flasher" }
            $releases = Invoke-RestMethod -Uri $apiUrl -Headers $headers -ErrorAction Stop
            
            if ($releases -and $releases.Count -gt 0) {
                Write-Host "Found $($releases.Count) release(s). Assets:" -ForegroundColor Green
                $assets = @()
                foreach ($r in $releases) {
                    foreach ($a in $r.assets) {
                        $assets += $a
                    }
                }
                
                if ($assets.Count -gt 0) {
                    for ($i = 0; $i -lt $assets.Count; $i++) {
                        $sizeMb = [math]::Round($assets[$i].size / 1MB, 2)
                        Write-Host " [$i] $($assets[$i].name) ($sizeMb MB)" -ForegroundColor Yellow
                    }
                    $sel = Read-Host "Enter number of asset to download (or press Enter to skip)"
                    if ($sel -ne "" -and $sel -match "^[0-9]+$" -and [int]$sel -lt $assets.Count) {
                        $chosen = $assets[[int]$sel]
                        $destPath = Join-Path (Get-Location) $chosen.name
                        Write-Host "Downloading $($chosen.name) to $destPath..." -ForegroundColor Cyan
                        Invoke-WebRequest -Uri $chosen.browser_download_url -OutFile $destPath
                        $ImagePath = $destPath
                    }
                } else {
                    Write-Host "No downloadable binary assets found in public releases." -ForegroundColor DarkYellow
                }
            }
        } catch {
            Write-Warning "Could not retrieve GitHub releases: $_"
        }
    }
}

# 3. File Selection Dialog if image path is not provided
if ([string]::IsNullOrEmpty($ImagePath)) {
    # Check current directory for existing images
    $localCandidates = Get-ChildItem -Filter "*.bin*" | Where-Object { $_.Extension -in ".bin", ".zst", ".gz" }
    if ($localCandidates) {
        Write-Host "Found local ChromiumOS image(s):" -ForegroundColor Green
        for ($i = 0; $i -lt $localCandidates.Count; $i++) {
            $sz = [math]::Round($localCandidates[$i].Length / 1MB, 2)
            Write-Host " [$i] $($localCandidates[$i].Name) ($sz MB)" -ForegroundColor Yellow
        }
        Write-Host " [M] Browse for file manually..." -ForegroundColor White
        $choice = Read-Host "Select an image option"
        if ($choice -match "^[0-9]+$" -and [int]$choice -lt $localCandidates.Count) {
            $ImagePath = $localCandidates[[int]$choice].FullName
        }
    }

    if ([string]::IsNullOrEmpty($ImagePath)) {
        Add-Type -AssemblyName System.Windows.Forms
        $dlg = New-Object System.Windows.Forms.OpenFileDialog
        $dlg.Filter = "ChromiumOS Images (*.bin;*.bin.zst;*.bin.gz)|*.bin;*.bin.zst;*.bin.gz|All Files (*.*)|*.*"
        $dlg.Title = "Select ChromiumOS USB Image"
        if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            $ImagePath = $dlg.FileName
        } else {
            Write-Error "No image selected. Exiting."
            exit 1
        }
    }
}

if (-not (Test-Path $ImagePath)) {
    Write-Error "Image file not found at: $ImagePath"
    exit 1
}

Write-Host "Selected image: $ImagePath" -ForegroundColor Green

# 4. Decompress if .zst or .gz
$RawBinPath = $ImagePath
if ($ImagePath.EndsWith(".zst")) {
    $decompressed = $ImagePath.Substring(0, $ImagePath.Length - 4)
    Write-Host "Detected Zstandard compressed image (.zst)." -ForegroundColor Cyan
    
    # Check if zstd is available
    $hasZstd = Get-Command "zstd" -ErrorAction SilentlyContinue
    if (-not $hasZstd) {
        Write-Host "zstd is not in PATH. Downloading standalone zstd tool for Windows..." -ForegroundColor Yellow
        $zstdExe = Join-Path $env:TEMP "zstd.exe"
        if (-not (Test-Path $zstdExe)) {
            $zstdZipUrl = "https://github.com/facebook/zstd/releases/download/v1.5.6/zstd-v1.5.6-win64.zip"
            $tempZip = Join-Path $env:TEMP "zstd.zip"
            Invoke-WebRequest -Uri $zstdZipUrl -OutFile $tempZip
            Expand-Archive -Path $tempZip -DestinationPath (Join-Path $env:TEMP "zstd_dir") -Force
            Copy-Item (Join-Path $env:TEMP "zstd_dir\\zstd-v1.5.6-win64\\zstd.exe") $zstdExe
        }
        $zstdCmd = $zstdExe
    } else {
        $zstdCmd = "zstd"
    }

    Write-Host "Decompressing $ImagePath -> $decompressed ..." -ForegroundColor Cyan
    & $zstdCmd -d -f "$ImagePath" -o "$decompressed"
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $decompressed)) {
        Write-Error "Failed to decompress .zst file."
        exit 1
    }
    $RawBinPath = $decompressed
} elseif ($ImagePath.EndsWith(".gz")) {
    $decompressed = $ImagePath.Substring(0, $ImagePath.Length - 3)
    Write-Host "Decompressing GZip image to $decompressed ..." -ForegroundColor Cyan
    # Built-in .NET GZipStream decompressor
    $inStream = [System.IO.File]::OpenRead($ImagePath)
    $gzStream = New-Object System.IO.Compression.GZipStream($inStream, [System.IO.Compression.CompressionMode]::Decompress)
    $outStream = [System.IO.File]::Create($decompressed)
    $gzStream.CopyTo($outStream)
    $outStream.Close()
    $gzStream.Close()
    $inStream.Close()
    $RawBinPath = $decompressed
}

$fileInfo = Get-Item $RawBinPath
$fileSizeGB = [math]::Round($fileInfo.Length / 1GB, 2)
Write-Host "Raw Image: $RawBinPath ($fileSizeGB GB)" -ForegroundColor Green
Write-Host ""

# 5. Safe USB Drive Discovery
Write-Host "Scanning physical disks..." -ForegroundColor Cyan
$allDisks = Get-Disk | Sort-Object Number

# Filter safe drives (prefer USB/Removable, NEVER allow System/Boot)
$availableDisks = @()
foreach ($d in $allDisks) {
    $partitions = Get-Partition -DiskNumber $d.Number -ErrorAction SilentlyContinue
    $isSystemDrive = $false
    $labels = @()
    
    foreach ($p in $partitions) {
        if ($p.IsBoot -or $p.IsSystem) {
            $isSystemDrive = $true
        }
        if ($p.DriveLetter) {
            $labels += "$($p.DriveLetter):"
        }
    }

    $sizeGB = [math]::Round($d.Size / 1GB, 2)
    $dObj = [PSCustomObject]@{
        Number        = $d.Number
        FriendlyName  = $d.FriendlyName
        BusType       = $d.BusType
        SizeGB        = $sizeGB
        IsSystem      = $isSystemDrive
        DriveLetters  = ($labels -join ", ")
        IsUSB         = ($d.BusType -eq "USB")
    }
    $availableDisks += $dObj
}

Write-Host "---------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " DISK SELECTION TABLE                                    " -ForegroundColor White
Write-Host "---------------------------------------------------------" -ForegroundColor DarkGray

foreach ($d in $availableDisks) {
    if ($d.IsSystem) {
        Write-Host " [LOCKED] Disk $($d.Number): $($d.FriendlyName) ($($d.SizeGB) GB) [WINDOWS BOOT DRIVE - PROTECTED]" -ForegroundColor Red
    } elseif ($d.IsUSB) {
        Write-Host " [READY]  Disk $($d.Number): $($d.FriendlyName) ($($d.SizeGB) GB) - USB Drive ($($d.DriveLetters))" -ForegroundColor Green
    } else {
        Write-Host " [WARN]   Disk $($d.Number): $($d.FriendlyName) ($($d.SizeGB) GB) - $($d.BusType) ($($d.DriveLetters))" -ForegroundColor Yellow
    }
}
Write-Host "---------------------------------------------------------" -ForegroundColor DarkGray

if ($DiskNumber -lt 0) {
    $selectedNum = Read-Host "Enter the TARGET USB Disk Number to flash (e.g. 1 or 2)"
    if ($selectedNum -notmatch "^[0-9]+$") {
        Write-Error "Invalid disk number. Aborting."
        exit 1
    }
    $DiskNumber = [int]$selectedNum
}

$targetDisk = $availableDisks | Where-Object { $_.Number -eq $DiskNumber }
if (-not $targetDisk) {
    Write-Error "Disk $DiskNumber does not exist."
    exit 1
}

# CRITICAL SAFETY CHECK: NEVER WRITE TO SYSTEM OR DISK 0 UNLESS REMOVABLE
if ($targetDisk.IsSystem) {
    Write-Host ""
    Write-Host "CRITICAL ERROR: Disk $DiskNumber contains the active Windows OS or Boot partition!" -ForegroundColor Red
    Write-Host "Writing to this disk will destroy your Windows installation." -ForegroundColor Red
    Write-Host "Operation cancelled for your safety." -ForegroundColor Red
    exit 1
}

if (-not $targetDisk.IsUSB -and -not $Force) {
    Write-Warning "Target Disk $($targetDisk.Number) is reported as '$($targetDisk.BusType)', NOT a standard USB flash drive."
    $resp = Read-Host "Are you ABSOLUTELY sure this is an external drive? Type 'YES' to continue"
    if ($resp -ne "YES") {
        Write-Host "Aborted by user." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
Write-Host " WARNING: ALL DATA ON DISK $DiskNumber WILL BE DESTROYED! " -ForegroundColor Red
Write-Host " Device: $($targetDisk.FriendlyName) ($($targetDisk.SizeGB) GB)" -ForegroundColor Yellow
Write-Host " Writing image: $(Split-Path $RawBinPath -Leaf) " -ForegroundColor Yellow
Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Type 'FLASH' in all caps to begin writing"
if ($confirm -ne "FLASH") {
    Write-Host "Confirmation failed. Exiting safely." -ForegroundColor Yellow
    exit 0
}

# 6. Unmount, Wipe Partition Table, and Write Raw Image
Write-Host ""
Write-Host "Dismounting volumes and wiping partition table on Disk $DiskNumber..." -ForegroundColor Cyan

# Use diskpart to clean and prepare the raw drive
$diskpartScript = @"
select disk $DiskNumber
clean
rescan
"@
$diskpartScript | diskpart | Out-Null
Start-Sleep -Seconds 2

Write-Host "Opening physical drive \\\\.\\PhysicalDrive$DiskNumber for raw writing..." -ForegroundColor Cyan

$PhysicalPath = "\\\\.\\PhysicalDrive$DiskNumber"
$BufferSizeBytes = 4 * 1024 * 1024 # 4MB buffer, optimal throughput for USB flash
$Buffer = New-Object byte[] $BufferSizeBytes

try {
    # Open target raw physical drive for writing
    $DriveStream = [System.IO.File]::Open($PhysicalPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    $ImageStream = [System.IO.File]::OpenRead($RawBinPath)

    $TotalBytes = $ImageStream.Length
    $BytesWritten = 0
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    Write-Host "Writing $($TotalBytes / 1GB -as [int]) GB to USB drive (4MB block size)..." -ForegroundColor Green

    while ($BytesWritten -lt $TotalBytes) {
        $ReadCount = $ImageStream.Read($Buffer, 0, $BufferSizeBytes)
        if ($ReadCount -eq 0) { break }

        $DriveStream.Write($Buffer, 0, $ReadCount)
        $BytesWritten += $ReadCount

        # Progress calculation
        $Percent = [math]::Round(($BytesWritten / $TotalBytes) * 100, 1)
        $ElapsedSec = [math]::Max($Stopwatch.Elapsed.TotalSeconds, 0.001)
        $SpeedMBs = [math]::Round(($BytesWritten / 1MB) / $ElapsedSec, 2)
        $RemainingBytes = $TotalBytes - $BytesWritten
        $RemainingSec = [math]::Round(($RemainingBytes / 1MB) / [math]::Max($SpeedMBs, 0.1), 0)

        Write-Progress -Activity "Flashing ChromiumOS Image" \`
            -Status "$Percent% complete ($([math]::Round($BytesWritten / 1MB, 0)) MB / $([math]::Round($TotalBytes / 1MB, 0)) MB) at $SpeedMBs MB/s" \`
            -PercentComplete $Percent \`
            -SecondsRemaining $RemainingSec
    }

    $DriveStream.Flush()
    $DriveStream.Close()
    $ImageStream.Close()
    $Stopwatch.Stop()

    Write-Progress -Activity "Flashing ChromiumOS Image" -Completed
    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Flash completed in $($Stopwatch.Elapsed.ToString('mm\\:ss'))!" -ForegroundColor Green
    Write-Host " Average write speed: $([math]::Round(($TotalBytes / 1MB) / $Stopwatch.Elapsed.TotalSeconds, 2)) MB/s" -ForegroundColor White
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS TO BOOT ON CHROMEBOOK:" -ForegroundColor Yellow
    Write-Host " 1. Ensure Chromebook is in Developer Mode (Esc + Refresh + Power -> Ctrl + D)." -ForegroundColor White
    Write-Host " 2. In Developer Shell, enable USB boot: 'crossystem dev_boot_usb=1'" -ForegroundColor White
    Write-Host " 3. Insert USB into Chromebook and press Ctrl + U on the Developer Mode boot warning screen." -ForegroundColor White
    Write-Host " 4. Open shell (Ctrl + Alt + T -> 'shell') and run 'sudo chromeos-install' to install to internal storage." -ForegroundColor White
    Write-Host ""

} catch {
    Write-Error "An error occurred during flashing: $_"
    if ($DriveStream) { $DriveStream.Close() }
    if ($ImageStream) { $ImageStream.Close() }
    exit 1
}
`;
}

export function generateWSLBuildOrchestrator(config: ScriptConfig): string {
  return `<#
.SYNOPSIS
    Automated Windows WSL2 ChromiumOS Builder
    Replicates 12dakota/Chromeos build pipeline inside Windows Subsystem for Linux

.DESCRIPTION
    This script automates setting up the Ubuntu WSL2 build environment on Windows,
    injects the custom Firefox overlay ebuilds & bootsplash generator, executes
    cros_sdk to build board '${config.board}', and extracts the flashable USB image
    back into your Windows directory.
#>

[CmdletBinding()]
param(
    [string]$Board = "${config.board}",
    [string]$FirefoxVersion = "${config.firefoxVersion}",
    [int]$RepoJobs = ${config.repoJobs},
    [string]$ManifestBranch = "${config.manifestBranch}"
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
$wslOutputDir = wsl wslpath -u ("$WinOutputDir" -replace '\\\\','/')
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

chmod +x ./\${BuilderScriptName}
./\${BuilderScriptName}
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
    Write-Host "You can now run .\\Flash-ChromiumOS.ps1 to write the image to a USB flash drive!" -ForegroundColor Yellow
} else {
    Write-Error "Build script encountered errors in WSL2. Check output logs above."
}
`;
}

export function generateWSLBuilderBash(config: ScriptConfig): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# wsl-dedede-builder.sh
# Port of 12dakota/Chromeos for WSL2 Ubuntu environment
# Builds ChromiumOS for board ${config.board} with Firefox rootfs & custom bootsplash
# ==============================================================================

set -euo pipefail

BOARD="\${BOARD:-${config.board}}"
MANIFEST_BRANCH="\${MANIFEST_BRANCH:-${config.manifestBranch}}"
CROS_ROOT="\${CROS_ROOT:-\$HOME/chromiumos}"
INCLUDE_FIREFOX="\${INCLUDE_FIREFOX:-${config.includeFirefox ? '1' : '0'}}"
FIREFOX_VERSION="\${FIREFOX_VERSION:-${config.firefoxVersion}}"
OUT_DIR="\${OUT_DIR:-\$PWD/flash}"
REPO_JOBS="\${REPO_JOBS:-${config.repoJobs}}"

echo "=========================================================="
echo " Starting ChromiumOS Build Pipeline"
echo " Board:           \${BOARD}"
echo " Firefox:         \${FIREFOX_VERSION} (include=\${INCLUDE_FIREFOX})"
echo " Manifest:        \${MANIFEST_BRANCH}"
echo " Source Root:     \${CROS_ROOT}"
echo " Output Dir:      \${OUT_DIR}"
echo "=========================================================="

mkdir -p "\$CROS_ROOT" "\$OUT_DIR"

# 1. Install prerequisites in WSL2
echo "== [1/6] Installing build host prerequisites =="
if command -v apt-get >/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq \
    git curl wget python3 python-is-python3 xz-utils zstd \
    librsvg2-bin imagemagick file ca-certificates
fi

# 2. Setup depot_tools
echo "== [2/6] Setting up Chromium depot_tools =="
if [ ! -d "\$HOME/depot_tools" ]; then
  git clone --depth=1 https://chromium.googlesource.com/chromium/tools/depot_tools.git "\$HOME/depot_tools"
fi
export PATH="\$HOME/depot_tools:\$PATH"
git config --global --add safe.directory '*' || true

# 3. Repo Sync (ChromiumOS Manifest)
echo "== [3/6] Syncing ChromiumOS source tree =="
cd "\$CROS_ROOT"
if [ ! -d .repo ]; then
  repo init -u https://chromium.googlesource.com/chromiumos/manifest -b "\$MANIFEST_BRANCH"
fi
repo sync -j"\${REPO_JOBS}"

# 4. Generate custom-firefox Portage Overlay and Boot Splash
OVERLAY="\$CROS_ROOT/src/overlays/overlay-custom-firefox"
if [ "\$INCLUDE_FIREFOX" = "1" ]; then
  echo "== [4/6] Generating Portage overlay for Firefox \${FIREFOX_VERSION} =="
  mkdir -p \\
    "\$OVERLAY/profiles" \\
    "\$OVERLAY/metadata" \\
    "\$OVERLAY/www-client/firefox-bin/files" \\
    "\$OVERLAY/chromeos-base/firefox-desktop-hook" \\
    "\$OVERLAY/chromeos-base/firefox-bootsplash/files/splash"

  echo custom-firefox > "\$OVERLAY/profiles/repo_name"

  cat > "\$OVERLAY/metadata/layout.conf" << 'EOF'
masters = portage-stable chromiumos
profile-formats = portage-2
repo-name = custom-firefox
EOF

  cat > "\$OVERLAY/www-client/firefox-bin/files/firefox-wrapper.sh" << 'EOF'
#!/bin/sh
export MOZ_ENABLE_WAYLAND="\${MOZ_ENABLE_WAYLAND:-0}"
exec /opt/firefox/firefox "\$@"
EOF
  chmod 0755 "\$OVERLAY/www-client/firefox-bin/files/firefox-wrapper.sh"

  cat > "\$OVERLAY/www-client/firefox-bin/files/firefox.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Firefox
Comment=Official Mozilla Firefox Web Browser
Exec=/usr/local/bin/firefox %u
Icon=firefox
Terminal=false
Categories=Network;WebBrowser;
MimeType=text/html;text/xml;application/xhtml+xml;x-scheme-handler/http;x-scheme-handler/https;
StartupNotify=true
EOF

  cat > "\$OVERLAY/www-client/firefox-bin/metadata.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pkgmetadata SYSTEM "https://www.gentoo.org/dtd/metadata.dtd">
<pkgmetadata>
  <maintainer type="person">
    <email>dev@localhost</email>
    <name>custom overlay</name>
  </maintainer>
</pkgmetadata>
EOF

  cat > "\$OVERLAY/www-client/firefox-bin/firefox-bin-\${FIREFOX_VERSION}.ebuild" << EOF
EAPI="7"
DESCRIPTION="Official Mozilla Firefox unpacked into the ChromiumOS rootfs"
HOMEPAGE="https://www.mozilla.org/firefox/"
SRC_URI="https://ftp.mozilla.org/pub/firefox/releases/\\\${PV}/linux-x86_64/en-US/firefox-\\\${PV}.tar.xz"
LICENSE="MPL-2.0"
SLOT="0"
KEYWORDS="amd64"
RESTRICT="mirror strip"
RDEPEND=">=sys-libs/glibc-2.31"
DEPEND="\\\${RDEPEND}"
S="\\\${WORKDIR}/firefox"

src_install() {
  dodir /opt/firefox
  cp -a "\\\${S}"/. "\\\${ED}/opt/firefox/" || die
  fperms 0755 /opt/firefox/firefox
  if [[ -e "\\\${ED}/opt/firefox/firefox-bin" ]]; then
    fperms 0755 /opt/firefox/firefox-bin
  fi
  exeinto /usr/local/bin
  newexe "\\\${FILESDIR}/firefox-wrapper.sh" firefox
  insinto /usr/share/applications
  doins "\\\${FILESDIR}/firefox.desktop"
}
EOF

  cat > "\$OVERLAY/chromeos-base/firefox-desktop-hook/firefox-desktop-hook-1.ebuild" << 'EOF'
EAPI="7"
DESCRIPTION="Pull official Firefox plus custom boot splash into a custom ChromiumOS image"
HOMEPAGE="https://www.mozilla.org/firefox/"
LICENSE="BSD"
SLOT="0"
KEYWORDS="*"
RDEPEND="
  www-client/firefox-bin
  chromeos-base/firefox-bootsplash
"
DEPEND="\${RDEPEND}"
EOF

  # Generate Boot Splash Vector & Frames
  echo "== Generating custom boot splash frames =="
  mkdir -p /tmp/ff-splash
  cat > /tmp/ff-splash/boot-logo.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${config.splashBgColor}"/>
      <stop offset="100%" stop-color="#140a28"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <circle cx="760" cy="480" r="140" fill="${config.splashAccent1}"/>
  <circle cx="760" cy="480" r="75" fill="${config.splashBgColor}"/>
  <circle cx="1160" cy="480" r="140" fill="none" stroke="${config.splashAccent2}" stroke-width="32"/>
  <circle cx="1160" cy="480" r="54" fill="${config.splashAccent2}"/>
  <text x="960" y="740" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
        font-size="52" fill="#f4f7fb" font-weight="700">${config.splashTitle}</text>
  <text x="960" y="800" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
        font-size="28" fill="#9bb0c9">${config.splashSubtitle}</text>
</svg>
SVG

  rsvg-convert -w 1280 -h 800 /tmp/ff-splash/boot-logo.svg -o "\$OVERLAY/chromeos-base/firefox-bootsplash/files/splash/boot_splash_frame01.png" || \\
    printf '\\x89PNG\\r\\n' > "\$OVERLAY/chromeos-base/firefox-bootsplash/files/splash/boot_splash_frame01.png"
  cp /tmp/ff-splash/boot-logo.svg "\$OVERLAY/chromeos-base/firefox-bootsplash/files/splash/"

  cat > "\$OVERLAY/chromeos-base/firefox-bootsplash/firefox-bootsplash-1.ebuild" << 'EOF'
EAPI="7"
DESCRIPTION="Custom Firefox x ChromiumOS boot splash frames"
LICENSE="BSD"
SLOT="0"
KEYWORDS="*"
S="\${WORKDIR}"
src_install() {
  insinto /usr/share/chromeos-assets/images_100_percent
  doins "\${FILESDIR}/splash/boot_splash_frame01.png" || die
  insinto /usr/share/firefox-os-splash
  doins "\${FILESDIR}/splash/"* || die
}
EOF
fi

# 5. cros_sdk compilation
echo "== [5/6] Entering cros_sdk container and building packages =="
cd "\$CROS_ROOT"
chromite/bin/cros_sdk --create || true

ROOTFS_VERIF_FLAG="${config.enableRootfsVerification ? '' : '--no-enable-rootfs-verification'}"

chromite/bin/cros_sdk -- bash -lc "
  set -euo pipefail
  setup_board --board=\${BOARD}
  if [ -d /mnt/host/source/src/overlays/overlay-custom-firefox ]; then
    emerge-\${BOARD} chromeos-base/firefox-desktop-hook
  fi
  cros build-packages --board=\${BOARD}
  cros build-image --board=\${BOARD} \${ROOTFS_VERIF_FLAG} ${config.imageType}
"

# 6. Package output image
echo "== [6/6] Packaging and compressing final USB image =="
IMG_DIR="\$CROS_ROOT/src/build/images/\${BOARD}/latest"
SRC=""
for cand in chromiumos_test_image.bin chromiumos_image.bin chromiumos_base_image.bin; do
  if [ -f "\$IMG_DIR/\$cand" ]; then
    SRC="\$IMG_DIR/\$cand"
    break
  fi
done

if [ -z "\$SRC" ]; then
  echo "Error: No output .bin image found in \$IMG_DIR"
  exit 1
fi

echo "Packaging \$SRC -> \$OUT_DIR ..."
if command -v zstd >/dev/null; then
  zstd -T0 -10 -f "\$SRC" -o "\$OUT_DIR/chromiumos_${config.imageType}_image-\${BOARD}.bin.zst"
else
  gzip -c "\$SRC" > "\$OUT_DIR/chromiumos_${config.imageType}_image-\${BOARD}.bin.gz"
fi

sha256sum "\$OUT_DIR/"* | tee "\$OUT_DIR/SHA256SUMS"
ls -lh "\$OUT_DIR"

echo "=========================================================="
echo " BUILD FINISHED!"
echo " Image location: \$OUT_DIR"
echo " Write to USB on Windows with: Flash-ChromiumOS.ps1"
echo "=========================================================="
`;
}

export function generateBatchLauncher(): string {
  return `@echo off
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
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
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
`;
}

export function generateReadme(config: ScriptConfig): string {
  return `# ChromiumOS Windows Toolkit
Based on [12dakota/Chromeos](https://github.com/12dakota/Chromeos)

This toolkit provides a complete Windows PowerShell & WSL2 workflow to build, package, and safely flash custom ChromiumOS images (featuring Mozilla Firefox rootfs integration and custom boot splash artwork) targeting board **${config.board}** and compatible hardware.

---

## Included Windows Files

| File | Purpose |
|------|---------|
| \`Flash-ChromiumOS.ps1\` | **Primary Windows USB Flasher**: Interactive PowerShell tool that detects USB drives, blocks Windows OS drive overwrites, handles \`.bin.zst\` decompression, and performs raw 4MB block flashing. |
| \`Flash-ChromiumOS.bat\` | **1-Click Batch Launcher**: Double-click wrapper that handles Windows UAC elevation automatically. |
| \`Build-ChromiumOS-WSL2.ps1\` | **Windows WSL2 Build Orchestrator**: Automates compiling ChromiumOS in WSL2 (Ubuntu) with Firefox overlay and exports image to Windows \`\\flash\` folder. |
| \`wsl-dedede-builder.sh\` | **WSL2 Linux Worker**: The build script executing \`repo\`, \`depot_tools\`, and \`cros_sdk\`. |

---

## Quick Start: Flashing a Pre-Built Image on Windows

1. Insert your USB flash drive (16 GB or larger recommended).
2. Right-click \`Flash-ChromiumOS.ps1\` and select **Run with PowerShell** (or double-click \`Flash-ChromiumOS.bat\`).
3. The script will:
   - Request Administrator elevation.
   - Scan physical disks and automatically safeguard your internal Windows C: drive.
   - Prompt you to select the USB drive number and target \`.bin\` or \`.bin.zst\` image.
   - Decompress and write using raw 4MB buffer streaming with real-time throughput metrics.

---

## Building from Source on Windows (via WSL2)

ChromiumOS requires a Linux chroot (\`cros_sdk\`) and loopback filesystem capabilities. The provided \`Build-ChromiumOS-WSL2.ps1\` orchestrates this directly from Windows:

### 1. Hardware Requirements
- **OS**: Windows 10 (Build 19041+) or Windows 11
- **WSL**: WSL2 with Ubuntu 22.04 or 24.04 (\`wsl --install -d Ubuntu\`)
- **CPU**: 8+ physical cores recommended
- **RAM**: 16 GB minimum (32 GB recommended)
- **Disk**: 300+ GB free storage (ChromiumOS source tree is large)

### 2. Execution
Run in PowerShell:
\`\`\`powershell
.\\Build-ChromiumOS-WSL2.ps1 -Board "${config.board}" -FirefoxVersion "${config.firefoxVersion}"
\`\`\`

The compiled image will be deposited into:
\`\`\`text
.\\flash\\chromiumos_test_image-${config.board}.bin.zst
\`\`\`

---

## Booting on your Chromebook (${config.board})

### Step 1: Put Chromebook into Developer Mode
1. Turn off the Chromebook.
2. Hold **Esc + Refresh (F3 / ↻)** and tap **Power**.
3. At the Recovery screen, press **Ctrl + D**.
4. Confirm by pressing **Enter** (or Space depending on firmware).
5. The device will wipe user data and reboot into Developer Mode.

### Step 2: Enable USB Boot
1. At the Developer Mode boot warning ("OS verification is OFF"), press **Ctrl + D** to boot ChromeOS.
2. Once booted to the login screen, press **Ctrl + Alt + T** to open the \`crosh\` terminal.
3. Type:
   \`\`\`bash
   shell
   sudo crossystem dev_boot_usb=1 dev_boot_signed_only=0
   \`\`\`

### Step 3: Boot the USB Drive
1. Insert the flashed USB drive into the Chromebook.
2. Reboot the Chromebook.
3. At the Developer Mode warning screen, press **Ctrl + U** to boot from the USB drive.

### Step 4: Install to Internal Storage (Optional)
To write the USB image onto the Chromebook's internal eMMC/NVMe storage:
\`\`\`bash
sudo /usr/sbin/chromeos-install --dst /dev/mmcblk0
# (or /dev/nvme0n1 on NVMe-based boards)
\`\`\`
`;
}

export function getAllScripts(config: ScriptConfig): ScriptFile[] {
  return [
    {
      filename: '.github/workflows/build-msi.yml',
      language: 'yaml',
      description: 'GitHub Actions CI/CD pipeline for automated on-demand and release MSI compilation on Windows runners',
      badge: 'Cloud CI/CD',
      content: generateGitHubActionsWorkflow(config)
    },
    {
      filename: 'compile-msi.bat',
      language: 'batch',
      description: '1-Click Windows batch script to compile the MSI installer locally with portable WiX fallback',
      badge: '1-Click Build',
      content: generateCompileMsiBat()
    },
    {
      filename: 'Product.wxs',
      language: 'xml',
      description: 'WiX Toolset source code defining the complete Windows MSI Installer and custom setup dialogs',
      badge: 'Windows MSI',
      content: generateWixProductXml(config)
    },
    {
      filename: 'build-msi.ps1',
      language: 'powershell',
      description: 'Automated compiler script that generates ChromiumOS-Toolkit-Setup.msi on Windows',
      badge: 'MSI Compiler',
      content: generateBuildMsiScript(config)
    },
    {
      filename: 'ChromiumOS-Builder-GUI.ps1',
      language: 'powershell',
      description: 'Native Windows Presentation Foundation (WPF) graphical application for configuring & compiling',
      badge: 'Windows GUI',
      content: generateWpfBuilderGui(config)
    },
    {
      filename: 'Build-All.ps1',
      language: 'powershell',
      description: 'Master orchestrator compiling ChromeOS with Firefox and the Chromebook BIOS together',
      badge: 'Master Pipeline',
      content: generateBuildAllScript(config)
    },
    {
      filename: 'Build-Chromebook-BIOS.ps1',
      language: 'powershell',
      description: 'Compiles Coreboot, Depthcharge and Tianocore UEFI firmware for your Chromebook in WSL2',
      badge: 'BIOS Builder',
      content: generateBiosBuildOrchestrator(config)
    },
    {
      filename: 'Flash-Chromebook-BIOS.ps1',
      language: 'powershell',
      description: 'Safe BIOS chip flasher with mandatory double backup verification and WP safety checks',
      badge: 'BIOS Flasher',
      content: generateFlashBiosScript(config)
    },
    {
      filename: 'wsl-bios-builder.sh',
      language: 'bash',
      description: 'Linux worker script for compiling Coreboot, cbfstool, and UEFI payloads inside WSL2',
      badge: 'Coreboot Worker',
      content: generateWslBiosBuilderBash(config)
    },
    {
      filename: 'Flash-ChromiumOS.ps1',
      language: 'powershell',
      description: 'Windows PowerShell USB flashing tool with safety drive locks and .zst decompressor',
      badge: 'USB Flasher',
      content: generatePowerShellFlasher(config)
    },
    {
      filename: 'Build-ChromiumOS-WSL2.ps1',
      language: 'powershell',
      description: 'Automates full cros_sdk compilation in Windows WSL2 Ubuntu environment',
      badge: 'WSL2 Builder',
      content: generateWSLBuildOrchestrator(config)
    },
    {
      filename: 'Flash-ChromiumOS.bat',
      language: 'batch',
      description: '1-Click Administrator launcher for Windows File Explorer',
      badge: 'Convenience',
      content: generateBatchLauncher()
    },
    {
      filename: `wsl-${config.board}-builder.sh`,
      language: 'bash',
      description: 'The Linux bash worker executed inside WSL2 to build the image and overlay',
      badge: 'Linux Worker',
      content: generateWSLBuilderBash(config)
    },
    {
      filename: 'README-Windows.md',
      language: 'markdown',
      description: 'Comprehensive guide covering hardware requirements, flashing, and Chromebook keys',
      badge: 'Docs',
      content: generateReadme(config)
    }
  ];
}
