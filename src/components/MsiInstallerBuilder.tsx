import { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  Download,
  Play,
  Cpu,
  Globe,
  HardDrive,
  Settings2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  Wrench
} from 'lucide-react';
import { ScriptConfig, ScriptFile } from '../types';
import { POPULAR_BOARDS } from '../data/boards';
import { downloadAllAsZip } from '../utils/downloadHelper';

interface MsiInstallerBuilderProps {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
  scripts: ScriptFile[];
}

export function MsiInstallerBuilder({ config, onChange, scripts }: MsiInstallerBuilderProps) {
  // Wizard simulation step: 1: Welcome, 2: License, 3: Options, 4: BIOS, 5: Ready, 6: Installing, 7: Finished
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [licenseAccepted, setLicenseAccepted] = useState<boolean>(true);
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installStatus, setInstallStatus] = useState<string>('');
  const [launchOnExit, setLaunchOnExit] = useState<boolean>(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Installation simulator timer
  useEffect(() => {
    if (wizardStep === 6) {
      setInstallProgress(0);
      setInstallStatus('Creating directory structure in C:\\Program Files\\ChromiumOS Toolkit...');

      const steps = [
        { pct: 18, status: 'Copying PowerShell flashing scripts & batch launchers...' },
        { pct: 36, status: 'Writing installation manifest config.json...' },
        { pct: 54, status: 'Extracting WSL2 Linux build workers for ' + config.board + '...' },
        { pct: 72, status: 'Configuring Coreboot & Tianocore UEFI build parameters...' },
        { pct: 90, status: 'Registering Desktop & Start Menu shortcuts...' },
        { pct: 100, status: 'Installation complete!' }
      ];

      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < steps.length) {
          setInstallProgress(steps[currentIdx].pct);
          setInstallStatus(steps[currentIdx].status);
          currentIdx++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setWizardStep(7);
          }, 600);
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [wizardStep, config.board]);

  const silentMsiCmd = `msiexec /i ChromiumOS-Toolkit-Setup-${config.board}.msi /qn BOARD="${config.board}" FIREFOX_VERSION="${config.firefoxVersion}" BUILD_BIOS=${config.buildBios ? 1 : 0} BUILD_CHROMEOS=${config.buildChromeOS ? 1 : 0} GBB_FLAGS="${config.gbbFlags || '0x489'}"`;
  const interactiveMsiCmd = `msiexec /i ChromiumOS-Toolkit-Setup-${config.board}.msi`;
  const buildMsiCmd = `powershell -ExecutionPolicy Bypass -File .\\build-msi.ps1 -Board "${config.board}" -FirefoxVersion "${config.firefoxVersion}"`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-500/10">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100">Windows MSI Installer Package Generator</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  WiX Toolset v3/v4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Builds a native Windows Installer (<code className="text-blue-300 font-mono">.msi</code>) package that bundles your selections for Firefox version, board architecture, ChromeOS build scripts, and Chromebook Coreboot/UEFI BIOS compiler into a standalone setup wizard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="download-msi-project-btn"
              onClick={() => downloadAllAsZip(scripts)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Complete MSI Project</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Interactive Windows MSI Setup Wizard Simulator */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Windows Window Chrome Header */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-blue-500 flex items-center justify-center">
                  <Package className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  ChromiumOS &amp; Chromebook BIOS Toolkit Setup (Board: {config.board})
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-500">
                <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
                <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
                <div className="w-3 h-3 rounded-full bg-red-900/60 border border-red-700/50" />
              </div>
            </div>

            {/* MSI Setup Dialog Body */}
            <div className="min-h-[440px] flex flex-col justify-between bg-slate-900/90 text-slate-200 p-6">
              {/* STEP 1: WELCOME */}
              {wizardStep === 1 && (
                <div className="space-y-4 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">
                        Welcome to the ChromiumOS &amp; BIOS Toolkit Setup Wizard
                      </h2>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        The Setup Wizard will install the unified ChromiumOS builder with custom Mozilla Firefox rootfs integration, USB flashing utilities, and Chromebook Coreboot/UEFI BIOS compiler on your computer.
                      </p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Click <strong className="text-slate-200">Next</strong> to customize your hardware board, Firefox release, and BIOS firmware targets.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Board:</span>
                      <span className="font-mono text-slate-300 font-semibold">{config.board}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mozilla Firefox Target:</span>
                      <span className="font-mono text-orange-400 font-semibold">{config.firefoxVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <span className="font-mono text-slate-400">{config.msiInstallDir}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LICENSE */}
              {wizardStep === 2 && (
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">End-User License Agreement</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Please read the following license agreement carefully before continuing.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-400 h-52 overflow-y-auto leading-relaxed">
                    <p className="text-slate-300 font-bold mb-2">Mozilla Public License Version 2.0 &amp; BSD 3-Clause</p>
                    <p className="mb-2">
                      Portions Copyright (c) 2024 12dakota and ChromiumOS Community Contributors.
                    </p>
                    <p className="mb-2">
                      1. Definitions: "Source Code Form" means the preferred form of the work for making modifications.
                      "Covered Software" means Source Code Form to which the initial Developer has attached the notice.
                    </p>
                    <p className="mb-2">
                      2. Grant of Rights: Each Contributor hereby grants You a world-wide, royalty-free, non-exclusive license to use, reproduce, make available, modify, display, perform, distribute, and otherwise exploit its Contributions.
                    </p>
                    <p className="text-amber-400/90">
                      DISCLAIMER: Flashing custom BIOS firmware or modifying operating system bootloaders carries inherent hardware risk. Always ensure you have a verified backup before writing firmware to your device.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="msi-chk-license"
                      type="checkbox"
                      checked={licenseAccepted}
                      onChange={(e) => setLicenseAccepted(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                    />
                    <label htmlFor="msi-chk-license" className="text-xs text-slate-300 cursor-pointer select-none">
                      I accept the terms in the License Agreement
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: BOARD & FIREFOX SELECTION */}
              {wizardStep === 3 && (
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Target Hardware &amp; Firefox Configuration</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Customize the ChromiumOS board architecture and Firefox browser version.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-400" />
                        <span>Chromebook Board Architecture</span>
                      </label>
                      <select
                        value={config.board}
                        onChange={(e) => onChange({ ...config, board: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        {POPULAR_BOARDS.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Target ebuilds: overlay-{config.board}-private
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-orange-400" />
                        <span>Mozilla Firefox Release</span>
                      </label>
                      <select
                        value={config.firefoxVersion}
                        onChange={(e) => onChange({ ...config, firefoxVersion: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="140.0">140.0 (Latest Nightly / Rapid)</option>
                        <option value="139.0">139.0 (Stable Release)</option>
                        <option value="128.0esr">128.0esr (Extended Support Release)</option>
                        <option value="115.0esr">115.0esr (Legacy)</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Overlay: <code className="text-orange-400 font-mono">www-client/firefox</code>
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">Compilation Targets:</span>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.buildChromeOS}
                          onChange={(e) => onChange({ ...config, buildChromeOS: e.target.checked })}
                          className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                        />
                        <span>Compile ChromeOS Image with Firefox</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.buildBios}
                          onChange={(e) => onChange({ ...config, buildBios: e.target.checked })}
                          className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                        />
                        <span>Compile Chromebook BIOS / Coreboot</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: BIOS & FIRMWARE CONFIG */}
              {wizardStep === 4 && (
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Chromebook BIOS &amp; Coreboot Options</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure firmware boot payloads and Google Binary Block (GBB) flags.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                      <span className="text-xs font-semibold text-slate-200 block">Firmware Bootloader Payload:</span>
                      <div className="space-y-1.5">
                        <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="payloadGroup"
                            checked={config.biosPayload === 'depthcharge'}
                            onChange={() => onChange({ ...config, biosPayload: 'depthcharge' })}
                            className="mt-0.5 w-4 h-4 accent-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-100">Google Depthcharge</span>
                            <p className="text-[11px] text-slate-400">
                              Stock ChromeOS bootloader. Fastest boot speed, verified boot security, and battery efficiency.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="payloadGroup"
                            checked={config.biosPayload === 'tianocore'}
                            onChange={() => onChange({ ...config, biosPayload: 'tianocore' })}
                            className="mt-0.5 w-4 h-4 accent-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-100">Tianocore EDK2 (Full UEFI)</span>
                            <p className="text-[11px] text-slate-400">
                              Replaces ChromeOS boot with standard UEFI BIOS. Allows booting Windows 10/11, Ubuntu, and standard OSes.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="payloadGroup"
                            checked={config.biosPayload === 'both'}
                            onChange={() => onChange({ ...config, biosPayload: 'both' })}
                            className="mt-0.5 w-4 h-4 accent-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-100">Build Both Payloads</span>
                            <p className="text-[11px] text-slate-400">
                              Generates both <code className="text-slate-300">bios-depthcharge.rom</code> and <code className="text-slate-300">bios-tianocore.rom</code>.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          GBB Flags (Google Binary Block)
                        </label>
                        <input
                          type="text"
                          value={config.gbbFlags || '0x489'}
                          onChange={(e) => onChange({ ...config, gbbFlags: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Preset 0x489 = Short 1s timeout + Allow USB boot
                        </span>
                      </div>

                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.disableSoftwareWp}
                            onChange={(e) => onChange({ ...config, disableSoftwareWp: e.target.checked })}
                            className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                          />
                          <span>Clear Software Write-Protect (<code className="text-orange-400 font-mono text-[10px]">--wp-disable</code>)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: READY TO INSTALL */}
              {wizardStep === 5 && (
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Ready to Install ChromiumOS &amp; BIOS Toolkit</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click <strong className="text-slate-200">Install</strong> to begin the installation process.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                    <div className="text-slate-300 font-semibold border-b border-slate-800 pb-1.5 mb-2">
                      Setup Configuration Summary:
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination Folder:</span>
                      <span className="font-mono text-slate-300">{config.msiInstallDir}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Board:</span>
                      <span className="font-mono text-blue-400 font-bold">{config.board}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Firefox Browser:</span>
                      <span className="font-mono text-orange-400 font-bold">{config.firefoxVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compile ChromeOS Image:</span>
                      <span className="text-slate-200">{config.buildChromeOS ? 'Yes (WSL2 Ubuntu)' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compile Chromebook BIOS:</span>
                      <span className="text-slate-200">{config.buildBios ? `Yes (${config.biosPayload})` : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GBB Flags:</span>
                      <span className="font-mono text-emerald-400">{config.gbbFlags || '0x489'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: INSTALLING / PROGRESS */}
              {wizardStep === 6 && (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-slate-100">Installing ChromiumOS &amp; BIOS Toolkit</h2>
                    <p className="text-xs text-slate-400">
                      Please wait while the Setup Wizard installs files and executes WiX Custom Actions...
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Status: {installStatus}</span>
                      <span className="font-mono font-bold text-blue-400">{installProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
                        style={{ width: `${installProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>MSI: Executing Component Group [CompleteToolkit]</div>
                    <div>CustomAction: CA_WriteConfigManifest &rarr; [INSTALLFOLDER]config.json</div>
                    <div>Shortcut: Registering Desktop Shortcut [ChromiumOS &amp; BIOS Builder]</div>
                  </div>
                </div>
              )}

              {/* STEP 7: FINISHED */}
              {wizardStep === 7 && (
                <div className="space-y-4 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">
                        Completed the ChromiumOS &amp; BIOS Toolkit Setup Wizard
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Click the <strong className="text-slate-200">Finish</strong> button to exit the Setup Wizard. All PowerShell flasher scripts, WSL2 build bridges, and Chromebook BIOS tools are installed.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={launchOnExit}
                        onChange={(e) => setLaunchOnExit(e.target.checked)}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                      <span className="font-semibold">Launch ChromiumOS &amp; BIOS Builder Control Center</span>
                    </label>
                    <p className="text-[11px] text-slate-400 pl-6">
                      Opens <code className="text-slate-300 font-mono">ChromiumOS-Builder-GUI.ps1</code> to compile your ChromeOS image and Chromebook BIOS immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Windows MSI Wizard Navigation Button Bar */}
              <div className="border-t border-slate-800/80 pt-4 mt-4 flex items-center justify-between">
                <div>
                  {wizardStep > 1 && wizardStep < 6 && (
                    <button
                      onClick={() => setWizardStep(wizardStep - 1)}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer border border-slate-700"
                    >
                      &lt; Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {wizardStep < 5 && (
                    <button
                      disabled={wizardStep === 2 && !licenseAccepted}
                      onClick={() => setWizardStep(wizardStep + 1)}
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Next &gt;</span>
                    </button>
                  )}

                  {wizardStep === 5 && (
                    <button
                      onClick={() => setWizardStep(6)}
                      className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Install</span>
                    </button>
                  )}

                  {wizardStep === 7 && (
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Finish</span>
                    </button>
                  )}

                  {wizardStep < 6 && (
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-3.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 rounded text-xs transition cursor-pointer border border-slate-700/50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Build Instructions & msiexec CLI */}
        <div className="lg:col-span-4 space-y-4">
          {/* WiX Build Instructions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>How to Compile .MSI on Windows</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compile <code className="text-blue-300 font-mono">Product.wxs</code> using the automated PowerShell builder (downloads portable WiX if missing):
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-blue-300 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="select-all">{buildMsiCmd}</span>
              <button
                onClick={() => copyToClipboard(buildMsiCmd, 'build')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] transition cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedCmd === 'build' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Silent Install Command */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Settings2 className="w-4 h-4 text-orange-400" />
              <span>Silent / Headless MSI Deployment</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pass properties directly into <code className="text-slate-300 font-mono">msiexec</code> for automated headless lab deployments:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-orange-300 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="select-all">{silentMsiCmd}</span>
              <button
                onClick={() => copyToClipboard(silentMsiCmd, 'silent')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] transition cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedCmd === 'silent' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Interactive Install Command */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Standard Interactive Install</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-emerald-300 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="select-all">{interactiveMsiCmd}</span>
              <button
                onClick={() => copyToClipboard(interactiveMsiCmd, 'inter')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] transition cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedCmd === 'inter' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Installed Components Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Installed by the MSI Package</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><code className="text-slate-300 font-mono">ChromiumOS-Builder-GUI.ps1</code> (WPF Control Center)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><code className="text-slate-300 font-mono">Build-All.ps1</code> (Unified ChromeOS + BIOS orchestrator)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><code className="text-slate-300 font-mono">Build-Chromebook-BIOS.ps1</code> (Coreboot &amp; Tianocore)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><code className="text-slate-300 font-mono">Flash-ChromiumOS.ps1</code> (Drive-protected USB flasher)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><code className="text-slate-300 font-mono">Flash-Chromebook-BIOS.ps1</code> (Safe flashrom flasher)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
