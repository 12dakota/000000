import { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, HardDrive, CheckCircle2, AlertOctagon, RotateCcw, Play, Check } from 'lucide-react';
import { ScriptConfig } from '../types';

interface FlashingSimulatorProps {
  config: ScriptConfig;
}

export function FlashingSimulator({ config }: FlashingSimulatorProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedDisk, setSelectedDisk] = useState<number | null>(null);
  const [typedConfirm, setTypedConfirm] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [writeSpeed, setWriteSpeed] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([
    'PowerShell 7.4.1 [Running as Administrator]',
    '=========================================================',
    `   ChromiumOS Windows Flasher (12dakota/Chromeos port)   `,
    `   Target Board: ${config.board}                         `,
    '=========================================================',
    ''
  ]);

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (text: string) => {
    setLogs(prev => [...prev, text]);
  };

  const resetSimulator = () => {
    setStep(1);
    setSelectedDisk(null);
    setTypedConfirm('');
    setProgress(0);
    setIsFlashing(false);
    setWriteSpeed(0);
    setLogs([
      'PowerShell 7.4.1 [Running as Administrator]',
      '=========================================================',
      `   ChromiumOS Windows Flasher (12dakota/Chromeos port)   `,
      `   Target Board: ${config.board}                         `,
      '=========================================================',
      ''
    ]);
  };

  const handleSelectImage = () => {
    addLog(`> Selected image: C:\\ChromiumOS\\chromiumos_${config.imageType}_image-${config.board}.bin.zst`);
    addLog(`> Decompressing Zstandard image: zstd -d chromiumos_${config.imageType}_image-${config.board}.bin.zst`);
    addLog(`> Raw uncompressed size: 7.84 GB`);
    addLog('');
    addLog('Scanning connected physical disks (Get-Disk)...');
    setStep(2);
  };

  const handleSelectDrive = (diskNum: number) => {
    if (diskNum === 0) {
      addLog(`[ERROR] Disk 0 contains Windows OS (C:)! Flasher blocked execution to safeguard host OS.`);
      return;
    }
    setSelectedDisk(diskNum);
    addLog(`> Selected target: Disk ${diskNum} (SanDisk Ultra USB 3.0, 29.8 GB)`);
    addLog('');
    addLog('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    addLog(` WARNING: ALL DATA ON DISK ${diskNum} WILL BE DESTROYED!`);
    addLog(' Device: SanDisk Ultra USB 3.0 (29.8 GB)');
    addLog(` Writing image: chromiumos_${config.imageType}_image-${config.board}.bin`);
    addLog('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    addLog('Type FLASH to proceed.');
    setStep(3);
  };

  const handleStartFlash = () => {
    if (typedConfirm !== 'FLASH') return;
    setStep(4);
    setIsFlashing(true);
    addLog('');
    addLog(`Dismounting volumes and wiping partition table on Disk ${selectedDisk}...`);
    addLog(`Opening physical raw device \\\\.\\PhysicalDrive${selectedDisk} (4MB buffer blocks)...`);
    addLog('Writing byte stream...');

    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      const speed = Math.round((38 + Math.random() * 8) * 10) / 10;
      setWriteSpeed(speed);
      
      if (current >= 100) {
        clearInterval(interval);
        setProgress(100);
        setIsFlashing(false);
        setStep(5);
        addLog('');
        addLog('=========================================================');
        addLog(' SUCCESS: Flash completed in 03m:14s!');
        addLog(` Average write speed: 42.1 MB/s`);
        addLog('=========================================================');
        addLog('');
        addLog('NEXT STEPS ON CHROMEBOOK:');
        addLog('1. Boot into Developer Mode (Esc + Refresh + Power -> Ctrl + D)');
        addLog('2. Enable USB boot in crosh: "crossystem dev_boot_usb=1"');
        addLog('3. Insert USB and press Ctrl + U on developer boot screen.');
      } else {
        setProgress(current);
      }
    }, 120);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Interactive Windows Flasher Simulator</h2>
              <p className="text-xs text-slate-400">
                Preview the safety verification and 4MB raw block flashing workflow of <code className="text-orange-400 font-mono">Flash-ChromiumOS.ps1</code>
              </p>
            </div>
          </div>

          <button
            onClick={resetSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { num: 1, label: 'Image Select' },
            { num: 2, label: 'Disk Scanner' },
            { num: 3, label: 'Safety Lock' },
            { num: 4, label: 'Raw Flashing' },
            { num: 5, label: 'Ready for Boot' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2.5 rounded-lg border text-center transition ${
                step === s.num
                  ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                  : step > s.num
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5">Step {s.num}</div>
              <div className="text-xs font-medium truncate">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Interactive Controls Area */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
          {step === 1 && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">Select Input ChromiumOS Image</div>
                <div className="text-xs text-slate-400">
                  Simulate selecting <code className="text-orange-400 font-mono">chromiumos_{config.imageType}_image-{config.board}.bin.zst</code>
                </div>
              </div>
              <button
                onClick={handleSelectImage}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Select & Decompress Image</span>
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-sm font-medium text-slate-200 mb-2">
                Physical Disks Detected via Windows PowerShell API:
              </div>
              <div className="space-y-2">
                {/* Disk 0 - Protected */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-red-900/40 bg-red-950/10">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-red-300 flex items-center gap-2">
                        <span>Disk 0: Samsung 980 PRO NVMe (512 GB)</span>
                        <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          LOCKED: WINDOWS OS (C:)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Contains active Boot & Windows system partitions. Script blocks selection.
                      </div>
                    </div>
                  </div>
                  <button
                    disabled
                    className="px-3 py-1.5 bg-slate-800 text-slate-600 text-xs rounded border border-slate-700 cursor-not-allowed opacity-50"
                  >
                    Protected
                  </button>
                </div>

                {/* Disk 1 - USB Drive */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-900/40 bg-emerald-950/10">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <span>Disk 1: SanDisk Ultra USB 3.0 (29.8 GB)</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          SAFE: REMOVABLE USB (E:)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Removable USB drive identified. Safe to flash.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectDrive(1)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition cursor-pointer"
                  >
                    Select USB Disk 1
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-900/50">
                <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 leading-relaxed">
                  <strong>Safety Confirmation Barrier:</strong> To prevent accidental data loss on Windows, the PowerShell script requires explicit manual confirmation before zeroing partitions and streaming raw data.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Type <code className="text-orange-400 font-bold">FLASH</code> in all caps to confirm writing:
                  </label>
                  <input
                    type="text"
                    value={typedConfirm}
                    onChange={(e) => setTypedConfirm(e.target.value)}
                    placeholder="Type FLASH"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  disabled={typedConfirm !== 'FLASH'}
                  onClick={handleStartFlash}
                  className={`mt-5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    typedConfirm === 'FLASH'
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  Confirm & Flash
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-orange-400">
                  Writing to \\.\PhysicalDrive{selectedDisk} (4MB blocks)...
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {progress}% • {writeSpeed} MB/s
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Buffer: 4,194,304 bytes per write</span>
                <span>Direct Win32 Stream IO</span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-emerald-300">Flash Completed Successfully!</div>
                  <div className="text-xs text-slate-300">
                    Your USB flash drive is now ready to boot your custom ChromiumOS {config.board} image.
                  </div>
                </div>
              </div>
              <button
                onClick={resetSimulator}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700 transition cursor-pointer"
              >
                Run Again
              </button>
            </div>
          )}
        </div>

        {/* Terminal Log Console */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 font-mono">
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span>Windows PowerShell (x64) - Administrator</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            </div>
          </div>
          <div
            ref={terminalRef}
            className="p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1 select-text leading-relaxed"
          >
            {logs.map((log, index) => (
              <div
                key={index}
                className={
                  log.startsWith('[ERROR]')
                    ? 'text-red-400'
                    : log.startsWith(' WARNING:') || log.startsWith('!')
                    ? 'text-amber-400'
                    : log.startsWith(' SUCCESS:')
                    ? 'text-emerald-400 font-bold'
                    : log.startsWith('>')
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
