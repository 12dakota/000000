import { useState } from 'react';
import { Settings, Cpu, Globe, Palette, Sliders, RotateCcw, Info, Zap, ShieldAlert, Package } from 'lucide-react';
import { ScriptConfig } from '../types';
import { POPULAR_BOARDS } from '../data/boards';

interface ConfigPanelProps {
  config: ScriptConfig;
  onChange: (newConfig: ScriptConfig) => void;
  onReset: () => void;
}

export function ConfigPanel({ config, onChange, onReset }: ConfigPanelProps) {
  const [activeSection, setActiveSection] = useState<'board' | 'firefox' | 'splash' | 'bios' | 'build'>('board');

  const selectedBoardInfo = POPULAR_BOARDS.find(b => b.id === config.board);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-slate-100">Script Parameters & Board Config</h2>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-orange-400 flex items-center gap-1 transition cursor-pointer"
          title="Reset to 12dakota/Chromeos defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-slate-800 text-xs bg-slate-950/50">
        <button
          onClick={() => setActiveSection('board')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition cursor-pointer border-b-2 ${
            activeSection === 'board'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Target Board</span>
        </button>
        <button
          onClick={() => setActiveSection('firefox')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition cursor-pointer border-b-2 ${
            activeSection === 'firefox'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Firefox Rootfs</span>
        </button>
        <button
          onClick={() => setActiveSection('splash')}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1 font-medium transition cursor-pointer border-b-2 ${
            activeSection === 'splash'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Splash</span>
        </button>
        <button
          onClick={() => setActiveSection('bios')}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1 font-medium transition cursor-pointer border-b-2 ${
            activeSection === 'bios'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>BIOS</span>
        </button>
        <button
          onClick={() => setActiveSection('build')}
          className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1 font-medium transition cursor-pointer border-b-2 ${
            activeSection === 'build'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Build</span>
        </button>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* Board Config */}
        {activeSection === 'board' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Chromebook Board
              </label>
              <select
                value={POPULAR_BOARDS.some(b => b.id === config.board) ? config.board : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    onChange({
                      ...config,
                      board: e.target.value,
                      splashSubtitle: `custom test image · board ${e.target.value}`
                    });
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 text-sm"
              >
                {POPULAR_BOARDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
                <option value="custom">-- Custom Board Name --</option>
              </select>
            </div>

            {/* If custom or editable board */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Board Identifier Code (as passed to <code className="text-orange-400 font-mono">setup_board --board=...</code>)
              </label>
              <input
                type="text"
                value={config.board}
                onChange={(e) =>
                  onChange({
                    ...config,
                    board: e.target.value.trim().toLowerCase(),
                    splashSubtitle: `custom test image · board ${e.target.value.trim().toLowerCase()}`
                  })
                }
                placeholder="dedede"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            {selectedBoardInfo ? (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Architecture:</span>
                  <span className="text-slate-200 font-mono">{selectedBoardInfo.arch}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Processor:</span>
                  <span className="text-slate-200 font-mono">{selectedBoardInfo.cpu}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Common Devices:</span>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {selectedBoardInfo.popularDevices.map((dev, idx) => (
                      <li key={idx} className="truncate">{dev}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-start gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Using custom board: ensure your Chromebook hardware matches this board name by running <code className="text-orange-400 font-mono">cat /etc/lsb-release</code> on your Chromebook.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Firefox Options */}
        {activeSection === 'firefox' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-sm font-medium text-slate-200 block">Include Firefox in Rootfs</span>
                <span className="text-xs text-slate-400">
                  Injects Mozilla Firefox into <code className="text-orange-400 font-mono">/opt/firefox</code>
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.includeFirefox}
                onChange={(e) => onChange({ ...config, includeFirefox: e.target.checked })}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
            </div>

            {config.includeFirefox && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Official Firefox Version (linux-x86_64)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {['140.0', '139.0', '138.0', '128.0esr'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onChange({ ...config, firefoxVersion: v })}
                        className={`py-1.5 px-3 rounded text-xs font-mono border transition cursor-pointer ${
                          config.firefoxVersion === v
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        v{v}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={config.firefoxVersion}
                    onChange={(e) => onChange({ ...config, firefoxVersion: e.target.value })}
                    placeholder="140.0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Downloads official binaries from <code className="text-slate-300 font-mono">ftp.mozilla.org/pub/firefox/releases/</code>.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block">Rootfs Hooks Generated:</span>
                  <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
                    <div>• /opt/firefox/firefox</div>
                    <div>• /usr/local/bin/firefox (wrapper)</div>
                    <div>• /usr/share/applications/firefox.desktop</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Boot Splash Config */}
        {activeSection === 'splash' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Boot Splash Title</label>
              <input
                type="text"
                value={config.splashTitle}
                onChange={(e) => onChange({ ...config, splashTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Boot Splash Subtitle</label>
              <input
                type="text"
                value={config.splashSubtitle}
                onChange={(e) => onChange({ ...config, splashSubtitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Background</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={config.splashBgColor}
                    onChange={(e) => onChange({ ...config, splashBgColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{config.splashBgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Firefox Accent</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={config.splashAccent1}
                    onChange={(e) => onChange({ ...config, splashAccent1: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{config.splashAccent1}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Chrome Accent</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={config.splashAccent2}
                    onChange={(e) => onChange({ ...config, splashAccent2: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{config.splashAccent2}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BIOS & Coreboot Config */}
        {activeSection === 'bios' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="text-xs font-semibold text-slate-200 block">Firmware Boot Payload</span>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="panelPayloadGroup"
                    checked={config.biosPayload === 'depthcharge'}
                    onChange={() => onChange({ ...config, biosPayload: 'depthcharge' })}
                    className="mt-0.5 w-3.5 h-3.5 accent-orange-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Google Depthcharge</span>
                    <p className="text-[11px] text-slate-400">Stock ChromeOS verified bootloader payload.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="panelPayloadGroup"
                    checked={config.biosPayload === 'tianocore'}
                    onChange={() => onChange({ ...config, biosPayload: 'tianocore' })}
                    className="mt-0.5 w-3.5 h-3.5 accent-orange-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Tianocore EDK2 (Full UEFI)</span>
                    <p className="text-[11px] text-slate-400">Allows booting Windows 10/11 & Linux distributions.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="panelPayloadGroup"
                    checked={config.biosPayload === 'both'}
                    onChange={() => onChange({ ...config, biosPayload: 'both' })}
                    className="mt-0.5 w-3.5 h-3.5 accent-orange-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Build Both (.rom payloads)</span>
                    <p className="text-[11px] text-slate-400">Generates both depthcharge and tianocore firmware.</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">GBB Flags (Hex)</label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onChange({ ...config, gbbFlags: '0x489' })}
                    className="text-[10px] font-mono text-orange-400 hover:underline cursor-pointer"
                  >
                    0x489 (Fast)
                  </button>
                  <span className="text-slate-600 text-[10px]">•</span>
                  <button
                    onClick={() => onChange({ ...config, gbbFlags: '0x3f' })}
                    className="text-[10px] font-mono text-orange-400 hover:underline cursor-pointer"
                  >
                    0x3f (Full Dev)
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={config.gbbFlags || '0x489'}
                onChange={(e) => onChange({ ...config, gbbFlags: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                0x489 enables 1s dev screen delay and allows USB booting.
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Clear Software Write-Protect</span>
                <span className="text-[11px] text-slate-400">
                  Runs <code className="text-orange-400 font-mono">flashrom --wp-disable</code> before flashing.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.disableSoftwareWp}
                onChange={(e) => onChange({ ...config, disableSoftwareWp: e.target.checked })}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Build Flags */}
        {activeSection === 'build' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="text-xs font-semibold text-slate-200 block">Compilation Targets:</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.buildChromeOS}
                    onChange={(e) => onChange({ ...config, buildChromeOS: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                  />
                  <span>Compile ChromiumOS Image with Firefox</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.buildBios}
                    onChange={(e) => onChange({ ...config, buildBios: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                  />
                  <span>Compile Chromebook BIOS / Coreboot</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">ChromiumOS Branch</label>
              <select
                value={config.manifestBranch}
                onChange={(e) => onChange({ ...config, manifestBranch: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="stable">stable (Recommended for daily use)</option>
                <option value="beta">beta</option>
                <option value="dev">dev</option>
                <option value="main">main / canary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Image Target Type</label>
              <select
                value={config.imageType}
                onChange={(e) => onChange({ ...config, imageType: e.target.value as 'test' | 'base' | 'dev' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="test">test (Includes root shell, ssh daemon, test keys)</option>
                <option value="base">base (Clean vanilla user experience)</option>
                <option value="dev">dev (Developer utilities included)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Rootfs Verification</span>
                <span className="text-[11px] text-slate-400">
                  When disabled, allows modifying system partitions (adds <code className="text-orange-400 font-mono">--no-enable-rootfs-verification</code>)
                </span>
              </div>
              <input
                type="checkbox"
                checked={!config.enableRootfsVerification}
                onChange={(e) => onChange({ ...config, enableRootfsVerification: !e.target.checked })}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Repo Sync Threads (-j)</label>
              <input
                type="number"
                min={1}
                max={32}
                value={config.repoJobs}
                onChange={(e) => onChange({ ...config, repoJobs: parseInt(e.target.value, 10) || 8 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
