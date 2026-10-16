# AAYU Mobile IDE for Android (Intent-to-Silicon)

> **Write your intent. Run on mobile silicon.**
> The official Android-optimized development environment for the **AAYU Programming Language** (inspired by Pydroid 3, modernized for 2026).

---

## ✨ Features

- **📱 Zero-Dependency Execution**: Run real AAYU code on your Android device (ARM64-v8a / x86_64) without root or Python.
- **⌨️ Touch-Optimized Symbol Strip**: Dedicated keyboard bar with instant brackets `{ } ( ) [ ]`, math operators, and D-pad cursor arrows.
- **🔄 GitHub Live Auto-Update**: Checks `Minato95-ayu/INTENT-TO-SILICON` repository releases. When new bytecode compiler releases or lessons drop on GitHub, one-click verify & hot-reload keeps your mobile IDE up to date.
- **📦 Android Studio Export**: Scaffold a complete Android Studio project (Kotlin + Jetpack Compose) running native AAYU bytecode in seconds.
- **📚 Interactive Zero-to-Silicon Tutorials**: Built-in 21-chapter course with instant runnable code examples.
- **🎨 Silicon Dark Theme**: High-contrast, battery-friendly dark theme optimized for OLED mobile screens.

---

## 🚀 Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/Minato95-ayu/INTENT-TO-SILICON.git

# Navigate to the mobile IDE directory
cd aayu-mobile-ide

# Install verified dependencies
npm install

# Launch developer server
npm run dev
```

Visit `http://localhost:3000` or open from your Android mobile browser/Termux!

---

## 📱 Running on Android OS

1. **Option 1: Progressive Web App (PWA)**:
   Add to Home Screen in Chrome/Firefox for full-screen offline mobile IDE experience.
2. **Option 2: Termux**:
   Run `sh install-termux.sh` to install local node & rust engine inside Termux.
3. **Option 3: Android APK**:
   Pre-built APK available in `dist/` or export via Android Studio using the built-in Native Export tool.

---

## 🏛️ Architecture

```
┌────────────────────────────────────────────────────────┐
│            AAYU Mobile IDE (React 19 + TypeScript)    │
├──────────────────────────┬─────────────────────────────┤
│  Touch Symbol Bar        │  AAYU Syntax Highlighter    │
│  D-Pad Cursor Nav        │  Multi-Tab Workspace        │
├──────────────────────────┴─────────────────────────────┤
│               Engine & Runtime Bridge                  │
├──────────────────────────┬─────────────────────────────┤
│  Browser Bytecode Sandbox │  Native JNI / Termux Engine │
│  (Lexer / Parser / VM)   │  (ARM64-v8a / Rust VM)      │
├──────────────────────────┴─────────────────────────────┤
│             GitHub Live Sync & Auto-Update             │
│   (Polls Minato95-ayu/INTENT-TO-SILICON releases)      │
└────────────────────────────────────────────────────────┘
```

---

## 📄 License

Apache-2.0 © 2026 Ayush Ghrit Kaushik & AAYU Language Contributors.
