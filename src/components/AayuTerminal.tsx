/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Fullscreen Terminal & Multi-Mode Execution Suite
 * Features:
 * 1. Terminal Console (stdout/stderr/stdin)
 * 2. Live Web Server & API Tester (Interactive GET/POST simulated endpoints)
 * 3. Architecture & Dependency Graph (Interactive Mermaid flowchart)
 * 4. AayuDB In-Memory Database State
 * 5. Stack VM Bytecode Disassembly
 * 6. Flutter-like Declarative UI Preview
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Trash2,
  Copy,
  Check,
  Send,
  Terminal as TerminalIcon,
  Cpu,
  Clock,
  Sparkles,
  AlertTriangle,
  Globe,
  Database,
  Layers,
  Layout,
  Share2,
  PlayCircle,
  ExternalLink,
} from 'lucide-react';
import { ExecutionResult } from '../engine/types';
import { AayuRunner } from '../engine/runner';

interface AayuTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  result: (ExecutionResult & { compilation?: any }) | null;
  isRunning: boolean;
  onSendStdin?: (input: string) => void;
}

export const AayuTerminal: React.FC<AayuTerminalProps> = ({
  isOpen,
  onClose,
  fileName,
  result,
  isRunning,
  onSendStdin,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'api' | 'graph' | 'db' | 'bytecode' | 'ui'>('console');
  const [copied, setCopied] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [apiResponses, setApiResponses] = useState<Record<string, { status: number; payload: any; durationMs: number }>>({});
  const [activeRequestUrl, setActiveRequestUrl] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'console') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, result, isRunning, activeTab]);

  if (!isOpen) return null;

  const handleCopy = () => {
    let text = '';
    if (activeTab === 'console') {
      text = (result?.stdout || '') + (result?.stderr || '');
    } else if (activeTab === 'graph') {
      text = result?.mermaidGraph || 'No graph available';
    } else if (activeTab === 'bytecode') {
      text = result?.compilation?.disassembly || 'No bytecode available';
    } else if (activeTab === 'db') {
      text = JSON.stringify(result?.databaseState || {}, null, 2);
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    if (onSendStdin) {
      onSendStdin(inputVal);
    }
    setInputVal('');
  };

  const handleTestRoute = (route: { method: string; path: string; chunk?: any }) => {
    if (!route.chunk) return;
    setActiveRequestUrl(`${route.method} ${route.path}`);
    const res = AayuRunner.executeRoute(route.chunk, result?.databaseState || {});
    setApiResponses(prev => ({
      ...prev,
      [`${route.method} ${route.path}`]: {
        status: res.status,
        payload: res.payload,
        durationMs: res.durationMs,
      },
    }));
  };

  const registeredRoutes = result?.registeredRoutes || [];
  const dbState = result?.databaseState || {};
  const uiTree = result?.uiTree;
  const mermaidGraph = result?.mermaidGraph || '';
  const disassembly = result?.compilation?.disassembly || '';

  return (
    <div className="fixed inset-0 z-40 bg-[#090d16] text-slate-100 flex flex-col font-mono select-text animate-in fade-in duration-150">
      {/* Top App Bar */}
      <div className="h-14 bg-[#0f172a] border-b border-[#1e293b] px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-200 transition-colors"
            title="Return to Editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>AAYU VM Terminal</span>
              <span className="text-[11px] font-normal text-emerald-400">[{fileName}]</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Silicon ARM64 Native Runtime v1.4.0
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 select-none">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy Content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-slate-200 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="h-10 bg-[#0b1120] border-b border-[#1e293b] px-3 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 select-none">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'console'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>Output</span>
          {result?.exitCode !== undefined && (
            <span
              className={`w-2 h-2 rounded-full ${
                result.success ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          )}
        </button>

        {registeredRoutes.length > 0 && (
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'api'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web API ({registeredRoutes.length})</span>
          </button>
        )}

        {mermaidGraph && (
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'graph'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Architecture Graph</span>
          </button>
        )}

        {Object.keys(dbState).length > 0 && (
          <button
            onClick={() => setActiveTab('db')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'db'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>AayuDB ({Object.keys(dbState).length})</span>
          </button>
        )}

        {disassembly && (
          <button
            onClick={() => setActiveTab('bytecode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'bytecode'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Bytecode ISA</span>
          </button>
        )}

        {uiTree && (
          <button
            onClick={() => setActiveTab('ui')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ui'
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>UI Preview</span>
          </button>
        )}
      </div>

      {/* Main Screen Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 leading-relaxed text-xs sm:text-sm">
        {/* TAB 1: CONSOLE OUTPUT */}
        {activeTab === 'console' && (
          <div className="space-y-3">
            <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-900 select-none">
              $ aayu run {fileName} --mode=silicon-native
            </div>

            {isRunning && (
              <div className="flex items-center gap-2 text-emerald-400 py-4 animate-pulse select-none">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Compiling AST & executing on Silicon Stack VM...</span>
              </div>
            )}

            {/* Stdout */}
            {result?.stdout && (
              <pre className="text-slate-100 whitespace-pre-wrap font-mono leading-relaxed">
                {result.stdout}
              </pre>
            )}

            {/* Stderr / Compiler Error */}
            {result?.stderr && (
              <div className="p-3 rounded bg-red-950/40 border border-red-900/60 text-red-300 whitespace-pre-wrap leading-relaxed font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>{result.stderr}</div>
              </div>
            )}

            {/* Finished status ribbon */}
            {!isRunning && result && (
              <div className="pt-4 border-t border-slate-900 select-none space-y-1 text-[11px] text-slate-400">
                <div
                  className={`font-bold ${
                    result.success ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  [Execution finished with exit code {result.exitCode}]
                </div>
                <div className="flex flex-wrap items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{result.durationMs}ms</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    <span>{result.stepCount.toLocaleString()} steps</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>GC Active: {result.gcStats.activeHeapObjects} objects</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        )}

        {/* TAB 2: LIVE WEB API TESTER */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-white">Silicon Embedded Web Server Active</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">Port: 3000 (Simulated)</span>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Endpoints:</div>
              {registeredRoutes.map((route, idx) => {
                const reqKey = `${route.method} ${route.path}`;
                const resp = apiResponses[reqKey];
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#0d1424] border border-[#1e293b] space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          route.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {route.method}
                        </span>
                        <span className="text-xs font-bold text-slate-100 font-mono">{route.path}</span>
                      </div>
                      <button
                        onClick={() => handleTestRoute(route)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Send Request</span>
                      </button>
                    </div>

                    {resp && (
                      <div className="p-3 rounded-lg bg-[#050811] border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] border-b border-slate-800/60 pb-1.5">
                          <span className="text-emerald-400 font-bold">HTTP/1.1 {resp.status} OK</span>
                          <span className="text-slate-400">Latency: {resp.durationMs}ms</span>
                        </div>
                        <pre className="text-xs text-slate-200 overflow-x-auto font-mono">
                          {JSON.stringify(resp.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ARCHITECTURE GRAPH */}
        {activeTab === 'graph' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-purple-300">AAYU Architecture & Call Graph</div>
                <div className="text-[11px] text-slate-400">Declarative dependency flow across Models, Routes, and Actions</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mermaidGraph);
                  alert('📋 Mermaid code copied to clipboard!');
                }}
                className="px-3 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold"
              >
                Copy Mermaid
              </button>
            </div>

            {/* Mermaid Source & Visual Flow */}
            <div className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-3 font-mono">
              <div className="text-xs font-bold text-slate-300">Mermaid Diagram Specification:</div>
              <pre className="text-xs text-purple-300 whitespace-pre-wrap bg-black/60 p-3 rounded-lg border border-purple-900/40">
                {mermaidGraph}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: AAYUDB IN-MEMORY DATABASE */}
        {activeTab === 'db' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40">
              <div className="text-xs font-bold text-amber-300">AayuDB In-Memory Relational State</div>
              <div className="text-[11px] text-slate-400">Active records persisted with append-only Write-Ahead Log (WAL)</div>
            </div>

            <div className="space-y-3">
              {Object.entries(dbState).map(([tableName, rows]) => (
                <div key={tableName} className="p-3 rounded-xl bg-[#0e1424] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 font-mono">Table: {tableName}</span>
                    <span className="text-[11px] text-slate-400">{rows.length} row(s)</span>
                  </div>
                  <pre className="text-xs text-slate-200 bg-black/50 p-2.5 rounded-lg border border-slate-800/60 overflow-x-auto">
                    {JSON.stringify(rows, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BYTECODE DISASSEMBLY */}
        {activeTab === 'bytecode' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 pb-1 border-b border-slate-800">
              Stack VM Disassembly (ARM64 Silicon ISA)
            </div>
            <pre className="text-xs text-cyan-300 whitespace-pre-wrap font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-slate-800">
              {disassembly || 'No bytecode instructions emitted.'}
            </pre>
          </div>
        )}

        {/* TAB 6: UI PREVIEW */}
        {activeTab === 'ui' && uiTree && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-pink-950/20 border border-pink-900/40">
              <div className="text-xs font-bold text-pink-300">Flutter-like Declarative Mobile View</div>
              <div className="text-[11px] text-slate-400">Rendered from AAYU Page / Column tree</div>
            </div>

            <div className="max-w-sm mx-auto p-4 rounded-2xl bg-[#090d16] border-2 border-slate-700 shadow-2xl space-y-3">
              <div className="text-center font-bold text-sm text-white border-b border-slate-800 pb-2">
                {uiTree.props?.name || uiTree.widget}
              </div>
              <div className="space-y-2.5">
                {(uiTree.children || []).map((child: any, cIdx: number) => (
                  <div key={cIdx}>
                    {child.widget === 'Text' && (
                      <p className="text-xs text-slate-200">{child.props?.text || 'Text element'}</p>
                    )}
                    {child.widget === 'Button' && (
                      <button className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md">
                        {child.props?.text || 'Button'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Stdin input prompt at bottom (active in console tab) */}
      {activeTab === 'console' && (
        <form
          onSubmit={handleSend}
          className="h-12 bg-[#0f172a] border-t border-[#1e293b] px-3 flex items-center gap-2 select-none"
        >
          <span className="text-emerald-400 font-mono text-sm">&gt;</span>
          <input
            type="text"
            placeholder="Send input to running program..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 outline-none text-xs sm:text-sm font-mono"
          />
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            title="Send Input"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
