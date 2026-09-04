import { Download, ExternalLink, Terminal, HardDrive, BookOpen, ShieldCheck, Cpu, Package, Zap, FolderGit2 } from 'lucide-react';
import { ScriptFile } from '../types';
import { downloadAllAsZip } from '../utils/downloadHelper';

export type AppTab = 'scripts' | 'msi' | 'bios' | 'repo' | 'simulator' | 'guide' | 'quickcmd';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  scripts: ScriptFile[];
}

export function Navbar({ activeTab, setActiveTab, scripts }: NavbarProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-blue-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-lg tracking-tight">ChromiumOS Windows Toolkit</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  MSI &amp; BIOS Compiler
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ported from{' '}
                <a
                  href="https://github.com/12dakota/Chromeos"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 font-mono"
                >
                  12dakota/Chromeos <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="download-all-zip-btn"
              onClick={() => downloadAllAsZip(scripts)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download All Files (.ZIP)</span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 py-2 overflow-x-auto text-sm">
          <button
            id="tab-btn-msi"
            onClick={() => setActiveTab('msi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'msi'
                ? 'bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-blue-400" />
            <span>Windows MSI Installer</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">WiX</span>
          </button>

          <button
            id="tab-btn-bios"
            onClick={() => setActiveTab('bios')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'bios'
                ? 'bg-amber-600/20 text-amber-400 shadow-sm border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Chromebook BIOS &amp; Coreboot</span>
          </button>

          <button
            id="tab-btn-repo"
            onClick={() => setActiveTab('repo')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'repo'
                ? 'bg-purple-600/20 text-purple-300 shadow-sm border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-purple-400" />
            <span>Push to Repo &amp; Cloud CI/CD</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">Build Later</span>
          </button>

          <button
            id="tab-btn-scripts"
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'scripts'
                ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Generated Scripts</span>
          </button>

          <button
            id="tab-btn-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Flasher Simulator</span>
          </button>

          <button
            id="tab-btn-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Chromebook Boot Guide</span>
          </button>

          <button
            id="tab-btn-quickcmd"
            onClick={() => setActiveTab('quickcmd')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'quickcmd'
                ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Safety &amp; Architecture</span>
          </button>
        </div>
      </div>
    </header>
  );
}

