# 外部依赖与重新检查

本包只包含应用自身 Electron/React 组件及自有 AICG-MCP.exe，不含 Codex、Claude、Node、PowerShell 7、FFmpeg、ffprobe 或 Python 安装器；不自动下载软件。

- Windows x64；自有桥使用系统 .NET Framework 4.6+。安装脚本使用系统 Windows PowerShell 5.1；工作台与自有 stdio 桥不需要 Node/PowerShell 7/Codex。系统组件缺失按微软／组织政策由用户自行安装。
- 视频探测、解码、渲染和合并需要 FFmpeg 与 ffprobe 6+，选择匹配版本；FFmpeg 需 libx264、aac 编码器以及 h264/aac/png/mjpeg/webp/mp3/pcm_s16le 解码能力。官方入口 https://ffmpeg.org/download.html 。
- Python 3.11+ 供保留的旧媒体校验路径使用；官方入口 https://www.python.org/downloads/windows/ 。缺失时检查结果会说明受影响路径，不影响本地画布或强制安装 Codex。
- Agent 是用户自行选择的软件；已有兼容客户端复用其正常安装和账号。不根据 PATH 自动信任第三方程序，不写全局 MCP 或创建新凭据。Codex https://developers.openai.com/codex/ ，Claude Code https://code.claude.com/docs/en/setup ，Grok Build https://docs.x.ai/build/ 。

在安装后的程序目录运行 CHECK-DEPENDENCIES.ps1 查看状态；自行安装媒体工具后运行：

```powershell
.\CHECK-DEPENDENCIES.ps1 -Configure -FFmpegPath "C:\Tools\ffmpeg\bin\ffmpeg.exe" -FFprobePath "C:\Tools\ffmpeg\bin\ffprobe.exe"
```

需要旧媒体 Python 路径时另加 -PythonPath "C:\Tools\Python\python.exe"。这里全部路径是示例，使用本人选择的实际路径。检查器探测版本／能力并固定该安装选择的字节；工具升级后重新检查配置即可，不必重装工作台。Node 22+/PowerShell 7.4+ 的参数仍保留给历史路径，不是当前自有桥硬前置。

没有 Codex 的机器仍可启动和使用本地工作台；缺少媒体工具时相应处理会明确拒绝，安装并重新检查后继续。离线时不会隐藏下载，也不会把未安装依赖冒充已配置。
