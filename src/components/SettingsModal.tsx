/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Settings as SettingsIcon, Sliders, Palette, Code } from 'lucide-react';
import { EditorTheme } from './Header';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  theme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
  tabSize: number;
  onTabSizeChange: (size: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
  tabSize,
  onTabSizeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in">
      <div className="w-full max-w-md bg-[#181920] border border-[#2a2c3a] rounded-2xl shadow-2xl p-5 space-y-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2c3a]">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Editor Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Font size */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Font Size</span>
            <span className="font-mono text-emerald-400">{fontSize}px</span>
          </div>
          <input
            type="range"
            min={11}
            max={24}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Theme selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Color Theme</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'silicon-dark', label: 'AAYU Silicon Dark' },
              { id: 'obsidian', label: 'AAYU Obsidian' },
              { id: 'cyberpunk', label: 'Cyberpunk Neon' },
              { id: 'light', label: 'Studio Light' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id as EditorTheme)}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  theme === t.id
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#121318] border-[#292c3a] text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab size */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-amber-400" />
            <span>Indentation Tab Size</span>
          </label>
          <div className="flex gap-2">
            {[2, 4, 8].map((size) => (
              <button
                key={size}
                onClick={() => onTabSizeChange(size)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                  tabSize === size
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#121318] border-[#292c3a] text-slate-400 hover:text-slate-200'
                }`}
              >
                {size} Spaces
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
