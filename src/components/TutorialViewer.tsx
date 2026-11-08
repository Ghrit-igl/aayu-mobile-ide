/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Play,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Code2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TUTORIAL_LESSONS, TutorialLesson } from '../data/tutorials';

interface TutorialViewerProps {
  onLoadAndRunCode: (code: string) => void;
}

export const TutorialViewer: React.FC<TutorialViewerProps> = ({ onLoadAndRunCode }) => {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const lesson = TUTORIAL_LESSONS[selectedLessonIndex];

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top lesson selector / progress ribbon */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/80 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-100">Zero-to-Silicon Curriculum</span>
          <span className="text-[11px] font-mono text-emerald-400">
            ({selectedLessonIndex + 1}/{TUTORIAL_LESSONS.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedLessonIndex(Math.max(0, selectedLessonIndex - 1));
              setShowSolution(false);
            }}
            disabled={selectedLessonIndex === 0}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
            title="Previous chapter"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedLessonIndex(Math.min(TUTORIAL_LESSONS.length - 1, selectedLessonIndex + 1));
              setShowSolution(false);
            }}
            disabled={selectedLessonIndex === TUTORIAL_LESSONS.length - 1}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
            title="Next chapter"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main scrollable lesson body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full select-text">
        {/* Title & Tagline */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Chapter {lesson.number}
            </span>
            <span className="text-xs text-slate-400 font-mono">INTENT-TO-SILICON</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">{lesson.title}</h1>
          <p className="text-sm font-medium text-emerald-400 mt-1">{lesson.tagline}</p>
        </div>

        {/* Concept & Prerequisites */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-start gap-2 text-xs">
            <span className="font-bold text-slate-300 min-w-[90px]">Core Concept:</span>
            <span className="text-slate-200">{lesson.concept}</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <span className="font-bold text-slate-400 min-w-[90px]">Prerequisites:</span>
            <span className="text-slate-400 font-mono">{lesson.prerequisites.join(', ')}</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-sm text-slate-300 leading-relaxed space-y-3">
          <p>{lesson.explanation}</p>
        </div>

        {/* Code Example Block */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
          <div className="h-9 bg-slate-900 px-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>example_ch{lesson.number}.aayu</span>
            </div>

            <button
              onClick={() => onLoadAndRunCode(lesson.code)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow transition-all active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Example</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-slate-950">
            {lesson.code}
          </pre>

          <div className="border-t border-slate-900 bg-slate-900/60 p-3">
            <div className="text-[11px] font-bold text-slate-400 mb-1">Expected Output:</div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
              {lesson.expectedOutput}
            </pre>
          </div>
        </div>

        {/* Practice Exercise */}
        <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Exercise: {lesson.exercise.title}</span>
            </h3>
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              {showSolution ? 'Hide Solution' : 'Reveal Solution'}
            </button>
          </div>

          <p className="text-xs text-slate-300">{lesson.exercise.task}</p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onLoadAndRunCode(lesson.exercise.starterCode)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Load Starter Code into Editor
            </button>
            {showSolution && (
              <button
                onClick={() => onLoadAndRunCode(lesson.exercise.solutionCode)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/40 transition-colors"
              >
                Run Verified Solution
              </button>
            )}
          </div>

          {showSolution && (
            <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-amber-500/30 animate-in fade-in">
              <div className="text-[11px] font-bold text-amber-400 mb-1">Verified Solution:</div>
              <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap">
                {lesson.exercise.solutionCode}
              </pre>
            </div>
          )}
        </div>

        {/* Links to Official Documentation */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <a
            href={lesson.docLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-cyan-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Official Documentation (intent-to-silicon.vercel.app/docs)</span>
          </a>

          <button
            onClick={() => {
              if (selectedLessonIndex < TUTORIAL_LESSONS.length - 1) {
                setSelectedLessonIndex(selectedLessonIndex + 1);
                setShowSolution(false);
              }
            }}
            className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>Next Chapter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
