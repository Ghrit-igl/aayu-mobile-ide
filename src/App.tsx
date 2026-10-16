/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official AAYU Mobile IDE
 * Fullscreen, responsive Android coding workspace with authentic AAYU logo (Intent to Silicon),
 * AAYU top bar, advanced mobile symbol keyboard with D-pad navigation, floating Run button,
 * and dedicated AAYU Virtual Machine terminal.
 */

import React, { useState, useCallback } from 'react';
import { Play, X } from 'lucide-react';
import { AayuTopBar } from './components/AayuTopBar';
import { AayuDrawer, DrawerAction } from './components/AayuDrawer';
import { AayuTerminal } from './components/AayuTerminal';
import { AayuRulesModal } from './components/AayuRulesModal';
import { AayuEditor } from './components/AayuEditor';
import { EditorTheme } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ProjectExplorer } from './components/ProjectExplorer';
import { TutorialViewer } from './components/TutorialViewer';
import { AuditViewer } from './components/AuditViewer';
import { UpdateCenter } from './components/UpdateCenter';
import { NativeExportModal } from './components/NativeExportModal';
import {
  WorkspaceService,
  UserProject,
  ProjectFile,
} from './services/workspaceService';
import { AayuRunner } from './engine/runner';
import { ExecutionResult } from './engine/types';
import { ExampleProgram } from './data/examples';
import { FileTabs } from './components/FileTabs';
import { GitHubService, GitHubSyncState } from './services/githubService';

