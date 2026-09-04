# ChromiumOS Windows Toolkit
Based on [12dakota/Chromeos](https://github.com/12dakota/Chromeos)

This toolkit provides a complete Windows PowerShell & WSL2 workflow to build, package, and safely flash custom ChromiumOS images (featuring Mozilla Firefox rootfs integration and custom boot splash artwork) targeting board **dedede** and compatible hardware.

---

## Included Windows Files

| File | Purpose |
|------|---------|
| `Flash-ChromiumOS.ps1` | **Primary Windows USB Flasher**: Interactive PowerShell tool that detects USB drives, blocks Windows OS drive overwrites, handles `.bin.zst` decompression, and performs raw 4MB block flashing. |
| `Flash-ChromiumOS.bat` | **1-Click Batch Launcher**: Double-click wrapper that handles Windows UAC elevation automatically. |
| `Build-ChromiumOS-WSL2.ps1` | **Windows WSL2 Build Orchestrator**: Automates compiling ChromiumOS in WSL2 (Ubuntu) with Firefox overlay and exports image to Windows `\flash` folder. |
| `wsl-dedede-builder.sh` | **WSL2 Linux Worker**: The build script executing `repo`, `depot_tools`, and `cros_sdk`. |

---

## Quick Start: Flashing a Pre-Built Image on Windows

1. Insert your USB flash drive (16 GB or larger recommended).
2. Right-click `Flash-ChromiumOS.ps1` and select **Run with PowerShell** (or double-click `Flash-ChromiumOS.bat`).
3. The script will:
   - Request Administrator elevation.
   - Scan physical disks and automatically safeguard your internal Windows C: drive.
   - Prompt you to select the USB drive number and target `.bin` or `.bin.zst` image.
   - Decompress and write using raw 4MB buffer streaming with real-time throughput metrics.

---

## Building from Source on Windows (via WSL2)

ChromiumOS requires a Linux chroot (`cros_sdk`) and loopback filesystem capabilities. The provided `Build-ChromiumOS-WSL2.ps1` orchestrates this directly from Windows:

### 1. Hardware Requirements
- **OS**: Windows 10 (Build 19041+) or Windows 11
- **WSL**: WSL2 with Ubuntu 22.04 or 24.04 (`wsl --install -d Ubuntu`)
- **CPU**: 8+ physical cores recommended
- **RAM**: 16 GB minimum (32 GB recommended)
- **Disk**: 300+ GB free storage (ChromiumOS source tree is large)

### 2. Execution
Run in PowerShell:
```powershell
.\Build-ChromiumOS-WSL2.ps1 -Board "dedede" -FirefoxVersion "140.0"
```

The compiled image will be deposited into:
```text
.\flash\chromiumos_test_image-dedede.bin.zst
```

---

## Booting on your Chromebook (dedede)

### Step 1: Put Chromebook into Developer Mode
1. Turn off the Chromebook.
2. Hold **Esc + Refresh (F3 / ↻)** and tap **Power**.
3. At the Recovery screen, press **Ctrl + D**.
4. Confirm by pressing **Enter** (or Space depending on firmware).
5. The device will wipe user data and reboot into Developer Mode.

### Step 2: Enable USB Boot
1. At the Developer Mode boot warning ("OS verification is OFF"), press **Ctrl + D** to boot ChromeOS.
2. Once booted to the login screen, press **Ctrl + Alt + T** to open the `crosh` terminal.
3. Type:
   ```bash
   shell
   sudo crossystem dev_boot_usb=1 dev_boot_signed_only=0
   ```

### Step 3: Boot the USB Drive
1. Insert the flashed USB drive into the Chromebook.
2. Reboot the Chromebook.
3. At the Developer Mode warning screen, press **Ctrl + U** to boot from the USB drive.

### Step 4: Install to Internal Storage (Optional)
To write the USB image onto the Chromebook's internal eMMC/NVMe storage:
```bash
sudo /usr/sbin/chromeos-install --dst /dev/mmcblk0
# (or /dev/nvme0n1 on NVMe-based boards)
```
