/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Fullscreen PowerShell Terminal & Multi-Mode Execution Suite
 * Features:
 * 1. Authentic Windows PowerShell Interactive Terminal:
 *    - Commands: aayu run, aayu build, aayu ast, aayu tokens
 *    - Git commands: git status, git add, git commit, git branch, git merge, git push, git pull, git log, git clone
 *    - Shell commands: ls/dir, cat/type, pwd, touch/new-item, rm/del, cls/clear, help
 *    - Direct AAYU code evaluation on Silicon Stack VM
 *    - Command history with ArrowUp / ArrowDown
 * 2. Live Web Server & API Tester
 * 3. Architecture & Dependency Flowchart (Mermaid)
 * 4. AayuDB In-Memory Relational State
 * 5. Stack VM Bytecode Disassembly
 * 6. Git Source Control Center (Branches, Commits, Sync)
 * 7. Flutter-like Declarative UI Preview
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
  FolderGit2,
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  GitMerge as GitMergeIcon,
  UploadCloud,
  DownloadCloud,
} from 'lucide-react';
import { ExecutionResult } from '../engine/types';
import { AayuRunner } from '../engine/runner';
import { GitService, GitRepoState, GitStatusResult } from '../services/gitService';
import { UserProject, WorkspaceService } from '../services/workspaceService';

export interface TerminalLogEntry {
  id: string;
  command?: string;
  output: string;
  isError?: boolean;
  isSuccess?: boolean;
  isPowershell?: boolean;
}

interface AayuTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  result: (ExecutionResult & { compilation?: any }) | null;
  isRunning: boolean;
  onSendStdin?: (input: string) => void;
  activeProject?: UserProject;
  onUpdateProjectFiles?: (files: Record<string, string>) => void;
}

