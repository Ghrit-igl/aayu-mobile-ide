/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderPlus,
  FilePlus,
  Folder,
  FileCode,
  Trash2,
  Download,
  Upload,
  BookOpen,
  Sparkles,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react';
import { UserProject, WorkspaceService, ProjectFile } from '../services/workspaceService';
import { STARTER_EXAMPLES, ExampleProgram } from '../data/examples';

interface ProjectExplorerProps {
  projects: UserProject[];
  activeProject: UserProject;
  onSelectProject: (projectId: string) => void;
  onSelectFile: (fileId: string) => void;
  onCreateProject: (name: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onLoadExample: (example: ExampleProgram) => void;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onSelectFile,
  onCreateProject,
  onCreateFile,
  onDeleteFile,
  onLoadExample,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim());
    setNewProjectName('');
    setShowNewProjectInput(false);
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setShowNewFileInput(false);
  };

  const categories = ['All', 'Basics', 'Algorithms', 'Intent Database', 'Intent Web & UI', 'Native AI', 'Multi-File'];
  const filteredExamples =
    activeCategory === 'All'
      ? STARTER_EXAMPLES
      : STARTER_EXAMPLES.filter((ex) => ex.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Folder className="w-4 h-4 text-emerald-400" />
            <span>Projects & Workspace</span>
          </h2>
          <p className="text-xs text-slate-400">Offline-first local file management</p>
        </div>

        <button
          onClick={() => setShowNewProjectInput(!showNewProjectInput)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Input */}
      {showNewProjectInput && (
        <form onSubmit={handleCreateProjectSubmit} className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-300">Project Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. My Intent App"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Current Project Files */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active: {activeProject.name}
          </span>
          <button
            onClick={() => setShowNewFileInput(!showNewFileInput)}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-medium"
          >
            <FilePlus className="w-3 h-3" />
            <span>Add File</span>
          </button>
        </div>

        {/* New file input */}
        {showNewFileInput && (
          <form onSubmit={handleCreateFileSubmit} className="mb-2 p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. utils.aayu"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium"
            >
              Add
            </button>
          </form>
        )}

        <div className="space-y-1">
          {activeProject.files.map((file) => {
            const isSelected = file.id === activeProject.activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-slate-900 border border-emerald-500/30 text-emerald-400 font-medium'
                    : 'hover:bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-xs">
                  <FileCode className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{file.name}</span>
                </div>

                {activeProject.files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Switch Project */}
      {projects.length > 1 && (
        <div className="mt-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Other Projects ({projects.length - 1})
          </div>
          <div className="space-y-1">
            {projects
              .filter((p) => p.id !== activeProject.id)
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/40 hover:bg-slate-900 text-slate-300 cursor-pointer border border-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Folder className="w-4 h-4 text-slate-500" />
                    <span>{p.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({p.files.length} files)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Starter Examples Gallery */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Verified Example Gallery</span>
            </h3>
            <p className="text-[11px] text-slate-400">Tested and validated on local AAYU VM</p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-colors ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Example Cards */}
        <div className="grid grid-cols-1 gap-2.5 mt-2">
          {filteredExamples.map((ex) => (
            <div
              key={ex.id}
              onClick={() => onLoadExample(ex)}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {ex.title}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {ex.filename}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{ex.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="text-emerald-400/90 font-medium">VERIFIED PASS</span>
                <span className="group-hover:text-cyan-400 flex items-center gap-0.5">
                  Load into Editor &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
