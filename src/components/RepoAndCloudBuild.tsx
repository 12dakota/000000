import { useState, useMemo } from 'react';
import {
  GitBranch,
  GitCommit,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Play,
  Package,
  Cpu,
  ShieldAlert,
  Sparkles,
  CloudLightning,
  Download,
  FolderGit2,
  FileCode,
  Tag,
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ScriptConfig } from '../types';
import { POPULAR_BOARDS } from '../data/boards';
import { generateGitHubActionsWorkflow } from '../utils/msiAndBiosGenerators';

interface RepoAndCloudBuildProps {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
}

export function RepoAndCloudBuild({ config, onChange }: RepoAndCloudBuildProps) {
  const [activeSubTab, setActiveSubTab] = useState<'push' | 'cloud' | 'local' | 'release'>('cloud');
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/12dakota/ChromiumOS-Windows-Toolkit.git');
  const [protocol, setProtocol] = useState<'https' | 'pat' | 'gh' | 'ssh'>('https');
  const [patToken, setPatToken] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Workflow Dispatch configuration state
  const [targetBoard, setTargetBoard] = useState<string>(config.board);
  const [targetFirefox, setTargetFirefox] = useState<string>(config.firefoxVersion);
  const [targetBuildBios, setTargetBuildBios] = useState<boolean>(config.buildBios);
  const [targetPayload, setTargetPayload] = useState<'depthcharge' | 'tianocore' | 'both'>(config.biosPayload);
  const [targetGbbFlags, setTargetGbbFlags] = useState<string>(config.gbbFlags || '0x489');
  const [targetMsiVer, setTargetMsiVer] = useState<string>(config.msiProductVersion || '1.0.0');

  // Interactive CI simulation
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Derive owner and repo name from URL
  const { repoOwner, repoName } = useMemo(() => {
    try {
      const clean = repoUrl.replace(/\.git$/, '');
      const parts = clean.split(/[/:]/);
      if (parts.length >= 2) {
        return {
          repoOwner: parts[parts.length - 2] || '12dakota',
          repoName: parts[parts.length - 1] || 'ChromiumOS-Windows-Toolkit'
        };
      }
    } catch {
      // fallback
    }
    return { repoOwner: '12dakota', repoName: 'ChromiumOS-Windows-Toolkit' };
  }, [repoUrl]);

  // Generated Git push commands
  const gitCommands = useMemo(() => {
    const effectiveUrl = protocol === 'pat' && patToken.trim()
      ? `https://${patToken.trim()}@github.com/${repoOwner}/${repoName}.git`
      : protocol === 'ssh'
      ? `git@github.com:${repoOwner}/${repoName}.git`
      : repoUrl;

    if (protocol === 'gh') {
      return `# 1. Ensure you are authenticated with GitHub CLI
gh auth login

# 2. Create the new remote repository and push all commits & workflows
gh repo create ${repoOwner}/${repoName} --public --source=. --remote=origin --push

# 3. Verify your repo is live
gh repo view --web`;
    }

    return `# 1. Link your remote GitHub repository
git remote add origin ${effectiveUrl}

# 2. Ensure main branch is selected
git branch -M main

# 3. Push all commits, WiX sources, and GitHub Actions workflows
git push -u origin main

# (Optional: Push tags to trigger an automated MSI Release)
git tag v${targetMsiVer}
git push origin v${targetMsiVer}`;
  }, [protocol, repoUrl, patToken, repoOwner, repoName, targetMsiVer]);

  // Generated GitHub CLI command for triggering workflow
  const ghCliTrigger = `gh workflow run build-msi.yml \\
  -f board=${targetBoard} \\
  -f firefox_version=${targetFirefox} \\
  -f build_bios=${targetBuildBios} \\
  -f bios_payload=${targetPayload} \\
  -f gbb_flags=${targetGbbFlags} \\
  -f msi_version=${targetMsiVer}`;

  // Generated cURL command for triggering workflow via GitHub REST API
  const curlTrigger = `curl -X POST \\
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \\
  -H "Accept: application/vnd.github.v3+json" \\
  https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/build-msi.yml/dispatches \\
  -d '{"ref":"main","inputs":{"board":"${targetBoard}","firefox_version":"${targetFirefox}","build_bios":"${targetBuildBios}","bios_payload":"${targetPayload}","gbb_flags":"${targetGbbFlags}","msi_version":"${targetMsiVer}"}}'`;

  // Generated workflow YAML for current board
  const workflowYaml = useMemo(() => {
    return generateGitHubActionsWorkflow({
      ...config,
      board: targetBoard,
      firefoxVersion: targetFirefox,
      buildBios: targetBuildBios,
      biosPayload: targetPayload,
      gbbFlags: targetGbbFlags,
      msiProductVersion: targetMsiVer
    });
  }, [config, targetBoard, targetFirefox, targetBuildBios, targetPayload, targetGbbFlags, targetMsiVer]);

  // Run CI simulation
  const runSimulation = () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimStep(1);

    setTimeout(() => setSimStep(2), 1000);
    setTimeout(() => setSimStep(3), 2200);
    setTimeout(() => setSimStep(4), 3600);
    setTimeout(() => setSimStep(5), 4800);
    setTimeout(() => {
      setSimStep(6);
      setSimRunning(false);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-blue-950/40 border border-purple-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <FolderGit2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>Git Repository &amp; Cloud CI/CD Compiler</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    GitHub Actions
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Push your complete workspace to any new Git repository, then compile Windows MSI installers anytime via GitHub cloud runners without needing local Windows or WiX setup.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-2">
              <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
              <span>HEAD: 1c3b1de</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              <span>branch: main</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>56 Files Committed</span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-4 overflow-x-auto text-sm">
          <button
            id="subtab-cloud"
            onClick={() => setActiveSubTab('cloud')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs sm:text-sm shrink-0 ${
              activeSubTab === 'cloud'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CloudLightning className="w-4 h-4 text-purple-400" />
            <span>1. Compile Later in Cloud (GitHub Actions)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">Recommended</span>
          </button>

          <button
            id="subtab-push"
            onClick={() => setActiveSubTab('push')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs sm:text-sm shrink-0 ${
              activeSubTab === 'push'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GitBranch className="w-4 h-4 text-purple-400" />
            <span>2. Push to New Repository</span>
          </button>

          <button
            id="subtab-local"
            onClick={() => setActiveSubTab('local')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs sm:text-sm shrink-0 ${
              activeSubTab === 'local'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>3. Compile Locally (Offline Windows)</span>
          </button>

          <button
            id="subtab-release"
            onClick={() => setActiveSubTab('release')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs sm:text-sm shrink-0 ${
              activeSubTab === 'release'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>4. Automated Tagged Releases</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Cloud CI/CD Compiler (Workflow Dispatch) */}
      {activeSubTab === 'cloud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dispatch Parameters */}
          <div className="lg:col-span-6 space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudLightning className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-semibold text-slate-100">
                    On-Demand Cloud Compilation Parameters
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  workflow_dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Whenever you want to build an installer in the future, trigger the <code className="text-purple-300 font-mono">.github/workflows/build-msi.yml</code> workflow directly in your GitHub repo. Customize any combination of board and Firefox version below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Chromebook Board Target
                  </label>
                  <select
                    id="dispatch-board-select"
                    value={targetBoard}
                    onChange={(e) => {
                      setTargetBoard(e.target.value);
                      onChange({ ...config, board: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {POPULAR_BOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} ({b.name} - {b.cpu})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Firefox Version Target
                  </label>
                  <select
                    id="dispatch-firefox-select"
                    value={targetFirefox}
                    onChange={(e) => {
                      setTargetFirefox(e.target.value);
                      onChange({ ...config, firefoxVersion: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="140.0">v140.0 (Latest Release)</option>
                    <option value="139.0">v139.0 (Stable)</option>
                    <option value="128.0esr">v128.0esr (Enterprise)</option>
                    <option value="115.0esr">v115.0esr (Legacy)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    BIOS Firmware Payload
                  </label>
                  <select
                    id="dispatch-payload-select"
                    value={targetPayload}
                    onChange={(e) => setTargetPayload(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="depthcharge">Google Depthcharge (ChromeOS)</option>
                    <option value="tianocore">Tianocore EDK2 (Windows / Linux)</option>
                    <option value="both">Both Bootloaders</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GBB Flags (Bitmask Hex)
                  </label>
                  <input
                    type="text"
                    value={targetGbbFlags}
                    onChange={(e) => setTargetGbbFlags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    placeholder="0x489"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetBuildBios}
                    onChange={(e) => setTargetBuildBios(e.target.checked)}
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-950"
                  />
                  <span>Package Chromebook Coreboot / UEFI BIOS Compiler</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">MSI Version:</span>
                  <input
                    type="text"
                    value={targetMsiVer}
                    onChange={(e) => setTargetMsiVer(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-center font-mono text-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* How to Trigger Cloud Compilation */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span>3 Ways to Trigger Compilation on GitHub</span>
              </h4>

              {/* Method A: GitHub Web UI */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 text-[10px] flex items-center justify-center font-bold">1</span>
                    Via GitHub Web Browser (No Terminal Required)
                  </span>
                  <a
                    href={`https://github.com/${repoOwner}/${repoName}/actions/workflows/build-msi.yml`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                  >
                    Open Actions Tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside pl-1">
                  <li>Go to your repo on GitHub &rarr; click the <strong className="text-slate-200">Actions</strong> tab.</li>
                  <li>Click <strong className="text-slate-200">"Build Windows MSI Installer"</strong> in the left sidebar.</li>
                  <li>Click the <strong className="text-slate-200">Run workflow</strong> dropdown on the right.</li>
                  <li>Select Board (<code className="text-purple-300 font-mono">{targetBoard}</code>), Firefox (<code className="text-purple-300 font-mono">{targetFirefox}</code>) and click <strong className="text-slate-200">Run workflow</strong>.</li>
                  <li>When completed (~2 mins), download the generated <code className="text-emerald-400 font-mono">windows-msi-installer-{targetBoard}</code> artifact!</li>
                </ol>
              </div>

              {/* Method B: GitHub CLI */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center font-bold">2</span>
                    Via GitHub CLI (`gh`)
                  </span>
                  <button
                    id="copy-gh-cli-btn"
                    onClick={() => copyToClipboard(ghCliTrigger, 'gh-cli')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition cursor-pointer"
                  >
                    {copiedKey === 'gh-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Command</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {ghCliTrigger}
                </pre>
              </div>

              {/* Method C: GitHub REST API (cURL) */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">3</span>
                    Via Webhook / cURL API
                  </span>
                  <button
                    id="copy-curl-btn"
                    onClick={() => copyToClipboard(curlTrigger, 'curl')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition cursor-pointer"
                  >
                    {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy cURL</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {curlTrigger}
                </pre>
              </div>
            </div>
          </div>

          {/* Right: Cloud Build Simulator & Workflow Inspector */}
          <div className="lg:col-span-6 space-y-5">
            {/* Live Cloud Build Simulator */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-semibold text-slate-100">
                    GitHub Actions Cloud Build Pipeline
                  </h3>
                </div>
                <button
                  id="simulate-ci-build-btn"
                  onClick={runSimulation}
                  disabled={simRunning}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                    simRunning
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>{simRunning ? 'Running Cloud Runner...' : 'Simulate Cloud Build'}</span>
                </button>
              </div>

              {/* Visual Pipeline Stages */}
              <div className="space-y-2">
                <div className={`p-2.5 rounded-lg border text-xs font-mono transition ${
                  simStep >= 1 ? 'bg-slate-950 border-emerald-500/40 text-slate-200' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {simStep > 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : simStep === 1 ? <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>Step 1: Check out repository (`actions/checkout@v4`)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">windows-latest</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-mono transition ${
                  simStep >= 2 ? 'bg-slate-950 border-emerald-500/40 text-slate-200' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {simStep > 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : simStep === 2 ? <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>Step 2: Detect WiX Toolset v3.11 in `ProgramFiles(x86)`</span>
                    </span>
                    <span className="text-[10px] text-slate-400">candle / light</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-mono transition ${
                  simStep >= 3 ? 'bg-slate-950 border-emerald-500/40 text-slate-200' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {simStep > 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : simStep === 3 ? <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>Step 3: Compile `Product.wxs` for board <strong className="text-purple-400">{targetBoard}</strong></span>
                    </span>
                    <span className="text-[10px] text-slate-400">build-msi.ps1</span>
                  </div>
                  {simStep >= 3 && (
                    <div className="mt-1.5 pl-5 text-[11px] text-slate-400 space-y-0.5">
                      <div>&bull; Injected Property BOARD="{targetBoard}"</div>
                      <div>&bull; Injected Property FIREFOX_VERSION="{targetFirefox}"</div>
                      <div>&bull; Embedded Desktop &amp; Start Menu shortcuts</div>
                    </div>
                  )}
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-mono transition ${
                  simStep >= 4 ? 'bg-slate-950 border-emerald-500/40 text-slate-200' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {simStep > 4 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : simStep === 4 ? <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>Step 4: Generate SHA-256 Checksums (`SHA256SUMS.txt`)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400">Verified</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-mono transition ${
                  simStep >= 5 ? 'bg-slate-950 border-emerald-500/40 text-slate-200' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {simStep >= 5 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>Step 5: Publish Build Artifact (`actions/upload-artifact@v4`)</span>
                    </span>
                    <span className="text-[10px] text-blue-400">Retained 90d</span>
                  </div>
                  {simStep >= 5 && (
                    <div className="mt-2 p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs">
                        <Package className="w-4 h-4 text-emerald-400" />
                        <span>ChromiumOS-Toolkit-Setup-{targetBoard}.msi (~4.2 MB)</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Ready</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow File Definition */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono text-slate-200">.github/workflows/build-msi.yml</span>
                </div>
                <button
                  id="copy-workflow-yaml-btn"
                  onClick={() => copyToClipboard(workflowYaml, 'yaml')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition cursor-pointer"
                >
                  {copiedKey === 'yaml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy YAML</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-72 overflow-y-auto leading-relaxed">
                {workflowYaml}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Push to New Repository */}
      {activeSubTab === 'push' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-purple-400" />
                <span>Link and Push to Your New Repository</span>
              </h3>
              <p className="text-xs text-slate-400">
                Your workspace is already a clean, fully initialized Git repository on branch <code className="text-purple-300 font-mono">main</code> with 56 files committed. Set your new repository address below to get the exact push instructions.
              </p>

              {/* Protocol selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose Authentication Protocol:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    onClick={() => setProtocol('https')}
                    className={`px-3 py-2 rounded-lg border font-mono transition cursor-pointer ${
                      protocol === 'https'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HTTPS (Git)
                  </button>
                  <button
                    onClick={() => setProtocol('gh')}
                    className={`px-3 py-2 rounded-lg border font-mono transition cursor-pointer ${
                      protocol === 'gh'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    GitHub CLI (`gh`)
                  </button>
                  <button
                    onClick={() => setProtocol('ssh')}
                    className={`px-3 py-2 rounded-lg border font-mono transition cursor-pointer ${
                      protocol === 'ssh'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SSH (`git@`)
                  </button>
                  <button
                    onClick={() => setProtocol('pat')}
                    className={`px-3 py-2 rounded-lg border font-mono transition cursor-pointer ${
                      protocol === 'pat'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HTTPS + Token
                  </button>
                </div>
              </div>

              {/* Target Repository Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/your-username/my-chromiumos-toolkit.git"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Detected Target: <span className="text-purple-300 font-mono">{repoOwner}/{repoName}</span>
                </p>
              </div>

              {/* Optional PAT Input */}
              {protocol === 'pat' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <input
                    type="password"
                    value={patToken}
                    onChange={(e) => setPatToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tokens need <code className="text-slate-300">repo</code> and <code className="text-slate-300">workflow</code> permissions.
                  </p>
                </div>
              )}

              {/* Command block */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>Run in your Terminal or PowerShell:</span>
                  </span>
                  <button
                    id="copy-git-cmd-btn"
                    onClick={() => copyToClipboard(gitCommands, 'git-cmds')}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-mono transition cursor-pointer"
                  >
                    {copiedKey === 'git-cmds' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'git-cmds' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {gitCommands}
                </pre>
              </div>
            </div>
          </div>

          {/* Right: Commit Overview & Checklist */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Pre-Flight Repository Checklist</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200">Git Initialized &amp; Staged:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Main branch with root commit <code className="text-purple-300 font-mono">1c3b1de</code> created with all sources.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200">WiX Installer Defined:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      <code className="text-slate-300 font-mono">installer/Product.wxs</code> and <code className="text-slate-300 font-mono">build-msi.ps1</code> ready for packaging.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200">GitHub Actions CI/CD Embedded:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      <code className="text-slate-300 font-mono">.github/workflows/build-msi.yml</code> ready for on-demand cloud compilation upon push.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200">Chromebook BIOS Firmware Engine:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Coreboot, Depthcharge and Tianocore UEFI build scripts present in <code className="text-slate-300 font-mono">scripts/</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Once pushed, GitHub Actions will detect the workflow and offer the <strong>"Build Windows MSI Installer"</strong> option under your Actions tab automatically.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Local Offline Windows Compilation */}
      {activeSubTab === 'local' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                <span>Compiling the Installer Offline on Windows</span>
              </h3>
              <p className="text-xs text-slate-400">
                If you or a colleague clone this repository later onto a Windows 10 or Windows 11 computer, you do not need administrative privileges or manual WiX installation to compile the installer.
              </p>

              <div className="space-y-3">
                {/* Method 1: 1-Click Batch */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">Method 1: 1-Click File Explorer</span>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Easiest</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Simply double-click <code className="text-slate-200 font-mono">compile-msi.bat</code> in the repository root.
                  </p>
                </div>

                {/* Method 2: PowerShell */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-400">Method 2: PowerShell Parameterized Build</span>
                    <button
                      onClick={() => copyToClipboard(`.\\build-msi.ps1 -Board "${targetBoard}" -FirefoxVersion "${targetFirefox}"`, 'ps1-cmd')}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition cursor-pointer"
                    >
                      {copiedKey === 'ps1-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
{`.\\build-msi.ps1 -Board "${targetBoard}" -FirefoxVersion "${targetFirefox}"`}
                  </pre>
                </div>
              </div>

              {/* Portable WiX engine explanation */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>How the Automated Portable WiX Engine Works</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The <code className="text-slate-300 font-mono">build-msi.ps1</code> script contains automated discovery logic:
                </p>
                <ol className="text-slate-400 space-y-1 list-decimal list-inside pl-1">
                  <li>Checks system <code className="text-slate-300 font-mono">$env:PATH</code> for <code className="text-slate-300 font-mono">candle.exe</code> &amp; <code className="text-slate-300 font-mono">light.exe</code>.</li>
                  <li>Checks standard <code className="text-slate-300 font-mono">C:\Program Files (x86)\WiX Toolset v3.11\bin</code>.</li>
                  <li>Checks for modern WiX v4 (<code className="text-slate-300 font-mono">wix.exe</code>).</li>
                  <li><strong>Automatic Fallback:</strong> If no WiX tool is present, it downloads the official portable WiX 3.11 binaries zip directly from GitHub releases into a local <code className="text-slate-300 font-mono">.wixtools/</code> folder and compiles instantly without requiring admin rights!</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span>Generated Output Files</span>
              </h4>
              <p className="text-xs text-slate-400">
                When compilation finishes, the installer creates:
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-emerald-400 font-semibold">
                  ChromiumOS-Toolkit-Setup-{targetBoard}.msi
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>&bull; Size: ~4-5 MB (All scripts, guides &amp; GUI embedded)</div>
                  <div>&bull; Architecture: x64 Windows 10 / 11</div>
                  <div>&bull; Install Target: C:\Program Files\ChromiumOS Toolkit</div>
                  <div>&bull; Shortcuts: Desktop + Start Menu &rarr; ChromiumOS Builder</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Tagged Releases */}
      {activeSubTab === 'release' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <span>Automated Release Pipeline via Git Tags</span>
              </h3>
              <p className="text-xs text-slate-400">
                Whenever you want to release a formal production installer build to your team or community, push a Git release tag. GitHub Actions will automatically compile the MSI and create a GitHub Release with downloadable assets.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Run in your terminal:</span>
                  <button
                    onClick={() => copyToClipboard(`git tag v${targetMsiVer}\ngit push origin v${targetMsiVer}`, 'tag-cmd')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition cursor-pointer"
                  >
                    {copiedKey === 'tag-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Tag Commands</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
{`# Create a release tag
git tag v${targetMsiVer}

# Push tag to GitHub
git push origin v${targetMsiVer}`}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                <div className="font-semibold text-slate-200">
                  What happens when the tag is pushed:
                </div>
                <ol className="text-slate-400 space-y-1 list-decimal list-inside pl-1">
                  <li>GitHub Actions triggers the <code className="text-slate-300 font-mono">build-msi.yml</code> release job.</li>
                  <li>Windows runner packages <code className="text-slate-300 font-mono">ChromiumOS-Toolkit-Setup.msi</code> and computes its SHA-256 hash.</li>
                  <li>The <code className="text-slate-300 font-mono">softprops/action-gh-release@v2</code> step publishes a new GitHub Release under <code className="text-purple-300 font-mono">https://github.com/{repoOwner}/{repoName}/releases/tag/v{targetMsiVer}</code>.</li>
                  <li>Direct download links for the <code className="text-emerald-400 font-mono">.msi</code> and <code className="text-slate-300 font-mono">SHA256SUMS.txt</code> are attached automatically.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Releases Page Destination</span>
              </h4>
              <p className="text-xs text-slate-400">
                Your users will be able to download the installer directly from:
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-400 break-all">
                https://github.com/{repoOwner}/{repoName}/releases
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
