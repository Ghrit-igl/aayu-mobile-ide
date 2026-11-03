/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Laptop-Style File Manager & Project Explorer
 * Features:
 * - Direct .aayu file import & export to device disk
 * - Project export as .ZIP archive
 * - Git version control access
 * - File duplicate, rename, delete
 * - AI save indicator & sample gallery
 */

import React, { useState, useRef } from 'react';
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
  Copy,
  Edit2,
  FolderGit2,
  Archive,
} from 'lucide-react';
import { UserProject, WorkspaceService, ProjectFile } from '../services/workspaceService';
import { STARTER_EXAMPLES, ExampleProgram } from '../data/examples';
import { GitService } from '../services/gitService';

interface ProjectExplorerProps {
  projects: UserProject[];
  activeProject: UserProject;
  onSelectProject: (projectId: string) => void;
  onSelectFile: (fileId: string) => void;
  onCreateProject: (name: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onLoadExample: (example: ExampleProgram) => void;
  onOpenGitModal?: () => void;
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
  onOpenGitModal,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        WorkspaceService.addFile(activeProject.id, file.name, content);
        // Refresh by selecting
        onSelectFile(activeProject.activeFileId);
      };
      reader.readAsText(file);
    }
    if (fileUploadInputRef.current) {
      fileUploadInputRef.current.value = '';
    }
  };

  const handleExportZip = async () => {
    await WorkspaceService.exportProjectZip(activeProject.id);
  };

  const handleDownloadFile = (file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    WorkspaceService.downloadFile(file);
  };

  const handleDuplicate = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy = WorkspaceService.duplicateFile(activeProject.id, fileId);
    if (copy) {
      onSelectFile(copy.id);
    }
  };

  const handleStartRename = (file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingFileId(file.id);
    setRenameInput(file.name);
  };

  const handleSaveRename = (fileId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (renameInput.trim()) {
      WorkspaceService.renameFile(activeProject.id, fileId, renameInput.trim());
    }
    setRenamingFileId(null);
  };

  const categories = ['All', 'Basics', 'Algorithms', 'Intent Database', 'Intent Web & UI', 'Native AI', 'Multi-File'];
  const filteredExamples =
    activeCategory === 'All'
      ? STARTER_EXAMPLES
      : STARTER_EXAMPLES.filter((ex) => ex.category === activeCategory);

  const gitStatus = GitService.status(
    activeProject.id,
    Object.fromEntries(activeProject.files.map((f) => [f.name, f.content]))
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto p-4 select-none font-sans">
      {/* Hidden File Input for Laptop/Device File Upload */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept=".aayu,.txt"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Folder className="w-4 h-4 text-emerald-400" />
            <span>File Manager & Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">Laptop-Style Native File System & Git</p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGitModal && (
            <button
              onClick={onOpenGitModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
              title="Open Git Version Control"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Git ({gitStatus.branch})</span>
            </button>
          )}

          <button
            onClick={() => setShowNewProjectInput(!showNewProjectInput)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* New Project Input */}
      {showNewProjectInput && (
        <form onSubmit={handleCreateProjectSubmit} className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-300">Project Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. My Intent App"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Laptop File Operations Toolbar */}
      <div className="mt-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileUploadInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
            title="Import .aayu file from device storage"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import .aayu</span>
          </button>

          <button
            onClick={handleExportZip}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
            title="Export all files as a ZIP archive"
          >
            <Archive className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export .ZIP</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Device Auto-Save: Active</span>
        </div>
      </div>

      {/* Current Project Files */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Files in {activeProject.name} ({activeProject.files.length})
          </span>
          <button
            onClick={() => setShowNewFileInput(!showNewFileInput)}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-semibold"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Add .aayu File</span>
          </button>
        </div>

        {/* New file input */}
        {showNewFileInput && (
          <form onSubmit={handleCreateFileSubmit} className="mb-2 p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. utils.aayu"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold"
            >
              Add
            </button>
          </form>
        )}

        <div className="space-y-1.5">
          {activeProject.files.map((file) => {
            const isSelected = file.id === activeProject.activeFileId;
            const isRenaming = renamingFileId === file.id;

            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-slate-900 border border-emerald-500/40 text-emerald-300 font-medium'
                    : 'hover:bg-slate-900/60 text-slate-300 bg-slate-900/20 border border-slate-800/60'
                }`}
              >
                {isRenaming ? (
                  <form
                    onSubmit={(e) => handleSaveRename(file.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 flex-1"
                  >
                    <input
                      type="text"
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      autoFocus
                      className="bg-black border border-cyan-500 rounded px-2 py-0.5 text-xs text-white outline-none font-mono flex-1"
                    />
                    <button type="submit" className="p-1 text-emerald-400 hover:text-emerald-300">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500">({file.content.length} bytes)</span>
                  </div>
                )}

                {/* File Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDownloadFile(file, e)}
                    className="p-1 text-slate-500 hover:text-cyan-400 rounded transition-colors"
                    title="Download .aayu file to device"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDuplicate(file.id, e)}
                    className="p-1 text-slate-500 hover:text-emerald-400 rounded transition-colors"
                    title="Duplicate file"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleStartRename(file, e)}
                    className="p-1 text-slate-500 hover:text-amber-400 rounded transition-colors"
                    title="Rename file"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

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
              </div>
            );
          })}
        </div>
      </div>

      {/* Switch Project */}
      {projects.length > 1 && (
        <div className="mt-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
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
              <span>AAYU Examples Gallery</span>
            </h3>
            <p className="text-xs text-slate-400">Load production single-file full-stack patterns</p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredExamples.map((ex) => (
            <div
              key={ex.id}
              onClick={() => onLoadExample(ex)}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {ex.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {ex.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {ex.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono">{ex.code.split('\n').length} lines</span>
                <span className="text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Load & Run →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
