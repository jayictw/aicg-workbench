# 开始使用 AICG

1. 解压安装包，先看依赖检查，再运行安装脚本。保留默认独立资料目录，不覆盖旧版或原资料。应用自带 Electron 等自身组件；FFmpeg 等第三方工具需用户按 DEPENDENCIES 说明自行安装，缺失时本地画布仍可打开，受影响功能有明确提示，不暗中下载。
2. 启动工作台。先建立测试项目、导入一张自己的测试图；不要把正式资料、Key 或真实项目交给不信任的 Agent。
3. 设置 → 模型连接：用户本人配置模型／Endpoint；Key 只在本机原生窗口输入。我们没有执行真付费生成测试。生成时核对接收方、素材和费用风险，再由人批准。
4. 设置 → Agent 与 MCP 连接：为实际使用的客户端建立连接，选权限和范围。要操作完整功能可选完整工作台操作；整库保存需整库授权，付费确认仍独立。
5. 用运行在同一台 Windows 电脑上的 CLI，填入工作台生成的 stdio 配置。详情见 MCP-CLIENT-GUIDE.zh-CN.md。
6. 把包内 AGENT-GUIDE.zh-CN.md 交给 Agent，先要求它读状态／测试项目／未保存画布，再做一笔提示词修改、读回、撤销。不要先生成或传正式图片。需要完整流程时再导入合成素材、配置任务、由真人确认实际调用（开发 Mock 证据不表示设置中可新增 Mock 平台）、保存、排序及本地合并。
7. 卸载程序与删除资料分开。先备份；保留资料即可重装重开。不必清空工程或重新安装才能检查外部依赖。

此包是供用户安装使用并验收的版本；实际测试与限制见 VERIFICATION.md。

## 安装命令与外部工具

在解压目录打开 Windows PowerShell（系统 5.1 可用）：

```powershell
.\INSTALL.ps1 -PackageRoot "$PWD" -InstallRoot "$env:LOCALAPPDATA\Programs\AICG Workbench MCP" -DataRoot "$env:LOCALAPPDATA\AICG Workbench MCP"
```

可改为自己的两个独立绝对路径。首次安装请选择空目录；旧版请先备份并正常关闭，保留原资料。安装后运行程序目录中的 `START-AICG.cmd`。若系统策略阻止脚本，先交由本机管理员按组织政策处理；本指南不要求关闭安全策略。

安装包内的 `DEPENDENCIES.md` 列出实际最低版本及官方来源。运行 `CHECK-DEPENDENCIES.ps1` 查看缺失；自行安装 FFmpeg/ffprobe 后可执行：

```powershell
.\CHECK-DEPENDENCIES.ps1 -Configure -FFmpegPath "C:\Tools\ffmpeg\bin\ffmpeg.exe" -FFprobePath "C:\Tools\ffmpeg\bin\ffprobe.exe"
```

路径是示例，不会自动下载。没有 Codex、Node 或 PowerShell 7 也可使用本地工作台和自有 MCP 桥；客户端自行安装。Python 仅影响说明中列出的旧媒体路径。未配置工具时看检查结果，不必重装应用。

卸载前正常关闭应用，在程序目录运行 `REMOVE-AICG.ps1`，资料目录保留；需要彻底删除资料时由使用者另行备份及处理。不要删除旧工程来解决接入错误。
