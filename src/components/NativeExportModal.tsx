/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode,
  Check,
  Copy,
  FolderArchive,
  Layers,
  Smartphone,
  Cpu,
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES, NativeFile } from '../android/nativeScaffold';

interface NativeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NativeExportModal: React.FC<NativeExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<NativeFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all Android Studio project files
      for (const file of ANDROID_PROJECT_FILES) {
        zip.file(`aayu-android-ide/${file.path}`, file.content);
      }

      // Add README.md with build instructions
      const readmeContent = `# AAYU Mobile IDE for Android (Kotlin + Jetpack Compose + Rust NDK)

Built for Intent-to-Silicon: https://intent-to-silicon.vercel.app/docs
Repository: https://github.com/Minato95-ayu/INTENT-TO-SILICON

## Quick Start in Android Studio

1. Open Android Studio (Hedgehog / Iguana / Jellyfish or newer).
2. Select **Open Project** and choose the \`aayu-android-ide\` folder.
3. Ensure Android NDK r26b or newer is installed via SDK Manager.
4. Build Rust engine static library:
   \`\`\`bash
   cd engine
   cargo build --target aarch64-linux-android --release
   \`\`\`
5. Run the app on an Android ARM64 device or emulator:
   \`\`\`bash
   ./gradlew installDebug
   \`\`\`
`;
      zip.file('aayu-android-ide/README.md', readmeContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aayu-mobile-ide-android-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Native Android Studio Project Source Code
              </h2>
              <p className="text-[11px] text-slate-400">
                Jetpack Compose UI + Material 3 + C++ NDK + Rust Engine C-ABI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Packaging ZIP...' : 'Download Android Studio ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left File Tree, Right Code Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/60 p-2 overflow-y-auto shrink-0 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider">
              Project Structure ({ANDROID_PROJECT_FILES.length})
            </div>
            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = file.path === selectedFile.path;
              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs font-mono flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{file.path.split('/').pop()}</span>
                  <span className="text-[10px] text-slate-500 truncate">{file.path}</span>
                </div>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* File info bar */}
            <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 text-xs font-mono">
              <span className="text-slate-300 font-semibold">{selectedFile.path}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Description banner */}
            <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 text-xs text-slate-400">
              {selectedFile.description}
            </div>

            {/* Code Surface */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed select-text">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
