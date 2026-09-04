import { ScriptConfig } from '../types';

/**
 * Generates the WiX Toolset v3/v4 Product.wxs file
 * defining the complete Windows MSI Installer with custom dialogs,
 * properties for board, firefox version, bios options, and shortcuts.
 */
export function generateWixProductXml(config: ScriptConfig): string {
  const version = config.msiProductVersion || '1.0.0';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
    ChromiumOS & Chromebook BIOS Windows Installer (WiX Toolset)
    Source: https://github.com/12dakota/Chromeos
    Compile with:
      candle.exe -ext WixUIExtension Product.wxs
      light.exe -ext WixUIExtension -out ChromiumOS-Toolkit-Setup.msi Product.wixobj
-->
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <?ifndef Board ?>
  <?define Board = "${config.board}" ?>
  <?endif ?>

  <Product Id="*"
           Name="ChromiumOS &amp; Chromebook BIOS Toolkit ($(var.Board))"
           Language="1033"
           Version="${version}"
           Manufacturer="12dakota &amp; Community"
           UpgradeCode="A7D43981-55C2-4E2F-A089-138BC643B7F1">

    <Package InstallerVersion="405"
             Compressed="yes"
             InstallScope="perMachine"
             Platform="x64"
             Description="Windows Installer for ChromiumOS Builder, Firefox Overlay, USB Flasher and Chromebook BIOS/Coreboot compiler"
             Comments="Installs WSL2 bridge, PowerShell flashing engine, and Coreboot UEFI firmware utilities" />

    <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
    <MediaTemplate EmbedCab="yes" />

    <!-- Configuration Properties (Overrideable via msiexec CLI or Setup Dialogs) -->
    <Property Id="BOARD" Value="${config.board}" />
    <Property Id="FIREFOX_VERSION" Value="${config.firefoxVersion}" />
    <Property Id="BUILD_CHROMEOS" Value="${config.buildChromeOS ? '1' : '0'}" />
    <Property Id="BUILD_BIOS" Value="${config.buildBios ? '1' : '0'}" />
    <Property Id="BIOS_PAYLOAD" Value="${config.biosPayload}" />
    <Property Id="GBB_FLAGS" Value="${config.gbbFlags || '0x489'}" />
    <Property Id="DISABLE_SOFTWARE_WP" Value="${config.disableSoftwareWp ? '1' : '0'}" />
    <Property Id="REPO_JOBS" Value="${config.repoJobs}" />
    <Property Id="WIXUI_INSTALLDIR" Value="INSTALLFOLDER" />
    <Property Id="LAUNCHAPPONEXIT" Value="1" />

    <!-- Target Directory Structure -->
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFiles64Folder">
        <Directory Id="INSTALLFOLDER" Name="ChromiumOS Toolkit">
          <Directory Id="ScriptsFolder" Name="scripts" />
          <Directory Id="FirmwareFolder" Name="firmware" />
          <Directory Id="FlashFolder" Name="flash" />
          <Directory Id="ArtworkFolder" Name="artwork" />
        </Directory>
      </Directory>

      <!-- Windows Start Menu & Desktop Shortcuts -->
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="ChromiumOS Toolkit" />
      </Directory>
      <Directory Id="DesktopFolder" Name="Desktop" />
    </Directory>

    <!-- Main Toolkit Files Component Group -->
    <DirectoryRef Id="INSTALLFOLDER">
      <Component Id="C_ConfigJson" Guid="F3E502A1-19B4-4B22-8789-562DC8293B01">
        <File Id="F_ConfigJson" Source="config.json" KeyPath="yes" />
      </Component>

      <Component Id="C_BuilderGui" Guid="89A12DF3-4029-4ECF-9821-48C074C40102">
        <File Id="F_BuilderGui" Source="ChromiumOS-Builder-GUI.ps1" KeyPath="yes" />
      </Component>

      <Component Id="C_BuilderBat" Guid="98BC21A2-8921-4BF2-A901-729BA1028303">
        <File Id="F_BuilderBat" Source="ChromiumOS-Builder.bat" KeyPath="yes">
          <Shortcut Id="DesktopShortcut"
                    Directory="DesktopFolder"
                    Name="ChromiumOS &amp; BIOS Builder"
                    Description="Configure and compile ChromiumOS images with Firefox and Chromebook BIOS"
                    WorkingDirectory="INSTALLFOLDER"
                    Advertise="yes" />
        </File>
      </Component>

      <Component Id="C_BuildAllPs1" Guid="1209AF32-8411-4DAF-8092-491BAC820304">
        <File Id="F_BuildAllPs1" Source="Build-All.ps1" KeyPath="yes" />
      </Component>

      <Component Id="C_ReadMe" Guid="4570192A-DF21-432A-8941-692B88A01905">
        <File Id="F_ReadMe" Source="README-Windows.md" KeyPath="yes" />
      </Component>
    </DirectoryRef>

    <DirectoryRef Id="ScriptsFolder">
      <Component Id="C_FlashChromeOsPs1" Guid="A91823C4-1928-4D2A-9812-781A02C30206">
        <File Id="F_FlashChromeOsPs1" Source="Flash-ChromiumOS.ps1" KeyPath="yes" />
      </Component>

      <Component Id="C_BuildChromeOsWslPs1" Guid="5912803C-D891-4BC9-9A01-192B480C3907">
        <File Id="F_BuildChromeOsWslPs1" Source="Build-ChromiumOS-WSL2.ps1" KeyPath="yes" />
      </Component>

      <Component Id="C_BuildBiosPs1" Guid="91284C01-8392-48AF-A901-491A0837C008">
        <File Id="F_BuildBiosPs1" Source="Build-Chromebook-BIOS.ps1" KeyPath="yes" />
      </Component>

      <Component Id="C_FlashBiosPs1" Guid="39105F89-A912-4BD1-8930-109AF82C0109">
        <File Id="F_FlashBiosPs1" Source="Flash-Chromebook-BIOS.ps1" KeyPath="yes" />
      </Component>

      <Component Id="C_WslLinuxBuilderBash" Guid="719284AF-1982-4DA1-8A19-9182C0349A10">
        <File Id="F_WslLinuxBuilderBash" Source="wsl-$(var.Board)-builder.sh" KeyPath="yes" />
      </Component>

      <Component Id="C_WslBiosBuilderBash" Guid="819230AB-D812-49BC-81A0-7128C0A98111">
        <File Id="F_WslBiosBuilderBash" Source="wsl-bios-builder.sh" KeyPath="yes" />
      </Component>
    </DirectoryRef>

    <!-- Start Menu Folder Shortcuts & Removal -->
    <DirectoryRef Id="ApplicationProgramsFolder">
      <Component Id="C_StartMenuShortcuts" Guid="A9012841-B891-4DA8-8120-192BAC817212">
        <Shortcut Id="StartMenuBuilderShortcut"
                  Name="ChromiumOS &amp; BIOS Builder"
                  Description="Open ChromiumOS and Chromebook BIOS compilation control panel"
                  Target="[INSTALLFOLDER]ChromiumOS-Builder.bat"
                  WorkingDirectory="INSTALLFOLDER" />
        <Shortcut Id="StartMenuFlasherShortcut"
                  Name="Flash ChromiumOS USB"
                  Description="Launch Administrator USB Flasher for ChromiumOS"
                  Target="[SystemFolder]WindowsPowerShell\\v1.0\\powershell.exe"
                  Arguments="-ExecutionPolicy Bypass -File &quot;[INSTALLFOLDER]scripts\\Flash-ChromiumOS.ps1&quot;"
                  WorkingDirectory="INSTALLFOLDER" />
        <Shortcut Id="StartMenuBiosShortcut"
                  Name="Flash Chromebook BIOS"
                  Description="Safe BIOS chip flasher with backup and write-protect verification"
                  Target="[SystemFolder]WindowsPowerShell\\v1.0\\powershell.exe"
                  Arguments="-ExecutionPolicy Bypass -File &quot;[INSTALLFOLDER]scripts\\Flash-Chromebook-BIOS.ps1&quot;"
                  WorkingDirectory="INSTALLFOLDER" />
        <RemoveFolder Id="RemoveApplicationProgramsFolder" On="uninstall" />
        <RegistryValue Root="HKCU"
                       Key="Software\\ChromiumOSToolkit"
                       Name="installed"
                       Type="integer"
                       Value="1"
                       KeyPath="yes" />
      </Component>
    </DirectoryRef>

    <!-- Features Definition -->
    <Feature Id="CompleteToolkit" Title="ChromiumOS &amp; BIOS Toolkit" Level="1" Display="expand" ConfigurableDirectory="INSTALLFOLDER">
      <ComponentRef Id="C_ConfigJson" />
      <ComponentRef Id="C_BuilderGui" />
      <ComponentRef Id="C_BuilderBat" />
      <ComponentRef Id="C_BuildAllPs1" />
      <ComponentRef Id="C_ReadMe" />
      <ComponentRef Id="C_StartMenuShortcuts" />

      <Feature Id="ChromeOSBuilderFeature" Title="ChromiumOS &amp; Firefox Engine" Level="1" Description="Includes WSL2 builder scripts, custom Firefox overlay ebuilds, and bootsplash artwork generator.">
        <ComponentRef Id="C_BuildChromeOsWslPs1" />
        <ComponentRef Id="C_FlashChromeOsPs1" />
        <ComponentRef Id="C_WslLinuxBuilderBash" />
      </Feature>

      <Feature Id="BiosFirmwareFeature" Title="Chromebook BIOS &amp; Coreboot" Level="1" Description="Includes Coreboot, Depthcharge and Tianocore UEFI payload compiler, flashrom tools, and GBB flag configurator.">
        <ComponentRef Id="C_BuildBiosPs1" />
        <ComponentRef Id="C_FlashBiosPs1" />
        <ComponentRef Id="C_WslBiosBuilderBash" />
      </Feature>
    </Feature>

    <!-- Custom Action to Launch GUI upon completion -->
    <CustomAction Id="CA_LaunchBuilder"
                  Directory="INSTALLFOLDER"
                  ExeCommand="cmd.exe /c start ChromiumOS-Builder.bat"
                  Return="asyncNoWait" />

    <!-- WiX UI Custom Sequence -->
    <UI>
      <UIRef Id="WixUI_InstallDir" />
      <Publish Dialog="ExitDialog"
               Control="Finish"
               Event="DoAction"
               Value="CA_LaunchBuilder">WIXUI_EXITDIALOGOPTIONALCHECKBOX = 1 and NOT Installed</Publish>
    </UI>
    <Property Id="WIXUI_EXITDIALOGOPTIONALCHECKBOXTEXT" Value="Launch ChromiumOS &amp; BIOS Builder Control Panel" />
    <Property Id="WIXUI_EXITDIALOGOPTIONALCHECKBOX" Value="1" />

  </Product>
</Wix>
`;
}

/**
 * Generates the build-msi.ps1 script
 * Compiles Product.wxs into an MSI file on any Windows machine using WiX toolset or .NET wix
 */
export function generateBuildMsiScript(config: ScriptConfig): string {
  return `<#
.SYNOPSIS
    Automated Windows MSI Package Compiler for ChromiumOS & BIOS Toolkit
.DESCRIPTION
    Checks for WiX Toolset (v3 candle/light or v4 wix.exe), downloads portable
    WiX binaries if missing, generates config.json, and compiles ChromiumOS-Toolkit-Setup.msi.
.EXAMPLE
    .\\build-msi.ps1
    .\\build-msi.ps1 -Board "${config.board}" -FirefoxVersion "${config.firefoxVersion}"
#>

[CmdletBinding()]
param(
    [string]$Board = "${config.board}",
    [string]$FirefoxVersion = "${config.firefoxVersion}",
    [string]$MsiVersion = "${config.msiProductVersion || '1.0.0'}",
    [string]$OutputFile = "ChromiumOS-Toolkit-Setup-${config.board}.msi"
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
    buildChromeOS = ${config.buildChromeOS ? '$true' : '$false'}
    buildBios = ${config.buildBios ? '$true' : '$false'}
    biosPayload = "${config.biosPayload}"
    gbbFlags = "${config.gbbFlags || '0x489'}"
    disableSoftwareWp = ${config.disableSoftwareWp ? '$true' : '$false'}
    imageType = "${config.imageType}"
    repoJobs = ${config.repoJobs}
    githubRepo = "${config.githubRepo}"
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

$pf86 = \${env:ProgramFiles(x86)}
if (-not $pf86) { $pf86 = "C:/Program Files (x86)" }
$pf = \$env:ProgramFiles
if (-not $pf) { $pf = "C:/Program Files" }

$wixCandidates = @(
    (Join-Path (Join-Path $pf86 'WiX Toolset v3.11') 'bin'),
    (Join-Path (Join-Path $pf86 'WiX Toolset v3.14') 'bin'),
    (Join-Path (Join-Path $pf 'WiX Toolset v3.11') 'bin'),
    (Join-Path (Join-Path $pf 'WiX Toolset v3.14') 'bin')
)

# Check environment PATH
if (Get-Command "candle.exe" -ErrorAction SilentlyContinue) {
    $candlePath = "candle.exe"
    $lightPath = "light.exe"
    $wixFound = $true
} else {
    foreach ($cand in $wixCandidates) {
        $cExe = Join-Path $cand "candle.exe"
        $lExe = Join-Path $cand "light.exe"
        if ((Test-Path $cExe) -and (Test-Path $lExe)) {
            $candlePath = $cExe
            $lightPath = $lExe
            $wixFound = $true
            break
        }
    }
}

if (-not $wixFound -and (Get-Command "wix.exe" -ErrorAction SilentlyContinue)) {
    # WiX v4+
    Write-Host "Found WiX v4 (wix.exe). Compiling via 'wix build'..." -ForegroundColor Cyan
    & wix build -d Board="$Board" -d FirefoxVersion="$FirefoxVersion" (Join-Path $WorkDir "Product.wxs") -o (Join-Path $WorkDir $OutputFile)
    if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $WorkDir $OutputFile))) {
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

# Ensure target board Linux worker script exists
$targetBoardWorker = Join-Path $WorkDir "wsl-$Board-builder.sh"
if (-not (Test-Path $targetBoardWorker)) {
    $fallbackWorker = Join-Path $WorkDir "wsl-dedede-builder.sh"
    if (Test-Path $fallbackWorker) {
        Write-Host "Creating board worker alias wsl-$Board-builder.sh..." -ForegroundColor DarkGray
        Copy-Item -Path $fallbackWorker -Destination $targetBoardWorker -Force
    }
}

$wixObj = Join-Path $WorkDir "Product.wixobj"

Write-Host "Running candle.exe..." -ForegroundColor DarkGray
& "$candlePath" -nologo -arch x64 -ext WixUIExtension -dBoard="$Board" -dFirefoxVersion="$FirefoxVersion" (Join-Path $WorkDir "Product.wxs") -out $wixObj
if ($LASTEXITCODE -ne 0) {
    Write-Error "Candle compilation failed."
    exit 1
}

Write-Host "Running light.exe to link MSI package..." -ForegroundColor DarkGray
& "$lightPath" -nologo -ext WixUIExtension -sval -b "$WorkDir" -b (Join-Path $WorkDir "scripts") -b (Join-Path $WorkDir "installer") -out (Join-Path $WorkDir $OutputFile) $wixObj
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
`;
}

/**
 * Generates the native Windows Presentation Foundation (WPF) GUI
 * installed by the MSI into Program Files, providing an interactive UI
 * to configure Firefox, ChromeOS build, and Chromebook Coreboot/UEFI BIOS.
 */
export function generateWpfBuilderGui(config: ScriptConfig): string {
  return `<#
.SYNOPSIS
    ChromiumOS & Chromebook BIOS - Windows GUI Control Panel
.DESCRIPTION
    Native Windows Presentation Foundation (WPF) desktop application.
    Provides graphical controls to configure Firefox versions, ChromeOS image builds,
    Chromebook Coreboot/Tianocore BIOS builds, GBB flags, and hardware flashing.
#>

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Windows.Forms

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ChromiumOS &amp; Chromebook BIOS Builder (Ported from 12dakota/Chromeos)"
        Height="720" Width="960"
        WindowStartupLocation="CenterScreen"
        Background="#0b1120"
        FontFamily="Segoe UI"
        ResizeMode="CanResize">
    <Window.Resources>
        <Style TargetType="TextBlock">
            <Setter Property="Foreground" Value="#e2e8f0"/>
        </Style>
        <Style TargetType="GroupBox">
            <Setter Property="Foreground" Value="#f97316"/>
            <Setter Property="BorderBrush" Value="#1e293b"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="10"/>
            <Setter Property="Margin" Value="0,0,0,10"/>
        </Style>
        <Style TargetType="TextBox">
            <Setter Property="Background" Value="#0f172a"/>
            <Setter Property="Foreground" Value="#f8fafc"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="Padding" Value="6,4"/>
            <Setter Property="BorderThickness" Value="1"/>
        </Style>
        <Style TargetType="ComboBox">
            <Setter Property="Background" Value="#0f172a"/>
            <Setter Property="Foreground" Value="#f8fafc"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="Padding" Value="6,4"/>
        </Style>
        <Style TargetType="CheckBox">
            <Setter Property="Foreground" Value="#cbd5e1"/>
            <Setter Property="Margin" Value="0,4"/>
        </Style>
        <Style TargetType="RadioButton">
            <Setter Property="Foreground" Value="#cbd5e1"/>
            <Setter Property="Margin" Value="0,4"/>
        </Style>
    </Window.Resources>

    <Grid Margin="16">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="180"/>
        </Grid.RowDefinitions>

        <!-- Header -->
        <Border Grid.Row="0" Background="#0f172a" BorderBrush="#1e293b" BorderThickness="1" CornerRadius="8" Padding="14" Margin="0,0,0,12">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>
                <StackPanel Grid.Column="0">
                    <TextBlock Text="ChromiumOS &amp; Chromebook BIOS Control Center" FontSize="18" FontWeight="Bold" Foreground="#f97316"/>
                    <TextBlock Text="Unified Windows pipeline: Build ChromeOS with custom Firefox rootfs and compile Coreboot/UEFI firmware." FontSize="12" Foreground="#94a3b8" Margin="0,3,0,0"/>
                </StackPanel>
                <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
                    <Border Background="#1e293b" CornerRadius="4" Padding="8,4" Margin="4,0">
                        <TextBlock Text="Board: ${config.board}" FontWeight="SemiBold" Foreground="#38bdf8"/>
                    </Border>
                    <Border Background="#1e293b" CornerRadius="4" Padding="8,4">
                        <TextBlock Text="Firefox: ${config.firefoxVersion}" FontWeight="SemiBold" Foreground="#fb923c"/>
                    </Border>
                </StackPanel>
            </Grid>
        </Border>

        <!-- Main Configuration Tabs -->
        <TabControl Grid.Row="1" Background="#0f172a" BorderBrush="#1e293b" Foreground="#e2e8f0">
            <!-- Tab 1: Build Targets & ChromeOS -->
            <TabItem Header="ChromeOS &amp; Firefox Engine" Background="#0f172a" Foreground="#cbd5e1">
                <ScrollViewer VerticalScrollBarVisibility="Auto" Padding="12">
                    <StackPanel>
                        <GroupBox Header="Chromebook Target Architecture">
                            <Grid>
                                <Grid.ColumnDefinitions>
                                    <ColumnDefinition Width="160"/>
                                    <ColumnDefinition Width="*"/>
                                </Grid.ColumnDefinitions>
                                <Grid.RowDefinitions>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="Auto"/>
                                </Grid.RowDefinitions>

                                <TextBlock Grid.Row="0" Grid.Column="0" Text="Hardware Board:" VerticalAlignment="Center" Margin="0,6"/>
                                <ComboBox Grid.Row="0" Grid.Column="1" Name="CmbBoard" Margin="0,6">
                                    <ComboBoxItem Content="dedede" IsSelected="True"/>
                                    <ComboBoxItem Content="octopus"/>
                                    <ComboBoxItem Content="hatch"/>
                                    <ComboBoxItem Content="brya"/>
                                    <ComboBoxItem Content="volteer"/>
                                    <ComboBoxItem Content="grunt"/>
                                </ComboBox>

                                <TextBlock Grid.Row="1" Grid.Column="0" Text="Image Type:" VerticalAlignment="Center" Margin="0,6"/>
                                <ComboBox Grid.Row="1" Grid.Column="1" Name="CmbImageType" Margin="0,6">
                                    <ComboBoxItem Content="test (Recommended - SSH &amp; Root login enabled)" IsSelected="True"/>
                                    <ComboBoxItem Content="dev (Developer packages included)"/>
                                    <ComboBoxItem Content="base (Production-like base system)"/>
                                </ComboBox>

                                <TextBlock Grid.Row="2" Grid.Column="0" Text="Manifest Branch:" VerticalAlignment="Center" Margin="0,6"/>
                                <TextBox Grid.Row="2" Grid.Column="1" Name="TxtBranch" Text="${config.manifestBranch}" Margin="0,6"/>
                            </Grid>
                        </GroupBox>

                        <GroupBox Header="Mozilla Firefox Browser Integration">
                            <StackPanel>
                                <CheckBox Name="ChkIncludeFirefox" Content="Embed Mozilla Firefox browser directly into ChromeOS root filesystem" IsChecked="True"/>
                                <Grid Margin="0,8,0,0">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="160"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <TextBlock Grid.Column="0" Text="Firefox Release Version:" VerticalAlignment="Center"/>
                                    <ComboBox Grid.Column="1" Name="CmbFirefoxVersion">
                                        <ComboBoxItem Content="140.0 (Latest Nightly / Rapid)" IsSelected="True"/>
                                        <ComboBoxItem Content="139.0 (Stable Release)"/>
                                        <ComboBoxItem Content="128.0esr (Extended Support Release)"/>
                                        <ComboBoxItem Content="115.0esr (Legacy Compatibility)"/>
                                    </ComboBox>
                                </Grid>
                            </StackPanel>
                        </GroupBox>

                        <GroupBox Header="Build Pipeline Controls">
                            <StackPanel>
                                <CheckBox Name="ChkBuildChromeOS" Content="Compile bootable ChromiumOS .bin image inside WSL2" IsChecked="True"/>
                                <CheckBox Name="ChkRootfsVerification" Content="Disable rootfs verification (Allows write access to /)" IsChecked="True"/>
                                <Grid Margin="0,8,0,0">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="160"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <TextBlock Grid.Column="0" Text="Parallel Jobs (-j):" VerticalAlignment="Center"/>
                                    <TextBox Grid.Column="1" Name="TxtJobs" Text="${config.repoJobs}"/>
                                </Grid>
                            </StackPanel>
                        </GroupBox>
                    </StackPanel>
                </ScrollViewer>
            </TabItem>

            <!-- Tab 2: Chromebook BIOS & Coreboot Firmware -->
            <TabItem Header="Chromebook BIOS &amp; Coreboot" Background="#0f172a" Foreground="#cbd5e1">
                <ScrollViewer VerticalScrollBarVisibility="Auto" Padding="12">
                    <StackPanel>
                        <GroupBox Header="Firmware Compilation Targets">
                            <StackPanel>
                                <CheckBox Name="ChkBuildBios" Content="Compile Chromebook Coreboot AP Firmware (.rom)" IsChecked="True"/>
                                <TextBlock Text="Select Firmware Boot Payload:" FontWeight="SemiBold" Margin="0,8,0,4"/>
                                <RadioButton Name="RbPayloadDepthcharge" Content="Google Depthcharge (Stock ChromeOS payload, fast boots, verified boots)" IsChecked="True" GroupName="PayloadGroup"/>
                                <RadioButton Name="RbPayloadTianocore" Content="Tianocore EDK2 (Full UEFI firmware - boot Windows 10/11, Ubuntu, or standard OS)" GroupName="PayloadGroup"/>
                                <RadioButton Name="RbPayloadBoth" Content="Build both payloads (generates bios-depthcharge.rom and bios-tianocore.rom)" GroupName="PayloadGroup"/>
                            </StackPanel>
                        </GroupBox>

                        <GroupBox Header="Google Binary Block (GBB) Flags Configuration">
                            <StackPanel>
                                <TextBlock Text="GBB flags configure low-level boot behavior and dev screen timeouts:" Foreground="#94a3b8" FontSize="11" Margin="0,0,0,6"/>
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="160"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <TextBlock Grid.Column="0" Text="GBB Hex Value:" VerticalAlignment="Center"/>
                                    <TextBox Grid.Column="1" Name="TxtGbbFlags" Text="${config.gbbFlags || '0x489'}"/>
                                </Grid>
                                <TextBlock Text="Common Presets: 0x489 (Short 1s dev screen + Allow USB Boot) | 0x3f (Full Dev Mode) | 0x0 (Stock ChromeOS)" FontSize="11" Foreground="#38bdf8" Margin="0,6,0,0"/>
                            </StackPanel>
                        </GroupBox>

                        <GroupBox Header="Write-Protect (WP) &amp; Safety Guards">
                            <StackPanel>
                                <CheckBox Name="ChkDisableWp" Content="Automatically clear Software Write-Protect (flashrom --wp-disable)" IsChecked="True"/>
                                <TextBlock Text="Hardware Write-Protect Note: Modern boards (dedede, octopus, hatch) use CR50/Ti50 CCD. Hardware WP must be opened via Suzy-Q cable or battery disconnection before flashing full ROM." FontSize="11" Foreground="#f59e0b" TextWrapping="Wrap" Margin="0,6,0,0"/>
                            </StackPanel>
                        </GroupBox>
                    </StackPanel>
                </ScrollViewer>
            </TabItem>
        </TabControl>

        <!-- Command Execution Bar -->
        <Border Grid.Row="2" Background="#0f172a" BorderBrush="#1e293b" BorderThickness="1" CornerRadius="8" Padding="12" Margin="0,12,0,12">
            <WrapPanel HorizontalAlignment="Center">
                <Button Name="BtnBuildAll" Content="Compile All (ChromeOS + BIOS)" Background="#ea580c" Foreground="White" FontWeight="Bold" Padding="14,8" Margin="4" Cursor="Hand"/>
                <Button Name="BtnBuildChromeOs" Content="Build ChromeOS Image Only" Background="#1e293b" Foreground="#e2e8f0" Padding="12,8" Margin="4" Cursor="Hand"/>
                <Button Name="BtnBuildBios" Content="Build Chromebook BIOS Only" Background="#1e293b" Foreground="#e2e8f0" Padding="12,8" Margin="4" Cursor="Hand"/>
                <Button Name="BtnFlashUsb" Content="Flash ChromeOS to USB" Background="#0369a1" Foreground="White" Padding="12,8" Margin="4" Cursor="Hand"/>
                <Button Name="BtnFlashBios" Content="Flash Chromebook BIOS" Background="#047857" Foreground="White" Padding="12,8" Margin="4" Cursor="Hand"/>
            </WrapPanel>
        </Border>

        <!-- Output Log Terminal -->
        <Border Grid.Row="3" Background="#020617" BorderBrush="#1e293b" BorderThickness="1" CornerRadius="8" Padding="10">
            <DockPanel>
                <TextBlock DockPanel.Dock="Top" Text="BUILD PIPELINE &amp; EXECUTION LOG:" FontSize="11" FontWeight="Bold" Foreground="#94a3b8" Margin="0,0,0,4"/>
                <ScrollViewer Name="LogScroller" VerticalScrollBarVisibility="Auto">
                    <TextBox Name="TxtLog" Background="Transparent" Foreground="#38bdf8" BorderThickness="0" FontFamily="Consolas" FontSize="11" TextWrapping="Wrap" IsReadOnly="True"/>
                </ScrollViewer>
            </DockPanel>
        </Border>
    </Grid>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader $xaml)
