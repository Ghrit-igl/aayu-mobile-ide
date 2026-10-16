/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Navigation Drawer
 * Slides in from left with authentic AAYU logo, rules, tutorials, and workspace actions.
 */

import React from 'react';
import {
  FileCode,
  FolderOpen,
  Save,
  FilePlus,
  Terminal,
  BookOpen,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Download,
  Settings,
  X,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { AayuLogo } from './AayuLogo';

export type DrawerAction =
  | 'new'
  | 'open'
  | 'save'
  | 'saveAs'
  | 'rules'
  | 'samples'
  | 'tutorials'
  | 'terminal'
  | 'updates'
  | 'audit'
  | 'export'
  | 'settings';

interface AayuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: DrawerAction) => void;
  activeFileName: string;
}

export const AayuDrawer: React.FC<AayuDrawerProps> = ({
  isOpen,
  onClose,
  onAction,
  activeFileName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Container (Slides from left like Android Navigation Drawer) */}
      <div className="relative w-80 max-w-[85vw] h-full bg-[#18191f] text-slate-200 border-r border-[#262833] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header with Real AAYU Logo */}
        <div className="p-5 bg-gradient-to-br from-[#121318] via-[#1a1b24] to-[#0c0d12] border-b border-[#262833] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AayuLogo size={46} className="shadow-lg shadow-black/80" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-wide">AAYU IDE</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                  ARM64
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Intent-to-Silicon</p>
              <p className="text-[10px] text-emerald-400 font-mono">Zero External Dependencies</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently open file chip */}
        <div className="px-5 py-2.5 bg-[#14151b] border-b border-[#232530] flex items-center gap-2 text-xs font-mono text-slate-400">
          <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Current: <span className="text-slate-200 font-semibold">{activeFileName}</span></span>
        </div>

        {/* Drawer Menu Items (AAYU Action List) */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 text-sm">
          {/* File Operations */}
          <div className="px-5 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            File
          </div>

          <button
            onClick={() => {
              onAction('new');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <FilePlus className="w-4 h-4 text-emerald-400" />
            <span>New</span>
          </button>

          <button
            onClick={() => {
              onAction('open');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Open...</span>
          </button>

          <button
            onClick={() => {
              onAction('save');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <Save className="w-4 h-4 text-cyan-400" />
            <span>Save</span>
          </button>

          <div className="my-2 border-t border-[#262833]" />

          {/* Development & Execution */}
          <div className="px-5 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Develop
          </div>

          <button
            onClick={() => {
              onAction('terminal');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>AAYU Terminal</span>
          </button>

          <button
            onClick={() => {
              onAction('samples');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Samples Gallery</span>
          </button>

          <button
            onClick={() => {
              onAction('rules');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AAYU Language Rules & Specs</span>
          </button>

          <button
            onClick={() => {
              onAction('tutorials');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Zero-to-Silicon Tutorials</span>
          </button>

          <div className="my-2 border-t border-[#262833]" />

          {/* Toolchain & Native */}
          <div className="px-5 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Toolchain
          </div>

          <button
            onClick={() => {
              onAction('updates');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Engine & Package Updates</span>
          </button>

          <button
            onClick={() => {
              onAction('audit');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Repository Audit (Phase 1)</span>
          </button>

          <button
            onClick={() => {
              onAction('export');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Android Studio Project</span>
          </button>

          <button
            onClick={() => {
              onAction('settings');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-[#232532] text-slate-200 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>

        {/* Footer with GitHub and Official Docs Links */}
        <div className="p-4 bg-[#121318] border-t border-[#262833] text-xs text-slate-400 flex items-center justify-between">
          <a
            href="https://github.com/Minato95-ayu/INTENT-TO-SILICON"
            target="_blank"
            rel="noreferrer"
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://intent-to-silicon.vercel.app/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <span>Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
