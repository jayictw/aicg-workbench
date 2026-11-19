# Windows V1.0 候选验证说明

- 任务框、来源栏、模型设置和语言入口来自已封存的精简 UI。前期验证使用隔离 Electron 与合成工程，覆盖 1440/900 像素、简中和英文、常用参数、预览取消、保存及重开。已通过 58 项定向回归与构建、类型检查。
- 本包独立检查实际载荷、安装、启动与自有 MCP 桥。早期 LocalCLI 安装的 Codex CLI 写入和撤销记录可作历史参考，当前包的各品牌客户端还须验收。
- 本地 Stable Diffusion 仅验证了受控 HTTP 和合成 PNG 解码、保存；未运行真实模型。自定义未知协议仅能保存为草稿。未加入 Ollama 或 LM Studio 执行能力。
- 未执行真供应商生成、真素材上传、干净 Windows 10/11 机器矩阵或人工前台验收。现场整屏卡住未重现。候选包未签名。

## 公开源码重建验证

新增清洁源码目录构建、原生桥编译、独立安装及隐藏 Electron / stdio MCP 验证：工具发现 31 项，状态 ready/applicationConnected。仅 JSON-RPC 合成测试客户端，非品牌 Agent。在线 npm ci 因 registry ECONNREFUSED 失败；成功构建复用锁文件相同的依赖。源码与安装包的详细复现步骤见 BUILDING 文档。
