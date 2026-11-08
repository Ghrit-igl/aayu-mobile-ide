/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Mobile Code Editor
 * World-class mobile coding experience with smart auto-pair wrapping,
 * cursor D-pad navigation, AAYU keyword chips, smart indentation, and line commenting.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Replace,
  ChevronDown,
  X,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Code2,
  Sparkles,
  Compass,
} from 'lucide-react';
import { EditorTheme } from './Header';

interface AayuEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  theme: EditorTheme;
  errorLine?: number;
  errorCol?: number;
  showSearch?: boolean;
  onToggleSearch?: () => void;
  fontSize?: number;
  tabSize?: number;
}

type SymbolCategory = 'all' | 'symbols' | 'keywords' | 'nav';

export const AayuEditor: React.FC<AayuEditorProps> = ({
  code,
  onChange,
  theme,
  errorLine,
  errorCol,
  showSearch: externalShowSearch,
  onToggleSearch: externalToggleSearch,
  fontSize: externalFontSize = 14,
  tabSize = 4,
}) => {
  const [internalFontSize, setInternalFontSize] = useState<number>(externalFontSize);
  const fontSize = externalFontSize || internalFontSize;
  const [internalShowSearch, setInternalShowSearch] = useState<boolean>(false);
  const showSearch = externalShowSearch !== undefined ? externalShowSearch : internalShowSearch;
  const setShowSearch = externalToggleSearch ? () => externalToggleSearch() : setInternalShowSearch;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [activeCategory, setActiveCategory] = useState<SymbolCategory>('all');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const lines = code.split('\n');

  // Track cursor position
  const handleSelect = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, pos);
    const lineList = textBefore.split('\n');
    const currentLine = lineList.length;
    const currentCol = lineList[lineList.length - 1].length + 1;
    setCursorPos({ line: currentLine, col: currentCol });
  };

  // Smart Auto-Pair Wrapping / Inserting
  const insertOrWrap = (open: string, close: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = code.substring(0, start);
    const selected = code.substring(start, end);
    const after = code.substring(end);

    let newCode: string;
    let newCursorPos: number;

    if (start !== end) {
      // Wrap selection
      newCode = before + open + selected + close + after;
      newCursorPos = end + open.length + close.length;
    } else {
      // Insert pair and place cursor between
      newCode = before + open + close + after;
      newCursorPos = start + open.length;
    }

    onChange(newCode);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      handleSelect();
    }, 10);
  };

  // Insert standard string / token
  const insertToken = (textToInsert: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = code.substring(0, start);
    const after = code.substring(end);
    const newCode = before + textToInsert + after;
    onChange(newCode);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
      handleSelect();
    }, 10);
  };

  // Unindent (remove up to 4 spaces before cursor)
  const handleUnindent = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const before = code.substring(0, start);
    const after = code.substring(start);
    const match = before.match(/ {1,4}$/);
    if (match) {
      const removedLen = match[0].length;
      const newCode = before.substring(0, before.length - removedLen) + after;
      onChange(newCode);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - removedLen, start - removedLen);
        handleSelect();
      }, 10);
    }
  };

  // Indent (insert 4 spaces)
  const handleIndent = () => {
    insertToken(' '.repeat(tabSize));
  };

  // Toggle Line Comment (//)
  const handleToggleComment = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const before = code.substring(0, start);
    const after = code.substring(start);

    // Find the start of the current line
    const lastNewline = before.lastIndexOf('\n');
    const lineStartIndex = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = after.indexOf('\n');
    const lineEndIndex = nextNewline === -1 ? code.length : start + nextNewline;

    const currentLine = code.substring(lineStartIndex, lineEndIndex);
    let updatedLine: string;
    let cursorOffset = 0;

    if (currentLine.trimStart().startsWith('// ')) {
      // Remove comment
      updatedLine = currentLine.replace('// ', '');
      cursorOffset = -3;
    } else if (currentLine.trimStart().startsWith('//')) {
      updatedLine = currentLine.replace('//', '');
      cursorOffset = -2;
    } else {
      // Add comment
      const leadingSpaces = currentLine.match(/^(\s*)/)?.[1] || '';
      const restOfLine = currentLine.slice(leadingSpaces.length);
      updatedLine = `${leadingSpaces}// ${restOfLine}`;
      cursorOffset = 3;
    }

    const newCode =
      code.substring(0, lineStartIndex) +
      updatedLine +
      code.substring(lineEndIndex);
    onChange(newCode);

    setTimeout(() => {
      textarea.focus();
      const targetPos = Math.max(0, start + cursorOffset);
      textarea.setSelectionRange(targetPos, targetPos);
      handleSelect();
    }, 10);
  };

  // Navigation D-Pad for Touch Screens
  const handleNav = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;

    if (dir === 'left') {
      const nextPos = Math.max(0, start - 1);
      textarea.setSelectionRange(nextPos, nextPos);
    } else if (dir === 'right') {
      const nextPos = Math.min(code.length, start + 1);
      textarea.setSelectionRange(nextPos, nextPos);
    } else if (dir === 'up') {
      const before = code.substring(0, start);
      const lineList = before.split('\n');
      if (lineList.length > 1) {
        const currentCol = lineList[lineList.length - 1].length;
        const prevLine = lineList[lineList.length - 2];
        const prevLineStart = before.lastIndexOf('\n', before.lastIndexOf('\n') - 1) + 1;
        const targetPos = prevLineStart + Math.min(currentCol, prevLine.length);
        textarea.setSelectionRange(targetPos, targetPos);
      }
    } else if (dir === 'down') {
      const before = code.substring(0, start);
      const after = code.substring(start);
      const lineList = before.split('\n');
      const currentCol = lineList[lineList.length - 1].length;
      const nextNewline = after.indexOf('\n');
      if (nextNewline !== -1) {
        const nextLineStart = start + nextNewline + 1;
        const nextNextNewline = code.indexOf('\n', nextLineStart);
        const nextLineLen = (nextNextNewline === -1 ? code.length : nextNextNewline) - nextLineStart;
        const targetPos = nextLineStart + Math.min(currentCol, nextLineLen);
        textarea.setSelectionRange(targetPos, targetPos);
      }
    }

    handleSelect();
  };

  // Duplicate current line
  const handleDuplicateLine = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const before = code.substring(0, start);
    const after = code.substring(start);

    const lastNewline = before.lastIndexOf('\n');
    const lineStartIndex = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = after.indexOf('\n');
    const lineEndIndex = nextNewline === -1 ? code.length : start + nextNewline;

    const currentLine = code.substring(lineStartIndex, lineEndIndex);
    const newCode =
      code.substring(0, lineEndIndex) +
      '\n' +
      currentLine +
      code.substring(lineEndIndex);
    onChange(newCode);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + currentLine.length + 1;
      textarea.setSelectionRange(newPos, newPos);
      handleSelect();
    }, 10);
  };

  // Search and replace logic
  const handleFindNext = () => {
    if (!searchQuery || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const currentStart = textarea.selectionEnd;
    const nextIdx = code.indexOf(searchQuery, currentStart);
    if (nextIdx !== -1) {
      textarea.focus();
      textarea.setSelectionRange(nextIdx, nextIdx + searchQuery.length);
      handleSelect();
    } else {
      const wrapIdx = code.indexOf(searchQuery, 0);
      if (wrapIdx !== -1) {
        textarea.focus();
        textarea.setSelectionRange(wrapIdx, wrapIdx + searchQuery.length);
        handleSelect();
      }
    }
  };

  const handleReplaceOne = () => {
    if (!searchQuery || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = code.substring(start, end);

    if (selected === searchQuery) {
      const newCode = code.substring(0, start) + replaceQuery + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + replaceQuery.length);
        handleSelect();
      }, 10);
    } else {
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const newCode = code.replaceAll(searchQuery, replaceQuery);
    onChange(newCode);
  };

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      handleIndent();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme styling definitions
  const themeStyles = {
    obsidian: {
      bg: 'bg-slate-950',
      text: 'text-slate-100',
      linesBg: 'bg-slate-950/60',
      linesText: 'text-slate-600',
      activeLineBg: 'bg-slate-900/40',
      border: 'border-slate-800',
      toolbarBg: 'bg-slate-900',
      caret: '#10B981', // Emerald
    },
    'silicon-dark': {
      bg: 'bg-[#18181b]',
      text: 'text-[#e4e4e7]',
      linesBg: 'bg-[#131316]',
      linesText: 'text-[#71717a]',
      activeLineBg: 'bg-[#27272a]/50',
      border: 'border-[#27272a]',
      toolbarBg: 'bg-[#1e2029]',
      caret: '#f43f5e', // Crimson silicon
    },
    cyberpunk: {
      bg: 'bg-[#090a15]',
      text: 'text-[#e2e8f0]',
      linesBg: 'bg-[#05060b]',
      linesText: 'text-[#6366f1]',
      activeLineBg: 'bg-[#1e1b4b]/40',
      border: 'border-[#312e81]',
      toolbarBg: 'bg-[#0f1123]',
      caret: '#f43f5e',
    },
    light: {
      bg: 'bg-white',
      text: 'text-slate-900',
      linesBg: 'bg-slate-50',
      linesText: 'text-slate-400',
      activeLineBg: 'bg-slate-100',
      border: 'border-slate-200',
      toolbarBg: 'bg-slate-100',
      caret: '#0284c7',
    },
  }[theme] || {
    bg: 'bg-[#18181b]',
    text: 'text-[#e4e4e7]',
    linesBg: 'bg-[#131316]',
    linesText: 'text-[#71717a]',
    activeLineBg: 'bg-[#27272a]/50',
    border: 'border-[#27272a]',
    toolbarBg: 'bg-[#1e2029]',
    caret: '#f43f5e',
  };

  return (
    <div className={`flex flex-col h-full w-full ${themeStyles.bg} relative overflow-hidden select-none`}>
      {/* Quick Search & Replace Floating Bar */}
      {showSearch && (
        <div className="absolute top-2 right-4 z-20 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 backdrop-blur-md max-w-sm w-full animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5">
            <Search className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder="Find in file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 flex-1 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={handleFindNext}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Next match"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Replace className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 flex-1 outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={handleReplaceOne}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded font-medium"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded font-medium"
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* Editor Body: Line Numbers + Textarea */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className={`w-12 select-none overflow-hidden text-right pr-3 font-mono border-r ${themeStyles.border} ${themeStyles.linesBg} ${themeStyles.linesText} pt-2 shrink-0`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize * 1.5}px`,
          }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className={`leading-relaxed ${
                cursorPos.line === i + 1 ? 'font-bold text-slate-200' : ''
              } ${errorLine === i + 1 ? 'text-red-400 font-bold bg-red-950/40' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Input Surface */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onClick={handleSelect}
            onKeyUp={handleSelect}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className={`w-full h-full p-2 outline-none resize-none font-mono ${themeStyles.text} bg-transparent leading-relaxed tab-size-4`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: `${fontSize * 1.5}px`,
              caretColor: themeStyles.caret,
            }}
          />
        </div>
      </div>

      {/* Mobile Keyboard Symbol & Navigation Strip */}
      <div className={`h-11 ${themeStyles.toolbarBg} border-t ${themeStyles.border} flex items-center px-1.5 overflow-x-auto select-none no-scrollbar gap-1 shrink-0`}>
        {/* Category Selector Tabs */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-700/60 shrink-0">
          <button
            onClick={() => setActiveCategory(activeCategory === 'all' ? 'symbols' : 'all')}
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeCategory === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle All Symbols"
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory(activeCategory === 'keywords' ? 'all' : 'keywords')}
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeCategory === 'keywords'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="AAYU Keywords"
          >
            Keys
          </button>
          <button
            onClick={() => setActiveCategory(activeCategory === 'nav' ? 'all' : 'nav')}
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              activeCategory === 'nav'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cursor Navigation D-Pad"
          >
            Nav
          </button>
        </div>

        {/* Indent / Unindent */}
        <button
          onClick={handleIndent}
          className="px-2.5 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-emerald-300 font-mono text-xs font-bold border border-slate-700/60 shrink-0 active:scale-95"
          title="Indent (Tab)"
        >
          Tab
        </button>
        <button
          onClick={handleUnindent}
          className="px-2.5 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-slate-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95"
          title="Unindent"
        >
          ⇤
        </button>

        {/* Cursor D-Pad (Navigation arrows for mobile screens) */}
        {(activeCategory === 'all' || activeCategory === 'nav') && (
          <div className="flex items-center gap-0.5 bg-[#171821] p-0.5 rounded-lg border border-slate-700/50 shrink-0">
            <button
              onClick={() => handleNav('left')}
              className="p-1 hover:bg-slate-700 text-slate-200 rounded active:scale-90"
              title="Move Cursor Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNav('up')}
              className="p-1 hover:bg-slate-700 text-slate-200 rounded active:scale-90"
              title="Move Cursor Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNav('down')}
              className="p-1 hover:bg-slate-700 text-slate-200 rounded active:scale-90"
              title="Move Cursor Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNav('right')}
              className="p-1 hover:bg-slate-700 text-slate-200 rounded active:scale-90"
              title="Move Cursor Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Line Comment and Duplicate buttons */}
        <button
          onClick={handleToggleComment}
          className="px-2 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-amber-300 font-mono text-xs font-bold border border-slate-700/60 shrink-0 active:scale-95"
          title="Toggle Line Comment (//)"
        >
          //
        </button>

        {(activeCategory === 'all' || activeCategory === 'nav') && (
          <button
            onClick={handleDuplicateLine}
            className="px-2 py-1 rounded bg-[#272935] hover:bg-cyan-600/30 text-cyan-300 font-mono text-[11px] border border-slate-700/60 shrink-0 active:scale-95"
            title="Duplicate Current Line"
          >
            Dup
          </button>
        )}

        {/* Smart Brackets & Quotes with Auto-Wrap */}
        {(activeCategory === 'all' || activeCategory === 'symbols') && (
          <>
            <button
              onClick={() => insertOrWrap('(', ')')}
              className="px-2.5 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-yellow-300 font-mono text-xs font-bold border border-slate-700/60 shrink-0 active:scale-95"
              title="Insert or Wrap ( )"
            >
              ( )
            </button>
            <button
              onClick={() => insertOrWrap('{', '}')}
              className="px-2.5 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-yellow-300 font-mono text-xs font-bold border border-slate-700/60 shrink-0 active:scale-95"
              title="Insert or Wrap { }"
            >
              &#123; &#125;
            </button>
            <button
              onClick={() => insertOrWrap('[', ']')}
              className="px-2.5 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-yellow-300 font-mono text-xs font-bold border border-slate-700/60 shrink-0 active:scale-95"
              title="Insert or Wrap [ ]"
            >
              [ ]
            </button>
            <button
              onClick={() => insertOrWrap('"', '"')}
              className="px-2.5 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-emerald-300 font-mono text-xs font-bold border border-slate-700/60 shrink-0 active:scale-95"
              title='Insert or Wrap "'
            >
              &quot;&quot;
            </button>
            <button
              onClick={() => insertOrWrap("'", "'")}
              className="px-2.5 py-1 rounded bg-[#272935] hover:bg-emerald-600/30 text-emerald-300 font-mono text-xs font-bold border border-slate-700/60 shrink-0 active:scale-95"
              title="Insert or Wrap '"
            >
              &apos;&apos;
            </button>

            {/* Common Operators & Punctuation */}
            <button onClick={() => insertToken(':')} className="px-2.5 py-1 rounded bg-[#272935] text-slate-200 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">:</button>
            <button onClick={() => insertToken(';')} className="px-2.5 py-1 rounded bg-[#272935] text-slate-200 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">;</button>
            <button onClick={() => insertToken(', ')} className="px-2.5 py-1 rounded bg-[#272935] text-slate-200 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">,</button>
            <button onClick={() => insertToken('.')} className="px-2.5 py-1 rounded bg-[#272935] text-slate-200 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">.</button>
            <button onClick={() => insertToken(' = ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">=</button>
            <button onClick={() => insertToken(' == ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">==</button>
            <button onClick={() => insertToken(' != ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">!=</button>
            <button onClick={() => insertToken(' < ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">&lt;</button>
            <button onClick={() => insertToken(' > ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">&gt;</button>
            <button onClick={() => insertToken(' + ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">+</button>
            <button onClick={() => insertToken(' - ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">-</button>
            <button onClick={() => insertToken(' * ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">*</button>
            <button onClick={() => insertToken(' / ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">/</button>
            <button onClick={() => insertToken(' % ')} className="px-2.5 py-1 rounded bg-[#272935] text-pink-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">%</button>
            <button onClick={() => insertToken('!')} className="px-2.5 py-1 rounded bg-[#272935] text-slate-200 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">!</button>
            <button onClick={() => insertToken('_')} className="px-2.5 py-1 rounded bg-[#272935] text-slate-200 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">_</button>
            <button onClick={() => insertToken(' -> ')} className="px-2.5 py-1 rounded bg-[#272935] text-cyan-300 font-mono text-xs border border-slate-700/60 shrink-0 active:scale-95">-&gt;</button>
          </>
        )}

        {/* AAYU Language Keywords */}
        {(activeCategory === 'all' || activeCategory === 'keywords') && (
          <>
            <button onClick={() => insertToken('let ')} className="px-2.5 py-1 rounded bg-[#232738] text-purple-300 font-mono text-xs font-semibold border border-purple-500/30 shrink-0 active:scale-95">let</button>
            <button onClick={() => insertToken('fn ')} className="px-2.5 py-1 rounded bg-[#232738] text-purple-300 font-mono text-xs font-semibold border border-purple-500/30 shrink-0 active:scale-95">fn</button>
            <button onClick={() => insertToken('model ')} className="px-2.5 py-1 rounded bg-[#232738] text-emerald-300 font-mono text-xs font-semibold border border-emerald-500/30 shrink-0 active:scale-95">model</button>
            <button onClick={() => insertToken('insert ')} className="px-2.5 py-1 rounded bg-[#232738] text-emerald-300 font-mono text-xs font-semibold border border-emerald-500/30 shrink-0 active:scale-95">insert</button>
            <button onClick={() => insertToken('find ')} className="px-2.5 py-1 rounded bg-[#232738] text-emerald-300 font-mono text-xs font-semibold border border-emerald-500/30 shrink-0 active:scale-95">find</button>
            <button onClick={() => insertToken('for ')} className="px-2.5 py-1 rounded bg-[#232738] text-amber-300 font-mono text-xs font-semibold border border-amber-500/30 shrink-0 active:scale-95">for</button>
            <button onClick={() => insertToken('in ')} className="px-2.5 py-1 rounded bg-[#232738] text-amber-300 font-mono text-xs font-semibold border border-amber-500/30 shrink-0 active:scale-95">in</button>
            <button onClick={() => insertToken('if ')} className="px-2.5 py-1 rounded bg-[#232738] text-amber-300 font-mono text-xs font-semibold border border-amber-500/30 shrink-0 active:scale-95">if</button>
            <button onClick={() => insertToken('elif ')} className="px-2.5 py-1 rounded bg-[#232738] text-amber-300 font-mono text-xs font-semibold border border-amber-500/30 shrink-0 active:scale-95">elif</button>
            <button onClick={() => insertToken('else ')} className="px-2.5 py-1 rounded bg-[#232738] text-amber-300 font-mono text-xs font-semibold border border-amber-500/30 shrink-0 active:scale-95">else</button>
            <button onClick={() => insertToken('while ')} className="px-2.5 py-1 rounded bg-[#232738] text-amber-300 font-mono text-xs font-semibold border border-amber-500/30 shrink-0 active:scale-95">while</button>
            <button onClick={() => insertToken('return ')} className="px-2.5 py-1 rounded bg-[#232738] text-pink-300 font-mono text-xs font-semibold border border-pink-500/30 shrink-0 active:scale-95">return</button>
            <button onClick={() => insertToken('println()')} className="px-2.5 py-1 rounded bg-[#232738] text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/30 shrink-0 active:scale-95">println</button>
          </>
        )}
      </div>

      {/* Editor Footer: Cursor info, font scale, search toggle */}
      <div className="h-7 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="font-mono">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          {errorLine && (
            <span className="text-red-400 font-medium">
              Error at Line {errorLine}:{errorCol}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 hover:text-slate-200 rounded"
            title="Find & Replace"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="p-1 hover:text-slate-200 rounded flex items-center gap-1"
            title="Copy code to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Font scale buttons */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setInternalFontSize(Math.max(11, fontSize - 1))}
              className="px-1 hover:bg-slate-800 rounded font-bold"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="font-mono text-[10px] w-5 text-center">{fontSize}</span>
            <button
              onClick={() => setInternalFontSize(Math.min(22, fontSize + 1))}
              className="px-1 hover:bg-slate-800 rounded font-bold"
              title="Increase font size"
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
