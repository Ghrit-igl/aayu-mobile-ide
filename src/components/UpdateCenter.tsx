/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  FileCode,
  Github,
  Cpu,
  Layers,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import {
  UpdateService,
  SAMPLE_RELEASE_MANIFEST,
  ComponentVersion,
} from '../services/updateService';

export const UpdateCenter: React.FC = () => {
  const [versions, setVersions] = useState(UpdateService.getVersions());
  const [selectedAbi, setSelectedAbi] = useState<string>('arm64-v8a');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const [updateStatusMessage, setUpdateStatusMessage] = useState<string>('');

  const handleApplyEngineUpdate = async () => {
    setIsUpdating(true);
    setUpdateLog([]);
    setUpdateStatusMessage('');

    const res = await UpdateService.verifyAndInstallEngine(selectedAbi, (step, progress) => {
      setUpdateLog((prev) => [...prev, `[${progress}%] ${step}`]);
    });

    setIsUpdating(false);
    setUpdateStatusMessage(res.message);
    setVersions(UpdateService.getVersions());
  };

  const handleRollback = () => {
    const res = UpdateService.rollbackEngine();
    setUpdateStatusMessage(res.message);
    setVersions(UpdateService.getVersions());
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full select-text">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Github className="w-5 h-5 text-slate-300" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            GitHub Release Pipeline
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
          Release & Update Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Decoupled version management for Android App, AAYU Compiler Engine, and Tutorials with cryptographic SHA-256 verification.
        </p>
      </div>

      {/* Three Decoupled Version Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Component A: Android Application */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">COMPONENT A</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">APK</span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android App</span>
          </h3>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Installed:</span>
              <span className="text-slate-200">v{versions.app.installed}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Latest GitHub:</span>
              <span className="text-emerald-400 font-semibold">v{versions.app.latest}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            APK updates require user-approved package installer or managed Play distribution.
          </div>
        </div>

        {/* Component B: AAYU Compiler / VM Engine */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">COMPONENT B</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              NDK .so
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Compiler Engine</span>
          </h3>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Installed:</span>
              <span className="text-slate-200">v{versions.engine.installed}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Latest GitHub:</span>
              <span className="text-cyan-400 font-semibold">v{versions.engine.latest}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Hot-reloaded in app sandbox without replacing the APK. Preserves user code.
          </div>
        </div>

        {/* Component C: Tutorials & Content Pack */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">COMPONENT C</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-mono">JSON</span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Tutorials Pack</span>
          </h3>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Installed:</span>
              <span className="text-slate-200">v{versions.tutorials.installed}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Latest GitHub:</span>
              <span className="text-purple-400 font-semibold">v{versions.tutorials.latest}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            12 active Zero-to-Silicon chapters with interactive exercises.
          </div>
        </div>
      </div>

      {/* Interactive Engine Update & Verification Station */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Engine Binary Verification & Installation</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tests cryptographic checksum, ABI matching, and rollback safety.
            </p>
          </div>

          {versions.backupEngineVersion && (
            <button
              onClick={handleRollback}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rollback to {versions.backupEngineVersion}</span>
            </button>
          )}
        </div>

        {/* ABI Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
          <label className="text-slate-300 font-medium">Select Device CPU ABI:</label>
          <div className="flex items-center gap-2">
            {['arm64-v8a', 'x86_64', 'armeabi-v7a', 'mips (incompatible)'].map((abi) => (
              <button
                key={abi}
                onClick={() => setSelectedAbi(abi)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  selectedAbi === abi
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {abi}
              </button>
            ))}
          </div>
        </div>

        {/* Checksum Details */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] space-y-1">
          <div className="text-slate-400 flex justify-between">
            <span>Target Manifest:</span>
            <span className="text-slate-200">{SAMPLE_RELEASE_MANIFEST.manifestVersion}</span>
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>Expected SHA-256:</span>
            <span className="text-emerald-400 break-all">{SAMPLE_RELEASE_MANIFEST.engine.artifacts[0].sha256}</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleApplyEngineUpdate}
            disabled={isUpdating}
            className={`w-full sm:w-auto px-5 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow transition-all ${
              isUpdating
                ? 'bg-cyan-600/50 text-cyan-200 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Verifying & Installing...' : 'Verify SHA-256 & Apply Engine Update'}</span>
          </button>
        </div>

        {/* Progress log */}
        {updateLog.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
            {updateLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}

        {/* Result Message */}
        {updateStatusMessage && (
          <div
            className={`p-3 rounded-lg text-xs leading-relaxed ${
              updateStatusMessage.includes('aborted') || updateStatusMessage.includes('Incompatible')
                ? 'bg-red-950/40 border border-red-900/60 text-red-300'
                : 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-300'
            }`}
          >
            {updateStatusMessage}
          </div>
        )}
      </div>

      {/* GitHub Actions Release Pipeline Documentation */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Github className="w-4 h-4" />
          <span>Automated GitHub Actions Verification Pipeline</span>
        </h3>
        <p className="text-xs text-slate-400">
          When code is pushed to <code className="text-cyan-400">Minato95-ayu/INTENT-TO-SILICON</code>, the CI workflow triggers:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 block font-bold">1. Compiler Tests</span>
            <span className="text-slate-400 text-[11px]">280+ Lexer, AST & Stack VM unit tests</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 block font-bold">2. ARM64 Cross-Compile</span>
            <span className="text-slate-400 text-[11px]">Cargo NDK build for aarch64-linux-android</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-purple-400 block font-bold">3. Checksum & Sign</span>
            <span className="text-slate-400 text-[11px]">SHA256 manifest published to GitHub Releases</span>
          </div>
        </div>
      </div>
    </div>
  );
};
