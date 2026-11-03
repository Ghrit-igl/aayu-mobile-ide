/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Local Workspace & Project File System Manager
 * Preserves user projects across sessions and application updates.
 */

import JSZip from 'jszip';

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  lastModified: number;
}

export interface UserProject {
  id: string;
  name: string;
  description: string;
  activeFileId: string;
  files: ProjectFile[];
  createdAt: number;
  lastOpenedAt: number;
}

const DEFAULT_PROJECT_CODE = `// AAYU Intent-to-Silicon Script
let greeting = "Hello from AAYU!"
println(greeting)

fn add(a, b) {
    return a + b
}

let result = add(10, 25)
println("Result:", result)
`;

export class WorkspaceService {
  private static STORAGE_KEY = 'aayu_mobile_ide_workspace_v1';
  private static memoryStore: Record<string, string> = {};

  private static getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        // fallback
      }
    }
    return this.memoryStore[key] || null;
  }

  private static setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // fallback
      }
    }
    this.memoryStore[key] = value;
  }

  static getProjects(): UserProject[] {
    const raw = this.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }

    // Default clean starter workspace (Production ready)
    const defaultProject: UserProject = {
      id: 'proj-starter',
      name: 'Default Workspace',
      description: 'Official AAYU Workspace — Intent to Silicon',
      activeFileId: 'file-main',
      files: [
        {
          id: 'file-main',
          name: 'main.aayu',
          content: DEFAULT_PROJECT_CODE,
          lastModified: Date.now(),
        },
      ],
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
    };

    const initial = [defaultProject];
    this.saveProjects(initial);
    return initial;
  }

  static saveProjects(projects: UserProject[]): void {
    this.setItem(this.STORAGE_KEY, JSON.stringify(projects));
  }

  static getActiveProject(): UserProject {
    const projects = this.getProjects();
    const sorted = [...projects].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    return sorted[0];
  }

  static updateFileContent(projectId: string, fileId: string, content: string): void {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const file = proj.files.find(f => f.id === fileId);
    if (file) {
      file.content = content;
      file.lastModified = Date.now();
      proj.lastOpenedAt = Date.now();
      this.saveProjects(projects);
    }
  }

  static addFile(projectId: string, fileName: string, initialContent = ''): ProjectFile | null {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return null;

    let finalName = fileName.trim();
    if (!finalName.endsWith('.aayu')) {
      finalName += '.aayu';
    }

    const newFile: ProjectFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      content: initialContent || `// ${finalName}\nprintln("File ${finalName} initialized.")\n`,
      lastModified: Date.now(),
    };

    proj.files.push(newFile);
    proj.activeFileId = newFile.id;
    proj.lastOpenedAt = Date.now();
    this.saveProjects(projects);
    return newFile;
  }

  static deleteFile(projectId: string, fileId: string): boolean {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj || proj.files.length <= 1) return false; // don't delete last file

    proj.files = proj.files.filter(f => f.id !== fileId);
    if (proj.activeFileId === fileId) {
      proj.activeFileId = proj.files[0].id;
    }
    this.saveProjects(projects);
    return true;
  }

  static renameFile(projectId: string, fileId: string, newName: string): boolean {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return false;
    const file = proj.files.find(f => f.id === fileId);
    if (!file) return false;

    let finalName = newName.trim();
    if (!finalName.endsWith('.aayu')) finalName += '.aayu';
    file.name = finalName;
    file.lastModified = Date.now();
    this.saveProjects(projects);
    return true;
  }

  static duplicateFile(projectId: string, fileId: string): ProjectFile | null {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return null;
    const file = proj.files.find(f => f.id === fileId);
    if (!file) return null;

    const baseName = file.name.replace(/\.aayu$/, '');
    const copyName = `${baseName}_copy.aayu`;
    return this.addFile(projectId, copyName, file.content);
  }

  static downloadFile(file: ProjectFile): void {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.endsWith('.aayu') ? file.name : `${file.name}.aayu`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async exportProjectZip(projectId: string): Promise<void> {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const zip = new JSZip();
    const folderName = proj.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = zip.folder(folderName) || zip;

    for (const f of proj.files) {
      folder.file(f.name, f.content);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static createProject(name: string, description = ''): UserProject {
    const projects = this.getProjects();
    const newProj: UserProject = {
      id: `proj-${Date.now()}`,
      name: name.trim() || 'Untitled Project',
      description,
      activeFileId: 'file-main',
      files: [
        {
          id: 'file-main',
          name: 'main.aayu',
          content: `// Project: ${name}\nprintln("Welcome to ${name}!")\n`,
          lastModified: Date.now(),
        },
      ],
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
    projects.unshift(newProj);
    this.saveProjects(projects);
    return newProj;
  }

  static syncFiles(projectId: string, filesMap: Record<string, string>): void {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    for (const [name, content] of Object.entries(filesMap)) {
      const existing = proj.files.find(f => f.name === name);
      if (existing) {
        existing.content = content;
        existing.lastModified = Date.now();
      } else {
        proj.files.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          content,
          lastModified: Date.now(),
        });
      }
    }
    proj.lastOpenedAt = Date.now();
    this.saveProjects(projects);
  }

  static deleteProject(projectId: string): boolean {
    const projects = this.getProjects();
    if (projects.length <= 1) return false; // keep at least 1 project
    const filtered = projects.filter(p => p.id !== projectId);
    this.saveProjects(filtered);
    return true;
  }
}
