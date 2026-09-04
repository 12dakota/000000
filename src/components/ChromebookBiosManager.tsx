import { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Zap,
  Sliders,
  AlertTriangle,
  HelpCircle,
  FileCode,
  Layers,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { ScriptConfig } from '../types';
import { POPULAR_BOARDS } from '../data/boards';

interface ChromebookBiosManagerProps {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
}

interface GbbFlagDefinition {
  bit: number;
  hex: string;
  name: string;
  description: string;
  recommended: boolean;
}

const GBB_FLAG_DEFINITIONS: GbbFlagDefinition[] = [
  {
    bit: 0,
    hex: '0x0001',
    name: 'DEV_SCREEN_SHORT_DELAY',
    description: 'Reduces the Developer Mode warning screen delay from 30 seconds to 1 second.',
    recommended: true
  },
  {
    bit: 3,
    hex: '0x0008',
    name: 'FORCE_DEV_SWITCH_ON',
    description: 'Locks Developer Mode ON. Prevents accidental Spacebar keypresses from wiping your Chromebook.',
    recommended: true
  },
  {
    bit: 5,
    hex: '0x0020',
    name: 'FORCE_DEV_BOOT_USB',
    description: 'Enables booting from external USB storage without requiring manual crossystem commands.',
    recommended: true
  },
  {
    bit: 6,
    hex: '0x0040',
    name: 'DISABLE_FW_ROLLBACK_CHECK',
    description: 'Allows flashing custom or downgraded Coreboot firmware versions safely.',
    recommended: false
  },
  {
    bit: 10,
    hex: '0x0400',
    name: 'DISABLE_EC_SOFTWARE_SYNC',
    description: 'Skips Embedded Controller software synchronization during boot.',
    recommended: true
  }
];

export function ChromebookBiosManager({ config, onChange }: ChromebookBiosManagerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedWpMethod, setSelectedWpMethod] = useState<'battery' | 'cr50' | 'screw'>('cr50');

  const currentBoard = useMemo(() => {
    return POPULAR_BOARDS.find((b) => b.id === config.board) || POPULAR_BOARDS[0];
  }, [config.board]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Parse current GBB flags
  const parsedGbbVal = useMemo(() => {
    try {
      const hexStr = config.gbbFlags?.startsWith('0x') ? config.gbbFlags : `0x${config.gbbFlags || '0'}`;
      return parseInt(hexStr, 16) || 0;
    } catch {
      return 0;
    }
  }, [config.gbbFlags]);

  const toggleGbbFlag = (bit: number) => {
    const mask = 1 << bit;
    const newVal = parsedGbbVal ^ mask;
    const hexResult = '0x' + newVal.toString(16);
    onChange({ ...config, gbbFlags: hexResult });
  };

  const applyGbbPreset = (hex: string) => {
    onChange({ ...config, gbbFlags: hex });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100">Chromebook BIOS &amp; Coreboot Firmware Studio</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Target Board: {config.board}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Compile and flash custom Coreboot AP firmware for <strong className="text-slate-200">{currentBoard.name}</strong>. Choose between Google Depthcharge for ChromiumOS or Tianocore EDK2 UEFI to boot Windows 10/11, calculate GBB flags, and safely manage hardware write-protect.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Firmware Payload Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Depthcharge Payload */}
        <div
          onClick={() => onChange({ ...config, biosPayload: 'depthcharge' })}
          className={`p-5 rounded-xl border transition cursor-pointer relative ${
            config.biosPayload === 'depthcharge'
              ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
              <Zap className="w-4 h-4" />
              <span>Google Depthcharge Payload</span>
            </div>
            {config.biosPayload === 'depthcharge' && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500 text-white font-bold">
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-2 font-medium">
            Stock ChromeOS Payload • Fast Boot • Verified Integrity
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Maintains the official ChromeOS bootloader architecture. Automatically verifies kernel signatures in your custom ChromiumOS build while honoring GBB flags like 1-second Developer Mode screen timeouts.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-blue-300 font-mono">
            <Check className="w-3.5 h-3.5 text-blue-400" />
            <span>Best for: ChromiumOS + Firefox builds on {config.board}</span>
          </div>
        </div>

        {/* Tianocore EDK2 Payload */}
        <div
          onClick={() => onChange({ ...config, biosPayload: 'tianocore' })}
          className={`p-5 rounded-xl border transition cursor-pointer relative ${
            config.biosPayload === 'tianocore'
              ? 'bg-orange-950/30 border-orange-500/60 ring-1 ring-orange-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-orange-400 text-sm font-bold">
              <Layers className="w-4 h-4" />
              <span>Tianocore EDK2 (Full UEFI Payload)</span>
            </div>
            {config.biosPayload === 'tianocore' && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500 text-white font-bold">
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-2 font-medium">
            Complete UEFI Firmware • Boot Windows 10/11 &amp; Standard Linux
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Replaces ChromeOS boot entirely with a standard PC UEFI BIOS. Allows you to install Windows 11, Ubuntu, Debian, or standard operating systems directly onto your Chromebook's internal NVMe/eMMC drive.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-orange-300 font-mono">
            <Check className="w-3.5 h-3.5 text-orange-400" />
            <span>Best for: Installing Windows or Ubuntu on Chromebook</span>
          </div>
        </div>
      </div>

      {/* Interactive GBB Flag Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">Interactive GBB Flag Calculator</h2>
              <p className="text-[11px] text-slate-400">
                Google Binary Block (GBB) flags configure low-level boot behavior and dev screen timeouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Computed Hex:</span>
            <span className="px-3 py-1 bg-slate-950 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm rounded-lg">
              {config.gbbFlags || '0x489'}
            </span>
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Quick Presets:</span>
          <button
            onClick={() => applyGbbPreset('0x489')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border ${
              config.gbbFlags === '0x489'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            0x489 (Recommended - 1s Timeout + Force Dev)
          </button>
          <button
            onClick={() => applyGbbPreset('0x39')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border ${
              config.gbbFlags === '0x39'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            0x39 (Short Timeout Only)
          </button>
          <button
            onClick={() => applyGbbPreset('0x3f')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border ${
              config.gbbFlags === '0x3f'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            0x3f (Full Dev Mode Override)
          </button>
          <button
            onClick={() => applyGbbPreset('0x0')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border ${
              config.gbbFlags === '0x0'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            0x0 (Stock ChromeOS Default)
          </button>
        </div>

        {/* Flag Bitmask Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {GBB_FLAG_DEFINITIONS.map((flag) => {
            const isSet = (parsedGbbVal & (1 << flag.bit)) !== 0;
            return (
              <div
                key={flag.hex}
                onClick={() => toggleGbbFlag(flag.bit)}
                className={`p-3 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
                  isSet
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSet}
                  onChange={() => {}} // Handled by parent div
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{flag.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      {flag.hex}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{flag.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware Write-Protect (WP) Unlock Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100">
            Hardware Write-Protect (WP) Guide for {currentBoard.name}
          </h2>
        </div>

        <div className="flex border-b border-slate-800 text-xs bg-slate-950/60 rounded-lg p-1">
          <button
            onClick={() => setSelectedWpMethod('cr50')}
            className={`flex-1 py-1.5 rounded-md font-medium transition cursor-pointer ${
              selectedWpMethod === 'cr50'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CR50 / Ti50 CCD (Modern Intel / AMD)
          </button>
          <button
            onClick={() => setSelectedWpMethod('battery')}
            className={`flex-1 py-1.5 rounded-md font-medium transition cursor-pointer ${
              selectedWpMethod === 'battery'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Battery Disconnect Method
          </button>
          <button
            onClick={() => setSelectedWpMethod('screw')}
            className={`flex-1 py-1.5 rounded-md font-medium transition cursor-pointer ${
              selectedWpMethod === 'screw'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Legacy WP Screw / Jumper
          </button>
        </div>

        {selectedWpMethod === 'cr50' && (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Jasper Lake (<code className="text-orange-300 font-mono">dedede</code>), Gemini Lake (<code className="text-orange-300 font-mono">octopus</code>), and Comet Lake (<code className="text-orange-300 font-mono">hatch</code>) use Google's CR50/Ti50 security chip. Hardware write-protect can be opened using a Suzy-Q USB-C debug cable.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-amber-300 space-y-1">
              <div># 1. Plug Suzy-Q into the debug USB-C port, open ChromeOS crosh shell (Ctrl + Alt + T):</div>
              <div className="text-slate-100 font-bold">shell</div>
              <div># 2. Open CCD (Closed Case Debugging):</div>
              <div className="text-slate-100 font-bold">sudo gsctool -a -o</div>
              <div># 3. Follow the prompt to press the power button multiple times when requested.</div>
            </div>
          </div>
        )}

        {selectedWpMethod === 'battery' && (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              On most Chromebooks without a Suzy-Q cable, the internal battery provides the ground signal for Hardware Write-Protect.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
              <li>Power off the Chromebook completely.</li>
              <li>Remove bottom panel screws and lift the back chassis.</li>
              <li>Unplug the battery cable connector from the motherboard.</li>
              <li>Plug in the OEM USB-C power charger (the device will boot on AC power without battery).</li>
              <li>Hardware Write-Protect is now disabled! You can execute <code className="text-slate-200 font-mono">flashrom</code> to write new firmware.</li>
            </ol>
          </div>
        )}

        {selectedWpMethod === 'screw' && (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Pre-2017 Chromebooks (Bay Trail, Braswell, Broadwell, Skylake) use a physical metallic screw bridging two solder pads near the Wi-Fi card or SoC.
            </p>
            <p className="text-slate-400">
              Removing this screw breaks the circuit and instantly opens hardware write-protect.
            </p>
          </div>
        )}
      </div>

      {/* Flashing Commands */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100">Windows BIOS Build &amp; Flash Commands</h2>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-400">Compile Chromebook BIOS in WSL2:</div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-blue-300 flex items-center justify-between">
            <span className="select-all">
              powershell -ExecutionPolicy Bypass -File .\scripts\Build-Chromebook-BIOS.ps1 -Board "{config.board}" -Payload "{config.biosPayload}"
            </span>
            <button
              onClick={() =>
                copyToClipboard(
                  `powershell -ExecutionPolicy Bypass -File .\\scripts\\Build-Chromebook-BIOS.ps1 -Board "${config.board}" -Payload "${config.biosPayload}"`,
                  'cmd-build-bios'
                )
              }
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition cursor-pointer shrink-0 ml-2"
            >
              {copiedId === 'cmd-build-bios' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="text-xs text-slate-400">Safely Flash BIOS via SSH with double-read backup verification:</div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-300 flex items-center justify-between">
            <span className="select-all">
              powershell -ExecutionPolicy Bypass -File .\scripts\Flash-Chromebook-BIOS.ps1 -RomPath ".\firmware\bios-{config.board}-{config.biosPayload}.rom"
            </span>
            <button
              onClick={() =>
                copyToClipboard(
                  `powershell -ExecutionPolicy Bypass -File .\\scripts\\Flash-Chromebook-BIOS.ps1 -RomPath ".\\firmware\\bios-${config.board}-${config.biosPayload}.rom"`,
                  'cmd-flash-bios'
                )
              }
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition cursor-pointer shrink-0 ml-2"
            >
              {copiedId === 'cmd-flash-bios' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