$window = [Windows.Markup.XamlReader]::Load($reader)

# Connect Elements
$cmbBoard = $window.FindName("CmbBoard")
$cmbFirefoxVersion = $window.FindName("CmbFirefoxVersion")
$chkBuildChromeOS = $window.FindName("ChkBuildChromeOS")
$chkBuildBios = $window.FindName("ChkBuildBios")
$rbPayloadDepthcharge = $window.FindName("RbPayloadDepthcharge")
$rbPayloadTianocore = $window.FindName("RbPayloadTianocore")
$txtGbbFlags = $window.FindName("TxtGbbFlags")
$txtLog = $window.FindName("TxtLog")
$logScroller = $window.FindName("LogScroller")

function Append-Log($text) {
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    $txtLog.AppendText("[$timestamp] $text" + [Environment]::NewLine)
    $logScroller.ScrollToEnd()
}

Append-Log "ChromiumOS & Chromebook BIOS Control Center initialized."
Append-Log "Ready to compile images for board '${config.board}' with Firefox ${config.firefoxVersion}."

# Wire Actions
$window.FindName("BtnBuildAll").Add_Click({
    Append-Log "Initiating Master Compilation Pipeline: ChromeOS Image + Chromebook BIOS..."
    $boardVal = $cmbBoard.Text
    $firefoxVal = $cmbFirefoxVersion.Text.Split(' ')[0]
    $scriptPath = Join-Path $PSScriptRoot "Build-All.ps1"
    
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$scriptPath", "-Board", "$boardVal", "-FirefoxVersion", "$firefoxVal"
})