export default function App() {
  // Workspace State
  const [projects, setProjects] = useState<UserProject[]>(() => WorkspaceService.getProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => WorkspaceService.getActiveProject().id);
  const [activeFileId, setActiveFileId] = useState<string>(() => WorkspaceService.getActiveProject().activeFileId);

  // Editor Settings State
  const [fontSize, setFontSize] = useState<number>(15);
  const [tabSize, setTabSize] = useState<number>(4);
  const [theme, setTheme] = useState<EditorTheme>('silicon-dark');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Navigation & Modal State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [activeModalView, setActiveModalView] = useState<'samples' | 'tutorials' | 'audit' | 'updates' | null>(null);

  // GitHub Live Synchronization State
  const [githubSync, setGithubSync] = useState<GitHubSyncState>(() => GitHubService.getCachedState());

  // Check GitHub on mount
  React.useEffect(() => {
    GitHubService.checkForUpdates().then((st) => setGithubSync(st));
  }, []);

  const handleCheckGitHub = async () => {
    setGithubSync((prev) => ({ ...prev, status: 'checking' }));
    const st = await GitHubService.checkForUpdates();
    setGithubSync(st);
  };

  const handleRenameFile = (newName: string) => {
    if (!activeProject || !activeFile) return;
    let finalName = newName.trim();
    if (!finalName.endsWith('.aayu')) finalName += '.aayu';
    activeFile.name = finalName;
    WorkspaceService.saveProjects(projects);
    setProjects([...WorkspaceService.getProjects()]);
  };

  const handleNewFilePrompt = () => {
    const name = prompt('Create new .aayu file (e.g. app.aayu):', 'untitled.aayu');
    if (name && name.trim() && activeProject) {
      let finalName = name.trim();
      if (!finalName.endsWith('.aayu')) finalName += '.aayu';
      const newF = WorkspaceService.addFile(
        activeProject.id,
        finalName,
        `// ${finalName}\nprintln("Running ${finalName} on AAYU VM")\n`
      );
      if (newF) {
        setProjects(WorkspaceService.getProjects());
        setActiveFileId(newF.id);
      }
    }
  };

  // Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activeFile = activeProject?.files.find((f) => f.id === activeFileId) || activeProject?.files[0];

  // Helper: virtual files map for multi-file imports
  const getVirtualFilesMap = useCallback(() => {
    const map: Record<string, string> = {};
    if (activeProject) {
      for (const f of activeProject.files) {
        map[f.name] = f.content;
      }
    }
    return map;
  }, [activeProject]);

  // Code change with undo tracking
  const handleCodeChange = (newCode: string) => {
    if (!activeProject || !activeFile) return;

    // Push to undo stack
    setUndoStack((prev) => [activeFile.content, ...prev.slice(0, 30)]);
    setRedoStack([]);

    setIsSaved(false);
    WorkspaceService.updateFileContent(activeProject.id, activeFile.id, newCode);
    setProjects(WorkspaceService.getProjects());

    setTimeout(() => {
      setIsSaved(true);
    }, 500);
  };

  // Undo
  const handleUndo = () => {
    if (undoStack.length === 0 || !activeFile || !activeProject) return;
    const previousCode = undoStack[0];
    const newUndo = undoStack.slice(1);
    setRedoStack((prev) => [activeFile.content, ...prev]);
    setUndoStack(newUndo);

    WorkspaceService.updateFileContent(activeProject.id, activeFile.id, previousCode);
    setProjects(WorkspaceService.getProjects());
  };

  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0 || !activeFile || !activeProject) return;
    const nextCode = redoStack[0];
    const newRedo = redoStack.slice(1);
    setUndoStack((prev) => [activeFile.content, ...prev]);
    setRedoStack(newRedo);

    WorkspaceService.updateFileContent(activeProject.id, activeFile.id, nextCode);
    setProjects(WorkspaceService.getProjects());
  };

  // Execute Code on real AAYU VM and open AAYU Terminal
  const handleRun = () => {
    if (!activeFile) return;
    setIsRunning(true);
    setIsTerminalOpen(true);

    setTimeout(() => {
      const virtualFiles = getVirtualFilesMap();
      const res = AayuRunner.run(activeFile.content, { virtualFiles });
      setExecutionResult(res);
      setIsRunning(false);
    }, 60);
  };

  // Drawer Action Handler
  const handleDrawerAction = (action: DrawerAction) => {
    switch (action) {
      case 'new': {
        const fileName = prompt('Enter new file name (.aayu):', 'script.aayu');
        if (fileName && activeProject) {
          const newF = WorkspaceService.addFile(activeProject.id, fileName);
          if (newF) {
            setProjects(WorkspaceService.getProjects());
            setActiveFileId(newF.id);
          }
        }
        break;
      }
      case 'open':
      case 'samples':
        setActiveModalView('samples');
        break;
      case 'save':
        setIsSaved(true);
        break;
      case 'saveAs': {
        const newName = prompt('Save file as:', activeFile?.name || 'copy.aayu');
        if (newName && activeProject && activeFile) {
          const newF = WorkspaceService.addFile(activeProject.id, newName, activeFile.content);
          if (newF) {
            setProjects(WorkspaceService.getProjects());
            setActiveFileId(newF.id);
          }
        }
        break;
      }
      case 'rules':
        setShowRulesModal(true);
        break;
      case 'tutorials':
        setActiveModalView('tutorials');
        break;
      case 'terminal':
        setIsTerminalOpen(true);
        break;
      case 'updates':
        setActiveModalView('updates');
        break;
      case 'audit':
        setActiveModalView('audit');
        break;
      case 'export':
        setShowExportModal(true);
        break;
      case 'settings':
        setShowSettingsModal(true);
        break;
    }
  };

  // Load Example Program
  const handleLoadExample = (example: ExampleProgram) => {
    const proj = WorkspaceService.createProject(example.title, example.description);
    const mainFile = proj.files[0];
    WorkspaceService.updateFileContent(proj.id, mainFile.id, example.code);

    if (example.virtualFiles) {
      for (const [name, content] of Object.entries(example.virtualFiles)) {
        WorkspaceService.addFile(proj.id, name, content);
      }
    }

    const updated = WorkspaceService.getProjects();
    setProjects(updated);
    setActiveProjectId(proj.id);
    setActiveFileId(mainFile.id);
    setActiveModalView(null);

    // Auto-run example
    setTimeout(() => {
      handleRun();
    }, 150);
  };

  // Load Tutorial Code
  const handleLoadTutorialCode = (code: string) => {
    if (!activeProject || !activeFile) return;
    handleCodeChange(code);
    setActiveModalView(null);
    setShowRulesModal(false);

    setTimeout(() => {
      handleRun();
    }, 150);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#14151b] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Official AAYU Mobile IDE Top Action Bar */}
      <AayuTopBar
        onOpenDrawer={() => setIsDrawerOpen(true)}
        fileName={activeFile?.name || 'main.aayu'}
        isSaved={isSaved}
        onNewFile={handleNewFilePrompt}
        onOpenFile={() => setActiveModalView('samples')}
        onSaveFile={() => setIsSaved(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onOpenSamples={() => setActiveModalView('samples')}
        onOpenTutorials={() => setActiveModalView('tutorials')}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenUpdates={() => setActiveModalView('updates')}
        onOpenAudit={() => setActiveModalView('audit')}
        onOpenExport={() => setShowExportModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onCheckGitHub={handleCheckGitHub}
        githubStatusText={
          githubSync.status === 'update_available'
            ? '⬆ Update Available'
            : githubSync.status === 'checking'
            ? 'Checking GitHub...'
            : `GitHub: ${githubSync.latestCommitSha}`
        }
        onRenameFile={handleRenameFile}
      />

      {/* 2. File Tabs Strip (Quick switch, close, or add files) */}
      <FileTabs
        files={activeProject?.files || []}
        activeFileId={activeFile?.id || ''}
        onSelectFile={(id) => setActiveFileId(id)}
        onCloseFile={(id) => {
          if (!activeProject) return;
          WorkspaceService.deleteFile(activeProject.id, id);
          const updated = WorkspaceService.getProjects();
          setProjects(updated);
          const p = updated.find((proj) => proj.id === activeProject.id);
          if (p) setActiveFileId(p.activeFileId);
        }}
        onNewFile={handleNewFilePrompt}
        isSaved={isSaved}
      />

      {/* 3. Fullscreen Editor Area (Pure AAYU Mobile IDE) */}
      <main className="flex-1 overflow-hidden relative">
        <AayuEditor
          code={activeFile?.content || ''}
          onChange={handleCodeChange}
          theme={theme}
          fontSize={fontSize}
          tabSize={tabSize}
          showSearch={showSearch}
          onToggleSearch={() => setShowSearch(!showSearch)}
          errorLine={executionResult?.error?.line}
          errorCol={executionResult?.error?.column}
        />

        {/* 4. Iconic Floating Action Button (FAB Run Button) */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          title="Run AAYU Program"
          className="absolute bottom-14 right-5 sm:bottom-16 sm:right-7 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all z-30"
        >
          <Play className={`w-6 h-6 fill-current ml-0.5 ${isRunning ? 'animate-pulse' : ''}`} />
        </button>
      </main>

      {/* 5. Left Sliding Drawer (AAYU Navigation) */}
      <AayuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAction={handleDrawerAction}
        activeFileName={activeFile?.name || 'main.aayu'}
      />

      {/* 6. Dedicated Fullscreen Terminal (AAYU Execution Screen) */}
      <AayuTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        fileName={activeFile?.name || 'main.aayu'}
        result={executionResult}
        isRunning={isRunning}
        onSendStdin={(input) => {
          if (!activeFile) return;
          setIsRunning(true);
          const res = AayuRunner.run(activeFile.content, {
            stdin: input,
            virtualFiles: getVirtualFilesMap(),
          });
          setExecutionResult(res);
          setIsRunning(false);
        }}
      />

      {/* 7. Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        theme={theme}
        onThemeChange={setTheme}
        tabSize={tabSize}
        onTabSizeChange={setTabSize}
      />

      {/* 8. AAYU Language Rules & Specification Modal */}
      <AayuRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        onTryCode={handleLoadTutorialCode}
      />

      {/* 9. Secondary Panels Modal View (Samples, Tutorials, Updates, Audit) */}
      {activeModalView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-xs select-none animate-in fade-in">
          <div className="w-full max-w-4xl h-[90vh] bg-[#14151b] border border-[#272935] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="h-12 px-4 bg-[#181922] border-b border-[#272935] flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                {activeModalView === 'samples' && 'Projects & Samples Gallery'}
                {activeModalView === 'tutorials' && 'Zero-to-Silicon Curriculum'}
                {activeModalView === 'updates' && 'Engine Updates & Release Pipeline'}
                {activeModalView === 'audit' && 'Repository Audit (Phase 1 & 2)'}
              </span>
              <button
                onClick={() => setActiveModalView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden">
              {activeModalView === 'samples' && (
                <ProjectExplorer
                  projects={projects}
                  activeProject={activeProject}
                  onSelectProject={(id) => {
                    setActiveProjectId(id);
                    setActiveModalView(null);
                  }}
                  onSelectFile={(id) => {
                    setActiveFileId(id);
                    setActiveModalView(null);
                  }}
                  onCreateProject={(name) => {
                    const p = WorkspaceService.createProject(name);
                    setProjects(WorkspaceService.getProjects());
                    setActiveProjectId(p.id);
                    setActiveFileId(p.activeFileId);
                    setActiveModalView(null);
                  }}
                  onCreateFile={(name) => {
                    if (!activeProject) return;
                    const f = WorkspaceService.addFile(activeProject.id, name);
                    if (f) {
                      setProjects(WorkspaceService.getProjects());
                      setActiveFileId(f.id);
                      setActiveModalView(null);
                    }
                  }}
                  onDeleteFile={(id) => {
                    if (!activeProject) return;
                    WorkspaceService.deleteFile(activeProject.id, id);
                    setProjects(WorkspaceService.getProjects());
                  }}
                  onLoadExample={handleLoadExample}
                />
              )}

              {activeModalView === 'tutorials' && (
                <TutorialViewer onLoadAndRunCode={handleLoadTutorialCode} />
              )}

              {activeModalView === 'updates' && <UpdateCenter />}

              {activeModalView === 'audit' && <AuditViewer />}
            </div>
          </div>
        </div>
      )}

      {/* 10. Export Native Android Studio Project Modal */}
      <NativeExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
