/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Play,
  Hammer,
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Moon,
  Sun,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';

export type ViewportMode = 'mobile-phone' | 'mobile-landscape' | 'tablet' | 'desktop';
export type EditorTheme = 'obsidian' | 'silicon-dark' | 'cyberpunk' | 'light';

interface HeaderProps {
  viewportMode: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  theme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
  onRun: () => void;
  onBuild: () => void;
  onOpenExport: () => void;
  isRunning: boolean;
  activeProjectName: string;
  activeFileName: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewportMode,
  onViewportChange,
  theme,
  onThemeChange,
  onRun,
  onBuild,
  onOpenExport,
  isRunning,
  activeProjectName,
  activeFileName,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-3 flex items-center justify-between select-none z-20 shrink-0">
      {/* Left: Branding & Active File */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-sm tracking-wider font-mono">
            AY
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-sm tracking-tight">AAYU</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Android IDE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{activeProjectName}</span>
              <span className="text-slate-600">/</span>
              <span className="text-emerald-400 font-mono font-medium">{activeFileName}</span>
            </div>
          </div>
        </div>

        {/* Engine status pills */}
        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-800 text-[11px]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>v0.4.2-alpha</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Zero-Dep</span>
          </span>
        </div>
      </div>

      {/* Center: Device Viewport Simulation Mode */}
      <div className="hidden md:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
        <button
          onClick={() => onViewportChange('mobile-phone')}
          title="Phone Portrait (390x844)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
            viewportMode === 'mobile-phone'
              ? 'bg-emerald-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Phone</span>
        </button>
        <button
          onClick={() => onViewportChange('mobile-landscape')}
          title="Phone Landscape (740x390)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
            viewportMode === 'mobile-landscape'
              ? 'bg-emerald-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 rotate-90" />
          <span className="hidden xl:inline">Landscape</span>
        </button>
        <button
          onClick={() => onViewportChange('tablet')}
          title="Tablet (800x1100)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
            viewportMode === 'tablet'
              ? 'bg-emerald-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Tablet</span>
        </button>
        <button
          onClick={() => onViewportChange('desktop')}
          title="Responsive Fullscreen"
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
            viewportMode === 'desktop'
              ? 'bg-emerald-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Full</span>
        </button>
      </div>

      {/* Right: Actions (Build, Run, Export, Theme) */}
      <div className="flex items-center gap-2">
        {/* Build / Validate Button */}
        <button
          onClick={onBuild}
          title="Build AST & Disassemble Bytecode"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 transition-colors"
        >
          <Hammer className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Build / AST</span>
        </button>

        {/* Primary Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          title="Execute AAYU Engine on VM"
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-md ${
            isRunning
              ? 'bg-emerald-700/50 text-emerald-200 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-emerald-500/20'
          }`}
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>

        {/* Export Android Studio Project */}
        <button
          onClick={onOpenExport}
          title="Export Native Android Kotlin + NDK Project"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs border border-slate-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Android APK Code</span>
        </button>

        {/* Theme Selector */}
        <div className="relative">
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as EditorTheme)}
            aria-label="Editor Color Theme"
            className="text-xs bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:border-slate-700"
          >
            <option value="obsidian">AAYU Obsidian</option>
            <option value="aayu-dark">AAYU Dark</option>
            <option value="cyberpunk">Cyberpunk Neon</option>
            <option value="light">Studio Light</option>
          </select>
        </div>
      </div>
    </header>
  );
};
