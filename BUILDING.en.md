# Build AICG Workbench from source

[中文](BUILDING.zh-CN.md)

## Prerequisites

Windows x64, Node.js 22.12+ (22.x) or 24.x, Python 3.11+, and the Windows .NET Framework x64 C# compiler. Verification used Node 24.13.1 and Python 3.12.14. These are build tools, not bundled application dependencies.

Obtain Electron **45.0.0 win32-x64** from its [official release](https://github.com/electron/electron/releases/tag/v45.0.0) and extract it outside the source checkout. The builder checks all 20 required runtime files against `tools/electron-runtime.json`, including the original Electron and Chromium notices. It ships only English and Simplified Chinese locales. No automatic download occurs.

## Build and package

Run in a clean source checkout:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd run build
npm.cmd test
powershell.exe -NoProfile -File .\tools\build-mcp-bridge.ps1
python .\tests\test-portable-package.py
python .\tools\build-windows-package.py --electron-dir C:\BuildTools\electron-v45.0.0-win32-x64 --output ..\aicg-package --execution-mode user-native
```

Use a new output directory outside the checkout. The builder derives the native MCP hash manifest from this build's bridge, Electron, and entry points. It uses the published immutable V3 protection policy, not private historical machine files. Node, Python, PowerShell 7, FFmpeg, and Agent clients are not bundled. The application includes its own Electron runtime.

## Install and verify

Replace the paths below with new, separate program and data directories. Do not use existing projects as either target.

```powershell
powershell.exe -NoProfile -File ..\aicg-package\INSTALL.ps1 -PackageRoot "$((Resolve-Path ..\aicg-package).Path)" -InstallRoot "$env:LOCALAPPDATA\Programs\AICG Source Build" -DataRoot "$env:LOCALAPPDATA\AICG Source Build Data"
& "$env:LOCALAPPDATA\Programs\AICG Source Build\START-AICG.cmd"
```

Use the installation's Agent / MCP settings to grant a local client access. Never start validation with real keys, private assets, or paid generation.

## What was verified

Frontend/domain build, TypeScript, 56 synthetic tests (one media test skipped), native bridge compilation, new-directory installation, hidden Electron startup, and native stdio MCP status/discovery were verified. Packaging tests cover output boundaries, protection policy, external-tool exclusion, and native confirmation retention. This is not human foreground GUI or branded Agent validation.

A fresh network `npm ci` attempt was blocked by `ECONNREFUSED` from the npm registry in the test environment. The successful build reused an existing dependency tree with an identical lockfile. Fresh online dependency installation, clean Windows systems, signing, live providers, and real Stable Diffusion generation remain unverified. The package is unsigned; builds are not claimed to be byte-for-byte reproducible.
