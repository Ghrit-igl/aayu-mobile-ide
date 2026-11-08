/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  Layers,
  Database,
  Globe,
  Layout,
  Trash2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ChevronRight,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ExecutionResult } from '../engine/types';
import { CompilationArtifacts } from '../engine/runner';

interface ConsolePanelProps {
  result: (ExecutionResult & { compilation?: CompilationArtifacts }) | null;
  compilationArtifacts: CompilationArtifacts | null;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  result,
  compilationArtifacts,
  isOpen,
  onToggle,
  onClear,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'bytecode' | 'ast' | 'database' | 'ui'>('console');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) {
    return (
      <div
        onClick={onToggle}
        className="h-8 bg-slate-900 border-t border-slate-800 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors shrink-0 select-none"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Console & Output</span>
          {result && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                result.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              Exit {result.exitCode}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">Tap to expand</div>
      </div>
    );
  }

  const handleCopyOutput = () => {
    const textToCopy =
      activeTab === 'bytecode'
        ? (compilationArtifacts?.disassembly || result?.compilation?.disassembly || 'No bytecode')
        : activeTab === 'ast'
        ? JSON.stringify(compilationArtifacts?.ast || result?.compilation?.ast || {}, null, 2)
        : (result?.stdout || '') + (result?.stderr || '');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const disassembly = compilationArtifacts?.disassembly || result?.compilation?.disassembly || '';
  const ast = compilationArtifacts?.ast || result?.compilation?.ast || null;
  const dbState = result?.databaseState || {};
  const routes = result?.registeredRoutes || [];
  const uiTree = result?.uiTree;

  return (
    <div
      className={`border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 z-10 shrink-0 ${
        isExpanded ? 'h-96 sm:h-[450px]' : 'h-52 sm:h-64'
      }`}
    >
      {/* Console Subheader Bar */}
      <div className="h-9 bg-slate-900/90 border-b border-slate-800 px-2 flex items-center justify-between select-none shrink-0 overflow-x-auto no-scrollbar">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'console'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output</span>
            {result?.exitCode !== undefined && (
              <span
                className={`w-2 h-2 rounded-full ${
                  result.success ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('bytecode')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'bytecode'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Bytecode</span>
          </button>

          <button
            onClick={() => setActiveTab('ast')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'ast'
                ? 'bg-slate-800 text-purple-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AST</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'database'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Intent DB & API</span>
            {(Object.keys(dbState).length > 0 || routes.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {uiTree && (
            <button
              onClick={() => setActiveTab('ui')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTab === 'ui'
                  ? 'bg-slate-800 text-teal-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>UI Preview</span>
            </button>
          )}
        </div>

        {/* Console Actions (Clear, Copy, Maximize, Collapse) */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={handleCopyOutput}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy tab content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title={isExpanded ? 'Restore height' : 'Maximize panel'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Minimize console"
          >
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-3 font-mono text-xs select-text">
        {/* Tab 1: Console Standard Output */}
        {activeTab === 'console' && (
          <div className="flex flex-col gap-2">
            {!result ? (
              <div className="text-slate-500 italic py-4 text-center select-none">
                Ready to execute. Press &apos;Run&apos; to execute on the local AAYU Stack VM.
              </div>
            ) : (
              <>
                {/* Metrics ribbon */}
                <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-slate-800/80 text-[11px] text-slate-400">
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
                    <span>
                      GC: {result.gcStats.activeHeapObjects} active heap ({result.gcStats.allocatedCount} alloc,{' '}
                      {result.gcStats.sweptCount} swept)
                    </span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      result.success
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    STATUS: {result.success ? 'SUCCESS (0)' : `ERROR (${result.exitCode})`}
                  </span>
                </div>

                {/* Stdout */}
                {result.stdout && (
                  <pre className="text-slate-100 whitespace-pre-wrap leading-relaxed font-mono">
                    {result.stdout}
                  </pre>
                )}

                {/* Stderr / Errors */}
                {result.stderr && (
                  <div className="p-2.5 rounded bg-red-950/40 border border-red-900/60 text-red-300 whitespace-pre-wrap leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>{result.stderr}</div>
                  </div>
                )}

                {/* Returned Value if expression */}
                {result.returnedValue !== undefined && result.returnedValue !== null && (
                  <div className="text-cyan-400 pt-1">
                    =&gt; {JSON.stringify(result.returnedValue)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Bytecode Disassembly */}
        {activeTab === 'bytecode' && (
          <div>
            {disassembly ? (
              <pre className="text-cyan-300/90 whitespace-pre font-mono leading-relaxed">
                {disassembly}
              </pre>
            ) : (
              <div className="text-slate-500 italic py-4 text-center">
                No bytecode available. Press &apos;Build / AST&apos; to compile and disassemble.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Abstract Syntax Tree */}
        {activeTab === 'ast' && (
          <div>
            {ast ? (
              <pre className="text-purple-300 whitespace-pre-wrap font-mono leading-relaxed">
                {JSON.stringify(ast, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-500 italic py-4 text-center">
                No AST generated yet. Press &apos;Build / AST&apos; to inspect.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Intent Database & API Routes */}
        {activeTab === 'database' && (
          <div className="flex flex-col gap-4">
            {/* Database Tables */}
            <div>
              <div className="text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>Embedded Relational Tables ({Object.keys(dbState).length})</span>
              </div>
              {Object.keys(dbState).length === 0 ? (
                <div className="text-slate-500 italic text-xs">
                  No models declared yet. Use &apos;model Table &#123; id: int, name: str &#125;&apos; to initialize.
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(dbState).map(([modelName, records]) => (
                    <div key={modelName} className="rounded-lg bg-slate-900 border border-slate-800 p-2.5">
                      <div className="text-slate-200 font-semibold mb-1 flex items-center justify-between">
                        <span className="font-mono text-emerald-400">{modelName}</span>
                        <span className="text-[11px] text-slate-400">{records.length} record(s)</span>
                      </div>
                      {records.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] font-mono text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400">
                                {Object.keys(records[0]).map((col) => (
                                  <th key={col} className="p-1">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {records.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-slate-800/40">
                                  {Object.values(row).map((val: any, cIdx) => (
                                    <td key={cIdx} className="p-1">
                                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic text-[11px]">Table empty. Use insert statement.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REST Routes */}
            <div>
              <div className="text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>Registered Intent REST Routes ({routes.length})</span>
              </div>
              {routes.length === 0 ? (
                <div className="text-slate-500 italic text-xs">
                  No routes configured. Use &apos;route &quot;GET /api/endpoint&quot; &#123; ... &#125;&apos;
                </div>
              ) : (
                <div className="space-y-1.5">
                  {routes.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px]">
                          {r.method}
                        </span>
                        <span className="text-slate-200">{r.path}</span>
                      </div>
                      <span className="text-emerald-400 text-[11px]">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Intent UI Preview */}
        {activeTab === 'ui' && (
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 max-w-sm mx-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Rendered Android UI Output
            </div>
            {uiTree ? (
              <div className="space-y-3 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-sm font-bold text-slate-100">{uiTree.widget}</div>
                {uiTree.children?.map((child: any, cIdx: number) => (
                  <div key={cIdx} className="p-2 rounded bg-slate-900 border border-slate-800">
                    {child.widget === 'Button' ? (
                      <button className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs">
                        {child.props?.text || 'Button'}
                      </button>
                    ) : child.widget === 'Text' ? (
                      <div className="text-slate-300 text-xs">{child.props?.text || 'Text Widget'}</div>
                    ) : (
                      <div className="text-slate-400 text-xs">{child.widget}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic text-center py-4">
                No UI tree declared. Use &apos;Page &#123; Column [ ... ] &#125;&apos;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