export const AayuTerminal: React.FC<AayuTerminalProps> = ({
  isOpen,
  onClose,
  fileName,
  result,
  isRunning,
  onSendStdin,
  activeProject,
  onUpdateProjectFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'git' | 'api' | 'graph' | 'db' | 'bytecode' | 'ui'>('console');
  const [copied, setCopied] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([]);
  const [apiResponses, setApiResponses] = useState<Record<string, { status: number; payload: any; durationMs: number }>>({});
  const [activeRequestUrl, setActiveRequestUrl] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize terminal banner on load
  useEffect(() => {
    if (terminalLogs.length === 0) {
      setTerminalLogs([
        {
          id: 'banner',
          output: `Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

AAYU Intent-to-Silicon Environment [ARM64 Silicon Native v1.5.0]
Zero-Dependency Compiler & Virtual Machine

Type 'help', 'aayu run', 'git status', 'ls', or write AAYU code (e.g. 'a = 7') directly.
`,
          isPowershell: true,
        },
      ]);
    }
  }, []);

  // Sync execution result when run externally
  useEffect(() => {
    if (result) {
      let text = '';
      if (result.stdout) {
        text += result.stdout;
      }
      if (result.returnedValue !== undefined && result.returnedValue !== null && !result.stdout) {
        text += `=> ${typeof result.returnedValue === 'object' ? JSON.stringify(result.returnedValue) : String(result.returnedValue)}\n`;
      }
      if (result.variablesState && Object.keys(result.variablesState).length > 0 && !result.stdout && result.returnedValue === undefined) {
        const userVars = Object.entries(result.variablesState).filter(([k]) => !k.startsWith('__'));
        for (const [k, v] of userVars) {
          text += `${k} = ${typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}\n`;
        }
      }
      if (result.stderr) {
        text += `\nError:\n${result.stderr}`;
      }

      setTerminalLogs(prev => [
        ...prev,
        {
          id: `run-${Date.now()}`,
          command: `aayu run ${fileName}`,
          output: text || '[Program exited cleanly with no output]',
          isError: !result.success,
          isSuccess: result.success,
        },
      ]);
    }
  }, [result]);

  useEffect(() => {
    if (isOpen && activeTab === 'console') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, terminalLogs, isRunning, activeTab]);

  if (!isOpen) return null;

  const getFilesMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    if (activeProject) {
      for (const f of activeProject.files) {
        map[f.name] = f.content;
      }
    }
    return map;
  };

  const handleCopy = () => {
    let text = '';
    if (activeTab === 'console') {
      text = terminalLogs.map(l => (l.command ? `PS D:\\INTENT-TO-SILICON> ${l.command}\n${l.output}` : l.output)).join('\n');
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

  // PowerShell Terminal Command Dispatcher
  const executeCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Add to history
    setCommandHistory(prev => [cmd, ...prev.slice(0, 50)]);
    setHistoryIndex(-1);

    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const subCmd = parts[1]?.toLowerCase();
    const arg = parts.slice(2).join(' ');

    const projectId = activeProject?.id || 'default';
    const files = getFilesMap();

    // 1. CLEAR / CLS
    if (mainCmd === 'cls' || mainCmd === 'clear') {
      setTerminalLogs([]);
      return;
    }

    // 2. HELP
    if (mainCmd === 'help') {
      const helpText = `
Available PowerShell & AAYU Commands:
---------------------------------------------------------------------------------
aayu run [file.aayu]       Execute file on Silicon Stack VM
aayu build [file.aayu]     Compile file and disassemble bytecode
aayu ast [file.aayu]       Show Abstract Syntax Tree (AST) JSON
aayu tokens [file.aayu]    Analyze BPE token count & budget

git status                 Show working tree status and active branch
git add <file> | git add . Stage files for commit
git commit -m "<message>"  Commit staged changes to branch
git branch [name]          List or create new branch
git checkout <branch>      Switch to branch and load files
git merge <branch>         Merge branch into current branch
git push                   Push commits to remote origin
git pull                   Pull updates from remote
git log                    Display commit history
git clone <url>            Clone remote repository into IDE

ls / dir                   List files in current project directory
cat / type <file.aayu>     Print file content to console
pwd                        Print current working directory path
touch / new-item <file>    Create a new .aayu file in workspace
rm / del <file>            Remove file from workspace
echo <text>                Echo text to screen

Or simply write AAYU code directly (e.g. 'a = 7', 'print("hi")', 'sqrt(144)')
---------------------------------------------------------------------------------
`;
      setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: helpText }]);
      return;
    }

    // 3. PWD
    if (mainCmd === 'pwd') {
      setTerminalLogs(prev => [
        ...prev,
        { id: `log-${Date.now()}`, command: cmd, output: `Path\n----\nD:\\INTENT-TO-SILICON\\workspace\\${activeProject?.name || 'Default'}\n` },
      ]);
      return;
    }

    // 4. ECHO
    if (mainCmd === 'echo') {
      const echoMsg = parts.slice(1).join(' ');
      setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `${echoMsg}\n` }]);
      return;
    }

    // 5. LS / DIR
    if (mainCmd === 'ls' || mainCmd === 'dir') {
      const fileList = activeProject?.files || [];
      let output = `
    Directory: D:\\INTENT-TO-SILICON\\workspace\\${activeProject?.name || 'Default'}

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
`;
      for (const f of fileList) {
        const dateStr = new Date(f.lastModified).toLocaleDateString();
        const timeStr = new Date(f.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const len = String(f.content.length).padStart(12, ' ');
        output += `-a---       ${dateStr}  ${timeStr} ${len} ${f.name}\n`;
      }
      setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output }]);
      return;
    }

    // 6. CAT / TYPE
    if (mainCmd === 'cat' || mainCmd === 'type') {
      const targetFile = parts[1];
      if (!targetFile) {
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: 'Error: file name required (e.g. cat main.aayu)', isError: true }]);
        return;
      }
      const found = activeProject?.files.find(f => f.name === targetFile || f.name === `${targetFile}.aayu`);
      if (found) {
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: found.content }]);
      } else {
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `File '${targetFile}' not found in workspace.`, isError: true }]);
      }
      return;
    }

    // 7. TOUCH / NEW-ITEM
    if (mainCmd === 'touch' || mainCmd === 'new-item') {
      const targetFile = parts[1];
      if (!targetFile) {
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: 'Error: file name required', isError: true }]);
        return;
      }
      if (activeProject) {
        const newF = WorkspaceService.addFile(activeProject.id, targetFile);
        if (newF) {
          setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `Created file: ${newF.name}` }]);
          return;
        }
      }
      setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `Could not create file '${targetFile}'.`, isError: true }]);
      return;
    }

    // 8. RM / DEL
    if (mainCmd === 'rm' || mainCmd === 'del') {
      const targetFile = parts[1];
      const found = activeProject?.files.find(f => f.name === targetFile || f.name === `${targetFile}.aayu`);
      if (found && activeProject) {
        WorkspaceService.deleteFile(activeProject.id, found.id);
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `Removed file: ${found.name}` }]);
        return;
      }
      setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `File '${targetFile}' not found.`, isError: true }]);
      return;
    }

    // 9. GIT COMMANDS
    if (mainCmd === 'git') {
      if (subCmd === 'status') {
        const status = GitService.status(projectId, files);
        let out = `On branch ${status.branch}\n`;
        if (status.ahead > 0) {
          out += `Your branch is ahead of 'origin/${status.branch}' by ${status.ahead} commit(s).\n  (use "git push" to publish your local commits)\n\n`;
        } else {
          out += `Your branch is up to date with 'origin/${status.branch}'.\n\n`;
        }

        if (status.staged.length > 0) {
          out += `Changes to be committed:\n  (use "git restore --staged <file>..." to unstage)\n`;
          for (const s of status.staged) out += `\tnew file:   ${s}\n`;
          out += '\n';
        }

        if (status.modified.length > 0) {
          out += `Changes not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n`;
          for (const m of status.modified) out += `\tmodified:   ${m}\n`;
          out += '\n';
        }

        if (status.untracked.length > 0) {
          out += `Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n`;
          for (const u of status.untracked) out += `\t${u}\n`;
          out += '\n';
        }

        if (status.clean) {
          out += 'nothing to commit, working tree clean\n';
        }

        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: out }]);
        return;
      }

      if (subCmd === 'add') {
        const fileTarget = parts[2];
        if (fileTarget === '.' || fileTarget === '-A') {
          GitService.stageAll(projectId, files);
          setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: 'Staged all modified and untracked files.' }]);
        } else if (fileTarget && files[fileTarget]) {
          GitService.stageFile(projectId, fileTarget, files[fileTarget]);
          setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `Staged: ${fileTarget}` }]);
        } else {
          setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `fatal: pathspec '${fileTarget || ''}' did not match any files`, isError: true }]);
        }
        return;
      }

      if (subCmd === 'commit') {
        let msg = 'Updated code';
        const mIdx = parts.indexOf('-m');
        if (mIdx !== -1 && parts[mIdx + 1]) {
          msg = parts.slice(mIdx + 1).join(' ').replace(/^["']|["']$/g, '');
        }
        const commit = GitService.commit(projectId, msg, files);
        setTerminalLogs(prev => [
          ...prev,
          { id: `log-${Date.now()}`, command: cmd, output: `[${commit.hash}] ${commit.message}\n ${Object.keys(commit.snapshot).length} file(s) changed` },
        ]);
        return;
      }

      if (subCmd === 'branch') {
        const bName = parts[2];
        const repo = GitService.getRepo(projectId, files);
        if (!bName) {
          let out = '';
          for (const b of Object.keys(repo.branches)) {
            out += b === repo.currentBranch ? `* ${b}\n` : `  ${b}\n`;
          }
          setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: out }]);
        } else {
          const ok = GitService.createBranch(projectId, bName);
          setTerminalLogs(prev => [
            ...prev,
            { id: `log-${Date.now()}`, command: cmd, output: ok ? `Created branch '${bName}'.` : `fatal: A branch named '${bName}' already exists.`, isError: !ok },
          ]);
        }
        return;
      }

      if (subCmd === 'checkout' || subCmd === 'switch') {
        const bName = parts[2];
        const res = GitService.switchBranch(projectId, bName);
        if (res.success && res.files && onUpdateProjectFiles) {
          onUpdateProjectFiles(res.files);
        }
        setTerminalLogs(prev => [
          ...prev,
          { id: `log-${Date.now()}`, command: cmd, output: res.message, isError: !res.success },
        ]);
        return;
      }

      if (subCmd === 'merge') {
        const bName = parts[2];
        const res = GitService.merge(projectId, bName, files);
        if (res.success && res.files && onUpdateProjectFiles) {
          onUpdateProjectFiles(res.files);
        }
        setTerminalLogs(prev => [
          ...prev,
          { id: `log-${Date.now()}`, command: cmd, output: res.message, isError: !res.success },
        ]);
        return;
      }

      if (subCmd === 'push') {
        const res = GitService.push(projectId);
        setTerminalLogs(prev => [
          ...prev,
          { id: `log-${Date.now()}`, command: cmd, output: res.message },
        ]);
        return;
      }

      if (subCmd === 'pull') {
        const res = GitService.pull(projectId);
        setTerminalLogs(prev => [
          ...prev,
          { id: `log-${Date.now()}`, command: cmd, output: res.message },
        ]);
        return;
      }

      if (subCmd === 'log') {
        const commits = GitService.log(projectId);
        let out = '';
        for (const c of commits) {
          out += `commit ${c.hash}\nAuthor: ${c.author}\nDate:   ${new Date(c.timestamp).toLocaleString()}\n\n    ${c.message}\n\n`;
        }
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: out }]);
        return;
      }

      if (subCmd === 'diff') {
        const diffText = GitService.diff(projectId, files);
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: diffText }]);
        return;
      }

      if (subCmd === 'clone') {
        const url = parts[2];
        if (!url) {
          setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: 'fatal: repository URL required', isError: true }]);
          return;
        }
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: `Cloning into '${url}'...` }]);
        try {
          const cloned = await GitService.cloneRepo(url);
          if (onUpdateProjectFiles) {
            onUpdateProjectFiles(cloned.files);
          }
          setTerminalLogs(prev => [
            ...prev,
            { id: `log-cloned-${Date.now()}`, output: `Resolving deltas: 100% done.\nCloned '${cloned.projectName}' successfully with ${Object.keys(cloned.files).length} files.` },
          ]);
        } catch (err: any) {
          setTerminalLogs(prev => [...prev, { id: `log-err-${Date.now()}`, output: `fatal: clone failed: ${err.message}`, isError: true }]);
        }
        return;
      }
    }

    // 10. AAYU RUN / BUILD / AST / TOKENS
    if (mainCmd === 'aayu') {
      const action = parts[1]?.toLowerCase();
      const targetFileName = parts[2] || fileName;

      let codeToExecute = files[targetFileName] || '';
      if (!codeToExecute && parts.length > 2) {
        // e.g. aayu run a = 7
        codeToExecute = parts.slice(2).join(' ');
      } else if (!codeToExecute && parts.length === 2 && action !== 'build' && action !== 'ast' && action !== 'token' && action !== 'tokens') {
        codeToExecute = action;
      }

      if (!codeToExecute) {
        codeToExecute = files[fileName] || '';
      }

      if (action === 'build') {
        const comp = AayuRunner.compileOnly(codeToExecute);
        setTerminalLogs(prev => [
          ...prev,
          { id: `log-${Date.now()}`, command: cmd, output: comp.disassembly || 'No bytecode generated.', isError: !comp.success },
        ]);
        return;
      }

      if (action === 'ast') {
        const comp = AayuRunner.compileOnly(codeToExecute);
        setTerminalLogs(prev => [
          ...prev,
          { id: `log-${Date.now()}`, command: cmd, output: JSON.stringify(comp.ast, null, 2), isError: !comp.success },
        ]);
        return;
      }

      if (action === 'token' || action === 'tokens') {
        const est = Math.max(1, Math.ceil(codeToExecute.length / 3.8));
        const out = `BPE Token Estimation for '${targetFileName}':
  Characters: ${codeToExecute.length}
  Estimated Tokens: ${est}
  Density: ${(codeToExecute.length / est).toFixed(2)} chars/token
`;
        setTerminalLogs(prev => [...prev, { id: `log-${Date.now()}`, command: cmd, output: out }]);
        return;
      }

      // Default: aayu run
      const res = AayuRunner.run(codeToExecute, { virtualFiles: files });
      let outText = res.stdout;
      if (res.returnedValue !== undefined && res.returnedValue !== null && !res.stdout) {
        outText = `=> ${typeof res.returnedValue === 'object' ? JSON.stringify(res.returnedValue) : String(res.returnedValue)}\n`;
      }
      if (!outText && res.variablesState && Object.keys(res.variablesState).length > 0) {
        const userVars = Object.entries(res.variablesState).filter(([k]) => !k.startsWith('__'));
        for (const [k, v] of userVars) {
          outText += `${k} = ${typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}\n`;
        }
      }
      if (res.stderr) outText += `\nError:\n${res.stderr}`;

      setTerminalLogs(prev => [
        ...prev,
        { id: `log-${Date.now()}`, command: cmd, output: outText || '[Process exited cleanly with code 0]', isError: !res.success },
      ]);
      return;
    }

    // 11. DIRECT AAYU CODE EXECUTION (e.g. a = 7, sqrt(144), print("hello"))
    const directRes = AayuRunner.run(cmd, { virtualFiles: files });
    let outText = directRes.stdout;
    if (directRes.returnedValue !== undefined && directRes.returnedValue !== null && !directRes.stdout) {
      outText = `=> ${typeof directRes.returnedValue === 'object' ? JSON.stringify(directRes.returnedValue) : String(directRes.returnedValue)}\n`;
    }
    if (!outText && directRes.variablesState && Object.keys(directRes.variablesState).length > 0) {
      const userVars = Object.entries(directRes.variablesState).filter(([k]) => !k.startsWith('__'));
      for (const [k, v] of userVars) {
        outText += `${k} = ${typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}\n`;
      }
    }
    if (directRes.stderr) outText += `\nError:\n${directRes.stderr}`;

    setTerminalLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        command: cmd,
        output: outText || '[Process finished with exit code 0]',
        isError: !directRes.success,
      },
    ]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    executeCommand(inputVal);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
    }
  };

  const registeredRoutes = result?.registeredRoutes || [];
  const dbState = result?.databaseState || {};
  const uiTree = result?.uiTree;
  const mermaidGraph = result?.mermaidGraph || '';
  const disassembly = result?.compilation?.disassembly || '';
  const projectId = activeProject?.id || 'default';
  const gitRepo = GitService.getRepo(projectId, getFilesMap());
  const gitStatus = GitService.status(projectId, getFilesMap());

  return (
    <div className="fixed inset-0 z-40 bg-[#080b13] text-slate-100 flex flex-col font-mono select-text animate-in fade-in duration-150">
      {/* Top App Bar */}
      <div className="h-14 bg-[#0c101d] border-b border-[#1c2438] px-3 flex items-center justify-between shrink-0 select-none">
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
              <span>Windows PowerShell — AAYU Execution Suite</span>
              <span className="text-[11px] font-normal text-emerald-400">[{fileName}]</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>ARM64 Silicon Native VM v1.5.0</span>
              <span className="text-cyan-400">• Branch: {gitRepo.currentBranch}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 select-none">
          <button
            onClick={() => setTerminalLogs([])}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy Output"
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
      <div className="h-10 bg-[#090d18] border-b border-[#1c2438] px-3 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 select-none">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'console'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>PowerShell</span>
        </button>

        <button
          onClick={() => setActiveTab('git')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'git'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Git ({gitRepo.currentBranch})</span>
          {!gitStatus.clean && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
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
        {/* TAB 1: POWERSHELL INTERACTIVE CONSOLE */}
        {activeTab === 'console' && (
          <div className="space-y-3">
            {terminalLogs.map((log) => (
              <div key={log.id} className="space-y-1">
                {log.command && (
                  <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono select-none">
                    <span className="text-emerald-400">PS D:\INTENT-TO-SILICON&gt;</span>
                    <span className="text-white">{log.command}</span>
                  </div>
                )}
                <pre
                  className={`whitespace-pre-wrap font-mono leading-relaxed pl-2 ${
                    log.isError
                      ? 'text-red-400 bg-red-950/30 p-2 rounded border border-red-900/40'
                      : log.isPowershell
                      ? 'text-cyan-200/90'
                      : 'text-slate-200'
                  }`}
                >
                  {log.output}
                </pre>
              </div>
            ))}

            {isRunning && (
              <div className="flex items-center gap-2 text-emerald-400 py-3 animate-pulse select-none font-mono">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>[AAYU Stack VM] Compiling AST and running on Silicon ARM64 runtime...</span>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        )}

        {/* TAB 2: GIT MANAGEMENT */}
        {activeTab === 'git' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranchIcon className="w-4 h-4 text-cyan-400" />
                  <span>Branch: {gitRepo.currentBranch}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Remote: <span className="text-cyan-400">{gitRepo.remoteUrl}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => executeCommand('git push')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>git push</span>
                </button>
                <button
                  onClick={() => executeCommand('git pull')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>git pull</span>
                </button>
              </div>
            </div>

            {/* Quick Commit bar */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">Quick Git Actions</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => executeCommand('git status')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                >
                  git status
                </button>
                <button
                  onClick={() => executeCommand('git add .')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300"
                >
                  git add .
                </button>
                <button
                  onClick={() => executeCommand('git log')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                >
                  git log
                </button>
                <button
                  onClick={() => executeCommand('git diff')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300"
                >
                  git diff
                </button>
              </div>
            </div>

            {/* Commits log */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commit Log</div>
              {gitRepo.commits.slice().reverse().map((c) => (
                <div key={c.hash} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400">{c.hash}</span>
                    <span className="text-slate-500">{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-white font-medium">{c.message}</div>
                  <div className="text-[10px] text-slate-400">{c.author}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE WEB API TESTER */}
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
                        onClick={() => {
                          const res = AayuRunner.executeRoute(route.chunk, dbState);
                          setApiResponses(prev => ({ ...prev, [reqKey]: { status: res.status, payload: res.payload, durationMs: res.durationMs } }));
                        }}
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

        {/* TAB 4: ARCHITECTURE GRAPH */}
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

            <div className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-3 font-mono">
              <div className="text-xs font-bold text-slate-300">Mermaid Diagram Specification:</div>
              <pre className="text-xs text-purple-300 whitespace-pre-wrap bg-black/60 p-3 rounded-lg border border-purple-900/40">
                {mermaidGraph}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 5: AAYUDB IN-MEMORY DATABASE */}
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
                    <span className="text-[11px] text-slate-400">{(rows as any[]).length} row(s)</span>
                  </div>
                  <pre className="text-xs text-slate-200 bg-black/50 p-2.5 rounded-lg border border-slate-800/60 overflow-x-auto">
                    {JSON.stringify(rows, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: BYTECODE DISASSEMBLY */}
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

        {/* TAB 7: UI PREVIEW */}
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

      {/* Windows PowerShell Command Prompt Input Line */}
      <form
        onSubmit={handleFormSubmit}
        className="h-12 bg-[#0c101d] border-t border-[#1c2438] px-3 flex items-center gap-2 select-none"
      >
        <span className="text-emerald-400 font-mono text-xs sm:text-sm font-bold whitespace-nowrap">
          PS D:\INTENT-TO-SILICON&gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type command ('aayu run', 'git status', 'ls', 'a = 7')..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 outline-none text-xs sm:text-sm font-mono"
        />
        <button
          type="submit"
          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          title="Execute Command"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
