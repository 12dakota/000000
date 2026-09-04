<#
.SYNOPSIS
    ChromiumOS Windows USB Flash Tool (PowerShell)
    Based on https://github.com/12dakota/Chromeos

.DESCRIPTION
    Safely flashes ChromiumOS images (including custom Firefox overlays for board 'dedede')
    to USB flash drives on Windows. Handles .zst / .gz decompression, drive safety checks,
    and raw byte stream writing to physical USB drives.

.EXAMPLE
    .\Flash-ChromiumOS.ps1
    .\Flash-ChromiumOS.ps1 -ImagePath ".\chromiumos_test_image-dedede.bin.zst"
    .\Flash-ChromiumOS.ps1 -DownloadRelease -Board "dedede"
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
    [string]$Board = "dedede",

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
    Start-Process powershell.exe -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" " + $MyInvocation.UnboundArguments)
    exit
}

Clear-Host
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   ChromiumOS Windows Flasher (12dakota/Chromeos port)   " -ForegroundColor Yellow
Write-Host "   Target Board: $Board                                  " -ForegroundColor White
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# 2. Optional: Download latest assets from GitHub
$RepoOwner = "https:"
$RepoName  = ""

if ($DownloadRelease -or ([string]::IsNullOrEmpty($ImagePath) -and -not (Get-ChildItem -Filter "chromiumos*${Board}*.bin*" -ErrorAction SilentlyContinue))) {
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
            Copy-Item (Join-Path $env:TEMP "zstd_dir\zstd-v1.5.6-win64\zstd.exe") $zstdExe
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

Write-Host "Opening physical drive \\.\PhysicalDrive$DiskNumber for raw writing..." -ForegroundColor Cyan

$PhysicalPath = "\\.\PhysicalDrive$DiskNumber"
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

        Write-Progress -Activity "Flashing ChromiumOS Image" `
            -Status "$Percent% complete ($([math]::Round($BytesWritten / 1MB, 0)) MB / $([math]::Round($TotalBytes / 1MB, 0)) MB) at $SpeedMBs MB/s" `
            -PercentComplete $Percent `
            -SecondsRemaining $RemainingSec
    }

    $DriveStream.Flush()
    $DriveStream.Close()
    $ImageStream.Close()
    $Stopwatch.Stop()

    Write-Progress -Activity "Flashing ChromiumOS Image" -Completed
    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Flash completed in $($Stopwatch.Elapsed.ToString('mm\:ss'))!" -ForegroundColor Green
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
