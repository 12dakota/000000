import { useState } from 'react';
import { ShieldCheck, Terminal, Copy, Check, Layers, Cpu, CheckCircle2, FileText } from 'lucide-react';
import { ScriptConfig } from '../types';

interface QuickCommandProps {
  config: ScriptConfig;
}

export function QuickCommand({ config }: QuickCommandProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const snippets = [
    {
      title: 'Run Windows Flasher via PowerShell (Admin)',
      desc: 'Bypasses execution policy and launches the interactive drive selection menu:',
      cmd: `powershell -ExecutionPolicy Bypass -File .\\Flash-ChromiumOS.ps1 -Board "${config.board}"`
    },
    {
      title: 'Flash specific local image directly to USB Disk 1',
      desc: 'Skips file selection dialog and directly targets Disk 1 with automated zstd decompression:',
      cmd: `powershell -ExecutionPolicy Bypass -File .\\Flash-ChromiumOS.ps1 -ImagePath ".\\chromiumos_${config.imageType}_image-${config.board}.bin.zst" -DiskNumber 1`
    },
    {
      title: 'Launch WSL2 Build Pipeline from Windows',
      desc: 'Orchestrates full cros_sdk compilation inside WSL2 and deposits output into Windows .\\flash\\:',
      cmd: `powershell -ExecutionPolicy Bypass -File .\\Build-ChromiumOS-WSL2.ps1 -Board "${config.board}" -FirefoxVersion "${config.firefoxVersion}"`
    },
    {
      title: 'Install Ubuntu WSL2 on Windows 10/11 (One-Time Prerequisite for building)',
      desc: 'Enables virtual machine platform, installs WSL2 kernel, and sets up Ubuntu distribution:',
      cmd: `wsl --install -d Ubuntu`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Architecture Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Windows Architecture: Bridging Linux ChromiumOS with Windows NT
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ChromiumOS is tightly coupled to the Linux kernel ecosystem (Gentoo Portage chroot, loop mounts, ext4 filesystems, and ebuild packages). Here is how this Windows toolkit safely implements the <code className="text-orange-400 font-mono">12dakota/Chromeos</code> workflow on Windows 10 and 11.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Anti-Brick Drive Safeguards</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Windows PowerShell commands <code className="text-slate-300 font-mono">Get-Disk</code> and <code className="text-slate-300 font-mono">Get-Partition</code> verify <code className="text-slate-300 font-mono">IsBoot</code> and <code className="text-slate-300 font-mono">IsSystem</code> flags. Writing to Disk 0 or the Windows host OS partition is strictly locked.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold">
            <Cpu className="w-4 h-4" />
            <span>WSL2 Ext4 Build Acceleration</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ChromiumOS's <code className="text-slate-300 font-mono">repo sync</code> creates millions of small files. Building inside the WSL2 native virtual disk (<code className="text-slate-300 font-mono">~/chromiumos</code>) avoids NTFS 9P translation penalties and executes at full native Linux NVMe speeds.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
            <FileText className="w-4 h-4" />
            <span>Zero-Dependency Zstandard</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Windows flasher automatically handles compressed <code className="text-slate-300 font-mono">.bin.zst</code> files by transparently fetching the official Facebook Zstandard binary if not present in your Windows system PATH.
          </p>
        </div>
      </div>

      {/* Commands List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-200">Common Windows PowerShell Commands</h3>
        </div>

        <div className="divide-y divide-slate-800">
          {snippets.map((item, idx) => (
            <div key={idx} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                <span className="text-[10px] font-mono text-slate-500">PowerShell (Admin)</span>
              </div>
              <p className="text-xs text-slate-400">{item.desc}</p>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between font-mono text-xs text-orange-300 overflow-x-auto">
                <span className="pr-4 select-all">{item.cmd}</span>
                <button
                  onClick={() => copyToClipboard(item.cmd, idx)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
