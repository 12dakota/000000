# ChromiumOS Windows Toolkit & Chromebook BIOS Studio

> Automated Windows MSI installer generator, WSL2 ChromiumOS builder, Firefox overlay compiler, and Coreboot UEFI firmware studio.
> Based on [12dakota/Chromeos](https://github.com/12dakota/Chromeos).

[![Build Windows MSI Installer](https://github.com/12dakota/Chromeos/actions/workflows/build-msi.yml/badge.svg)](https://github.com/12dakota/Chromeos/actions/workflows/build-msi.yml)
[![CI](https://github.com/12dakota/Chromeos/actions/workflows/ci.yml/badge.svg)](https://github.com/12dakota/Chromeos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚡ Highlights

- **Windows MSI Installer**: Self-contained `.msi` package generated using the **WiX Toolset** with custom Setup Wizard dialogs, public property overrides, and desktop shortcuts.
- **Mozilla Firefox Overlay**: Injects binary Firefox (`www-client/firefox-bin`) ebuilds into Gentoo Portage overlays for offline, unmanaged browsing.
- **Chromebook BIOS & Coreboot Studio**: Compiles custom Coreboot ROMs with Google **Depthcharge** (fast ChromeOS boot) or **Tianocore EDK2** (full UEFI boot for Windows 10/11 & Linux).
- **Automated Cloud CI/CD**: Compile the `.msi` installer file directly on GitHub's cloud runners on-demand via **GitHub Actions `workflow_dispatch`**—no local Windows installation or WiX required!
- **Safe Dual-Read Flasher**: Flash images and BIOS ROMs directly from PowerShell with mandatory hardware write-protect checks and double SHA-256 backup verification.

---

## 🚀 How to Compile the Installer File Later

You can compile the `.msi` installer whenever you need it, for any board architecture and any Firefox version, using either the **Cloud CI/CD flow** or **Local Windows flow**.

### Flow A: Compile Later in GitHub Cloud (Zero Local Setup)

GitHub Actions runs on free `windows-latest` runners with the WiX Toolset pre-installed:

1. Push this repository to your GitHub account (see instructions below).
2. In your GitHub repository, navigate to the **Actions** tab.
3. In the left sidebar, click **"Build Windows MSI Installer"**.
4. Click **Run workflow** dropdown on the right:
   - **Chromebook Board**: Select your target architecture (e.g., `dedede`, `octopus`, `hatch`, `volteer`, `brya`, `nissa`, `corsola`, `guybrush`).
   - **Mozilla Firefox Target Version**: Choose `140.0`, `139.0`, `128.0esr`, or `115.0esr`.
   - **Include BIOS Compiler**: Check or uncheck.
   - **BIOS Payload**: Choose `depthcharge`, `tianocore`, or `both`.
   - **GBB Flags**: Set hex value (e.g. `0x489` for 1-second Developer Screen + USB Boot default).
5. Click **Run workflow**.
6. In ~2 minutes, open the completed run and download the compiled `windows-msi-installer-<board>` artifact containing `ChromiumOS-Toolkit-Setup-<board>.msi` and its SHA256 checksums!

Alternatively, trigger it via the GitHub CLI:
```bash
gh workflow run build-msi.yml -f board=dedede -f firefox_version=140.0 -f bios_payload=depthcharge
```

### Flow B: Compile on a Windows PC

On any Windows 10/11 machine:

```powershell
# 1. Clone your repository
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# 2. Run the automated WiX compiler (auto-downloads portable WiX if missing)
.\build-msi.ps1 -Board "dedede" -FirefoxVersion "140.0"

# Or simply double-click:
compile-msi.bat
```

The script produces `ChromiumOS-Toolkit-Setup-dedede.msi` in the root directory.

### Flow C: Automated Release Compilation

Whenever you push a Git tag, GitHub Actions will compile the MSI and publish a GitHub Release with downloadable assets automatically:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 📦 Pushing This Repository to GitHub

To push this codebase to a new repository:

```bash
# 1. Initialize Git (already done in this workspace)
git init -b main

# 2. Stage all files
git add .

# 3. Commit the changes
git commit -m "feat: Initial commit for ChromiumOS Windows Toolkit & WiX MSI Builder"

# 4. Link your new GitHub repository
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# 5. Push to GitHub
git push -u origin main
```

*(If using SSH: `git remote add origin git@github.com:<YOUR-USERNAME>/<YOUR-REPO-NAME>.git`)*

---

## 💻 Silent Deployment via msiexec

The generated MSI package supports silent installation and command-line property overrides for enterprise or headless setups:

```cmd
msiexec.exe /i ChromiumOS-Toolkit-Setup-dedede.msi /qn /norestart ^
  BOARD="dedede" ^
  FIREFOX_VERSION="140.0" ^
  BUILD_CHROMEOS="1" ^
  BUILD_BIOS="1" ^
  BIOS_PAYLOAD="depthcharge" ^
  GBB_FLAGS="0x489" ^
  INSTALLDIR="C:\ChromiumOS-Toolkit"
```

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       ├── build-msi.yml          # GitHub Actions workflow for on-demand cloud MSI compilation
│       └── ci.yml                 # CI test & WiX XML schema validation workflow
├── installer/
│   ├── Product.wxs                # WiX Toolset v3/v4 installer manifest
│   ├── build-msi.ps1              # WiX compiler script with portable toolset fallback
│   └── compile-msi.bat            # 1-Click batch launcher for Windows File Explorer
├── scripts/
│   ├── Build-All.ps1              # Unified master compiler (WSL2 ChromeOS + Coreboot BIOS)
│   ├── Build-ChromiumOS-WSL2.ps1  # Automated cros_sdk compilation in WSL2 Ubuntu
│   ├── Build-Chromebook-BIOS.ps1  # Coreboot / Depthcharge / Tianocore BIOS orchestrator
│   ├── Flash-ChromiumOS.ps1       # Physical USB flasher with drive safety locks
│   └── Flash-Chromebook-BIOS.ps1  # Safe BIOS SPI flasher with dual backup verification
├── linux-workers/
│   ├── wsl-chromeos-builder.sh    # Linux bash worker executed inside cros_sdk
│   └── wsl-bios-builder.sh        # Linux bash worker for Coreboot compilation
├── ChromiumOS-Builder-GUI.ps1     # Native WPF desktop control center
└── README.md                      # This documentation
```

---

## 🛡️ Chromebook Hardware Write-Protect (WP) Reference

| Chromebook Model | Board Codename | WP Mechanism | Unlock Method |
|:---|:---|:---|:---|
| Acer Chromebook Spin 511 / 512 | `dedede` | CR50 / Ti50 CCD | Suzy-Q cable or battery disconnect |
| HP Chromebook 11A / x360 | `octopus` | CR50 CCD | Open shell: `gsctool -a -o` |
| Lenovo IdeaPad Duet 5 | `hatch` | CR50 CCD | Battery disconnect grounding |
| Dell Chromebook 3100 | `octopus` | CR50 CCD | CCD unlock or screw bypass |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
Based on the upstream work by [12dakota/Chromeos](https://github.com/12dakota/Chromeos).
