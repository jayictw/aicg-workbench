# 从源码构建 AICG Workbench

[English](BUILDING.en.md)

## 准备

使用 Windows x64、Node.js 22.12+（22.x）或 24.x、Python 3.11+，以及 Windows .NET Framework x64 C# 编译器。本次验证使用 Node 24.13.1、Python 3.12.14。这些是构建工具，不会作为外部依赖捆绑进应用。

从 [Electron 官方发行页](https://github.com/electron/electron/releases/tag/v45.0.0) 取得 **45.0.0 win32-x64** 并解压到源码目录之外。封装器按 `tools/electron-runtime.json` 核对 20 个必要运行文件，包含 Electron 和 Chromium 原授权文件；仅封装英文和简中语言包，不自动下载。

## 构建和封装

在独立源码目录运行：

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd run build
npm.cmd test
powershell.exe -NoProfile -File .\tools\build-mcp-bridge.ps1
python .\tests\test-portable-package.py
python .\tools\build-windows-package.py --electron-dir C:\BuildTools\electron-v45.0.0-win32-x64 --output ..\aicg-package --execution-mode user-native
```

输出必须是源码之外的新目录。封装器根据本次编译的原生桥、Electron 和程序入口生成 MCP 哈希清单，使用已公开且固定的 V3 保护策略，不再依赖开发者旧电脑路径或私有证明文件。不捆绑 Node、Python、PowerShell 7、FFmpeg 或 Agent 客户端；Electron 是应用自身运行组件。

## 安装与检查

下面的程序和资料路径必须是两个独立新目录，不能指向既有工程：

```powershell
powershell.exe -NoProfile -File ..\aicg-package\INSTALL.ps1 -PackageRoot "$((Resolve-Path ..\aicg-package).Path)" -InstallRoot "$env:LOCALAPPDATA\Programs\AICG Source Build" -DataRoot "$env:LOCALAPPDATA\AICG Source Build Data"
& "$env:LOCALAPPDATA\Programs\AICG Source Build\START-AICG.cmd"
```

启动后在「Agent 与 MCP 连接」授权同机客户端。先用合成项目验证，不输入真实 Key、不传私人素材、不启动付费生成。

## 实测范围

已验证前端与领域构建、TypeScript、56 项合成测试（1 项媒体测试跳过）、原生桥编译、新目录安装、隐藏 Electron 启动及原生 stdio MCP 状态和工具发现。封装测试包含输出目录边界、保护策略、不捆绑外部工具与原生确认保留。这不是人工前台 GUI 或各品牌 Agent 验收。

本机尝试 fresh npm ci 时，官方 npm registry 返回 ECONNREFUSED。成功构建使用了锁文件完全相同的既有依赖树，不冒称全新在线安装成功。全新依赖下载、干净 Windows 机器、签名、真供应商与真实 Stable Diffusion 生成仍未验证。包未签名，不承诺逐字节可复现构建。
