# AICG — Agent 接入与能力指南

本版支持本机标准 stdio MCP，不绑定 Agent 品牌、执行文件名称或第三方父进程链。使用同一套模型、画布、保存、姿势和结果逻辑。协议支持不等于所有客户端均已实测；实际测试矩阵见交付报告。现有安装、工程和客户端全局配置不自动更改。

## 先授权，再配置客户端

打开设置 → Agent 与 MCP 连接，为你实际使用的客户端建立独立连接。可选择只读、可撤销编辑、完整工作台操作；范围为当前项目或当前素材库。有效期可选直到撤销。允许按需启动是独立选项。旧连接保持原权限，需要完整操作时由使用者明确新建授权，不自动升级。

完整操作包括明确请求的保存、配置、姿势库及既有任务操作；整库保存／备份／恢复引擎作用于整个素材库，因此直接执行需整库授权。只给单一项目时，保存仍须本机用户核对整库摘要。只读角色可按明确请求读取授权项目内容及素材；不要把连接交给不信任的客户端。密钥只能在本机原生密钥窗口输入，Agent 不读取密钥；每次真实生成均须本机人核对接收方、模型、素材、费用风险并批准，MCP 没有批准接口。撤销连接后不能新执行；中断或未知结果先查原回执，不重送。

## 本地客户端

复制工作台生成的 mcpServers 配置，command 是本安装自有的 AICG-MCP.exe，参数 --stdio --connection 与本次连接 ID，cwd 为本安装目录。路径可包含空格，参数逐项保存。不要把 config 贴到公开聊天或交给未授权者；它使用当前 Windows 用户的私有连接凭据，不能防同账户恶意软件。包装器无需登记第三方哈希；不要自行关闭工作台身份校验。

- Codex CLI／桌面：在其 MCP 设置导入本配置。上一安装版完成真 Codex CLI 回归；本候选包内使用原生桥验证工具发现与只读状态，未重跑真 Codex。Codex 桌面形态根据实际客户端是否支持本机 stdio 配置，待单独验证。
- Claude Code：本地 stdio 可用 `claude mcp add --transport stdio aicg -- "INSTALL/tools/AICG-MCP.exe" --stdio --connection CONNECTION-ID`；用户本人选择配置范围。本次 Claude Code 的会话尝试未成功进入 MCP 工具调用，具体原因尚未确认。
- 其他支持本地标准 stdio 的 Agent：导入同一 command/args/cwd。平台声称支持 MCP 不代表其每种传输和工具授权方式都兼容。

## 工具使用路线

1. `aicg_workbench_status` / `aicg_workbench_open` 发现或按授权打开应用；`aicg_project_list/create/open` 管理项目。读回实际 projectId/graphId/appContextId，不猜 ID。
2. `session_info` / `scope_select` 取得当前授权；`canvas_context_read` 读已套用但未保存画布。deferredFields 使用 `canvas_context_field` 补读，分页后再修改。未套用草稿独立，不能自动保存或覆盖。
3. `canvas_context_execute` 修改文字、提示词、位置、节点、连线、批量解除、任务模型、图片／视频选择；`canvas_context_undo` 撤销。引用绑定 assetNodeId/mediaVersionId/contentSha256；图片、角色、顺序与模式必须一致。不要解析提示词文字来偷偷覆盖参数。
4. `canvas_task_models` 读当前任务真正可选的模型／连接／地区／能力；`task_model` 与 image_selection/video_selection/provider_selection 写回同一任务状态。五种视频入口为文字、首帧、首尾、多参考、参考影片；编辑／延长是参考影片内不同合同操作。只开放已选模型实际支持的参数。
5. `canvas_video_capabilities/prepare/status` 保留选定 BytePlus 视频正式五模式原生确认。新增通用 `canvas_workbench_catalog` 分页列出其他完整操作；只读操作可用 `canvas_workbench_read`，其中 media.preview 返回标准 MCP PNG 图像预览（派生缩图），media.read 分页返回经过校验的原始素材字节；`canvas_workbench_call` 按 action 调用，需最新 scope/projectId/graphId/snapshotId/requestId/input。
6. `generation.preview` 只用已套用的任务模型、统一提示词、参数及选材，支持既有 BytePlus 图片与各已适配 Provider 子集；MCP 回精简摘要，完整摘要留本机。`generation.submit` 才请求原生真人确认，不接受批准旗标、URL 或 Key。`generation.history/recover/stop` 只处理原任务；恢复不新 POST，停止等待不保证云端取消或退款。
7. `canvas_material_choose` 由用户本机选图；上传分块／import_uploads、已有批量导入能力用于明确指定素材，不等于向生成商公开上传。真实本地影片上传／合法 GetAsset 临时 HTTPS 路径须按本机配置、原生分享确认和所选官方合同；不暗选地域、存储桶或付费目的地。直接 asset:// carrier 不应被猜造。
8. `canvas_studio_read/execute/undo/render/render_status` 管理人物（4 人）、关节、位置、相机、灯光与本地示例图导出。`pose.capture` 可将当前人物姿势独立保存到姿势库；`pose.list/save/receipt` 保留读写和原回执。套用用 person.update 的 pose，不能改人物根位置、相机或灯光来冒充同一姿势；库更新不回写已套用快照。
9. `result_view/result_accept` 单独指定结果版本；`result.reveal` 只打开经过校验的明确本地文件位置。排序用 task_video_order；严格合并读当前成功结果，保持音轨，不偷偷转码／配乐／新建成片框。`canvas_strict_merge_*` 负责开始、状态、原生另存；旧 composition.* 操作仍保留，不能把旧后制自动转码当严格拼接。
10. `canvas_library_prepare/execute` 明确保存、备份或恢复新副本；全库完整操作可消费自己的明确保存意图，其他授权须原生一次确认。恢复不覆盖原库、不自动切副本、不生成。原图、旧结果、任务历史均保留。
11. config.read/template/save 是非秘密模型连接管理；credential.open 仅打开本地密钥输入窗，credential.status 仅状态。Agent 连接创建/撤销、付费批准、密钥明文不在工具内。

请求示例（先用真实回传填大写占位符）：
```json
{"scope":"SCOPE","projectId":"PROJECT-ID","graphId":"GRAPH-ID","snapshotId":"SNAPSHOT-ID","requestId":"REQUEST-ID","action":"generation.preview","input":{"nodeId":"TASK-NODE-ID"}}
```
```json
{"scope":"SCOPE","projectId":"PROJECT-ID","graphId":"GRAPH-ID","snapshotId":"SNAPSHOT-ID","requestId":"NEW-REQUEST-ID","action":"pose.capture","input":{"studioId":"STUDIO-ID","personId":"PERSON-ID","expectedSceneRevision":1,"name":"自定义姿势"}}
```
每个写意图用独立 requestId；重发同 ID 只能查原回执，同 ID 不得换输入。遇断线、ACK_UNKNOWN、outcome-unknown，不换 ID 自动重做。因权限／作用域／版本拒绝时先读真实状态。不要修改客户端批准政策来伪造用户批准。

## 验证范围

- [Codex MCP](https://developers.openai.com/codex/mcp)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp)
- [MCP stdio 规范](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio)

当前客户端证据见 CLIENT-MATRIX.md。支持标准 stdio 的本机 CLI 可尝试相同配置，安全授权取决于所选项目和本人批准。单独的云端连接器不能运行本机 stdio 程序，本版本的 MCP 接入范围是本机。真实生成依赖使用者本人配置供应商，并在原生窗口确认。
