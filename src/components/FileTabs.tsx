/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileCode, Plus, X, Check, Save } from 'lucide-react';
import { ProjectFile } from '../services/workspaceService';

interface FileTabsProps {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCloseFile: (fileId: string) => void;
  onNewFile: () => void;
  isSaved?: boolean;
}

export const FileTabs: React.FC<FileTabsProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCloseFile,
  onNewFile,
  isSaved = true,
}) => {
  return (
    <div className="h-9 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between px-2 overflow-x-auto select-none no-scrollbar shrink-0">
      <div className="flex items-center gap-1 overflow-x-auto max-w-[80%]">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs cursor-pointer border-t-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-slate-100 border-emerald-500 font-medium'
                  : 'bg-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-300 border-transparent'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="font-mono">{file.name}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-opacity"
                  title="Close file"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={onNewFile}
          title="Create new .aayu file"
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">New File</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400 pr-1">
        <span className="flex items-center gap-1 text-slate-400">
          {isSaved ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="text-amber-400">Unsaved</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};
