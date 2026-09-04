<#
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
                        <TextBlock Text="Board: dedede" FontWeight="SemiBold" Foreground="#38bdf8"/>
                    </Border>
                    <Border Background="#1e293b" CornerRadius="4" Padding="8,4">
                        <TextBlock Text="Firefox: 140.0" FontWeight="SemiBold" Foreground="#fb923c"/>
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
                                <TextBox Grid.Row="2" Grid.Column="1" Name="TxtBranch" Text="release-R120-15662.B" Margin="0,6"/>
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
                                    <TextBox Grid.Column="1" Name="TxtJobs" Text="8"/>
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
                                    <TextBox Grid.Column="1" Name="TxtGbbFlags" Text="0x489"/>
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
Append-Log "Ready to compile images for board 'dedede' with Firefox 140.0."

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
    $scriptPath = Join-Path $PSScriptRoot "scripts\Build-ChromiumOS-WSL2.ps1"
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$scriptPath"
})

$window.FindName("BtnBuildBios").Add_Click({
    Append-Log "Launching Chromebook Coreboot BIOS Build..."
    $scriptPath = Join-Path $PSScriptRoot "scripts\Build-Chromebook-BIOS.ps1"
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$scriptPath"
})

$window.FindName("BtnFlashUsb").Add_Click({
    Append-Log "Launching Windows USB Flasher..."
    $scriptPath = Join-Path $PSScriptRoot "scripts\Flash-ChromiumOS.ps1"
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "$scriptPath" -Verb RunAs
})

$window.FindName("BtnFlashBios").Add_Click({
    Append-Log "Launching Chromebook BIOS Flasher..."
    $scriptPath = Join-Path $PSScriptRoot "scripts\Flash-Chromebook-BIOS.ps1"
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "$scriptPath" -Verb RunAs
})

$window.ShowDialog() | Out-Null