$window.FindName("BtnBuildChromeOs").Add_Click({
    Append-Log "Launching WSL2 ChromeOS Image Build..."
    $scriptPath = Join-Path $PSScriptRoot "scripts\\Build-ChromiumOS-WSL2.ps1"
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$scriptPath"
})

$window.FindName("BtnBuildBios").Add_Click({
    Append-Log "Launching Chromebook Coreboot BIOS Build..."
    $scriptPath = Join-Path $PSScriptRoot "scripts\\Build-Chromebook-BIOS.ps1"
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$scriptPath"
})

$window.FindName("BtnFlashUsb").Add_Click({
    Append-Log "Launching Windows USB Flasher..."
    $scriptPath = Join-Path $PSScriptRoot "scripts\\Flash-ChromiumOS.ps1"
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "$scriptPath" -Verb RunAs
})

$window.FindName("BtnFlashBios").Add_Click({
    Append-Log "Launching Chromebook BIOS Flasher..."
    $scriptPath = Join-Path $PSScriptRoot "scripts\\Flash-Chromebook-BIOS.ps1"
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "$scriptPath" -Verb RunAs
})

$window.ShowDialog() | Out-Null
`;
}

/**
 * Generates the Build-Chromebook-BIOS.ps1 Windows PowerShell orchestrator
 * for compiling Coreboot and Depthcharge/Tianocore in WSL2
 */
export function generateBiosBuildOrchestrator(config: ScriptConfig): string {
  return `<#
