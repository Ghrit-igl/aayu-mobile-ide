/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Mobile IDE - Git Version Control GUI Modal
 * Complete Git management:
 * - Commit, Stage, Status
 * - Branches (Create, Switch, Merge with conflict detection)
 * - Git Clone from GitHub / Remote
 * - Push / Pull synchronization
 * - Commit timeline & history
 */

import React, { useState, useEffect } from 'react';
import {
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  GitMerge as GitMergeIcon,
  GitPullRequest,
  UploadCloud,
  DownloadCloud,
  FolderGit2,
  Check,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  X,
  FileCode,
  Share2,
} from 'lucide-react';
import { GitService, GitRepoState, GitStatusResult, GitCommit } from '../services/gitService';
import { UserProject } from '../services/workspaceService';

interface GitModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: UserProject;
  onUpdateFiles: (files: Record<string, string>) => void;
  onCloneSuccess: (projectName: string, files: Record<string, string>) => void;
}

export const GitModal: React.FC<GitModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onUpdateFiles,
  onCloneSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'branches' | 'merge' | 'log' | 'clone'>('status');
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [targetMergeBranch, setTargetMergeBranch] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [repoState, setRepoState] = useState<GitRepoState | null>(null);
  const [statusResult, setStatusResult] = useState<GitStatusResult | null>(null);

  const getFilesMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const f of activeProject.files) {
      map[f.name] = f.content;
    }
    return map;
  };

  const refreshGitState = () => {
    const files = getFilesMap();
    const repo = GitService.getRepo(activeProject.id, files);
    const status = GitService.status(activeProject.id, files);
    setRepoState(repo);
    setStatusResult(status);
  };

  useEffect(() => {
    if (isOpen) {
      refreshGitState();
      setActionFeedback(null);
    }
  }, [isOpen, activeProject]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    refreshGitState();
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // 1. Stage All
  const handleStageAll = () => {
    GitService.stageAll(activeProject.id, getFilesMap());
    showFeedback('✓ All working changes staged.');
  };

  // 2. Commit
  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    const commit = GitService.commit(activeProject.id, commitMessage.trim(), getFilesMap());
    setCommitMessage('');
    showFeedback(`✓ Committed [${commit.hash}]: "${commit.message}"`);
  };

  // 3. Create Branch
  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const ok = GitService.createBranch(activeProject.id, newBranchName.trim());
    if (ok) {
      showFeedback(`✓ Created branch '${newBranchName.trim()}'.`);
      setNewBranchName('');
    } else {
      showFeedback('⚠ Branch already exists or invalid name.');
    }
  };

  // 4. Switch Branch
  const handleSwitchBranch = (branchName: string) => {
    const res = GitService.switchBranch(activeProject.id, branchName);
    if (res.success && res.files) {
      onUpdateFiles(res.files);
      showFeedback(res.message);
    } else {
      showFeedback(res.message);
    }
  };

  // 5. Merge Branch
  const handleMerge = () => {
    if (!targetMergeBranch) return;
    const res = GitService.merge(activeProject.id, targetMergeBranch, getFilesMap());
    if (res.success && res.files) {
      onUpdateFiles(res.files);
      showFeedback(res.message);
      setTargetMergeBranch('');
    } else {
      showFeedback(`⚠ ${res.message}`);
    }
  };

  // 6. Push
  const handlePush = () => {
    const res = GitService.push(activeProject.id);
    showFeedback(`✓ ${res.message}`);
  };

  // 7. Pull
  const handlePull = () => {
    const res = GitService.pull(activeProject.id);
    showFeedback(`✓ ${res.message}`);
  };

  // 8. Clone
  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneUrl.trim()) return;
    setIsCloning(true);
    try {
      const cloned = await GitService.cloneRepo(cloneUrl.trim());
      onCloneSuccess(cloned.projectName, cloned.files);
      showFeedback(`✓ Cloned '${cloned.projectName}' successfully!`);
      setTimeout(() => {
        setIsCloning(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsCloning(false);
      showFeedback(`⚠ Clone failed: ${err.message || String(err)}`);
    }
  };

  const branchList = repoState ? Object.keys(repoState.branches) : ['main'];
  const commits = repoState ? GitService.log(activeProject.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-xs select-none animate-in fade-in">
      <div className="w-full max-w-3xl h-[88vh] bg-[#12141c] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono">
        {/* Header */}
        <div className="h-14 px-4 bg-[#181a24] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Git Source Control</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {statusResult?.branch || 'main'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Project: {activeProject.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshGitState}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {actionFeedback && (
          <div className="p-2.5 bg-emerald-950/70 border-b border-emerald-800/80 text-emerald-300 text-xs px-4 flex items-center justify-between">
            <span>{actionFeedback}</span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="h-10 bg-[#0e1017] border-b border-slate-800 px-3 flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'status'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommitIcon className="w-3.5 h-3.5" />
            <span>Changes & Commit</span>
            {statusResult && (statusResult.modified.length > 0 || statusResult.staged.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'branches'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranchIcon className="w-3.5 h-3.5" />
            <span>Branches ({branchList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('merge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'merge'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitMergeIcon className="w-3.5 h-3.5" />
            <span>Merge</span>
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'log'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({commits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'clone'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Git Clone</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* TAB 1: STATUS & COMMIT */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Quick Remote Sync Buttons */}
              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Remote:</span>
                  <span className="text-cyan-400 truncate max-w-xs">{repoState?.remoteUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePush}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Push</span>
                  </button>
                  <button
                    onClick={handlePull}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Pull</span>
                  </button>
                </div>
              </div>

              {/* Commit form */}
              <form onSubmit={handleCommit} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">Commit Message</label>
                  <button
                    type="button"
                    onClick={handleStageAll}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    + Stage All Changes
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. feat: add native math_sqrt builtin and routes"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500 font-mono text-xs"
                />
                <button
                  type="submit"
                  disabled={!commitMessage.trim()}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <GitCommitIcon className="w-4 h-4" />
                  <span>Commit to &apos;{statusResult?.branch}&apos;</span>
                </button>
              </form>

              {/* Staged & Modified Files lists */}
              <div className="space-y-3">
                {/* Staged Changes */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Staged Changes ({statusResult?.staged.length || 0})</span>
                  </div>
                  {statusResult?.staged && statusResult.staged.length > 0 ? (
                    <div className="space-y-1">
                      {statusResult.staged.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px] italic">No changes currently staged.</div>
                  )}
                </div>

                {/* Modified / Untracked Changes */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>Working Tree Changes ({((statusResult?.modified.length || 0) + (statusResult?.untracked.length || 0))})</span>
                  </div>
                  {statusResult && (statusResult.modified.length > 0 || statusResult.untracked.length > 0) ? (
                    <div className="space-y-1">
                      {statusResult.modified.map((f) => (
                        <div key={f} className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-amber-300">M {f}</span>
                          <button
                            onClick={() => {
                              const files = getFilesMap();
                              if (files[f]) GitService.stageFile(activeProject.id, f, files[f]);
                              refreshGitState();
                            }}
                            className="text-emerald-400 hover:text-emerald-300 text-[10px]"
                          >
                            + Stage
                          </button>
                        </div>
                      ))}
                      {statusResult.untracked.map((f) => (
                        <div key={f} className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-purple-300">? {f}</span>
                          <button
                            onClick={() => {
                              const files = getFilesMap();
                              if (files[f]) GitService.stageFile(activeProject.id, f, files[f]);
                              refreshGitState();
                            }}
                            className="text-emerald-400 hover:text-emerald-300 text-[10px]"
                          >
                            + Stage
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px] italic">Working tree clean. Nothing to commit.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANCHES */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              {/* Create branch form */}
              <form onSubmit={handleCreateBranch} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New branch name (e.g. dev-intent-api)"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 outline-none text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={!newBranchName.trim()}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create</span>
                </button>
              </form>

              {/* Branch list */}
              <div className="space-y-2">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Available Branches</div>
                {branchList.map((bName) => {
                  const isCurrent = bName === repoState?.currentBranch;
                  const bObj = repoState?.branches[bName];
                  return (
                    <div
                      key={bName}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <GitBranchIcon className={`w-4 h-4 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="font-bold">{bName}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            HEAD
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">[{bObj?.commitHash}]</span>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => handleSwitchBranch(bName)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                        >
                          Checkout
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MERGE */}
          {activeTab === 'merge' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-purple-400">Merge Branches</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Merge changes from another branch into current branch: <span className="text-white font-bold">{repoState?.currentBranch}</span>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300">Select branch to merge into &apos;{repoState?.currentBranch}&apos;:</label>
                <select
                  value={targetMergeBranch}
                  onChange={(e) => setTargetMergeBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none text-xs font-mono"
                >
                  <option value="">-- Choose source branch --</option>
                  {branchList
                    .filter((b) => b !== repoState?.currentBranch)
                    .map((b) => (
                      <option key={b} value={b}>
                        {b} (commit {repoState?.branches[b]?.commitHash})
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleMerge}
                disabled={!targetMergeBranch}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <GitMergeIcon className="w-4 h-4" />
                <span>Execute Fast-Forward & Intent Merge</span>
              </button>
            </div>
          )}

          {/* TAB 4: COMMIT HISTORY LOG */}
          {activeTab === 'log' && (
            <div className="space-y-2">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Commit Timeline</div>
              {commits.map((c, idx) => (
                <div key={c.hash} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{c.hash}</span>
                    <span className="text-[10px] text-slate-500">{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-white font-medium">{c.message}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{c.author}</span>
                    <span>{Object.keys(c.snapshot || {}).length} file(s) snapshot</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: GIT CLONE */}
          {activeTab === 'clone' && (
            <form onSubmit={handleClone} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <div className="text-xs font-bold text-indigo-400">Clone Repository</div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Enter any GitHub repository URL (e.g. https://github.com/Minato95-ayu/INTENT-TO-SILICON) to clone into your AAYU mobile workspace.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300">Repository URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/Minato95-ayu/INTENT-TO-SILICON"
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-600 outline-none text-xs font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCloneUrl('https://github.com/Minato95-ayu/INTENT-TO-SILICON')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  ⚡ Template: Intent-to-Silicon
                </button>
              </div>

              <button
                type="submit"
                disabled={isCloning || !cloneUrl.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{isCloning ? 'Cloning repository...' : 'Clone Repository'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
