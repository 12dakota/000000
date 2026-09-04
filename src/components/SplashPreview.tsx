import { Palette, Monitor } from 'lucide-react';
import { ScriptConfig } from '../types';

interface SplashPreviewProps {
  config: ScriptConfig;
}

export function SplashPreview({ config }: SplashPreviewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-200">Custom Boot Splash Preview</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded">
          <Monitor className="w-3 h-3" />
          <span>1920×1080 / 1280×800</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center select-none shadow-inner">
        <svg
          viewBox="0 0 1920 1080"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="live-splash-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={config.splashBgColor} />
              <stop offset="100%" stopColor="#140a28" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect width="1920" height="1080" fill="url(#live-splash-bg)" />

          {/* Firefox stylised circle icon */}
          <g>
            <circle cx="760" cy="460" r="145" fill={config.splashAccent1} />
            <circle cx="760" cy="460" r="78" fill={config.splashBgColor} />
          </g>

          {/* Chromium stylised circle icon */}
          <g>
            <circle cx="1160" cy="460" r="145" fill="none" stroke={config.splashAccent2} strokeWidth="34" />
            <circle cx="1160" cy="460" r="56" fill={config.splashAccent2} />
          </g>

          {/* Center Connection Indicator */}
          <text x="960" y="480" textAnchor="middle" fill="#94a3b8" fontSize="48" fontWeight="300" fontFamily="sans-serif">
            ×
          </text>

          {/* Title and Subtitle */}
          <text
            x="960"
            y="730"
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="54"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="1"
          >
            {config.splashTitle || 'Firefox × ChromiumOS'}
          </text>
          
          <text
            x="960"
            y="800"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="28"
            fontWeight="400"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {config.splashSubtitle || `custom test image · board ${config.board}`}
          </text>
        </svg>

        {/* Small badge overlay */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-[10px] text-slate-300 font-mono">
          boot_splash_frame01.png
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
        This SVG is compiled into the Gentoo Portage package <code className="text-orange-400 bg-slate-950 px-1 py-0.5 rounded font-mono">chromeos-base/firefox-bootsplash</code> and converted into framebuffer frames in the image rootfs.
      </p>
    </div>
  );
}
