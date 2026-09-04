import { useState } from 'react';
import { Copy, Check, Download, FileCode, Play, AlertTriangle } from 'lucide-react';
import { ScriptFile } from '../types';
import { downloadSingleFile } from '../utils/downloadHelper';

interface ScriptViewerProps {
  files: ScriptFile[];
}

export function ScriptViewer({ files }: ScriptViewerProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = files[activeFileIndex] || files[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = activeFile.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* File Tab Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-2 py-1.5 overflow-x-auto">
        <div className="flex items-center space-x-1">
          {files.map((file, idx) => (
            <button
              key={file.filename}
              onClick={() => {
                setActiveFileIndex(idx);
                setCopied(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                activeFileIndex === idx
                  ? 'bg-slate-800 text-orange-400 font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.filename}</span>
              {file.badge && (
                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                  {file.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pl-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Copy script to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => downloadSingleFile(activeFile.filename, activeFile.content)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition cursor-pointer"
            title={`Download ${activeFile.filename}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* File Description Header */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-300 font-semibold">{activeFile.filename}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{activeFile.description}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {activeFile.content.split('\n').length} lines
        </span>
      </div>

      {/* Quick Windows Run Hint */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {activeFile.filename.endsWith('.ps1') && (
              <>
                Run in Windows PowerShell (Admin):{' '}
                <code className="bg-slate-900 text-orange-400 px-1.5 py-0.5 rounded font-mono">
                  powershell -ExecutionPolicy Bypass -File .\{activeFile.filename}
                </code>
              </>
            )}
            {activeFile.filename.endsWith('.bat') && (
              <>
                Run in Windows Explorer:{' '}
                <span className="text-slate-300">Double-click file (prompts for UAC Administrator elevation)</span>
              </>
            )}
            {activeFile.filename.endsWith('.sh') && (
              <>
                Run inside WSL2 Ubuntu terminal:{' '}
                <code className="bg-slate-900 text-orange-400 px-1.5 py-0.5 rounded font-mono">
                  chmod +x ./{activeFile.filename} && ./{activeFile.filename}
                </code>
              </>
            )}
            {activeFile.filename.endsWith('.md') && (
              <span className="text-slate-300">Complete documentation guide for flashing and Chromebook boot keys</span>
            )}
          </span>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative flex-1 bg-slate-950 overflow-auto font-mono text-xs text-slate-300 p-4 leading-relaxed max-h-[620px] select-text">
        <pre className="overflow-x-auto whitespace-pre">
          {activeFile.content.split('\n').map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell pr-4 text-right select-none text-slate-600 w-10 text-[11px]">
                {i + 1}
              </span>
              <span className="table-cell">{line}</span>
            </div>
          ))}
        </pre>
      </div>

      {/* Safety Notice for Flasher */}
      {activeFile.filename === 'Flash-ChromiumOS.ps1' && (
        <div className="bg-amber-950/20 border-t border-amber-900/40 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Windows Safety Protection:</strong> This script queries <code className="font-mono bg-black/40 px-1 rounded">Get-Disk</code> and automatically locks Drive 0 and any disk containing the Windows boot/system partition to prevent accidental wiping.
          </span>
        </div>
      )}
    </div>
  );
}