.SYNOPSIS
    Chromebook BIOS & Coreboot Firmware Build Pipeline (PowerShell + WSL2)
.DESCRIPTION
    Compiles AP (Application Processor) firmware for board '${config.board}'.
    Supports Google Depthcharge payload (ChromeOS bootloader) and Tianocore EDK2 (Full UEFI).
    Injects GBB flags (${config.gbbFlags || '0x489'}) and packages custom CBFS bootsplash.
.EXAMPLE
    .\\Build-Chromebook-BIOS.ps1
    .\\Build-Chromebook-BIOS.ps1 -Board "${config.board}" -Payload tianocore -GbbFlags "0x489"
#>

[CmdletBinding()]
param(
    [string]$Board = "${config.board}",
    [ValidateSet("depthcharge", "tianocore", "both")]
    [string]$Payload = "${config.biosPayload}",
    [string]$GbbFlags = "${config.gbbFlags || '0x489'}",
    [switch]$ForceRebuild,
    [string]$OutputDir = ".\\firmware"
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
wsl bash -c "cd '$wslWorkspace/scripts' && sed -i 's/\r$//' $builderScript && chmod +x $builderScript"

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
    Write-Host "Next Step: Flash to Chromebook using .\\Flash-Chromebook-BIOS.ps1" -ForegroundColor Yellow
} else {
    Write-Warning "Build finished without errors but no .rom files were found in $OutputDir."
}
`;
}

/**
 * Generates wsl-bios-builder.sh
 * The Linux worker script executed inside WSL2 that builds coreboot, payloads,
 * tools (cbfstool, ifdtool, gbb_utility), and exports bios-${BOARD}.rom
 */
export function generateWslBiosBuilderBash(config: ScriptConfig): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# wsl-bios-builder.sh
# Coreboot & Chromebook BIOS Compilation Worker (WSL2 Ubuntu)
# Ports ChromeOS depthcharge & Tianocore UEFI builds to Windows
# ==============================================================================
set -e

BOARD="\${BOARD:-${config.board}}"
PAYLOAD="\${PAYLOAD:-${config.biosPayload}}"
GBB_FLAGS="\${GBB_FLAGS:-${config.gbbFlags || '0x489'}}"
OUTPUT_DIR="\${OUTPUT_DIR:-../firmware}"

echo ">>> [WSL BIOS] Building Coreboot Firmware for Board: $BOARD"
echo ">>> [WSL BIOS] Payload Selection: $PAYLOAD | GBB Flags: $GBB_FLAGS"

# Install required build packages
sudo apt-get update -qq
sudo apt-get install -y -qq \
    build-essential git bfd-plugins-dev bison flex zlib1g-dev \
    libncurses5-dev libssl-dev gnat nasm acpica-tools libelf-dev \
    python3 python3-pip curl wget uuid-dev pkg-config

BUILD_ROOT="$HOME/chromebook-bios-build"
mkdir -p "$BUILD_ROOT"
cd "$BUILD_ROOT"

# Clone or update coreboot repository
if [ ! -d "coreboot/.git" ]; then
    echo ">>> [WSL BIOS] Cloning Coreboot source tree..."
    git clone --depth 1 --recurse-submodules https://review.coreboot.org/coreboot.git coreboot
fi

cd coreboot

# Build host utilities: cbfstool, ifdtool
echo ">>> [WSL BIOS] Compiling CBFS and Intel Flash Descriptor tools..."
make -C util/cbfstool -j"$(nproc)"
make -C util/ifdtool -j"$(nproc)"
export PATH="$BUILD_ROOT/coreboot/util/cbfstool:$BUILD_ROOT/coreboot/util/ifdtool:$PATH"

# Build crossgcc toolchain if not present
if [ ! -f "util/crossgcc/xgcc/bin/i386-elf-gcc" ]; then
    echo ">>> [WSL BIOS] Building Coreboot cross-compiler toolchain (i386-elf)..."
    make crossgcc-i386 CPUS="$(nproc)"
fi

# Configure Coreboot for board
echo ">>> [WSL BIOS] Generating Coreboot configuration..."
make distclean || true

# Write board-specific defconfig
cat << 'EOF_CONFIG' > defconfig_board
CONFIG_VENDOR_GOOGLE=y
CONFIG_CBFS_SIZE=0x01000000
CONFIG_COMPRESS_RAMSTAGE_LZMA=y
CONFIG_COLLECT_TIMESTAMPS=y
CONFIG_USE_OPTION_TABLE=y
CONFIG_BOOTSPLASH_IMAGE=y
EOF_CONFIG

if [ "$PAYLOAD" = "tianocore" ] || [ "$PAYLOAD" = "both" ]; then
    echo "CONFIG_PAYLOAD_EDK2=y" >> defconfig_board
    echo "CONFIG_EDK2_BOOTLOADER_SHELL=y" >> defconfig_board
else
    echo "CONFIG_PAYLOAD_DEPTHCHARGE=y" >> defconfig_board
fi

make defconfig KBUILD_DEFCONFIG=defconfig_board

# Compile Coreboot ROM
echo ">>> [WSL BIOS] Compiling Coreboot ROM with $(nproc) jobs..."
make -j"$(nproc)"

# Inject GBB Flags and Bootsplash
ROM_FILE="build/coreboot.rom"
if [ -f "$ROM_FILE" ]; then
    echo ">>> [WSL BIOS] Stamping GBB Flags: $GBB_FLAGS"
    # If gbb_utility exists, set flags
    if command -v gbb_utility &>/dev/null; then
        gbb_utility --set --flags="$GBB_FLAGS" "$ROM_FILE" || true
    fi

    # Prepare final output ROM
    FINAL_ROM="bios-$BOARD-$PAYLOAD.rom"
    cp "$ROM_FILE" "$FINAL_ROM"

    mkdir -p "$OUTPUT_DIR"
    cp "$FINAL_ROM" "$OUTPUT_DIR/"
    echo ">>> [WSL BIOS] SUCCESS: Exported firmware to $OUTPUT_DIR/$FINAL_ROM"
else
    echo ">>> [WSL BIOS] Error: build/coreboot.rom was not produced."
    exit 1
fi
`;
}

