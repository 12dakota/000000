import { useState } from 'react';
import { Key, ShieldAlert, Cpu, Laptop, Terminal, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';
import { ScriptConfig } from '../types';

interface ChromebookGuideProps {
  config: ScriptConfig;
}

export function ChromebookGuide({ config }: ChromebookGuideProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copySnippet = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Chromebook Developer Boot & Flash Guide ({config.board})
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chromebooks enforce verified boot with cryptographic hardware signatures. Because custom images compiled with official Firefox into the rootfs cannot be signed with Google production private keys, your device <strong>must be in Developer Mode</strong> with USB boot allowed.
            </p>
          </div>
        </div>
      </div>

      {/* Step by step cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              STEP 1
            </span>
            <Key className="w-4 h-4 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Enter Developer Mode</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            This disables OS verification and allows booting unsigned test/custom images.
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono text-orange-400">1</span>
              <span>Turn off the Chromebook.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono text-orange-400">2</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Esc</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Refresh (↻)</kbd> + tap <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Power</kbd>.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono text-orange-400">3</span>
              <span>At Recovery screen, press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">D</kbd>.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono text-orange-400">4</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Enter</kbd> to confirm transitioning to developer mode.</span>
            </div>
          </div>
          <p className="text-[11px] text-amber-400/90">
            Note: This transitions the device and wipes user partitions. Takes ~5-10 minutes.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              STEP 2
            </span>
            <Terminal className="w-4 h-4 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Enable USB Boot in GBB / Crossystem</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            By default, Developer Mode blocks USB booting until explicitly enabled via the developer shell.
          </p>
          <div className="space-y-2 text-xs">
            <div className="text-slate-300">1. On the Developer boot screen, press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">D</kbd> to boot the internal OS.</div>
            <div className="text-slate-300">2. Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">T</kbd> to open crosh.</div>
            <div className="text-slate-300">3. Type <code className="text-orange-400 font-mono">shell</code> and press Enter.</div>
            <div className="bg-slate-950 border border-slate-800 rounded p-2 flex items-center justify-between font-mono text-[11px] text-emerald-400">
              <code>sudo crossystem dev_boot_usb=1 dev_boot_signed_only=0</code>
              <button
                onClick={() => copySnippet('sudo crossystem dev_boot_usb=1 dev_boot_signed_only=0')}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedCmd === 'sudo crossystem dev_boot_usb=1 dev_boot_signed_only=0' ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              STEP 3
            </span>
            <Cpu className="w-4 h-4 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Boot the Flashed USB Drive</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Plug the USB drive (created with <code className="text-orange-400 font-mono">Flash-ChromiumOS.ps1</code>) into your Chromebook.
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 text-xs text-slate-300">
            <div>1. Insert the USB into an available USB 3.0 port.</div>
            <div>2. Restart your Chromebook.</div>
            <div>
              3. At the Developer Mode warning screen ("OS verification is OFF"), press:
              <div className="mt-1.5 text-center">
                <span className="inline-block px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 font-mono text-sm font-bold border border-orange-500/40 shadow">
                  Ctrl + U
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 text-center">
              (The device will beep once or twice and immediately boot the USB kernel)
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              STEP 4
            </span>
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Install to Internal Storage (Optional)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You can run live from the USB, or write it directly onto internal eMMC or NVMe disk.
          </p>
          <div className="space-y-2 text-xs">
            <div className="text-slate-300">Inside the booted ChromiumOS live environment:</div>
            <div className="text-slate-300">1. Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-orange-300">F2 (→)</kbd> or open crosh.</div>
            <div className="text-slate-300">2. Log in as <code className="text-orange-400 font-mono">root</code> (test image password is usually <code className="text-orange-400 font-mono">test0000</code>).</div>
            <div className="text-slate-300">3. Run the installer:</div>
            <div className="bg-slate-950 border border-slate-800 rounded p-2 flex items-center justify-between font-mono text-[11px] text-emerald-400">
              <code>sudo /usr/sbin/chromeos-install --dst /dev/mmcblk0</code>
              <button
                onClick={() => copySnippet('sudo /usr/sbin/chromeos-install --dst /dev/mmcblk0')}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedCmd === 'sudo /usr/sbin/chromeos-install --dst /dev/mmcblk0' ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="text-[11px] text-slate-500">
              For NVMe devices (e.g. higher-end dedede or brya models), use destination <code className="font-mono text-slate-400">/dev/nvme0n1</code>.
            </div>
          </div>
        </div>
      </div>

      {/* How to verify board name on Chromebook */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            How to verify if your Chromebook is board '{config.board}'
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">Method 1: Chrome URL</span>
            <p className="text-slate-400 leading-relaxed">
              Open Chrome browser on the Chromebook and navigate to <code className="text-orange-400 font-mono">chrome://version</code> or <code className="text-orange-400 font-mono">chrome://system</code>. Look for <strong>CHROMEOS_RELEASE_BOARD</strong>.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">Method 2: Recovery Screen</span>
            <p className="text-slate-400 leading-relaxed">
              At the <kbd className="px-1 bg-slate-800 rounded">Esc</kbd> + <kbd className="px-1 bg-slate-800 rounded">Refresh</kbd> recovery screen, the hardware model name is listed at the bottom (e.g. <code className="text-orange-400 font-mono">DEDEDE ...</code> or <code className="text-orange-400 font-mono">OCTOPUS ...</code>).
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">Method 3: Terminal</span>
            <p className="text-slate-400 leading-relaxed">
              In shell, run <code className="text-orange-400 font-mono">cat /etc/lsb-release | grep CHROMEOS_RELEASE_BOARD</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
