/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Code,
  Folder,
  BookOpen,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Play,
} from 'lucide-react';

export type ActiveNavTab = 'code' | 'projects' | 'learn' | 'console' | 'audit' | 'updates';

interface MobileNavbarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onRun: () => void;
  isRunning: boolean;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  activeTab,
  onSelectTab,
  onRun,
  isRunning,
}) => {
  const navItems = [
    { id: 'code', label: 'Code', icon: Code },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'audit', label: 'Audit', icon: ShieldCheck },
    { id: 'updates', label: 'Updates', icon: RefreshCw },
  ] as const;

  return (
    <nav className="h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-2 select-none relative z-20 shrink-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
              isActive
                ? 'text-emerald-400 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Floating Action Button for Run (Android Mobile UX) */}
      {activeTab === 'code' && (
        <button
          onClick={onRun}
          disabled={isRunning}
          title="Run AAYU Program"
          className="absolute -top-6 right-5 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all z-30"
        >
          <Play className={`w-5 h-5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
        </button>
      )}
    </nav>
  );
};