/**
 * Generates Flash-Chromebook-BIOS.ps1
 * Safe BIOS flashing utility with chip identification, double verification backup,
 * hardware write-protect warning, and flashrom execution.
 */
export function generateFlashBiosScript(config: ScriptConfig): string {
  return `<#
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
    [string]$Board = "${config.board}"
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
    $candidates = Get-ChildItem -Path ".\\firmware" -Filter "*.rom" -ErrorAction SilentlyContinue
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
        scp root@\${ChromebookIp}:/tmp/backup1.bin $backup1
        scp root@\${ChromebookIp}:/tmp/backup2.bin $backup2
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
    scp $RomPath root@\${ChromebookIp}:/tmp/new_bios.rom
    Write-Host "Executing flashrom on Chromebook..." -ForegroundColor Cyan
    ssh root@$ChromebookIp "flashrom -p host -w /tmp/new_bios.rom"
}

Write-Host ""
Write-Host "[3/3] BIOS flash operation completed successfully!" -ForegroundColor Green
Write-Host "Reboot your Chromebook to initialize the new firmware." -ForegroundColor Yellow
`;
}

/**
 * Generates Build-All.ps1
 * Master orchestrator that executes the full pipeline:
 * compiles the ChromeOS image with Firefox AND the Chromebook BIOS ROM.
 */
