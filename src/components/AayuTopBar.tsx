/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official AAYU Mobile IDE Top Action Bar
 */

import React, { useState } from 'react';
import {
  Menu,
  Folder,
  FolderOpen,
  Save,
  FilePlus,
  Undo2,
  Redo2,
  Search,
  MoreVertical,
  Play,
  Terminal,
  BookOpen,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';
import { AayuLogo } from './AayuLogo';

interface AayuTopBarProps {
  onOpenDrawer: () => void;
  fileName: string;
  isSaved: boolean;
  onNewFile: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleSearch: () => void;
  onOpenSamples: () => void;
  onOpenTutorials: () => void;
  onOpenRules?: () => void;
  onOpenTerminal: () => void;
  onOpenUpdates: () => void;
  onOpenAudit: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onCheckGitHub?: () => void;
  githubStatusText?: string;
  onRenameFile?: (newName: string) => void;
}

export const AayuTopBar: React.FC<AayuTopBarProps> = ({
  onOpenDrawer,
  fileName,
  isSaved,
  onNewFile,
  onOpenFile,
  onSaveFile,
  onUndo,
  onRedo,
  onToggleSearch,
  onOpenSamples,
  onOpenTutorials,
  onOpenRules,
  onOpenTerminal,
  onOpenUpdates,
  onOpenAudit,
  onOpenExport,
  onOpenSettings,
  onCheckGitHub,
  githubStatusText = 'GitHub: Synced',
  onRenameFile,
}) => {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  const handleNameClick = () => {
    if (onRenameFile) {
      const newName = prompt('Rename file to:', fileName);
      if (newName && newName.trim()) {
        onRenameFile(newName.trim());
      }
    }
  };

  return (
    <header className="h-14 bg-[#14151b] border-b border-[#232530] px-3 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Drawer Toggle + AAYU Logo + File Name with Click-to-rename */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenDrawer}
          className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-[#232530] rounded-lg transition-colors"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <AayuLogo size={30} />
          <div
            onClick={handleNameClick}
            className="flex items-center gap-1 font-mono text-sm cursor-pointer hover:bg-[#232530] px-1.5 py-0.5 rounded transition-colors"
            title="Click to rename file"
          >
            <span className="font-bold text-slate-100">{fileName}</span>
            {!isSaved && <span className="text-amber-400 font-bold">*</span>}
          </div>
        </div>

        {/* Quick New File '+' Button */}
        <button
          onClick={onNewFile}
          className="p-1.5 hover:bg-[#232530] text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors text-xs font-semibold flex items-center gap-0.5"
          title="Create New .aayu File"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>

      {/* Right Action Icons (AAYU Toolbar + Docs Link in corner) */}
      <div className="flex items-center gap-1.5 relative">
        {/* Live GitHub Sync Indicator */}
        {onCheckGitHub && (
          <button
            onClick={onCheckGitHub}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e2029] hover:bg-[#282b37] text-[11px] font-mono text-slate-300 border border-[#2b2e3c] transition-colors"
            title="Live GitHub Sync (Minato95-ayu/INTENT-TO-SILICON) - Click to check"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{githubStatusText}</span>
          </button>
        )}

        {/* Corner Official Website Docs Link requested by User */}
        <a
          href="https://intent-to-silicon.vercel.app/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
          title="AAYU Official Documentation (intent-to-silicon.vercel.app/docs)"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Docs</span>
        </a>

        {/* File actions folder icon */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFolderMenu(!showFolderMenu);
              setShowOverflowMenu(false);
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#232530] rounded-lg transition-colors"
            title="File Menu"
          >
            <Folder className="w-5 h-5 text-amber-400" />
          </button>

          {showFolderMenu && (
            <div className="absolute right-0 top-12 w-48 bg-[#1e2029] border border-[#2d303e] rounded-xl shadow-2xl py-1 z-50 text-xs font-sans animate-in fade-in">
              <button
                onClick={() => {
                  onNewFile();
                  setShowFolderMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <FilePlus className="w-4 h-4 text-emerald-400" />
                <span>New File</span>
              </button>
              <button
                onClick={() => {
                  onOpenFile();
                  setShowFolderMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Open Project File...</span>
              </button>
              <button
                onClick={() => {
                  onSaveFile();
                  setShowFolderMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <Save className="w-4 h-4 text-cyan-400" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {/* Undo */}
        <button
          onClick={onUndo}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#232530] rounded-lg transition-colors hidden sm:block"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#232530] rounded-lg transition-colors hidden sm:block"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Search */}
        <button
          onClick={onToggleSearch}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#232530] rounded-lg transition-colors"
          title="Search in file"
        >
          <Search className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Overflow 3 dots */}
        <div className="relative">
          <button
            onClick={() => {
              setShowOverflowMenu(!showOverflowMenu);
              setShowFolderMenu(false);
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#232530] rounded-lg transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showOverflowMenu && (
            <div className="absolute right-0 top-12 w-56 bg-[#1e2029] border border-[#2d303e] rounded-xl shadow-2xl py-1 z-50 text-xs font-sans animate-in fade-in">
              <button
                onClick={() => {
                  onOpenSamples();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sample Programs</span>
              </button>

              <button
                onClick={() => {
                  onOpenTutorials();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Zero-to-Silicon Tutorials</span>
              </button>

              {onOpenRules && (
                <button
                  onClick={() => {
                    onOpenRules();
                    setShowOverflowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>AAYU Language Rules & Specs</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenTerminal();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Open Terminal</span>
              </button>

              <button
                onClick={() => {
                  onOpenUpdates();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Engine & Updates</span>
              </button>

              <button
                onClick={() => {
                  onOpenAudit();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Repository Audit</span>
              </button>

              <button
                onClick={() => {
                  onOpenExport();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Export Android Studio Project</span>
              </button>

              <div className="my-1 border-t border-[#2d303e]" />

              <button
                onClick={() => {
                  onOpenSettings();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#292c3a] text-slate-200"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
