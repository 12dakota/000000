/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { ScriptConfig } from './types';
import { getAllScripts } from './utils/scriptGenerators';
import { Navbar, AppTab } from './components/Navbar';
import { ConfigPanel } from './components/ConfigPanel';
import { SplashPreview } from './components/SplashPreview';
import { ScriptViewer } from './components/ScriptViewer';
import { FlashingSimulator } from './components/FlashingSimulator';
import { ChromebookGuide } from './components/ChromebookGuide';
import { QuickCommand } from './components/QuickCommand';
import { MsiInstallerBuilder } from './components/MsiInstallerBuilder';
import { ChromebookBiosManager } from './components/ChromebookBiosManager';
import { RepoAndCloudBuild } from './components/RepoAndCloudBuild';
import { ExternalLink, Terminal, Shield, Sparkles } from 'lucide-react';

const DEFAULT_CONFIG: ScriptConfig = {
  board: 'dedede',
  manifestBranch: 'stable',
  includeFirefox: true,
  firefoxVersion: '140.0',
  splashTitle: 'Firefox × ChromiumOS',
  splashSubtitle: 'custom test image · board dedede',
  splashBgColor: '#0b1a2b',
  splashAccent1: '#ff7139',
  splashAccent2: '#4285f4',
  enableRootfsVerification: false,
  imageType: 'test',
  repoJobs: 8,
  outputDirectory: './flash',
  githubRepo: '12dakota/Chromeos',
  buildChromeOS: true,
  buildBios: true,
  biosPayload: 'depthcharge',
  gbbFlags: '0x489',
  disableSoftwareWp: true,
  msiProductVersion: '1.0.0',
  msiInstallDir: 'C:\\Program Files\\ChromiumOS Toolkit'
};

export default function App() {
  const [config, setConfig] = useState<ScriptConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<AppTab>('msi');

  // Regenerate all Windows scripts dynamically whenever config changes
  const generatedScripts = useMemo(() => {
    return getAllScripts(config);
  }, [config]);

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scripts={generatedScripts}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Feature Highlights Bar */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Windows Port for 12dakota/Chromeos</span>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                  MSI Installer Ready
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Board: {config.board}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unified compilation pipeline: Build Firefox {config.firefoxVersion} overlay for ChromiumOS and build custom Chromebook Coreboot/UEFI BIOS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center text-xs">
            <a
              href="https://github.com/12dakota/Chromeos"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition flex items-center gap-1.5 border border-slate-700"
            >
              <span>GitHub Repo</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* View Switching */}
        {activeTab === 'msi' && (
          <MsiInstallerBuilder
            config={config}
            onChange={setConfig}
            scripts={generatedScripts}
          />
        )}

        {activeTab === 'bios' && (
          <ChromebookBiosManager
            config={config}
            onChange={setConfig}
          />
        )}

        {activeTab === 'repo' && (
          <RepoAndCloudBuild
            config={config}
            onChange={setConfig}
          />
        )}

        {activeTab === 'scripts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Configuration & Live Splash Preview */}
            <div className="lg:col-span-4 space-y-6">
              <ConfigPanel
                config={config}
                onChange={setConfig}
                onReset={handleReset}
              />
              <SplashPreview config={config} />
            </div>

            {/* Right Column: Code Viewer & Direct Downloads */}
            <div className="lg:col-span-8">
              <ScriptViewer files={generatedScripts} />
            </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <FlashingSimulator config={config} />
        )}

        {activeTab === 'guide' && (
          <ChromebookGuide config={config} />
        )}

        {activeTab === 'quickcmd' && (
          <QuickCommand config={config} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-400" />
            <span>
              ChromiumOS Windows Toolkit • Based on open-source code from{' '}
              <a
                href="https://github.com/12dakota/Chromeos"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-200 underline"
              >
                12dakota/Chromeos
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Windows Drive 0 Protection Active
            </span>
            <span>MPL-2.0 / BSD License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