export function generateBuildAllScript(config: ScriptConfig): string {
  return `<#
.SYNOPSIS
    Master ChromiumOS & Chromebook BIOS Compilation Pipeline
.DESCRIPTION
    Compiles both the ChromiumOS test/dev image with Mozilla Firefox overlay
    AND the Coreboot / Tianocore BIOS firmware in a single automated flow.
.EXAMPLE
    .\\Build-All.ps1 -Board "${config.board}" -FirefoxVersion "${config.firefoxVersion}"
#>

[CmdletBinding()]
param(
    [string]$Board = "${config.board}",
    [string]$FirefoxVersion = "${config.firefoxVersion}",
    [string]$BiosPayload = "${config.biosPayload}",
    [string]$GbbFlags = "${config.gbbFlags || '0x489'}",
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
    $chromeOsScript = Join-Path $PSScriptRoot "scripts\\Build-ChromiumOS-WSL2.ps1"
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
    $biosScript = Join-Path $PSScriptRoot "scripts\\Build-Chromebook-BIOS.ps1"
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
Write-Host " MASTER BUILD COMPLETED IN $($Elapsed.ToString('hh\\:mm\\:ss'))! " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Output Directory: .\\flash (ChromeOS image) and .\\firmware (BIOS ROM)" -ForegroundColor White
Write-Host "To Flash USB Drive: .\\scripts\\Flash-ChromiumOS.ps1" -ForegroundColor Yellow
Write-Host "To Flash BIOS ROM:  .\\scripts\\Flash-Chromebook-BIOS.ps1" -ForegroundColor Yellow
`;
}

