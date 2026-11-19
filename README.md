# AICG Workbench V1.0

中文 · [English](README.en.md)

**Seedance 折扣 API：請聯絡開發者。**

AICG Workbench 是一个 Windows 创作工作台。你可以在同一张画布上整理图片和影片、配置生成任务、布置示例镜头，再排序并合并已保存的影片。也可以授权同一台电脑上的 Agent 协作。

## 安装与上手

1. 从 GitHub Releases 下载 Windows x64 安装包与 `SHA256SUMS.txt`。核对 SHA-256 后解压。
2. 按包内 `START-HERE.zh-CN.md` 安装。首次安装使用两个独立目录存放程序和资料，保留旧工程。
3. 启动 `START-AICG.cmd`。先用一张测试图片建项目、配置任务并保存。
4. 按包内 `DEPENDENCIES.md` 检查媒体工具。视频探测、解码和合并使用自装的 FFmpeg 和 ffprobe。保留的旧媒体校验路径可能需要 Python。安装包不会自动下载工具或模型。

## 现在可以做什么

- 在任务框中编辑提示词、模型及常用参数。在「来源」查看素材、结果和记录。简体中文和英文可在设置切换。
- 使用已适配的图片和视频模型。视频入口包含文字、首帧、首尾帧、多参考和参考影片；可用操作与参数取决于模型、账户和官方接口。
- 使用同机 AUTOMATIC1111 Stable Diffusion WebUI v1.10.1 的 API。配置无认证的 `http://127.0.0.1` 服务，可读取模型列表和执行单张 PNG 文生图。该连接不提供参考图或影片生成。未知协议可以保存为自定义草稿。当前未提供 Ollama 或 LM Studio 执行连接。
- 在摄影棚布置最多四个人偶、调整姿势与相机，并把本地示例图送回画布。影片可按任务排序后直接拼接；片段符合兼容条件时保留音轨。
- 在「Agent 与 MCP 连接」为当前项目或素材库建立、限制及撤销授权。使用运行在同一台 Windows 电脑上的标准 stdio MCP 客户端。包内 `MCP-CLIENT-GUIDE.zh-CN.md` 提供配置步骤，`AGENT-GUIDE.zh-CN.md` 说明工具、实际权限及例子。首次连接可先读状态、修改合成提示词并撤销。

## 生成服务与费用

工作台允许使用自己的生成服务账户。Key 在本机窗口输入。真实生成或上传前请核对模型、接收方、资料和费用，并在工作台批准。供应商收费、可用额度和能力以你的账户与服务协议为准。未知提交先查原任务，避免重复发送。

## 验证范围

Windows 候选的任务 UI 已在隔离 Electron 用合成项目验证。安装和本地启动见包内 `VERIFICATION.md`。真供应商生成、真 Stable Diffusion 生成、干净 Win10/Win11 机器矩阵及部分客户端还待验证。本版提供 Windows 安装包，MCP 接入范围为同机 stdio。历史现场整屏卡死尚未重现，根因未确认。

## 许可

项目原创代码采用 MIT 许可，版权所有 © 2026 Jay C.。第三方组件保留各自许可。

[MIT](LICENSE) · [Third-party notices](THIRD-PARTY-NOTICES.md) · [Build from source](BUILDING.zh-CN.md)
