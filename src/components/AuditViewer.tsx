/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  FileCode,
  Download,
  Terminal,
} from 'lucide-react';
import { REPOSITORY_AUDIT_REPORT, ANDROID_ARCHITECTURE_SPECS, AuditItem } from '../android/architectureAudit';

export const AuditViewer: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'PARTIAL' | 'FAIL' | 'UNVERIFIED'>('ALL');

  const filteredItems =
    filter === 'ALL'
      ? REPOSITORY_AUDIT_REPORT
      : REPOSITORY_AUDIT_REPORT.filter((item) => item.status === filter);

  const getStatusBadge = (status: AuditItem['status']) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>PASS</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
            <AlertCircle className="w-3 h-3" />
            <span>PARTIAL</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold">
            <XCircle className="w-3 h-3" />
            <span>FAIL</span>
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 text-[11px] font-bold">
            <HelpCircle className="w-3 h-3" />
            <span>UNVERIFIED</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full select-text">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Phase 1 & 2 Deliverable
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
          AAYU Repository Audit & Android Architecture
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Evidence-based inspection of INTENT-TO-SILICON repository, compiler entry points, and Android NDK ARM64 feasibility.
        </p>
      </div>

      {/* Android Architecture Spec Summary Card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Recommended Android Target Architecture</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">APPLICATION SHELL</span>
            <span className="text-slate-200 font-semibold">{ANDROID_ARCHITECTURE_SPECS.uiFramework}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">NATIVE ENGINE CRATE</span>
            <span className="text-emerald-400 font-semibold">{ANDROID_ARCHITECTURE_SPECS.engineCrate}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">TARGET ABIS</span>
            <span className="text-slate-200 font-semibold">{ANDROID_ARCHITECTURE_SPECS.supportedABIs.join(', ')}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">IPC & BUFFER PROTOCOL</span>
            <span className="text-slate-200 font-semibold">{ANDROID_ARCHITECTURE_SPECS.ipcProtocol}</span>
          </div>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
        {(['ALL', 'PASS', 'PARTIAL', 'FAIL', 'UNVERIFIED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              filter === s
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Audit Checklist Items */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
              </div>
              <div>{getStatusBadge(item.status)}</div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-400">Evidence: </span>
              {item.evidence}
            </div>

            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Known Boundary: </span>
              {item.notes}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-emerald-400/90">
              <span className="text-slate-500">Android Solution: </span>
              {item.mitigationOrSolution}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