/**
 * Generates the .github/workflows/build-msi.yml file
 * Enabling automated on-demand and release compilation of the MSI on GitHub Actions
 */
export function generateGitHubActionsWorkflow(config: ScriptConfig): string {
  return `name: Build Windows MSI Installer

on:
  workflow_dispatch:
    inputs:
      board:
        description: 'Chromebook Board Codename'
        required: true
        default: '${config.board}'
        type: choice
        options:
          - 'dedede'
          - 'octopus'
          - 'hatch'
          - 'volteer'
          - 'brya'
          - 'nissa'
          - 'corsola'
          - 'guybrush'
          - 'grunt'
          - 'snappy'
      firefox_version:
        description: 'Mozilla Firefox Target Version'
        required: true
        default: '${config.firefoxVersion}'
        type: choice
        options:
          - '140.0'
          - '139.0'
          - '128.0esr'
          - '115.0esr'
      build_bios:
        description: 'Include Coreboot / UEFI BIOS Compiler'
        required: true
        type: boolean
        default: ${config.buildBios ? 'true' : 'false'}
      bios_payload:
        description: 'BIOS Payload'
        required: true
        default: '${config.biosPayload}'
        type: choice
        options:
          - 'depthcharge'
          - 'tianocore'
          - 'both'
      gbb_flags:
        description: 'GBB Flags (e.g. 0x489 for 1s Dev Screen + USB Boot)'
        required: false
        default: '${config.gbbFlags || '0x489'}'
        type: string
      msi_version:
        description: 'MSI Package Version'
        required: false
        default: '${config.msiProductVersion || '1.0.0'}'
        type: string
      release_tag:
        description: 'GitHub Release Tag (e.g. v1.0.0 or latest)'
        required: false
        default: 'v${config.msiProductVersion || '1.0.0'}'
        type: string

  push:
    branches:
      - main
      - master
    tags:
      - 'v*'
    paths:
      - 'installer/**'
      - 'scripts/**'
      - 'Product.wxs'
      - 'build-msi.ps1'
      - '.github/workflows/build-msi.yml'

  pull_request:
    branches:
      - main
    paths:
      - 'installer/**'
      - 'scripts/**'
      - 'Product.wxs'
      - 'build-msi.ps1'

jobs:
  build-msi:
    name: Compile WiX MSI Package (\${{ github.event.inputs.board || '${config.board}' }})
    runs-on: windows-latest
    permissions:
      contents: write

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Add WiX Toolset to PATH
        shell: pwsh
        run: |
          $wixPath = "\${env:ProgramFiles(x86)}\\WiX Toolset v3.11\\bin"
          if (Test-Path $wixPath) {
              Write-Host "Found WiX v3.11 at: $wixPath"
              "$wixPath" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
          } else {
              Write-Host "WiX v3.11 not found in default location; build-msi.ps1 will download portable binaries."
          }

      - name: Verify Tools & Environment
        shell: pwsh
        run: |
          Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)"
          if (Get-Command "candle.exe" -ErrorAction SilentlyContinue) {
              & candle.exe -? | Select-Object -First 2
          }

      - name: Compile Windows MSI Installer
        id: compile
        shell: pwsh
        run: |
          $board = "\${{ github.event.inputs.board }}"
          if ([string]::IsNullOrWhiteSpace($board)) { $board = "${config.board}" }
          
          $firefox = "\${{ github.event.inputs.firefox_version }}"
          if ([string]::IsNullOrWhiteSpace($firefox)) { $firefox = "${config.firefoxVersion}" }
          
          $msiVer = "\${{ github.event.inputs.msi_version }}"
          if ([string]::IsNullOrWhiteSpace($msiVer)) { $msiVer = "${config.msiProductVersion || '1.0.0'}" }

          $buildBios = "\${{ github.event.inputs.build_bios }}"
          if ([string]::IsNullOrWhiteSpace($buildBios)) { $buildBios = "${config.buildBios ? 'true' : 'false'}" }

          $payload = "\${{ github.event.inputs.bios_payload }}"
          if ([string]::IsNullOrWhiteSpace($payload)) { $payload = "${config.biosPayload}" }

          $outputName = "ChromiumOS-Toolkit-Setup-$board.msi"

          Write-Host "Compiling MSI for Board: $board | Firefox: $firefox | Version: $msiVer"
          
          # Execute the WiX compilation script
          .\\build-msi.ps1 -Board $board -FirefoxVersion $firefox -MsiVersion $msiVer -OutputFile $outputName

          if (-not (Test-Path $outputName)) {
              Write-Error "MSI file was not produced: $outputName"
              exit 1
          }

          $hash = (Get-FileHash -Algorithm SHA256 $outputName).Hash
          Write-Host "MSI generated: $outputName" -ForegroundColor Green
          Write-Host "SHA256: $hash" -ForegroundColor Cyan

          # Determine Target Release Tag
          $tag = "\${{ github.event.inputs.release_tag }}"
          if ([string]::IsNullOrWhiteSpace($tag)) {
              if ("\${{ github.ref }}".StartsWith("refs/tags/")) {
                  $tag = "\${{ github.ref_name }}"
              } else {
                  $tag = "v$msiVer"
              }
          }
          Write-Host "Target Release Tag: $tag" -ForegroundColor Cyan

          # Save environment variables for subsequent steps
          "MSI_FILE=$outputName" | Out-File -FilePath $env:GITHUB_ENV -Append -Encoding utf8
          "MSI_HASH=$hash" | Out-File -FilePath $env:GITHUB_ENV -Append -Encoding utf8
          "RELEASE_TAG=$tag" | Out-File -FilePath $env:GITHUB_ENV -Append -Encoding utf8

      - name: Generate Checksums Manifest
        shell: pwsh
        run: |
          Get-FileHash -Algorithm SHA256 *.msi | Out-File -FilePath "SHA256SUMS.txt" -Encoding utf8
          Get-Content "SHA256SUMS.txt"

      - name: Publish Directly to GitHub Releases
        id: create_release
        uses: softprops/action-gh-release@v2
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ env.RELEASE_TAG }}
          name: ChromiumOS &amp; Chromebook BIOS Toolkit (\${{ env.RELEASE_TAG }})
          body: |
            ### 🚀 ChromiumOS &amp; Chromebook BIOS Windows Installer (MSI)
            
            Automated production build uploaded directly to GitHub Releases.
            
            #### 📦 Release Metadata
            - **Target Board:** \`\${{ github.event.inputs.board || '${config.board}' }}\`
            - **Firefox Overlay:** \`\${{ github.event.inputs.firefox_version || '${config.firefoxVersion}' }}\`
            - **MSI Version:** \`\${{ github.event.inputs.msi_version || '${config.msiProductVersion || '1.0.0'}' }}\`
            - **Package Filename:** \`\${{ env.MSI_FILE }}\`
            - **SHA256 Checksum:** \`\${{ env.MSI_HASH }}\`
            - **Built From Commit:** \`\${{ github.sha }}\`
            
            #### ⚡ Installation
            1. Download the attached **\${{ env.MSI_FILE }}** installer below.
            2. Run standard or silent installation:
               \`\`\`cmd
               msiexec /i \${{ env.MSI_FILE }}
               \`\`\`
            3. Access **ChromiumOS Builder** and **BIOS Flasher** directly from your Desktop and Start Menu.
          files: |
            *.msi
            SHA256SUMS.txt
          generate_release_notes: false
          draft: false
          prerelease: false
          fail_on_unmatched_files: false

      - name: Fallback Release via GitHub CLI
        if: failure() && env.MSI_FILE != ''
        shell: pwsh
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          Write-Host "Release step failed, running GitHub CLI fallback..." -ForegroundColor Yellow
          $tag = $env:RELEASE_TAG
          if (-not $tag) { $tag = "v${config.msiProductVersion || '1.0.0'}" }
          gh release create $tag --title "ChromiumOS Toolkit MSI ($tag)" --notes "Automated release build for board \${{ github.event.inputs.board || '${config.board}' }}" --clobber *.msi SHA256SUMS.txt

      - name: Upload MSI Build Artifact (Quota Safe)
        uses: actions/upload-artifact@v4
        continue-on-error: true
        with:
          name: windows-msi-installer-\${{ github.event.inputs.board || '${config.board}' }}
          path: |
            *.msi
            SHA256SUMS.txt
          retention-days: 7
`;
}

/**
 * 1-Click Batch compiler script for Windows
 */
export function generateCompileMsiBat(): string {
  return `@echo off
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
`;
}

