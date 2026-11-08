/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official AAYU Language Rules & Specification Guide
 * Explains core architectural rules, grammar, intent computing, and runtime semantics.
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle,
  Code,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { AayuLogo } from './AayuLogo';

interface AayuRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryCode: (code: string) => void;
}

export const AAYU_CORE_RULES = [
  {
    number: 1,
    title: 'The Intent-to-Silicon Law',
    category: 'Architecture',
    summary: 'Zero external dependencies. Intent directly compiles into native servers, databases, and VM instructions without npm or pip.',
    code: `// Rule 1: Declarative Intent compiles natively
let status = "Intent to Silicon: Zero Dependencies"
println(status)
`,
  },
  {
    number: 2,
    title: 'Variable Declarations & Dynamic Typing',
    category: 'Variables',
    summary: "Variables are defined with 'let'. AAYU supports dynamic types: Integers, Floats, Strings, Booleans, Arrays, and Dictionaries.",
    code: `// Rule 2: Variables & Dynamic Types
let count = 42
let ratio = 3.14159
let name = "AAYU Language"
let is_active = true

println("Count:", count, "| Ratio:", ratio, "| Active:", is_active)
`,
  },
  {
    number: 3,
    title: 'Functions & Recursion Rules',
    category: 'Functions',
    summary: "Functions use 'fn name(params) { ... }' and 'return'. Functions execute in lightweight call frames with full recursion support.",
    code: `// Rule 3: Functions & Call Frames
fn calculate_area(length, width) {
    return length * width
}

let room = calculate_area(12, 15)
println("Calculated Area:", room, "sq ft")
`,
  },
  {
    number: 4,
    title: 'Flow Control & Loop Semantics',
    category: 'Control Flow',
    summary: "Conditionals use 'if / elif / else'. Loops support 'for item in collection', 'while cond', and unbounded 'loop' with 'break' & 'continue'.",
    code: `// Rule 4: Flow Control & Loops
for i in range(1, 6) {
    if i % 2 == 0 {
        println(i, "is Even")
    } else {
        println(i, "is Odd")
    }
}
`,
  },
  {
    number: 5,
    title: 'Intent Database (CRUD) Rules',
    category: 'Intent Database',
    summary: "Native relational models defined with 'model Table { fields }'. Supports 'insert' and 'find Table where condition' without SQLite C drivers.",
    code: `// Rule 5: Intent Relational Database
model Engineer {
    id: int,
    name: str,
    experience: int
}

insert Engineer {
    name: "Ayush",
    experience: 5
}

find Engineer where experience >= 5
`,
  },
  {
    number: 6,
    title: 'Intent REST API Routing Rules',
    category: 'Intent Web',
    summary: "Declare REST routes with 'route \"METHOD /path\" { ... }'. The embedded ASGI engine handles endpoints without Express or FastAPI.",
    code: `// Rule 6: Intent REST Routing
route "GET /api/health" {
    return { "status": "ok", "runtime": "ARM64-VM" }
}

println("REST Endpoint registered successfully.")
`,
  },
  {
    number: 7,
    title: 'Memory Safety & Cyclic GC Rules',
    category: 'Memory',
    summary: 'Memory is tracked on an operand stack. Heap objects are reclaimed via mark-and-sweep garbage collection, avoiding memory leaks on mobile devices.',
    code: `// Rule 7: Heap Collections & Memory Safety
let matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

println("Matrix length:", len(matrix))
println("Center element:", matrix[1][1])
`,
  },
];

export const AayuRulesModal: React.FC<AayuRulesModalProps> = ({
  isOpen,
  onClose,
  onTryCode,
}) => {
  const [selectedRule, setSelectedRule] = useState<number>(1);

  if (!isOpen) return null;

  const currentRule = AAYU_CORE_RULES.find((r) => r.number === selectedRule) || AAYU_CORE_RULES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs select-none animate-in fade-in">
      <div className="w-full max-w-4xl h-[88vh] bg-[#14151b] border border-[#272935] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="h-14 px-4 bg-[#181922] border-b border-[#272935] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <AayuLogo size={28} />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                AAYU Language Rules & Intent Architecture
              </h2>
              <p className="text-[10px] text-emerald-400 font-mono">
                Official Language Guidelines (Intent-to-Silicon)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Rules Index, Right Rule Details & Code */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Rules List (Left Sidebar) */}
          <div className="w-full md:w-72 border-r border-[#272935] bg-[#101117] p-2 overflow-y-auto space-y-1 shrink-0">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">
              Core Language Rules ({AAYU_CORE_RULES.length})
            </div>
            {AAYU_CORE_RULES.map((rule) => {
              const isSelected = rule.number === selectedRule;
              return (
                <div
                  key={rule.number}
                  onClick={() => setSelectedRule(rule.number)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-colors text-xs flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-[#1e202c] text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'hover:bg-[#161822] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">RULE {rule.number}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {rule.category}
                    </span>
                  </div>
                  <span className="truncate text-slate-200">{rule.title}</span>
                </div>
              );
            })}
          </div>

          {/* Rule Detail & Runnable Code (Right Pane) */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#14151b] select-text">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Rule {currentRule.number}
                </span>
                <span className="text-xs text-slate-400 font-mono uppercase">{currentRule.category}</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{currentRule.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {currentRule.summary}
              </p>
            </div>

            {/* Code Block */}
            <div className="rounded-xl border border-[#272935] overflow-hidden bg-black">
              <div className="h-9 bg-[#181922] px-3 flex items-center justify-between border-b border-[#272935]">
                <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span>rule_{currentRule.number}_example.aayu</span>
                </div>

                <button
                  onClick={() => {
                    onTryCode(currentRule.code);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow transition-all active:scale-95 select-none"
                >
                  <span>Load & Run Rule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <pre className="p-4 text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-[#0a0a0d]">
                {currentRule.code}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181922] border border-[#272935] text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Compiler Enforcement</span>
              </div>
              <p>
                The AAYU lexer, AST parser, and Stack Virtual Machine strictly validate this rule.
                Syntax anomalies produce an error with line and column highlighting in the editor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
