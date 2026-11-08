<p align="center">
  <img src="logo.svg" alt="AAYU Mobile IDE Banner" width="100%"/>
</p>

<p align="center">
  <a href="https://github.com/Ghrit-igl/aayu-mobile-ide"><img src="https://img.shields.io/badge/Platform-Mobile_Web_%26_Android-emerald?style=for-the-badge&logo=android" alt="Platform"/></a>
  <a href="https://github.com/Ghrit-igl/aayu-mobile-ide"><img src="https://img.shields.io/badge/Stack-React_18_+_Vite_6-cyan?style=for-the-badge&logo=vite" alt="Stack"/></a>
  <a href="https://github.com/Ghrit-igl/aayu-mobile-ide"><img src="https://img.shields.io/badge/Sync-Live_GitHub-blue?style=for-the-badge&logo=github" alt="GitHub Sync"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License"/></a>
</p>

---

## 📱 What is AAYU Mobile IDE?

**AAYU Mobile IDE** is a mobile-first code editor and PWA development environment designed to run natively in mobile browsers, tablets, and Android APK containers.

### Key Capabilities:
1. **Touch-Optimized Code Editor**: High-speed syntax highlighting, line numbering, and bracket-matching tailored for virtual keyboards.
2. **Offline-First PWA Storage**: Service workers cache tutorials, libraries, and user source code locally in IndexedDB / localStorage.
3. **Live GitHub Synchronization**: Direct OAuth integration pulling and pushing commits to GitHub repositories without requiring a desktop git terminal.
4. **Standalone Android Packaging**: Easily wrapped into an Android APK using Capacitor / WebView toolchains.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    TOUCH["Mobile Touch / Gesture Input"] --> UI["React 18 + Tailwind UI Shell"]
    UI --> EDITOR["Syntax Highlighter & Editor Engine"]
    
    subgraph Storage["Offline Local Storage"]
        EDITOR --> IDB["IndexedDB / LocalStorage File Tree"]
        IDB --> SW["PWA Service Worker Cache"]
    end

    subgraph Sync["Cloud Synchronization"]
        EDITOR --> GH["GitHub REST API v3 Integration"]
        GH --> REPO["Remote GitHub Repo Push / Pull"]
    end

    subgraph Output["Execution & Export"]
        EDITOR --> RUNNER["In-Browser WASM / Bytecode Runner"]
        EDITOR --> APK["Native Android APK Package Export"]
    end
```

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
```

---

## 📄 License
MIT License (c) 2026 Ayush Kaushik ([@Ghrit-igl](https://github.com/Ghrit-igl)).