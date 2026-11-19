// App-owned exact message keys; interpolation values are opaque.
export const messages={
"Codex 未配置": {"zh-CN": "Codex 未配置", "en": "Codex not configured"},
"本地功能可用；需要協作時請按安裝指南接入 Codex": {"zh-CN": "本地功能可用；需要协作时请按安装指南接入 Codex", "en": "Local tools are available. Follow the installation guide to connect Codex when needed."},

"聲音已關閉": {"zh-CN": "声音已关闭", "en": "Audio disabled"},
"聲音選項來源無效": {"zh-CN": "声音选项来源无效", "en": "Invalid audio preference source"},

"生成聲音": {"zh-CN": "生成声音", "en": "Generate audio"},
"BytePlus 聲音選項": {"zh-CN": "BytePlus 声音选项", "en": "BytePlus audio preference"},
"開啟聲音": {"zh-CN": "开启声音", "en": "Audio enabled"},
"靜音影片": {"zh-CN": "静音视频", "en": "Silent video"},

"选择本机图片（最多32张）": {"zh-CN": "选择本机图片（最多32张）", "en": "Choose local images (up to 32)"},
"一次最多提供32张本机图片": {"zh-CN": "一次最多提供32张本机图片", "en": "Provide up to 32 local images at a time."},
"请明确指定1–32份本次图片，不重复来源ID": {"zh-CN": "请明确指定1–32份本次图片，不重复来源ID", "en": "Select 1–32 distinct images from this inbox."},
"一次最多导入32份不同素材": {"zh-CN": "一次最多导入32份不同素材", "en": "Import up to 32 distinct items in one transaction."},
"同一交易最多导入32份不同素材": {"zh-CN": "同一交易最多导入32份不同素材", "en": "One transaction accepts up to 32 distinct items."},
"影片聲音選項必須為開啟或關閉": {"zh-CN": "视频声音选项必须为开启或关闭", "en": "Video audio must be explicitly on or off."},
"影片聲音選項無效，沒有送出": {"zh-CN": "视频声音选项无效，未提交", "en": "Invalid audio option; nothing was submitted."},
"Seedance 2.5 · 4秒 · 480p · 聲音依本次選項 · 水印；首尾幀只支援依首幀比例，多圖參考可選比例": {"zh-CN": "Seedance 2.5 · 4秒 · 480p · 声音按本次选项 · 水印；首尾帧跟随首帧比例，多图参考可选比例", "en": "Seedance 2.5 · 4s · 480p · selected audio · watermark. Frame modes use adaptive ratio; references allow a chosen ratio."},

"請選取目前畫布中不重複的節點；未修改任何位置。":{"zh-CN": "请选择当前画布中不重复的节点；未修改任何位置。", "en": "Select distinct nodes in this canvas. No positions were changed."},

"每张画布 ≤8 MiB；整库提交载荷 ≤32 MiB。素材累计数量与总容量不另设固定配额；仍受磁盘和内存资源约束。单文件探测最多10秒；完整解码按媒体时长加10秒，最多120秒。模型请求另按各自合同校验，不等同本地导入限制。":{"zh-CN": "每张画布 ≤8 MiB；整库提交载荷 ≤32 MiB。素材累计数量与总容量不另设固定配额；仍受磁盘和内存资源约束。单文件探测最多10秒；完整解码按媒体时长加10秒，最多120秒。模型请求另按各自合同校验，不等同本地导入限制。", "en": "Each canvas ≤8 MiB; saved library payload ≤32 MiB. No separate lifetime item or media-byte quota; disk and memory still apply. Probe: 10s. Full decode: media duration plus10s, capped at120s. Model requests use their own contracts."},

"套用影片方式與選材":{"zh-CN": "应用视频方式和素材", "en": "Apply video mode and inputs"},
"有未套用的影片輸入":{"zh-CN": "视频输入尚未应用", "en": "Video input changes are not applied"},
"放棄本次輸入修改":{"zh-CN": "放弃本次输入修改", "en": "Discard input changes"},
"影片方式與固定選材已套用；請手動保存項目。":{"zh-CN": "视频方式和固定素材已应用，请手动保存项目。", "en": "Video mode and fixed inputs applied. Save the project manually."},

"工作台設定":{"zh-CN": "工作台设置", "en": "Settings"},
"關閉設定":{"zh-CN": "关闭设置", "en": "Close settings"},
"外觀":{"zh-CN": "外观", "en": "Appearance"},
"深色":{"zh-CN": "深色", "en": "Dark"},
"淺色":{"zh-CN": "浅色", "en": "Light"},
"模型與連接":{"zh-CN": "模型与连接", "en": "Models and connections"},
"設定只影響此工作台；不會改寫項目、提示詞或既有結果。":{"zh-CN": "设置只影响此工作台，不会改写项目、提示词或已有结果。", "en": "Settings apply to this workbench. Projects, prompts and existing results are unchanged."},
"返回工作台首頁":{"zh-CN": "返回工作台首页", "en": "Go to workbench home"},
"導入本機素材":{"zh-CN": "导入本机素材", "en": "Import local media"},

  "简易模型接入": {
    "zh-CN": "简易模型接入",
    "en": "Quick model setup"
  },
  "把你的 AI 模型加入画布": {
    "zh-CN": "把你的 AI 模型加入画布",
    "en": "Add your AI model to the canvas"
  },
  "选择服务平台，填入调用标识，即可保存配置。": {
    "zh-CN": "选择服务平台，填入调用标识，即可保存配置。",
    "en": "Choose a provider and enter its model identifier to save the configuration."
  },
  "API 服务平台": {
    "zh-CN": "API 服务平台",
    "en": "API provider"
  },
  "请选择平台…": {
    "zh-CN": "请选择平台…",
    "en": "Choose a provider…"
  },
  "官方平台": {
    "zh-CN": "官方平台",
    "en": "Official provider"
  },
  "第三方平台": {
    "zh-CN": "第三方平台",
    "en": "Third-party provider"
  },
  "后续版本支持": {
    "zh-CN": "后续版本支持",
    "en": "Planned support"
  },
  "未知第三方、自定义 API、本地／自架服务暂不开放新建。已有配置和关联保留，可在完整设置中查看；这些路径不能真实调用。": {
    "zh-CN": "未知第三方、自定义 API、本地／自架服务暂不开放新建。已有配置和关联保留，可在完整设置中查看；这些路径不能真实调用。",
    "en": "New custom APIs, unknown third-party providers and local or self-hosted services are unavailable. Existing configurations and links remain available in full settings; these routes cannot make live requests."
  },
  "查看暂未开放平台": {
    "zh-CN": "查看暂未开放平台",
    "en": "View unavailable providers"
  },
  "模型 ID 或 Endpoint ID": {
    "zh-CN": "模型 ID 或 Endpoint ID",
    "en": "Model ID or Endpoint ID"
  },
  "粘贴平台提供的原始标识，不会自动改写": {
    "zh-CN": "粘贴平台提供的原始标识，不会自动改写",
    "en": "Paste the exact identifier from your provider; it will not be rewritten"
  },
  "标识类型": {
    "zh-CN": "标识类型",
    "en": "Identifier type"
  },
  "模型 ID": {
    "zh-CN": "模型 ID",
    "en": "Model ID"
  },
  "Endpoint ID": {
    "zh-CN": "Endpoint ID",
    "en": "Endpoint ID"
  },
  "用于创作": {
    "zh-CN": "用于创作",
    "en": "Use for"
  },
  "视频": {
    "zh-CN": "视频",
    "en": "Video"
  },
  "图片": {
    "zh-CN": "图片",
    "en": "Image"
  },
  "Workspace ID（业务空间ID）": {
    "zh-CN": "Workspace ID（业务空间ID）",
    "en": "Workspace ID"
  },
  "平台提供的 WorkspaceId": {
    "zh-CN": "平台提供的 WorkspaceId",
    "en": "WorkspaceId supplied by the provider"
  },
  "服务地区": {
    "zh-CN": "服务地区",
    "en": "Service region"
  },
  "请选择平台开通的地区…": {
    "zh-CN": "请选择平台开通的地区…",
    "en": "Choose an enabled provider region…"
  },
  "按平台账户选择；列出的地区不保证你的模型或账户已开通。": {
    "zh-CN": "按平台账户选择；列出的地区不保证你的模型或账户已开通。",
    "en": "Choose according to your account. Listed regions do not prove that your account or model has access."
  },
  "保存模型后，在上方「本机凭据管理」打开独立窗口输入 Key。凭据不进入模型配置；真实连接尚未验证。": {
    "zh-CN": "保存模型后，在上方「本机凭据管理」打开独立窗口输入 Key。凭据不进入模型配置；真实连接尚未验证。",
    "en": "After saving the model, open Local credentials above and enter the Key in its separate window. Credentials stay out of model configuration; live connectivity is unverified."
  },
  "BFL 精确协议已适配；Video 仅 t2v Preview。账户和地域权限未验证，真实联网 BLOCK。": {
    "zh-CN": "BFL 精确协议已适配；Video 仅 t2v Preview。账户和地域权限未验证，真实联网 BLOCK。",
    "en": "The exact BFL protocol is adapted; video supports text-to-video Preview only. Account and regional access are unverified; live requests are blocked."
  },
  "MiniMax 官方协议已适配；账户资格与真实API未验证。模式按区域和模型能力显示；音讯开关与第五模式提交未开放。": {
    "zh-CN": "MiniMax 官方协议已适配；账户资格与真实API未验证。模式按区域和模型能力显示；音讯开关与第五模式提交未开放。",
    "en": "The official MiniMax protocol is adapted. Account access and the live API are unverified. Modes depend on region and model; audio controls and reference-video submission are unavailable."
  },
  "Kling 3.0 本批协议已适配；真实 API 与账户权限未验证。只支持本批图片与前三种影片模式；第五模式 UI 留待 P2-01。": {
    "zh-CN": "Kling 3.0 本批协议已适配；真实 API 与账户权限未验证。只支持本批图片与前三种视频模式；第五模式 UI 留待 P2-01。",
    "en": "The selected Kling 3.0 protocol is adapted. Live API and account access are unverified. Only images and the first three video modes are supported in this adaptation."
  },
  "xAI 本批协议已适配；真实 API 与账户权限未验证。模式按模型能力显示，第五模式 UI 留待 P2-01。": {
    "zh-CN": "xAI 本批协议已适配；真实 API 与账户权限未验证。模式按模型能力显示，第五模式 UI 留待 P2-01。",
    "en": "The selected xAI protocol is adapted. Live API and account access are unverified. Modes follow model capabilities; reference-video submission is unavailable."
  },
  "Wan 3.0 本批协议已适配；真实 API 与账户权限未验证。支持前四种现有模式；第五模式 UI 留待 P2-01。": {
    "zh-CN": "Wan 3.0 本批协议已适配；真实 API 与账户权限未验证。支持前四种现有模式；第五模式 UI 留待 P2-01。",
    "en": "The selected Wan 3.0 protocol is adapted. Live API and account access are unverified. The first four adapted video modes are supported; reference-video submission is unavailable."
  },
  "Runway 本批协议已适配；真实 API 与账户权限未验证。支持模式以画布所示能力为准。": {
    "zh-CN": "Runway 本批协议已适配；真实 API 与账户权限未验证。支持模式以画布所示能力为准。",
    "en": "The selected Runway protocol is adapted. Live API and account access are unverified. Available modes follow the capabilities shown on the canvas."
  },
  "保存不联网、不扣费。配置可加入画布，但真实调用尚未适配。能力：UNKNOWN（未确认）。": {
    "zh-CN": "保存不联网、不扣费。配置可加入画布，但真实调用尚未适配。能力：UNKNOWN（未确认）。",
    "en": "Saving stays offline and does not incur charges. The configuration can be selected on the canvas, but live calls are not adapted. Capability: UNKNOWN."
  },
  "平台接入参考 ·": {
    "zh-CN": "平台接入参考 ·",
    "en": "Provider reference ·"
  },
  "根据已收集的官方文档带入连接参数。文档研究不代表账户权限或真实连接成功。": {
    "zh-CN": "根据已收集的官方文档带入连接参数。文档研究不代表账户权限或真实连接成功。",
    "en": "Connection parameters come from archived official documentation. Research does not establish account access or a successful live connection."
  },
  "所选 xAI 模型协议已适配；真实 API 与账户权限未验证。图片采用同步单输出，视频按原 request_id 恢复。": {
    "zh-CN": "所选 xAI 模型协议已适配；真实 API 与账户权限未验证。图片采用同步单输出，视频按原 request_id 恢复。",
    "en": "The selected xAI protocol is adapted; live API and account access are unverified. Images return one synchronous output; video recovery queries the original request_id."
  },
  "所选 Wan 3.0 协议已适配，真实 API 与账户权限未验证；第五模式 UI 留待 P2-01。": {
    "zh-CN": "所选 Wan 3.0 协议已适配，真实 API 与账户权限未验证；第五模式 UI 留待 P2-01。",
    "en": "The selected Wan 3.0 protocol is adapted; live API and account access are unverified. Reference-video submission is unavailable."
  },
  "本批已适配所选 Runway 模型；平台模板原件和历史研究记录保留。": {
    "zh-CN": "本批已适配所选 Runway 模型；平台模板原件和历史研究记录保留。",
    "en": "The selected Runway models are adapted. Original provider templates and research history are preserved."
  },
  "该模型的文档参考": {
    "zh-CN": "该模型的文档参考",
    "en": "Model documentation"
  },
  "仅作参考；真实调用与参数组合仍未验证。": {
    "zh-CN": "仅作参考；真实调用与参数组合仍未验证。",
    "en": "Reference only; live calls and parameter combinations remain unverified."
  },
  "进阶设置": {
    "zh-CN": "进阶设置",
    "en": "Advanced settings"
  },
  "模型显示名称（可选）": {
    "zh-CN": "模型显示名称（可选）",
    "en": "Model display name (optional)"
  },
  "留空时使用原始模型标识": {
    "zh-CN": "留空时使用原始模型标识",
    "en": "Use the original model identifier when blank"
  },
  "连接名称": {
    "zh-CN": "连接名称",
    "en": "Connection name"
  },
  "平台地址（自动配置）": {
    "zh-CN": "平台地址（自动配置）",
    "en": "Provider address (configured automatically)"
  },
  "协议": {
    "zh-CN": "协议",
    "en": "Protocol"
  },
  "协议版本": {
    "zh-CN": "协议版本",
    "en": "Protocol version"
  },
  "认证方式": {
    "zh-CN": "认证方式",
    "en": "Authentication"
  },
  "请求路径（平台配置）": {
    "zh-CN": "请求路径（平台配置）",
    "en": "Request path (provider configuration)"
  },
  "请求映射参考：": {
    "zh-CN": "请求映射参考：",
    "en": "Request mapping reference:"
  },
  "连接参数由已核实模板自动配置，不能改成自定义地址或协议；模型标识原样保存。": {
    "zh-CN": "连接参数由已核实模板自动配置，不能改成自定义地址或协议；模型标识原样保存。",
    "en": "Connection parameters use verified templates. Custom addresses and protocols are unavailable; the model identifier is saved exactly."
  },
  "完整设置流程（七步）": {
    "zh-CN": "完整设置流程（七步）",
    "en": "Full setup (seven steps)"
  },
  "请补充": {
    "zh-CN": "请补充",
    "en": "Complete"
  },
  "工作空间": {
    "zh-CN": "工作空间",
    "en": "workspace"
  },
  "项目 ID": {
    "zh-CN": "项目 ID",
    "en": "project ID"
  },
  "后再保存。": {
    "zh-CN": "后再保存。",
    "en": "before saving."
  },
  "正在带入配置…": {
    "zh-CN": "正在带入配置…",
    "en": "Loading configuration…"
  },
  "正在保存…": {
    "zh-CN": "正在保存…",
    "en": "Saving…"
  },
  "保存模型": {
    "zh-CN": "保存模型",
    "en": "Save model"
  },
  "編排調整草稿": {
    "zh-CN": "编排调整草稿",
    "en": "Composition draft"
  },
  "Agent 本地編排草稿": {
    "zh-CN": "Agent 本地编排草稿",
    "en": "Local Agent composition draft"
  },
  "關閉 Agent 草稿": {
    "zh-CN": "关闭 Agent 草稿",
    "en": "Close Agent draft"
  },
  "把 Agent 的 JSON 草稿貼到這裡，先看差異，再由你確認。只讀／提案沿用同一工程與 C3 驗證；此入口不啟動模型、不連網、不給 Agent 套用、保存或編碼權。": {
    "zh-CN": "把 Agent 的 JSON 草稿贴到这里，先看差异，再由你确认。只读／提案沿用同一工程与 C3 验证；此入口不启动模型、不连网、不给 Agent 应用、保存或编码权。",
    "en": "Paste the Agent JSON draft, review the changes, then confirm. Read and proposal use the same project and C3 validation. This does not start a model, access the network or grant apply, save or encoding rights."
  },
  "目前編排資料（供 Agent 讀取）": {
    "zh-CN": "目前编排资料（供 Agent 读取）",
    "en": "Current composition (for Agent reading)"
  },
  "讀取中…": {
    "zh-CN": "读取中…",
    "en": "Loading…"
  },
  "編排草稿 JSON": {
    "zh-CN": "编排草稿 JSON",
    "en": "Composition draft JSON"
  },
  "Agent 編排草稿 JSON": {
    "zh-CN": "Agent 编排草稿 JSON",
    "en": "Agent composition draft JSON"
  },
  "預覽草稿差異": {
    "zh-CN": "预览草稿差异",
    "en": "Preview draft changes"
  },
  "修改前": {
    "zh-CN": "修改前",
    "en": "Before"
  },
  "修改後": {
    "zh-CN": "修改后",
    "en": "After"
  },
  "已確認套用 · 請手動保存": {
    "zh-CN": "已确认应用 · 请手动保存",
    "en": "Applied · Save the project manually"
  },
  "確認套用此草稿": {
    "zh-CN": "确认应用此草稿",
    "en": "Apply this draft"
  },
  "請先套用既有裁切草稿，再確認 Agent 修改。": {
    "zh-CN": "请先应用既有裁切草稿，再确认 Agent 修改。",
    "en": "Apply the existing trim draft before confirming Agent changes."
  },
  "文字生成视频": {
    "zh-CN": "文字生成视频",
    "en": "Text to video"
  },
  "首帧生成视频": {
    "zh-CN": "首帧生成视频",
    "en": "First frame to video"
  },
  "首尾帧生成视频": {
    "zh-CN": "首尾帧生成视频",
    "en": "First and last frames to video"
  },
  "多参考图生成视频": {
    "zh-CN": "多参考图生成视频",
    "en": "Multiple reference images to video"
  },
  "参考影片生成视频": {
    "zh-CN": "参考视频生成视频",
    "en": "Reference video to video"
  },
  "文字生成图片": {
    "zh-CN": "文字生成图片",
    "en": "Text to image"
  },
  "参考图生成图片": {
    "zh-CN": "参考图生成图片",
    "en": "Reference image to image"
  },
  "服务商": {
    "zh-CN": "服务商",
    "en": "Provider"
  },
  "连接": {
    "zh-CN": "连接",
    "en": "Connection"
  },
  "模型与路由": {
    "zh-CN": "模型与路由",
    "en": "Models and routes"
  },
  "参考能力": {
    "zh-CN": "参考能力",
    "en": "Reference capabilities"
  },
  "参数": {
    "zh-CN": "参数",
    "en": "Parameters"
  },
  "保存": {
    "zh-CN": "保存",
    "en": "Save"
  },
  "画布选用": {
    "zh-CN": "画布选用",
    "en": "Use on canvas"
  },
  "存在未保存编辑。请先保存，或关闭并明确放弃后再切换。": {
    "zh-CN": "存在未保存编辑。请先保存，或关闭并明确放弃后再切换。",
    "en": "There are unsaved edits. Save them, or close and explicitly discard them before switching."
  },
  "操作未完成，输入已保留。请检查配置，或展开错误详情。": {
    "zh-CN": "操作未完成，输入已保留。请检查配置，或展开错误详情。",
    "en": "The action did not finish. Your input is preserved. Check the configuration or expand error details."
  },
  "模型配置已保存；尚未验证真实连接。可以在画布选择模型。": {
    "zh-CN": "模型配置已保存；尚未验证真实连接。可以在画布选择模型。",
    "en": "Model configuration saved. Live connectivity is unverified. You can select the model on the canvas."
  },
  "请先修正 JSON 对象；输入已保留。": {
    "zh-CN": "请先修正 JSON 对象；输入已保留。",
    "en": "Fix the JSON object first. Your input is preserved."
  },
  "请先修正 JSON；输入已保留。": {
    "zh-CN": "请先修正 JSON；输入已保留。",
    "en": "Fix the JSON first. Your input is preserved."
  },
  "采用上层默认": {
    "zh-CN": "采用上层默认",
    "en": "Use the inherited default"
  },
  "· 参考": {
    "zh-CN": "· 参考",
    "en": "· Reference"
  },
  "true": {
    "zh-CN": "true",
    "en": "true"
  },
  "false": {
    "zh-CN": "false",
    "en": "false"
  },
  "类型": {
    "zh-CN": "类型",
    "en": "Type"
  },
  "· 已知范围": {
    "zh-CN": "· 已知范围",
    "en": "· Known range"
  },
  "参数已保存；历史连接和模型字段保持只读，真实调用不可用。": {
    "zh-CN": "参数已保存；历史连接和模型字段保持只读，真实调用不可用。",
    "en": "Parameters saved. Historical connections and model fields remain read-only; live calls are unavailable."
  },
  "· 历史配置（真实调用不可用）": {
    "zh-CN": "· 历史配置（真实调用不可用）",
    "en": "· Historical configuration (live calls unavailable)"
  },
  "新增 AI 模型": {
    "zh-CN": "新增 AI 模型",
    "en": "Add AI model"
  },
  "P1-03 · 独立候选": {
    "zh-CN": "模型设置",
    "en": "Model setup"
  },
  "画布模型与生成": {
    "zh-CN": "画布模型与生成",
    "en": "Canvas models and generation"
  },
  "完整模型设置": {
    "zh-CN": "完整模型设置",
    "en": "Full model settings"
  },
  "关闭模型设置": {
    "zh-CN": "关闭模型设置",
    "en": "Close model settings"
  },
  "关闭": {
    "zh-CN": "关闭",
    "en": "Close"
  },
  "● 有未保存更改": {
    "zh-CN": "● 有未保存更改",
    "en": "● Unsaved changes"
  },
  "配置已同步": {
    "zh-CN": "配置已同步",
    "en": "Configuration synchronized"
  },
  "· 尚未验证真实连接": {
    "zh-CN": "· 尚未验证真实连接",
    "en": "· Live connection unverified"
  },
  "草稿尚未保存。": {
    "zh-CN": "草稿尚未保存。",
    "en": "Draft is not saved."
  },
  "继续编辑": {
    "zh-CN": "继续编辑",
    "en": "Keep editing"
  },
  "放弃未保存更改": {
    "zh-CN": "放弃未保存更改",
    "en": "Discard unsaved changes"
  },
  "错误详情": {
    "zh-CN": "错误详情",
    "en": "Error details"
  },
  "当前版本 r": {
    "zh-CN": "当前版本 r",
    "en": "Current revision r"
  },
  "；编辑内容已保留。修改位置：": {
    "zh-CN": "；编辑内容已保留。修改位置：",
    "en": "; edits preserved. Changed fields:"
  },
  "版本已更新": {
    "zh-CN": "版本已更新",
    "en": "Revision changed"
  },
  "已重读最新版本，编辑内容保留；请比较后再保存。": {
    "zh-CN": "已重读最新版本，编辑内容保留；请比较后再保存。",
    "en": "Latest revision loaded; your edits are preserved. Compare before saving."
  },
  "重读版本并保留编辑": {
    "zh-CN": "重读版本并保留编辑",
    "en": "Reload revision and keep edits"
  },
  "正在读取本地配置…": {
    "zh-CN": "正在读取本地配置…",
    "en": "Reading local configuration…"
  },
  "模型设置视图": {
    "zh-CN": "模型设置视图",
    "en": "Model settings view"
  },
  "简易接入": {
    "zh-CN": "简易接入",
    "en": "Quick setup"
  },
  "完整设置流程": {
    "zh-CN": "完整设置流程",
    "en": "Full setup"
  },
  "七步设置流程": {
    "zh-CN": "七步设置流程",
    "en": "Seven-step setup"
  },
  "本机凭据管理": {
    "zh-CN": "本机凭据管理",
    "en": "Local credentials"
  },
  "本机凭据 · BYOK": {
    "zh-CN": "本机凭据 · BYOK",
    "en": "Local credentials · BYOK"
  },
  "先保存模型配置，再按连接管理 Key；原厂与第三方分别保存。不会发出 API 请求。": {
    "zh-CN": "先保存模型配置，再按连接管理 Key；原厂与第三方分别保存。不会发出 API 请求。",
    "en": "Save the model first, then manage Keys by connection. Official and third-party credentials remain separate. No API request is sent."
  },
  "管理凭据 ·": {
    "zh-CN": "管理凭据 ·",
    "en": "Manage credentials ·"
  },
  "刷新凭据状态": {
    "zh-CN": "刷新凭据状态",
    "en": "Refresh credential status"
  },
  "编辑已保存路由": {
    "zh-CN": "编辑已保存路由",
    "en": "Edit a saved route"
  },
  "选择条目…": {
    "zh-CN": "选择条目…",
    "en": "Choose an item…"
  },
  "请先在简易接入选择已支持平台。": {
    "zh-CN": "请先在简易接入选择已支持平台。",
    "en": "Choose a supported provider in Quick setup first."
  },
  "通过已支持平台新增模型": {
    "zh-CN": "通过已支持平台新增模型",
    "en": "Add a model through a supported provider"
  },
  "1. 新增服务商": {
    "zh-CN": "1. 新增服务商",
    "en": "1. Add provider"
  },
  "名称由你定义；同名条目按稳定 ID 分开。": {
    "zh-CN": "名称由你定义；同名条目按稳定 ID 分开。",
    "en": "Choose your own names. Stable IDs distinguish entries with the same name."
  },
  "复用服务商": {
    "zh-CN": "复用服务商",
    "en": "Reuse provider"
  },
  "新服务商": {
    "zh-CN": "新服务商",
    "en": "New provider"
  },
  "服务商名称": {
    "zh-CN": "服务商名称",
    "en": "Provider name"
  },
  "服务商类型": {
    "zh-CN": "服务商类型",
    "en": "Provider type"
  },
  "· 来源 USER_DECLARED": {
    "zh-CN": "· 来源 USER_DECLARED",
    "en": "· Source USER_DECLARED"
  },
  "2. 建立连接": {
    "zh-CN": "2. 建立连接",
    "en": "2. Create connection"
  },
  "复用当前服务商连接": {
    "zh-CN": "复用当前服务商连接",
    "en": "Reuse this provider connection"
  },
  "新连接": {
    "zh-CN": "新连接",
    "en": "New connection"
  },
  "协议 ID": {
    "zh-CN": "协议 ID",
    "en": "Protocol ID"
  },
  "Region（UNKNOWN 或不适用可原样填写）": {
    "zh-CN": "Region（UNKNOWN 或不适用可原样填写）",
    "en": "Region (UNKNOWN or not applicable may be retained)"
  },
  "认证类型": {
    "zh-CN": "认证类型",
    "en": "Authentication type"
  },
  "Key 通过上方本机凭据管理窗口输入，画布不会接收或回显 Key。OAuth 授权流程、AK/SK 签名与真实协议调用需对应适配，不因保存凭据而开放。": {
    "zh-CN": "Key 通过上方本机凭据管理窗口输入，画布不会接收或回显 Key。OAuth 授权流程、AK/SK 签名与真实协议调用需对应适配，不因保存凭据而开放。",
    "en": "Enter Keys in the separate Local credentials window. The canvas never receives or displays the Key. OAuth, AK/SK signing and live protocols require their own adapters; saving credentials does not enable them."
  },
  "本地配置": {
    "zh-CN": "本地配置",
    "en": "Local configuration"
  },
  "保存时校验": {
    "zh-CN": "保存时校验",
    "en": "Validated when saved"
  },
  "协议适配": {
    "zh-CN": "协议适配",
    "en": "Protocol adaptation"
  },
  "仅 Mock；没有真实传输": {
    "zh-CN": "仅 Mock；没有真实传输",
    "en": "Mock only; no live transport"
  },
  "协议尚未支持真实调用": {
    "zh-CN": "协议尚未支持真实调用",
    "en": "Live protocol calls are unsupported"
  },
  "安全探测": {
    "zh-CN": "安全探测",
    "en": "Safe probe"
  },
  "NOT_RUN；无已核实的不付费探测": {
    "zh-CN": "NOT_RUN；无已核实的不付费探测",
    "en": "NOT_RUN; no verified free probe"
  },
  "账户 / Endpoint 权限": {
    "zh-CN": "账户 / Endpoint 权限",
    "en": "Account / Endpoint access"
  },
  "UNKNOWN": {
    "zh-CN": "未知（未验证）",
    "en": "Unknown (unverified)"
  },
  "本地 HTTP": {
    "zh-CN": "本地 HTTP",
    "en": "Local HTTP"
  },
  "历史草稿保留；后续版本支持，不开放新建": {
    "zh-CN": "历史草稿保留；后续版本支持，不开放新建",
    "en": "Historical draft retained; new creation is unavailable"
  },
  "3. 选择或新增模型与路由": {
    "zh-CN": "3. 选择或新增模型与路由",
    "en": "3. Select or add a model and route"
  },
  "复用当前服务商模型": {
    "zh-CN": "复用当前服务商模型",
    "en": "Reuse this provider model"
  },
  "新模型": {
    "zh-CN": "新模型",
    "en": "New model"
  },
  "模型显示名称": {
    "zh-CN": "模型显示名称",
    "en": "Model display name"
  },
  "媒体类型": {
    "zh-CN": "媒体类型",
    "en": "Media type"
  },
  "原始提供方 ID（未知填 UNKNOWN）": {
    "zh-CN": "原始提供方 ID（未知填 UNKNOWN）",
    "en": "Original provider ID (use UNKNOWN if unknown)"
  },
  "模型版本": {
    "zh-CN": "模型版本",
    "en": "Model version"
  },
  "Canonical model（留空 = null / UNKNOWN）": {
    "zh-CN": "Canonical model（留空 = null / UNKNOWN）",
    "en": "Canonical model (blank = null / UNKNOWN)"
  },
  "Canonical 来源等级": {
    "zh-CN": "Canonical 来源等级",
    "en": "Canonical source level"
  },
  "实际 wire selector 类型": {
    "zh-CN": "实际 wire selector 类型",
    "en": "Actual wire selector type"
  },
  "声明 canonical（可空）": {
    "zh-CN": "声明 canonical（可空）",
    "en": "Declared canonical model (optional)"
  },
  "操作 Endpoint 路径": {
    "zh-CN": "操作 Endpoint 路径",
    "en": "Operation Endpoint path"
  },
  "调用 ID 按原样保存；不匹配官方白名单。Endpoint ID 与路径是独立字段。": {
    "zh-CN": "调用 ID 按原样保存；不匹配官方白名单。Endpoint ID 与路径是独立字段。",
    "en": "The invocation ID is saved exactly, without matching an official allowlist. Endpoint ID and path are separate fields."
  },
  "Model": {
    "zh-CN": "Model",
    "en": "Model"
  },
  "Route": {
    "zh-CN": "Route",
    "en": "Route"
  },
  "4. 查看参考能力": {
    "zh-CN": "4. 查看参考能力",
    "en": "4. Review reference capabilities"
  },
  "参考模板": {
    "zh-CN": "参考模板",
    "en": "Reference template"
  },
  "接入参考不证明协议已适配、账户可用或真实生成成功。Runway 按所选模型显示已核实的官方协议能力；其他未适配协议仍阻断。": {
    "zh-CN": "接入参考不证明协议已适配、账户可用或真实生成成功。Runway 按所选模型显示已核实的官方协议能力；其他未适配协议仍阻断。",
    "en": "A setup reference does not prove protocol adaptation, account access or live generation. Runway shows verified official protocol capabilities for the selected model. Unadapted protocols remain blocked."
  },
  "UNKNOWN 可查看和保存。CONFLICT 列出全部来源；已知限制不能被覆写绕过。": {
    "zh-CN": "UNKNOWN 可查看和保存。CONFLICT 列出全部来源；已知限制不能被覆写绕过。",
    "en": "UNKNOWN can be reviewed and saved. CONFLICT lists every source. Known limits cannot be overridden."
  },
  "5. 修改用户默认参数": {
    "zh-CN": "5. 修改用户默认参数",
    "en": "5. Edit user defaults"
  },
  "用户默认": {
    "zh-CN": "用户默认",
    "en": "User defaults"
  },
  "用户默认参数 JSON": {
    "zh-CN": "用户默认参数 JSON",
    "en": "User defaults JSON"
  },
  "保留非法输入并显示错误；不自动纠正。仅允许 schema 参数；认证、model、headers、批量输出字段禁止。": {
    "zh-CN": "保留非法输入并显示错误；不自动纠正。仅允许 schema 参数；认证、model、headers、批量输出字段禁止。",
    "en": "Invalid input is preserved with an error; it is never corrected automatically. Only schema parameters are allowed. Authentication, model, headers and batch output fields are forbidden."
  },
  "恢复前预览参考值：": {
    "zh-CN": "恢复前预览参考值：",
    "en": "Preview reference values before restoring:"
  },
  "预览参考默认值": {
    "zh-CN": "预览参考默认值",
    "en": "Preview reference defaults"
  },
  "采纳所示参考默认值": {
    "zh-CN": "采纳所示参考默认值",
    "en": "Use these reference defaults"
  },
  "参考模板：": {
    "zh-CN": "参考模板：",
    "en": "Reference template:"
  },
  "当前用户默认：": {
    "zh-CN": "当前用户默认：",
    "en": "Current user defaults:"
  },
  "本次覆写：在第 7 步填写": {
    "zh-CN": "本次覆写：在第 7 步填写",
    "en": "Per-request overrides: enter in step 7"
  },
  "6. 保存非秘密配置": {
    "zh-CN": "6. 保存非秘密配置",
    "en": "6. Save non-secret configuration"
  },
  "历史连接和模型字段只读。仅可按既有合同保存用户默认参数，不会转换连接。": {
    "zh-CN": "历史连接和模型字段只读。仅可按既有合同保存用户默认参数，不会转换连接。",
    "en": "Historical connection and model fields are read-only. Only user defaults allowed by the existing contract can be saved; connections are not converted."
  },
  "仅保存已支持平台的配置；连接参数不可自定义。保存不联网、不生成。": {
    "zh-CN": "仅保存已支持平台的配置；连接参数不可自定义。保存不联网、不生成。",
    "en": "Save configurations for supported providers only. Connection parameters are fixed. Saving stays offline and does not generate media."
  },
  "服务商 / 连接": {
    "zh-CN": "服务商 / 连接",
    "en": "Provider / connection"
  },
  "模型 / selector": {
    "zh-CN": "模型 / selector",
    "en": "Model / selector"
  },
  "Canonical": {
    "zh-CN": "Canonical",
    "en": "Canonical"
  },
  "仅保存传输禁用草稿": {
    "zh-CN": "仅保存传输禁用草稿",
    "en": "Save a transport-disabled draft only"
  },
  "HTTPS 配置校验": {
    "zh-CN": "HTTPS 配置校验",
    "en": "HTTPS configuration validation"
  },
  "保存用户参数（连接只读）": {
    "zh-CN": "保存用户参数（连接只读）",
    "en": "Save parameters (connection read-only)"
  },
  "保存设置": {
    "zh-CN": "保存设置",
    "en": "Save settings"
  },
  "画布选用与单次请求": {
    "zh-CN": "画布选用与单次请求",
    "en": "Canvas selection and single request"
  },
  "新增另一个模型": {
    "zh-CN": "新增另一个模型",
    "en": "Add another model"
  },
  "画布任务": {
    "zh-CN": "画布任务",
    "en": "Canvas task"
  },
  "选择一个任务…": {
    "zh-CN": "选择一个任务…",
    "en": "Choose a task…"
  },
  "AI 模型": {
    "zh-CN": "AI 模型",
    "en": "AI model"
  },
  "画布模型路由": {
    "zh-CN": "画布模型路由",
    "en": "Canvas model route"
  },
  "选择已保存模型…": {
    "zh-CN": "选择已保存模型…",
    "en": "Choose a saved model…"
  },
  "· 本地（未适配）": {
    "zh-CN": "· 本地（未适配）",
    "en": "· Local (not adapted)"
  },
  "历史本地配置：": {
    "zh-CN": "历史本地配置：",
    "en": "Historical local configuration:"
  },
  "— 真实传输未实现，发送禁用。": {
    "zh-CN": "— 真实传输未实现，发送禁用。",
    "en": "— Live transport is unimplemented; sending is disabled."
  },
  "生成模式": {
    "zh-CN": "生成模式",
    "en": "Generation mode"
  },
  "画布选择已保存；只影响新草稿，旧任务快照保留。": {
    "zh-CN": "画布选择已保存；只影响新草稿，旧任务快照保留。",
    "en": "Canvas selection saved. Only new drafts change; historical task snapshots are preserved."
  },
  "保存画布选择": {
    "zh-CN": "保存画布选择",
    "en": "Save canvas selection"
  },
  "参考：": {
    "zh-CN": "参考：",
    "en": "Reference:"
  },
  "· 来源": {
    "zh-CN": "· 来源",
    "en": "· Source"
  },
  "· 修订": {
    "zh-CN": "· 修订",
    "en": "· Revision"
  },
  "本次提示词": {
    "zh-CN": "本次提示词",
    "en": "Prompt for this request"
  },
  "本地已连接图片：": {
    "zh-CN": "本地已连接图片：",
    "en": "Locally connected images:"
  },
  "张": {
    "zh-CN": "张",
    "en": "images"
  },
  "· 版本": {
    "zh-CN": "· 版本",
    "en": "· Version"
  },
  "切换模式保留全部画布连线；下面只选择本次送出的图片。": {
    "zh-CN": "切换模式保留全部画布连线；下面只选择本次送出的图片。",
    "en": "Switching modes preserves canvas links. Select only the images to send in this request below."
  },
  "首帧影片比例自动跟随所选图片。请移除用户默认或本次覆写中的 aspect_ratio；不会发送无效比例参数。": {
    "zh-CN": "首帧视频比例自动跟随所选图片。请移除用户默认或本次覆写中的 aspect_ratio；不会发送无效比例参数。",
    "en": "First-frame video follows the selected image ratio automatically. Remove aspect_ratio from user defaults or request overrides; invalid ratio parameters will not be sent."
  },
  "本次使用图片": {
    "zh-CN": "本次使用图片",
    "en": "Images for this request"
  },
  "首帧图片": {
    "zh-CN": "首帧图片",
    "en": "First-frame image"
  },
  "尾帧图片": {
    "zh-CN": "尾帧图片",
    "en": "Last-frame image"
  },
  "本次首帧": {
    "zh-CN": "本次首帧",
    "en": "First frame for this request"
  },
  "本次尾帧": {
    "zh-CN": "本次尾帧",
    "en": "Last frame for this request"
  },
  "明确选择…": {
    "zh-CN": "明确选择…",
    "en": "Choose explicitly…"
  },
  "该模式不发送图片。": {
    "zh-CN": "该模式不发送图片。",
    "en": "This mode sends no images."
  },
  "不使用 API 首尾角色；提示词提到“首帧”不会切换模式，构图遵循程度未保证。": {
    "zh-CN": "不使用 API 首尾角色；提示词提到“首帧”不会切换模式，构图遵循程度未保证。",
    "en": "API first/last-frame roles are unused. Mentioning “first frame” in a prompt does not change modes. Composition adherence is not guaranteed."
  },
  "本次覆写": {
    "zh-CN": "本次覆写",
    "en": "Request overrides"
  },
  "本次覆写 JSON": {
    "zh-CN": "本次覆写 JSON",
    "en": "Request overrides JSON"
  },
  "最终值 = 所选参考默认 → 用户默认 → 本次覆写。摘要逐字段显示来源；输出数固定为 1。": {
    "zh-CN": "最终值 = 所选参考默认 → 用户默认 → 本次覆写。摘要逐字段显示来源；输出数固定为 1。",
    "en": "Final values = reference defaults → user defaults → request overrides. The summary shows each field source. Output count is fixed at 1."
  },
  "查看单次请求摘要": {
    "zh-CN": "查看单次请求摘要",
    "en": "Review request summary"
  },
  "BytePlus 合同请求摘要": {
    "zh-CN": "BytePlus 合同请求摘要",
    "en": "BytePlus request summary"
  },
  "BFL 单次请求摘要": {
    "zh-CN": "BFL 单次请求摘要",
    "en": "BFL request summary"
  },
  "MiniMax 单次请求摘要": {
    "zh-CN": "MiniMax 单次请求摘要",
    "en": "MiniMax request summary"
  },
  "Kling 单次请求摘要": {
    "zh-CN": "Kling 单次请求摘要",
    "en": "Kling request summary"
  },
  "xAI 单次请求摘要": {
    "zh-CN": "xAI 单次请求摘要",
    "en": "xAI request summary"
  },
  "Wan 单次请求摘要": {
    "zh-CN": "Wan 单次请求摘要",
    "en": "Wan request summary"
  },
  "OpenAI 单次请求摘要": {
    "zh-CN": "OpenAI 单次请求摘要",
    "en": "OpenAI request summary"
  },
  "Gemini 单次请求摘要": {
    "zh-CN": "Gemini 单次请求摘要",
    "en": "Gemini request summary"
  },
  "Runway 单次请求摘要": {
    "zh-CN": "Runway 单次请求摘要",
    "en": "Runway request summary"
  },
  "单次 Mock 请求摘要": {
    "zh-CN": "单次 Mock 请求摘要",
    "en": "Mock request summary"
  },
  "模型": {
    "zh-CN": "模型",
    "en": "Model"
  },
  "本次模式": {
    "zh-CN": "本次模式",
    "en": "Request mode"
  },
  "本次送出": {
    "zh-CN": "本次送出",
    "en": "Send in this request"
  },
  "张图片 · 1 个任务": {
    "zh-CN": "张图片 · 1 个任务",
    "en": "images · 1 task"
  },
  "有效参数与来源": {
    "zh-CN": "有效参数与来源",
    "en": "Effective parameters and sources"
  },
  "费用": {
    "zh-CN": "费用",
    "en": "Cost"
  },
  "账户和地域权限 UNKNOWN；真实联网 BLOCK，不提供预估美元费用。工程 Mock 仍需一次原生确认。": {
    "zh-CN": "账户和地域权限 UNKNOWN；真实联网 BLOCK，不提供预估美元费用。工程 Mock 仍需一次原生确认。",
    "en": "Account and regional access are UNKNOWN; live requests are blocked. No dollar estimate is available. Engineering Mock still requires one native confirmation."
  },
  "费用与账户权限 UNKNOWN；真实 API 未验证。提交需本人原生确认。": {
    "zh-CN": "费用与账户权限 UNKNOWN；真实 API 未验证。提交需本人原生确认。",
    "en": "Cost and account access are UNKNOWN; the live API is unverified. Submission requires your native confirmation."
  },
  "Mock 演示，不扣费；真实调用未进行。": {
    "zh-CN": "Mock 演示，不扣费；真实调用未进行。",
    "en": "Mock demonstration, no charge; no live call was made."
  },
  "技术详情": {
    "zh-CN": "技术详情",
    "en": "Technical details"
  },
  "Mock 回执场景": {
    "zh-CN": "Mock 回执场景",
    "en": "Mock receipt scenario"
  },
  "成功": {
    "zh-CN": "成功",
    "en": "Success"
  },
  "HTTP 403 错误": {
    "zh-CN": "HTTP 403 错误",
    "en": "HTTP 403 error"
  },
  "提交未知": {
    "zh-CN": "提交未知",
    "en": "Submission unknown"
  },
  "继续到 BytePlus 原生确认": {
    "zh-CN": "继续到 BytePlus 原生确认",
    "en": "Continue to BytePlus confirmation"
  },
  "继续到 BFL 原生确认": {
    "zh-CN": "继续到 BFL 原生确认",
    "en": "Continue to BFL confirmation"
  },
  "继续到 MiniMax 原生确认": {
    "zh-CN": "继续到 MiniMax 原生确认",
    "en": "Continue to MiniMax confirmation"
  },
  "继续到 Kling 原生确认": {
    "zh-CN": "继续到 Kling 原生确认",
    "en": "Continue to Kling confirmation"
  },
  "继续到 xAI 原生确认": {
    "zh-CN": "继续到 xAI 原生确认",
    "en": "Continue to xAI confirmation"
  },
  "继续到 Wan 原生确认": {
    "zh-CN": "继续到 Wan 原生确认",
    "en": "Continue to Wan confirmation"
  },
  "继续到 OpenAI 原生确认": {
    "zh-CN": "继续到 OpenAI 原生确认",
    "en": "Continue to OpenAI confirmation"
  },
  "继续到 Gemini 原生确认": {
    "zh-CN": "继续到 Gemini 原生确认",
    "en": "Continue to Gemini confirmation"
  },
  "继续到 Runway 原生确认": {
    "zh-CN": "继续到 Runway 原生确认",
    "en": "Continue to Runway confirmation"
  },
  "确认一次 Mock 任务（不调用 API）": {
    "zh-CN": "确认一次 Mock 任务（不调用 API）",
    "en": "Confirm one Mock task (no API call)"
  },
  "该画布任务的历史配置快照": {
    "zh-CN": "该画布任务的历史配置快照",
    "en": "Historical configuration snapshot for this canvas task"
  },
  "本地结果参考（非远程 task ID）：": {
    "zh-CN": "本地结果参考（非远程 task ID）：",
    "en": "Local result reference (not a remote task ID):"
  },
  "原 taskId：": {
    "zh-CN": "原 taskId：",
    "en": "Original taskId:"
  },
  "未取得，不得重发": {
    "zh-CN": "未取得，不得重发",
    "en": "Not obtained; do not resubmit"
  },
  "· 真实 API": {
    "zh-CN": "· 真实 API",
    "en": "· Live API"
  },
  "查询／恢复原 BFL 任务": {
    "zh-CN": "查询／恢复原 BFL 任务",
    "en": "Query / recover original BFL task"
  },
  "查看原 MiniMax 图片记录（不重发）": {
    "zh-CN": "查看原 MiniMax 图片记录（不重发）",
    "en": "View original MiniMax image record (no resubmission)"
  },
  "查询／恢复原 MiniMax 任务": {
    "zh-CN": "查询／恢复原 MiniMax 任务",
    "en": "Query / recover original MiniMax task"
  },
  "查询／恢复原 Kling 任务": {
    "zh-CN": "查询／恢复原 Kling 任务",
    "en": "Query / recover original Kling task"
  },
  "查看原 xAI 图片记录（不重发）": {
    "zh-CN": "查看原 xAI 图片记录（不重发）",
    "en": "View original xAI image record (no resubmission)"
  },
  "查询／恢复原 xAI 任务": {
    "zh-CN": "查询／恢复原 xAI 任务",
    "en": "Query / recover original xAI task"
  },
  "查询／恢复原 Wan 任务": {
    "zh-CN": "查询／恢复原 Wan 任务",
    "en": "Query / recover original Wan task"
  },
  "查看原 OpenAI 本地记录（不重发）": {
    "zh-CN": "查看原 OpenAI 本地记录（不重发）",
    "en": "View original OpenAI local record (no resubmission)"
  },
  "查询／恢复原 Gemini 任务": {
    "zh-CN": "查询／恢复原 Gemini 任务",
    "en": "Query / recover original Gemini task"
  },
  "查询／恢复原 Runway 任务": {
    "zh-CN": "查询／恢复原 Runway 任务",
    "en": "Query / recover original Runway task"
  },
  "已验证文件：": {
    "zh-CN": "已验证文件：",
    "en": "Verified file:"
  },
  "· SHA256": {
    "zh-CN": "· SHA256",
    "en": "· SHA256"
  },
  "Kling 已验证图片": {
    "zh-CN": "Kling 已验证图片",
    "en": "Kling verified image"
  },
  "Kling 已验证视频": {
    "zh-CN": "Kling 已验证视频",
    "en": "Kling verified video"
  },
  "BFL 已验证图片": {
    "zh-CN": "BFL 已验证图片",
    "en": "BFL verified image"
  },
  "BFL 已验证视频": {
    "zh-CN": "BFL 已验证视频",
    "en": "BFL verified video"
  },
  "MiniMax 已验证图片": {
    "zh-CN": "MiniMax 已验证图片",
    "en": "MiniMax verified image"
  },
  "MiniMax 已验证视频": {
    "zh-CN": "MiniMax 已验证视频",
    "en": "MiniMax verified video"
  },
  "xAI 已验证图片": {
    "zh-CN": "xAI 已验证图片",
    "en": "xAI verified image"
  },
  "xAI 已验证视频": {
    "zh-CN": "xAI 已验证视频",
    "en": "xAI verified video"
  },
  "Wan 已验证视频": {
    "zh-CN": "Wan 已验证视频",
    "en": "Wan verified video"
  },
  "HTTP": {
    "zh-CN": "HTTP",
    "en": "HTTP"
  },
  "未取得": {
    "zh-CN": "未取得",
    "en": "Not obtained"
  },
  "· Provider code": {
    "zh-CN": "· Provider code",
    "en": "· Provider code"
  },
  "· Request ID": {
    "zh-CN": "· Request ID",
    "en": "· Request ID"
  },
  "历史连接配置": {
    "zh-CN": "历史连接配置",
    "en": "Historical connection settings"
  },
  "历史连接配置（只读）": {
    "zh-CN": "历史连接配置（只读）",
    "en": "Historical connection settings (read-only)"
  },
  "保留原始名称、调用标识、修订与关联。未支持路径真实调用不可用；不会删除或转换。": {
    "zh-CN": "保留原始名称、调用标识、修订与关联。未支持路径真实调用不可用；不会删除或转换。",
    "en": "Original names, invocation IDs, revisions and links are preserved. Unsupported routes cannot make live calls; nothing is deleted or converted."
  },
  "（历史，真实调用不可用）": {
    "zh-CN": "（历史，真实调用不可用）",
    "en": "(Historical; live calls unavailable)"
  },
  "（本地，后续版本支持）": {
    "zh-CN": "（本地，后续版本支持）",
    "en": "(Local; planned support)"
  },
  "上一步": {
    "zh-CN": "上一步",
    "en": "Previous"
  },
  "/ 7": {
    "zh-CN": "/ 7",
    "en": "/ 7"
  },
  "下一步": {
    "zh-CN": "下一步",
    "en": "Next"
  },
  "待導入": {
    "zh-CN": "待导入",
    "en": "Ready to import"
  },
  "排隊": {
    "zh-CN": "排队",
    "en": "Queued"
  },
  "檢查中": {
    "zh-CN": "检查中",
    "en": "Checking"
  },
  "安全保存中": {
    "zh-CN": "安全保存中",
    "en": "Saving safely"
  },
  "失敗": {
    "zh-CN": "失败",
    "en": "Failed"
  },
  "已取消": {
    "zh-CN": "已取消",
    "en": "Canceled"
  },
  "重複內容，待確認": {
    "zh-CN": "重复内容，待确认",
    "en": "Duplicate content; confirmation required"
  },
  "原回執未知": {
    "zh-CN": "原回执未知",
    "en": "Original receipt unknown"
  },
  "批量素材導入": {
    "zh-CN": "批量素材导入",
    "en": "Batch media import"
  },
  "單次最多50檔 · 每批5檔 · 同時最多2檔檢查。這是單次導入效能規則，與工程素材總量、模型API限制分開。實際成功仍取決於檔案檢查和目前工程容量，失敗原因逐項顯示。": {
    "zh-CN": "单次最多50档 · 每批5档 · 同时最多2档检查。这是单次导入效能规则，与工程素材总量、模型API限制分开。实际成功仍取决于文件检查和目前工程容量，失败原因逐项显示。",
    "en": "Up to 50 files per import, in batches of 5, with at most 2 checks at once. These are import processing rules, separate from project capacity and model API limits. File validation and remaining project capacity determine success; each failure is reported."
  },
  "每個成功檔案建立獨立框；舊框與畫布視角保持不動。素材保存在工程內，不跟隨外部原檔變動。": {
    "zh-CN": "每个成功文件建立独立框；旧框与画布视角保持不动。素材保存在工程内，不跟随外部原档变动。",
    "en": "Each successful file creates a separate card. Existing cards and the viewport stay in place. Project media remains independent of changes to external originals."
  },
  "· 失敗": {
    "zh-CN": "· 失败",
    "en": "· Failed"
  },
  "· 重複待確認": {
    "zh-CN": "· 重复待确认",
    "en": "· Duplicate confirmation required"
  },
  "· 取消": {
    "zh-CN": "· 取消",
    "en": "· Canceled"
  },
  "· 導入中": {
    "zh-CN": "· 导入中",
    "en": "· Importing"
  },
  "檔案": {
    "zh-CN": "文件",
    "en": "File"
  },
  "結果": {
    "zh-CN": "结果",
    "en": "Result"
  },
  "詳情": {
    "zh-CN": "详情",
    "en": "Details"
  },
  "工程檔名": {
    "zh-CN": "工程文件名",
    "en": "Project filename"
  },
  "SHA256 相同；確認後仍建立獨立新框。": {
    "zh-CN": "SHA256 相同；确认后仍建立独立新框。",
    "en": "Same SHA256. Confirmation still creates an independent card."
  },
  "嘗試": {
    "zh-CN": "尝试",
    "en": "Attempt"
  },
  "次，原紀錄保留": {
    "zh-CN": "次，原纪录保留",
    "en": "times; original records retained"
  },
  "重試失敗項": {
    "zh-CN": "重试失败项",
    "en": "Retry failed items"
  },
  "重試此檔": {
    "zh-CN": "重试此档",
    "en": "Retry this file"
  },
  "查原回執": {
    "zh-CN": "查原回执",
    "en": "Check original receipt"
  },
  "開始導入": {
    "zh-CN": "开始导入",
    "en": "Start import"
  },
  "檔": {
    "zh-CN": "档",
    "en": "files"
  },
  "取消剩餘檔案": {
    "zh-CN": "取消剩余文件",
    "en": "Cancel remaining files"
  },
  "只重試失敗": {
    "zh-CN": "只重试失败",
    "en": "Retry failed only"
  },
  "仍為重複": {
    "zh-CN": "仍为重复",
    "en": "Still duplicated"
  },
  "檔建立獨立框": {
    "zh-CN": "档建立独立框",
    "en": "files as separate cards"
  },
  "完成": {
    "zh-CN": "完成",
    "en": "Complete"
  },
  "已到期，請重新預覽批次": {
    "zh-CN": "已到期，请重新预览批次",
    "en": "Expired; preview the batch again"
  },
  "待批准": {
    "zh-CN": "待批准",
    "en": "Awaiting approval"
  },
  "已批准，等待 Codex 執行": {
    "zh-CN": "已批准，等待 Codex 执行",
    "en": "Approved; awaiting Codex execution"
  },
  "本批進行中": {
    "zh-CN": "本批进行中",
    "en": "Batch in progress"
  },
  "本批已完成": {
    "zh-CN": "本批已完成",
    "en": "Batch completed"
  },
  "部分操作未完成": {
    "zh-CN": "部分操作未完成",
    "en": "Some actions did not finish"
  },
  "原批結果待查": {
    "zh-CN": "原批结果待查",
    "en": "Original batch results need checking"
  },
  "本批已停止": {
    "zh-CN": "本批已停止",
    "en": "Batch stopped"
  },
  "已停止等待": {
    "zh-CN": "已停止等待",
    "en": "Local waiting stopped"
  },
  "結果未存入目前畫布，保留原操作待核對": {
    "zh-CN": "结果未存入目前画布，保留原操作待核对",
    "en": "Result was not added to this canvas; original operation retained for checking"
  },
  "圖片生成批次": {
    "zh-CN": "图片生成批次",
    "en": "Image generation batch"
  },
  "Codex 建好素材需求後，會在這裡列出本次要生成的圖片。": {
    "zh-CN": "Codex 建好素材需求后，会在这里列出本次要生成的图片。",
    "en": "Images proposed by Codex appear here before generation."
  },
  "本批": {
    "zh-CN": "本批",
    "en": "This batch"
  },
  "張素材圖": {
    "zh-CN": "张素材图",
    "en": "material images"
  },
  "火山方舟 Seedream 5.0 Flash · 1024×1024 PNG": {
    "zh-CN": "火山方舟 Seedream 5.0 Flash · 1024×1024 PNG",
    "en": "Volcengine Ark Seedream 5.0 Flash · 1024×1024 PNG"
  },
  "HTTP 模擬工程驗證 · 不是真實生成": {
    "zh-CN": "HTTP 模拟工程验证 · 不是真实生成",
    "en": "HTTP simulation · Not live generation"
  },
  "擬提交純文字文生圖": {
    "zh-CN": "拟提交纯文字文生图",
    "en": "Proposed text-to-image request"
  },
  "· 最多4次 · 單次上限 ¥0.12 · 本批上限 ¥0.60": {
    "zh-CN": "· 最多4次 · 单次上限 ¥0.12 · 本批上限 ¥0.60",
    "en": "· Up to 4 attempts · ¥0.12 per attempt · ¥0.60 batch limit"
  },
  "四段需求擬送往方舟中國區，不上傳參考圖。": {
    "zh-CN": "四段需求拟送往方舟中国区，不上传参考图。",
    "en": "Four prompts would be sent to Ark China; no reference images are uploaded."
  },
  "已有提交紀錄，實際費用尚未核對。": {
    "zh-CN": "已有提交纪录，实际费用尚未核对。",
    "en": "Submission records exist; actual charges are unreconciled."
  },
  "尚未提交。": {
    "zh-CN": "尚未提交。",
    "en": "Not submitted."
  },
  "需要本批 Owner 批准與安全帳戶接通；讀取或草稿權不包含收費生成。停止等待不代表退款。": {
    "zh-CN": "需要本批 Owner 批准与安全帐户接通；读取或草稿权不包含收费生成。停止等待不代表退款。",
    "en": "Owner approval for this batch and a secure account connection are required. Read and draft rights do not include paid generation. Stopping local waiting does not imply a refund."
  },
  "免費離線接線測試 · 合成結果 · 總費用 ¥0": {
    "zh-CN": "免费离线接线测试 · 合成结果 · 总费用 ¥0",
    "en": "Free offline integration test · Synthetic results · ¥0 total"
  },
  "不讀取憑據，不發供應商請求。真實生成仍需另外批准固定模型與預算。": {
    "zh-CN": "不读取凭据，不发供应商请求。真实生成仍需另外批准固定模型与预算。",
    "en": "No credentials or provider requests. Live generation requires separate approval of the fixed model and budget."
  },
  "· 1張 · 純文字，不上傳參考圖": {
    "zh-CN": "· 1张 · 纯文字，不上传参考图",
    "en": "· 1 image · Text only; no reference upload"
  },
  "已建立": {
    "zh-CN": "已建立",
    "en": "Created"
  },
  "個原任務；": {
    "zh-CN": "个原任务；",
    "en": "original tasks;"
  },
  "張已回填。": {
    "zh-CN": "张已回填。",
    "en": "images received."
  },
  "有結果未保存至目前畫布，請保留原操作核對。": {
    "zh-CN": "有结果未保存至目前画布，请保留原操作核对。",
    "en": "Some results are not saved to this canvas. Keep the original operation for checking."
  },
  "重複查詢不會重新生成。": {
    "zh-CN": "重复查询不会重新生成。",
    "en": "Repeated queries do not generate again."
  },
  "確認本批 HTTP 模擬 · 真實費用未授權": {
    "zh-CN": "确认本批 HTTP 模拟 · 真实费用未授权",
    "en": "Confirm batch HTTP simulation · Live charges not authorized"
  },
  "確認本批四圖範圍 · 上限 ¥0.60": {
    "zh-CN": "确认本批四图范围 · 上限 ¥0.60",
    "en": "Confirm four-image scope · ¥0.60 limit"
  },
  "批准本批離線測試 ·": {
    "zh-CN": "批准本批离线测试 ·",
    "en": "Approve this offline test ·"
  },
  "張 · ¥0": {
    "zh-CN": "张 · ¥0",
    "en": "images · ¥0"
  },
  "顯示位置已變，請重新標記": {
    "zh-CN": "显示位置已变，请重新标记",
    "en": "The displayed image moved. Mark it again."
  },
  "請在實際圖片內標記；留白與零面積框不提交": {
    "zh-CN": "请在实际图片内标记；留白与零面积框不提交",
    "en": "Mark inside the actual image. Padding and zero-area boxes are not submitted."
  },
  "最多64個標記": {
    "zh-CN": "最多64个标记",
    "en": "Up to 64 marks"
  },
  "圖片編輯標記": {
    "zh-CN": "图片编辑标记",
    "en": "Image edit marks"
  },
  "標記工具": {
    "zh-CN": "标记工具",
    "en": "Marking tool"
  },
  "圖片標記工具": {
    "zh-CN": "图片标记工具",
    "en": "Image marking tool"
  },
  "點選": {
    "zh-CN": "点选",
    "en": "Point"
  },
  "拖曳框選": {
    "zh-CN": "拖曳框选",
    "en": "Drag a box"
  },
  "顯示縮放": {
    "zh-CN": "显示缩放",
    "en": "Display zoom"
  },
  "圖片標記縮放": {
    "zh-CN": "图片标记缩放",
    "en": "Image marking zoom"
  },
  "圖片標記畫面": {
    "zh-CN": "图片标记画面",
    "en": "Image marking view"
  },
  "編輯固定版本圖片": {
    "zh-CN": "编辑固定版本图片",
    "en": "Edit fixed-version image"
  },
  "只以實際圖片矩形映射0–999；留白不算座標。標記綁定所列固定版本。": {
    "zh-CN": "只以实际图片矩形映射0–999；留白不算座标。标记绑定所列固定版本。",
    "en": "Coordinates map the actual image rectangle to 0–999, excluding padding. Marks are bound to the listed fixed version."
  },
  "圖片標記清單": {
    "zh-CN": "图片标记清单",
    "en": "Image marks"
  },
  "移除標記": {
    "zh-CN": "移除标记",
    "en": "Remove mark"
  },
  "清空標記": {
    "zh-CN": "清空标记",
    "en": "Clear marks"
  },
  "Seedream Pro 圖片合同需先保存已適配路由；Flash與未知模型不開放這些操作。": {
    "zh-CN": "Seedream Pro 图片合同需先保存已适配路由；Flash与未知模型不开放这些操作。",
    "en": "Save an adapted route before using Seedream Pro image operations. Flash and unknown models do not enable these operations."
  },
  "Seedream Pro 圖片合同": {
    "zh-CN": "Seedream Pro 图片合同",
    "en": "Seedream Pro image operations"
  },
  "Seedream 5.0 Pro": {
    "zh-CN": "Seedream 5.0 Pro",
    "en": "Seedream 5.0 Pro"
  },
  "精確Pro合同；帳戶、接入點資格與真實API仍未驗證。": {
    "zh-CN": "精确Pro合同；帐户、接入点资格与真实API仍未验证。",
    "en": "Exact Pro contract; account, Endpoint access and live API remain unverified."
  },
  "圖片路由": {
    "zh-CN": "图片路由",
    "en": "Image route"
  },
  "Pro 圖片路由": {
    "zh-CN": "Pro 图片路由",
    "en": "Pro image route"
  },
  "圖片操作": {
    "zh-CN": "图片操作",
    "en": "Image operation"
  },
  "Pro 圖片操作": {
    "zh-CN": "Pro 图片操作",
    "en": "Pro image operation"
  },
  "本次需求保留單次編輯，與畫布有效提示詞不同。": {
    "zh-CN": "本次需求保留单次编辑，与画布有效提示词不同。",
    "en": "Your per-request prompt is preserved and differs from the effective canvas prompt."
  },
  "使用畫布有效提示詞": {
    "zh-CN": "使用画布有效提示词",
    "en": "Use effective canvas prompt"
  },
  "圖片需求": {
    "zh-CN": "图片需求",
    "en": "Image prompt"
  },
  "Pro 圖片需求": {
    "zh-CN": "Pro 图片需求",
    "en": "Pro image prompt"
  },
  "本次零素材；其他操作的選材和標記保留。": {
    "zh-CN": "本次零素材；其他操作的选材和标记保留。",
    "en": "No media for this request. Selections and marks in other modes are preserved."
  },
  "明確選擇參考圖": {
    "zh-CN": "明确选择参考图",
    "en": "Choose reference images explicitly"
  },
  "Pro 加入圖片": {
    "zh-CN": "Pro 加入图片",
    "en": "Add Pro reference image"
  },
  "從畫布選固定版本…": {
    "zh-CN": "从画布选固定版本…",
    "en": "Choose a fixed canvas version…"
  },
  "· alpha": {
    "zh-CN": "· alpha",
    "en": "· alpha"
  },
  "Pro 圖片順序": {
    "zh-CN": "Pro 图片顺序",
    "en": "Pro image order"
  },
  "來源失效": {
    "zh-CN": "来源失效",
    "en": "Source unavailable"
  },
  "Pro 圖片": {
    "zh-CN": "Pro 图片",
    "en": "Pro image"
  },
  "上移": {
    "zh-CN": "上移",
    "en": "Move up"
  },
  "移除此圖片": {
    "zh-CN": "移除此图片",
    "en": "Remove this image"
  },
  "標記綁定圖片": {
    "zh-CN": "标记绑定图片",
    "en": "Image bound to marks"
  },
  "Pro 標記圖片": {
    "zh-CN": "Pro 标记图片",
    "en": "Pro marked image"
  },
  "明確選擇；換圖清空標記…": {
    "zh-CN": "明确选择；换图清空标记…",
    "en": "Choose explicitly; switching images clears marks…"
  },
  "尺寸方式": {
    "zh-CN": "尺寸方式",
    "en": "Size mode"
  },
  "Pro 尺寸方式": {
    "zh-CN": "Pro 尺寸方式",
    "en": "Pro size mode"
  },
  "官方尺寸等級": {
    "zh-CN": "官方尺寸等级",
    "en": "Official size tier"
  },
  "比例／自訂尺寸": {
    "zh-CN": "比例／自订尺寸",
    "en": "Aspect ratio / custom size"
  },
  "尺寸等級": {
    "zh-CN": "尺寸等级",
    "en": "Size tier"
  },
  "Pro 尺寸等級": {
    "zh-CN": "Pro 尺寸等级",
    "en": "Pro size tier"
  },
  "比例預設": {
    "zh-CN": "比例预设",
    "en": "Aspect ratio preset"
  },
  "Pro 圖片比例": {
    "zh-CN": "Pro 图片比例",
    "en": "Pro image aspect ratio"
  },
  "· 目前值": {
    "zh-CN": "· 目前值",
    "en": "· Current value"
  },
  "寬": {
    "zh-CN": "宽",
    "en": "Width"
  },
  "高": {
    "zh-CN": "高",
    "en": "Height"
  },
  "輸出格式": {
    "zh-CN": "输出格式",
    "en": "Output format"
  },
  "回傳方式": {
    "zh-CN": "回传方式",
    "en": "Response format"
  },
  "背景": {
    "zh-CN": "背景",
    "en": "Background"
  },
  "提示詞優化": {
    "zh-CN": "提示词优化",
    "en": "Prompt optimization"
  },
  "Pro 提示詞優化": {
    "zh-CN": "Pro 提示词优化",
    "en": "Pro prompt optimization"
  },
  "standard": {
    "zh-CN": "标准",
    "en": "Standard"
  },
  "fast": {
    "zh-CN": "快速",
    "en": "Fast"
  },
  "Pro 浮水印": {
    "zh-CN": "Pro 水印",
    "en": "Pro watermark"
  },
  "浮水印": {
    "zh-CN": "水印",
    "en": "Watermark"
  },
  "透明背景只在合同允許的單張真alpha參考圖＋PNG組合使用。層分解保存完整2–17成員順序；不套用一般單輸出限制。尺寸／格式／容量會再次於主程序驗證。": {
    "zh-CN": "透明背景只在合同允许的单张真alpha参考图＋PNG组合使用。层分解保存完整2–17成员顺序；不应用一般单输出限制。尺寸／格式／容量会再次于主程序验证。",
    "en": "Transparent backgrounds require a contract-supported single genuine-alpha reference image with PNG. Layer decomposition preserves all 2–17 members in order, without the normal single-output limit. The main process revalidates size, format and capacity."
  },
  "· 保存的預設設定不合法；下方暫顯合同預設尚未採納，請修正本次覆寫。": {
    "zh-CN": "· 保存的预设设定不合法；下方暂显合同预设尚未采纳，请修正本次覆写。",
    "en": "· Saved defaults are invalid. The displayed contract defaults have not been adopted. Correct the request override."
  },
  "明確採用本次合同預設": {
    "zh-CN": "明确采用本次合同预设",
    "en": "Use contract defaults for this request"
  },
  "· 請修正後重看摘要；需求、選材、標記與舊成功結果保留。": {
    "zh-CN": "· 请修正后重看摘要；需求、选材、标记与旧成功结果保留。",
    "en": "· Correct the request and review its summary again. Prompt, selections, marks and previous successful results are preserved."
  },
  "查看 Pro 單次摘要": {
    "zh-CN": "查看 Pro 单次摘要",
    "en": "Review Pro request summary"
  },
  "Pro 單次摘要": {
    "zh-CN": "Pro 单次摘要",
    "en": "Pro request summary"
  },
  "繼續到 Pro 原生確認": {
    "zh-CN": "继续到 Pro 原生确认",
    "en": "Continue to Pro confirmation"
  },
  "取消 Pro 摘要": {
    "zh-CN": "取消 Pro 摘要",
    "en": "Cancel Pro summary"
  },
  "查看 Pro 原任務回報": {
    "zh-CN": "查看 Pro 原任务回报",
    "en": "View original Pro task response"
  },
  "Pro 安全回報": {
    "zh-CN": "Pro 安全回报",
    "en": "Pro safe response"
  },
  "BytePlus 五模式需先在「新增 AI 模型」保存已適配的影片路由；未知模型不開放提交。": {
    "zh-CN": "BytePlus 五模式需先在「新增 AI 模型」保存已适配的视频路由；未知模型不开放提交。",
    "en": "Save an adapted video route in Add AI model before using all five BytePlus modes. Unknown models cannot submit."
  },
  "請先在原生視窗授權分享，再按「驗證已授權來源」。取消不會建立可用來源。": {
    "zh-CN": "请先在原生视窗授权分享，再按「验证已授权来源」。取消不会建立可用来源。",
    "en": "Authorize sharing in the native window, then verify the authorized source. Canceling does not create a usable source."
  },
  "來源已核對固定版本；供應商取用能力仍未驗證。": {
    "zh-CN": "来源已核对固定版本；供应商取用能力仍未验证。",
    "en": "The source matches the fixed version. Provider access remains unverified."
  },
  "BytePlus 五模式影片": {
    "zh-CN": "BytePlus 五模式视频",
    "en": "Five BytePlus video modes"
  },
  "BytePlus 影片": {
    "zh-CN": "BytePlus 视频",
    "en": "BytePlus video"
  },
  "五種入口依已選定的 Seedance 合同；帳戶／真 API 未驗證。": {
    "zh-CN": "五种入口依已选定的 Seedance 合同；帐户／真 API 未验证。",
    "en": "Five entries follow the selected Seedance contract. Account access and live API are unverified."
  },
  "影片模型": {
    "zh-CN": "视频模型",
    "en": "Video model"
  },
  "BytePlus 影片路由": {
    "zh-CN": "BytePlus 视频路由",
    "en": "BytePlus video route"
  },
  "影片方式": {
    "zh-CN": "视频方式",
    "en": "Video mode"
  },
  "BytePlus 影片方式": {
    "zh-CN": "BytePlus 视频方式",
    "en": "BytePlus video mode"
  },
  "影片操作": {
    "zh-CN": "视频操作",
    "en": "Video operation"
  },
  "BytePlus 影片操作": {
    "zh-CN": "BytePlus 视频操作",
    "en": "BytePlus video operation"
  },
  "參考生成": {
    "zh-CN": "参考生成",
    "en": "Generate from reference"
  },
  "編輯既有影片": {
    "zh-CN": "编辑既有视频",
    "en": "Edit existing video"
  },
  "延長既有影片": {
    "zh-CN": "延长既有视频",
    "en": "Extend existing video"
  },
  "動作、鏡頭與聲音": {
    "zh-CN": "动作、镜头与声音",
    "en": "Motion, camera and sound"
  },
  "BytePlus 影片需求": {
    "zh-CN": "BytePlus 视频需求",
    "en": "BytePlus video prompt"
  },
  "文字模式不送素材；其他模式所選的本地引用保留。": {
    "zh-CN": "文字模式不送素材；其他模式所选的本地引用保留。",
    "en": "Text mode sends no media. Local references selected in other modes are preserved."
  },
  "本次明確選材 · 固定版本": {
    "zh-CN": "本次明确选材 · 固定版本",
    "en": "Explicit media selection · Fixed versions"
  },
  "首幀": {
    "zh-CN": "首帧",
    "en": "First frame"
  },
  "尾幀": {
    "zh-CN": "尾帧",
    "en": "Last frame"
  },
  "明確選擇圖片…": {
    "zh-CN": "明确选择图片…",
    "en": "Choose an image explicitly…"
  },
  "加入參考素材": {
    "zh-CN": "加入参考素材",
    "en": "Add reference media"
  },
  "BytePlus 加入參考": {
    "zh-CN": "BytePlus 加入参考",
    "en": "Add BytePlus reference"
  },
  "選擇圖片／影片／音訊…": {
    "zh-CN": "选择图片／视频／音讯…",
    "en": "Choose image / video / audio…"
  },
  "BytePlus 本次素材順序": {
    "zh-CN": "BytePlus 本次素材顺序",
    "en": "BytePlus request media order"
  },
  "來源缺失": {
    "zh-CN": "来源缺失",
    "en": "Source missing"
  },
  "素材": {
    "zh-CN": "素材",
    "en": "Media"
  },
  "下移": {
    "zh-CN": "下移",
    "en": "Move down"
  },
  "移除此引用": {
    "zh-CN": "移除此引用",
    "en": "Remove this reference"
  },
  "已登記分享來源；每次提交仍重新核對期限與內容。": {
    "zh-CN": "已登记分享来源；每次提交仍重新核对期限与内容。",
    "en": "Sharing source registered. Expiry and content are checked again for every submission."
  },
  "本地影片未有可用 carrier，尚不能提交。": {
    "zh-CN": "本地视频未有可用 carrier，尚不能提交。",
    "en": "This local video has no usable carrier and cannot be submitted yet."
  },
  "核對並授權這段影片來源": {
    "zh-CN": "核对并授权这段视频来源",
    "en": "Review and authorize this video source"
  },
  "驗證已授權來源": {
    "zh-CN": "验证已授权来源",
    "en": "Verify authorized source"
  },
  "多參考素材按明確角色與所列順序提交；提示詞指定首／尾畫面不代表嚴格首尾幀。編輯與延長使用各自合同。": {
    "zh-CN": "多参考素材按明确角色与所列顺序提交；提示词指定首／尾画面不代表严格首尾帧。编辑与延长使用各自合同。",
    "en": "Mixed references use the explicit roles and listed order. Prompt mentions of first/last frames do not guarantee strict frame roles. Editing and extension use separate contracts."
  },
  "影片來源與分享": {
    "zh-CN": "视频来源与分享",
    "en": "Video source and sharing"
  },
  "本地 uploader 與 live asset resolver 尚未實作。請自行選定已獲合法分享權限的 HTTPS 來源；不會自動上傳或替你選擇目的地、地域、隱私與成本。": {
    "zh-CN": "本地 uploader 与 live asset resolver 尚未实作。请自行选定已获合法分享权限的 HTTPS 来源；不会自动上传或替你选择目的地、地域、隐私与成本。",
    "en": "Local uploader and live asset resolver are unimplemented. Choose a legally shareable HTTPS source yourself. Nothing is automatically uploaded, and no destination, region, privacy setting or cost is chosen for you."
  },
  "已有影片 HTTPS 來源": {
    "zh-CN": "已有视频 HTTPS 来源",
    "en": "Existing video HTTPS source"
  },
  "BytePlus 影片 HTTPS 來源": {
    "zh-CN": "BytePlus 视频 HTTPS 来源",
    "en": "BytePlus video HTTPS source"
  },
  "來源有效至": {
    "zh-CN": "来源有效至",
    "en": "Source valid until"
  },
  "BytePlus 來源有效至": {
    "zh-CN": "BytePlus 来源有效至",
    "en": "BytePlus source valid until"
  },
  "原生分享確認與生成確認分開；來源須涵蓋執行期限及安全餘量。取消分享不會生成。": {
    "zh-CN": "原生分享确认与生成确认分开；来源须涵盖执行期限及安全余量。取消分享不会生成。",
    "en": "Sharing and generation require separate native confirmations. Source validity must cover execution plus the safety margin. Canceling sharing does not generate anything."
  },
  "時長（秒）": {
    "zh-CN": "时长（秒）",
    "en": "Duration (seconds)"
  },
  "BytePlus 時長": {
    "zh-CN": "BytePlus 时长",
    "en": "BytePlus duration"
  },
  "比例": {
    "zh-CN": "比例",
    "en": "Aspect ratio"
  },
  "BytePlus 比例": {
    "zh-CN": "BytePlus 比例",
    "en": "BytePlus aspect ratio"
  },
  "依素材／模型決定": {
    "zh-CN": "依素材／模型决定",
    "en": "Follow media / model"
  },
  "解析度": {
    "zh-CN": "解析度",
    "en": "Resolution"
  },
  "BytePlus 解析度": {
    "zh-CN": "BytePlus 解析度",
    "en": "BytePlus resolution"
  },
  "BytePlus 輸出格式": {
    "zh-CN": "BytePlus 输出格式",
    "en": "BytePlus output format"
  },
  "首幀／首尾幀及編輯／延長的比例依素材，編輯時長跟隨原片；其他模式的參數分別保留。": {
    "zh-CN": "首帧／首尾帧及编辑／延长的比例依素材，编辑时长跟随原片；其他模式的参数分别保留。",
    "en": "First-frame, first/last-frame, edit and extend ratios follow their media. Editing duration follows the original clip. Parameters for other modes are preserved separately."
  },
  "保留模型聲音能力；可描述對白、音效和環境音。合法無音軌結果仍可保存，不自動重試生成。輸入大小、數量、時長與角色按既有合同驗證。": {
    "zh-CN": "保留模型声音能力；可描述对白、音效和环境音。合法无音轨结果仍可保存，不自动重试生成。输入大小、数量、时长与角色按既有合同验证。",
    "en": "Model sound capability is retained. Describe dialogue, effects and ambience if needed. Valid results without audio can still be saved; generation is not retried automatically. Input size, count, duration and roles follow the existing contract."
  },
  "· 請修正本次選擇後重新查看摘要；原成功結果保留。": {
    "zh-CN": "· 请修正本次选择后重新查看摘要；原成功结果保留。",
    "en": "· Correct the selection and review the summary again. Previous successful results are preserved."
  },
  "查看 BytePlus 單次摘要": {
    "zh-CN": "查看 BytePlus 单次摘要",
    "en": "Review BytePlus request summary"
  },
  "BytePlus 單次摘要": {
    "zh-CN": "BytePlus 单次摘要",
    "en": "BytePlus request summary"
  },
  "本次": {
    "zh-CN": "本次",
    "en": "This request"
  },
  "項固定素材 · 1 個任務。帳戶資格與費用待核對。": {
    "zh-CN": "项固定素材 · 1 个任务。帐户资格与费用待核对。",
    "en": "fixed media items · 1 task. Account access and cost need checking."
  },
  "已交原生視窗核對一次任務；查看原任務不會重新 POST。": {
    "zh-CN": "已交原生视窗核对一次任务；查看原任务不会重新 POST。",
    "en": "One task was handed to native confirmation. Viewing the original task does not send another POST."
  },
  "繼續到 BytePlus 原生確認": {
    "zh-CN": "继续到 BytePlus 原生确认",
    "en": "Continue to BytePlus native confirmation"
  },
  "取消本次摘要": {
    "zh-CN": "取消本次摘要",
    "en": "Cancel this summary"
  },
  "請填入有效數字": {
    "zh-CN": "请填入有效数字",
    "en": "Enter a valid number"
  },
  "設定未套用，請檢查裁切範圍或音量": {
    "zh-CN": "设定未应用，请检查裁切范围或音量",
    "en": "Settings were not applied. Check the trim range or volume."
  },
  "音軌": {
    "zh-CN": "音轨",
    "en": "Audio track"
  },
  "片段": {
    "zh-CN": "片段",
    "en": "Clip"
  },
  "名稱": {
    "zh-CN": "名称",
    "en": "Name"
  },
  "s": {
    "zh-CN": "s",
    "en": "s"
  },
  "上移片段": {
    "zh-CN": "上移片段",
    "en": "Move clip up"
  },
  "下移片段": {
    "zh-CN": "下移片段",
    "en": "Move clip down"
  },
  "移除音軌": {
    "zh-CN": "移除音轨",
    "en": "Remove audio track"
  },
  "移除片段": {
    "zh-CN": "移除片段",
    "en": "Remove clip"
  },
  "原片": {
    "zh-CN": "原片",
    "en": "Original clip"
  },
  "· 無聲": {
    "zh-CN": "· 无声",
    "en": "· No audio"
  },
  "開始（秒）": {
    "zh-CN": "开始（秒）",
    "en": "Start (seconds)"
  },
  "裁切開始": {
    "zh-CN": "裁切开始",
    "en": "Trim start"
  },
  "結束（秒）": {
    "zh-CN": "结束（秒）",
    "en": "End (seconds)"
  },
  "裁切結束": {
    "zh-CN": "裁切结束",
    "en": "Trim end"
  },
  "入場（秒）": {
    "zh-CN": "入场（秒）",
    "en": "Entry (seconds)"
  },
  "入場時間": {
    "zh-CN": "入场时间",
    "en": "Entry time"
  },
  "音量（%）": {
    "zh-CN": "音量（%）",
    "en": "Volume (%)"
  },
  "音量": {
    "zh-CN": "音量",
    "en": "Volume"
  },
  "已靜音": {
    "zh-CN": "已静音",
    "en": "Muted"
  },
  "靜音": {
    "zh-CN": "静音",
    "en": "Mute"
  },
  "套用": {
    "zh-CN": "应用",
    "en": "Apply"
  },
  "C5-綠瓶成片": {
    "zh-CN": "C5-绿瓶成片",
    "en": "C5 green bottle film"
  },
  "整片預覽已更新，可直接播放": {
    "zh-CN": "整片预览已更新，可直接播放",
    "en": "Full preview updated. Ready to play."
  },
  "匯出完成：": {
    "zh-CN": "导出完成：",
    "en": "Export completed:"
  },
  "編碼已取消，保留上次完整預覽": {
    "zh-CN": "编码已取消，保留上次完整预览",
    "en": "Encoding canceled. Previous complete preview preserved."
  },
  "請先套用各片段的裁切草稿": {
    "zh-CN": "请先应用各片段的裁切草稿",
    "en": "Apply each clip trim draft first"
  },
  "正在建立整片預覽…": {
    "zh-CN": "正在建立整片预览…",
    "en": "Building full preview…"
  },
  "正在匯出凍結版本，工程仍須手動保存": {
    "zh-CN": "正在导出冻结版本，工程仍须手动保存",
    "en": "Exporting a frozen version. Save the project manually."
  },
  "影片編排與匯出": {
    "zh-CN": "视频编排与导出",
    "en": "Video composition and export"
  },
  "C5 · 離線影片編排": {
    "zh-CN": "C5 · 离线视频编排",
    "en": "C5 · Offline video composition"
  },
  "把鏡頭接成一支影片": {
    "zh-CN": "把镜头接成一支视频",
    "en": "Join shots into a film"
  },
  "同一畫布的素材與任務結果 · 裁切對齊24fps最近影格 · 修改後請手動保存": {
    "zh-CN": "同一画布的素材与任务结果 · 裁切对齐24fps最近影格 · 修改后请手动保存",
    "en": "Media and task results from this canvas · Trim snaps to the nearest 24fps frame · Save manually after editing"
  },
  "部分輸出記錄損壞，已保留原件；工程仍可編輯，請使用新檔名匯出。": {
    "zh-CN": "部分输出记录损坏，已保留原件；工程仍可编辑，请使用新文件名导出。",
    "en": "Some output records are damaged and preserved. The project remains editable. Export under a new name."
  },
  "640 × 640": {
    "zh-CN": "640 × 640",
    "en": "640 × 640"
  },
  "H.264 / AAC · 24fps": {
    "zh-CN": "H.264 / AAC · 24fps",
    "en": "H.264 / AAC · 24fps"
  },
  "片段順序": {
    "zh-CN": "片段顺序",
    "en": "Clip order"
  },
  "段 ·": {
    "zh-CN": "段 ·",
    "en": "clips ·"
  },
  "秒": {
    "zh-CN": "秒",
    "en": "seconds"
  },
  "Agent 草稿": {
    "zh-CN": "Agent 草稿",
    "en": "Agent draft"
  },
  "撤銷編排": {
    "zh-CN": "撤销编排",
    "en": "Undo composition"
  },
  "整片時長分佈": {
    "zh-CN": "整片时长分布",
    "en": "Full duration distribution"
  },
  "從畫布選一支影片，加入第一個片段。": {
    "zh-CN": "从画布选一支视频，加入第一个片段。",
    "en": "Choose a canvas video to add the first clip."
  },
  "從同一畫布加入素材": {
    "zh-CN": "从同一画布加入素材",
    "en": "Add media from this canvas"
  },
  "選擇畫布影片或聲音…": {
    "zh-CN": "选择画布视频或声音…",
    "en": "Choose a canvas video or audio…"
  },
  "加入": {
    "zh-CN": "加入",
    "en": "Add"
  },
  "聲音": {
    "zh-CN": "声音",
    "en": "Sound"
  },
  "保留原片聲音；可調整音量或加入音軌": {
    "zh-CN": "保留原片声音；可调整音量或加入音轨",
    "en": "Original clip audio is retained. Adjust volume or add tracks."
  },
  "整片預覽": {
    "zh-CN": "整片预览",
    "en": "Full preview"
  },
  "有未套用草稿": {
    "zh-CN": "有未应用草稿",
    "en": "Unapplied draft"
  },
  "符合目前編排": {
    "zh-CN": "符合目前编排",
    "en": "Matches current composition"
  },
  "舊版凍結預覽": {
    "zh-CN": "旧版冻结预览",
    "en": "Older frozen preview"
  },
  "等待建立": {
    "zh-CN": "等待建立",
    "en": "Awaiting creation"
  },
  "整片 MP4 預覽": {
    "zh-CN": "整片 MP4 预览",
    "en": "Full MP4 preview"
  },
  "依照左側順序、裁切與音量": {
    "zh-CN": "依照左侧顺序、裁切与音量",
    "en": "Uses the order, trim and volume on the left"
  },
  "編碼成單一 MP4 後在這裡播放": {
    "zh-CN": "编码成单一 MP4 后在这里播放",
    "en": "The encoded MP4 will play here"
  },
  "更新整片預覽": {
    "zh-CN": "更新整片预览",
    "en": "Update full preview"
  },
  "匯出 MP4": {
    "zh-CN": "导出 MP4",
    "en": "Export MP4"
  },
  "檔名": {
    "zh-CN": "文件名",
    "en": "Filename"
  },
  "匯出檔名": {
    "zh-CN": "导出文件名",
    "en": "Export filename"
  },
  ".mp4": {
    "zh-CN": ".mp4",
    "en": ".mp4"
  },
  "匯出": {
    "zh-CN": "导出",
    "en": "Export"
  },
  "秒影片": {
    "zh-CN": "秒视频",
    "en": "second video"
  },
  "成片存入此工程的 exports 資料夾。同名檔案會保留，請用新名稱。": {
    "zh-CN": "成片存入此工程的 exports 资料夹。同名文件会保留，请用新名称。",
    "en": "The film is saved in this project’s exports folder. Existing names are preserved; use a new name."
  },
  "核對成片": {
    "zh-CN": "核对成片",
    "en": "Verify film"
  },
  "完成落盤": {
    "zh-CN": "完成落盘",
    "en": "Finalize saved output"
  },
  "取消編碼": {
    "zh-CN": "取消编码",
    "en": "Cancel encoding"
  },
  "兩支已驗原片衍生為 1 / 2 / 3 秒三段；沒有新增生成。": {
    "zh-CN": "两支已验原片衍生为 1 / 2 / 3 秒三段；没有新增生成。",
    "en": "Two verified originals provide three clips of 1 / 2 / 3 seconds. No new generation occurred."
  },
  "輸出記錄（": {
    "zh-CN": "输出记录（",
    "en": "Output records ("
  },
  "已完成": {
    "zh-CN": "已完成",
    "en": "Completed"
  },
  "中斷": {
    "zh-CN": "中断",
    "en": "Interrupted"
  },
  "編碼中": {
    "zh-CN": "编码中",
    "en": "Encoding"
  },
  "準備中": {
    "zh-CN": "准备中",
    "en": "Preparing"
  },
  "核對中": {
    "zh-CN": "核对中",
    "en": "Verifying"
  },
  "完成落盤中": {
    "zh-CN": "完成落盘中",
    "en": "Finalizing saved output"
  },
  "· v": {
    "zh-CN": "· v",
    "en": "· v"
  },
  "播放": {
    "zh-CN": "播放",
    "en": "Play"
  },
  "本地協作尚未就緒": {
    "zh-CN": "本地协作尚未就绪",
    "en": "Local collaboration is not ready"
  },
  "Agent 畫布修改預覽": {
    "zh-CN": "Agent 画布修改预览",
    "en": "Agent canvas change preview"
  },
  "Agent 畫布修改": {
    "zh-CN": "Agent 画布修改",
    "en": "Agent canvas changes"
  },
  "關閉 Agent 修改": {
    "zh-CN": "关闭 Agent 修改",
    "en": "Close Agent changes"
  },
  "Agent 與畫布共用同一份成片設定。只在這裡確認一次修改；本輪沒有啟動外部模型，Agent 不能保存、合併編碼或另存檔案。": {
    "zh-CN": "Agent 与画布共用同一份成片设定。只在这里确认一次修改；本轮没有启动外部模型，Agent 不能保存、合并编码或另存文件。",
    "en": "Agent and canvas share the same film settings. Confirm the change once here. No external model is started in this test. The Agent cannot save, encode a merge or save files as."
  },
  "目前沒有待確認修改。畫布可照常操作。": {
    "zh-CN": "目前没有待确认修改。画布可照常操作。",
    "en": "No changes await confirmation. You can use the canvas normally."
  },
  "修改已套用，請手動保存。": {
    "zh-CN": "修改已应用，请手动保存。",
    "en": "Changes applied. Save manually."
  },
  "已套用": {
    "zh-CN": "已应用",
    "en": "Applied"
  },
  "確認此畫布修改": {
    "zh-CN": "确认此画布修改",
    "en": "Confirm this canvas change"
  },
  "請先套用或取消畫布中的裁切／文字草稿。": {
    "zh-CN": "请先应用或取消画布中的裁切／文字草稿。",
    "en": "Apply or cancel canvas trim / text drafts first."
  },
  "狀態讀取失敗，已斷線": {
    "zh-CN": "状态读取失败，已断线",
    "en": "Status could not be read; disconnected"
  },
  "目前畫布 Codex 連線": {
    "zh-CN": "目前画布 Codex 连线",
    "en": "Codex connection for this canvas"
  },
  "固定項目：": {
    "zh-CN": "固定项目：",
    "en": "Fixed project:"
  },
  "；本機工作階段，關閉、停止或切換項目即撤銷原連線。": {
    "zh-CN": "；本机工作阶段，关闭、停止或切换项目即撤销原连线。",
    "en": "; local session. Closing, stopping or switching projects revokes the connection."
  },
  "停止協作": {
    "zh-CN": "停止协作",
    "en": "Stop collaboration"
  },
  "恢復協作": {
    "zh-CN": "恢复协作",
    "en": "Resume collaboration"
  },
  "重新連線": {
    "zh-CN": "重新连线",
    "en": "Reconnect"
  },
  "僅目前畫布 · 本次軟體工作階段": {
    "zh-CN": "仅目前画布 · 本次软体工作阶段",
    "en": "This canvas only · This app session"
  },
  "正在等待目前 Codex；不需選擇範圍或重複確認": {
    "zh-CN": "正在等待目前 Codex；不需选择范围或重复确认",
    "en": "Waiting for this Codex client. No scope selection or repeated confirmation is needed."
  },
  "Esc 關閉 · ↑↓ 選擇 · Enter 執行；鍵位提示只在畫布選取時使用": {
    "zh-CN": "Esc 关闭 · ↑↓ 选择 · Enter 执行；键位提示只在画布选取时使用",
    "en": "Esc closes · ↑↓ select · Enter runs. Shortcut hints apply only to canvas selection."
  },
  "新增畫布內容": {
    "zh-CN": "新增画布内容",
    "en": "Add canvas content"
  },
  "新增圖片任務框": {
    "zh-CN": "新增图片任务框",
    "en": "Add image task card"
  },
  "新增影片任務框 · 離線測試": {
    "zh-CN": "新增视频任务框 · 离线测试",
    "en": "Add video task card · Offline test"
  },
  "新增文字框": {
    "zh-CN": "新增文字框",
    "en": "Add text card"
  },
  "導入素材…": {
    "zh-CN": "导入素材…",
    "en": "Import media…"
  },
  "正面": {
    "zh-CN": "正面",
    "en": "Front"
  },
  "背面": {
    "zh-CN": "背面",
    "en": "Back"
  },
  "左側": {
    "zh-CN": "左侧",
    "en": "Left"
  },
  "右側": {
    "zh-CN": "右侧",
    "en": "Right"
  },
  "45 度": {
    "zh-CN": "45 度",
    "en": "45 degrees"
  },
  "俯視": {
    "zh-CN": "俯视",
    "en": "Top"
  },
  "站立": {
    "zh-CN": "站立",
    "en": "Standing"
  },
  "T 形": {
    "zh-CN": "T 形",
    "en": "T-pose"
  },
  "行走": {
    "zh-CN": "行走",
    "en": "Walking"
  },
  "跑步": {
    "zh-CN": "跑步",
    "en": "Running"
  },
  "坐姿": {
    "zh-CN": "坐姿",
    "en": "Sitting"
  },
  "深蹲": {
    "zh-CN": "深蹲",
    "en": "Squatting"
  },
  "單膝跪": {
    "zh-CN": "单膝跪",
    "en": "One knee"
  },
  "雙膝跪": {
    "zh-CN": "双膝跪",
    "en": "Both knees"
  },
  "寬站姿": {
    "zh-CN": "宽站姿",
    "en": "Wide stance"
  },
  "倚靠": {
    "zh-CN": "倚靠",
    "en": "Leaning"
  },
  "鞠躬": {
    "zh-CN": "鞠躬",
    "en": "Bowing"
  },
  "思考": {
    "zh-CN": "思考",
    "en": "Thinking"
  },
  "格鬥": {
    "zh-CN": "格斗",
    "en": "Fighting"
  },
  "踢腿": {
    "zh-CN": "踢腿",
    "en": "Kicking"
  },
  "投擲": {
    "zh-CN": "投掷",
    "en": "Throwing"
  },
  "推": {
    "zh-CN": "推",
    "en": "Pushing"
  },
  "揮手": {
    "zh-CN": "挥手",
    "en": "Waving"
  },
  "伸手": {
    "zh-CN": "伸手",
    "en": "Reaching"
  },
  "抱臂": {
    "zh-CN": "抱臂",
    "en": "Folded arms"
  },
  "看手機": {
    "zh-CN": "看手机",
    "en": "Looking at phone"
  },
  "讀取目前項目構圖…": {
    "zh-CN": "读取目前项目构图…",
    "en": "Reading this project’s scene…"
  },
  "每個攝影棚場景最多4人；原始資料保留，請先減員再套用。": {
    "zh-CN": "每个摄影棚场景最多4人；原始资料保留，请先减员再应用。",
    "en": "Each studio scene supports up to 4 people. Original data is preserved; reduce the count before applying."
  },
  "場景有新套用內容；本地草稿保留。請返回後重讀，套用仍會檢查版本。": {
    "zh-CN": "场景有新应用内容；本地草稿保留。请返回后重读，应用仍会检查版本。",
    "en": "New scene changes were applied elsewhere. Your local draft is preserved. Return and reload; applying still checks the revision."
  },
  "已讀取最新已套用但未保存構圖。": {
    "zh-CN": "已读取最新已应用但未保存构图。",
    "en": "Latest applied, unsaved scene loaded."
  },
  "構圖已載入。": {
    "zh-CN": "构图已加载。",
    "en": "Scene loaded."
  },
  "已讀取目前未保存工程；仍須手動保存。": {
    "zh-CN": "已读取目前未保存工程；仍须手动保存。",
    "en": "Current unsaved project loaded. Save manually."
  },
  "構圖未載入": {
    "zh-CN": "构图未加载",
    "en": "Scene is not loaded"
  },
  "請先完成有效的人物／相機欄位；構圖尚未提交。": {
    "zh-CN": "请先完成有效的人物／相机栏位；构图尚未提交。",
    "en": "Complete valid person / camera fields first. The scene has not been submitted."
  },
  "套用構圖…": {
    "zh-CN": "应用构图…",
    "en": "Applying scene…"
  },
  "正在匯出 PNG 到畫布…": {
    "zh-CN": "正在导出 PNG 到画布…",
    "en": "Exporting PNG to canvas…"
  },
  "已加入素材庫": {
    "zh-CN": "已加入素材库",
    "en": "Added to media library"
  },
  "及目前畫布": {
    "zh-CN": "及目前画布",
    "en": "and current canvas"
  },
  "工程尚須手動保存。": {
    "zh-CN": "工程尚须手动保存。",
    "en": "Save the project manually."
  },
  "構圖已套用至目前項目；尚須手動保存。": {
    "zh-CN": "构图已应用至目前项目；尚须手动保存。",
    "en": "Scene applied to this project. Save manually."
  },
  "已取消新擷取，既有素材保留。": {
    "zh-CN": "已取消新撷取，既有素材保留。",
    "en": "New capture canceled. Existing media is preserved."
  },
  "攝影棚構圖": {
    "zh-CN": "摄影棚构图",
    "en": "Studio composition"
  },
  "PNG 已落盤；畫布關係仍須手動保存。": {
    "zh-CN": "PNG 已落盘；画布关系仍须手动保存。",
    "en": "PNG saved. Canvas links still require manual project saving."
  },
  "素材提交未獲確定回覆；保留同一請求，請查詢／重取回執後再繼續。": {
    "zh-CN": "素材提交未获确定回覆；保留同一请求，请查询／重取回执后再继续。",
    "en": "Media submission receipt is unknown. Keep the same request and query / retrieve its receipt before continuing."
  },
  "相機將朝向主體目標點；位置保持不變。": {
    "zh-CN": "相机将朝向主体目标点；位置保持不变。",
    "en": "Camera now aims at the subject target. Its position is unchanged."
  },
  "相機位置與目前朝向保持，自由旋轉已啟用。": {
    "zh-CN": "相机位置与目前朝向保持，自由旋转已启用。",
    "en": "Camera position and current orientation are preserved. Free rotation is enabled."
  },
  "已安全撤銷／重做原構圖欄位；已出版的 PNG 保留，工程尚須手動保存。": {
    "zh-CN": "已安全撤销／重做原构图栏位；已出版的 PNG 保留，工程尚须手动保存。",
    "en": "Original scene fields safely undone / redone. Published PNGs are preserved. Save the project manually."
  },
  "攝影棚": {
    "zh-CN": "摄影棚",
    "en": "Studio"
  },
  "同一項目的構圖與參考素材": {
    "zh-CN": "同一项目的构图与参考素材",
    "en": "Composition and reference media for this project"
  },
  "返回畫布（不套用調整）": {
    "zh-CN": "返回画布（不应用调整）",
    "en": "Return to canvas (do not apply adjustments)"
  },
  "返回畫布": {
    "zh-CN": "返回画布",
    "en": "Return to canvas"
  },
  "套用構圖後仍須手動保存工程。人物姿勢為靜態；單張參考圖不保證影片方向。": {
    "zh-CN": "应用构图后仍须手动保存工程。人物姿势为静态；单张参考图不保证视频方向。",
    "en": "Save the project manually after applying. Poses are static; one reference image does not guarantee video direction."
  },
  "工作庫正在合併，攝影棚目前只可查看。": {
    "zh-CN": "工作库正在合并，摄影棚目前只可查看。",
    "en": "The library is merging. Studio is view-only."
  },
  "此構圖含 GLB 或圖片／HDR 來源，本次入口不改寫該來源；原構圖保留。": {
    "zh-CN": "此构图含 GLB 或图片／HDR 来源，本次入口不改写该来源；原构图保留。",
    "en": "This scene contains GLB or image / HDR sources. This entry preserves them without rewriting."
  },
  "此歷史場景有": {
    "zh-CN": "此历史场景有",
    "en": "This historical scene contains"
  },
  "人，現行上限4人。原始人物完整保留；請在本地草稿刪減至4人後再套用，或返回畫布保留原狀。撤銷若會恢復超額人物，將拒絕且保留歷史。": {
    "zh-CN": "人，现行上限4人。原始人物完整保留；请在本地草稿删减至4人后再应用，或返回画布保留原状。撤销若会恢复超额人物，将拒绝且保留历史。",
    "en": "people; the current limit is 4. All original people are preserved. Reduce the local draft to 4 before applying, or return without changes. Undo that would restore excess people is rejected while history is preserved."
  },
  "場景與機位": {
    "zh-CN": "场景与机位",
    "en": "Scene and camera views"
  },
  "拍攝畫面": {
    "zh-CN": "拍摄画面",
    "en": "Camera view"
  },
  "構圖設定": {
    "zh-CN": "构图设定",
    "en": "Scene settings"
  },
  "只讀查看對象": {
    "zh-CN": "只读查看对象",
    "en": "View-only target"
  },
  "人物": {
    "zh-CN": "人物",
    "en": "People"
  },
  "相機": {
    "zh-CN": "相机",
    "en": "Camera"
  },
  "燈光": {
    "zh-CN": "灯光",
    "en": "Light"
  },
  "主體": {
    "zh-CN": "主体",
    "en": "Subject"
  },
  "人物木偶": {
    "zh-CN": "人物人偶",
    "en": "Person mannequin"
  },
  "盒形產品": {
    "zh-CN": "盒形产品",
    "en": "Box product"
  },
  "圓柱產品": {
    "zh-CN": "圆柱产品",
    "en": "Cylinder product"
  },
  "靜態姿勢": {
    "zh-CN": "静态姿势",
    "en": "Static pose"
  },
  "自訂姿勢": {
    "zh-CN": "自订姿势",
    "en": "Custom pose"
  },
  "主體朝向（度）": {
    "zh-CN": "主体朝向（度）",
    "en": "Subject orientation (degrees)"
  },
  "主體朝向": {
    "zh-CN": "主体朝向",
    "en": "Subject orientation"
  },
  "保留單人世界變換與姿勢，已轉為多人偶草稿；請明確套用。": {
    "zh-CN": "保留单人世界变换与姿势，已转为多人偶草稿；请明确应用。",
    "en": "Single-person world transform and pose are preserved in a multi-person draft. Apply explicitly."
  },
  "啟用多人偶（保留單人構圖）": {
    "zh-CN": "启用多人偶（保留单人构图）",
    "en": "Enable multiple people (preserve single-person scene)"
  },
  "多人偶編排": {
    "zh-CN": "多人偶编排",
    "en": "People arrangement"
  },
  "人物 ·": {
    "zh-CN": "人物 ·",
    "en": "People ·"
  },
  "人": {
    "zh-CN": "人",
    "en": "people"
  },
  "每個攝影棚場景最多4人；達限後不能新增或複製。": {
    "zh-CN": "每个摄影棚场景最多4人；达限后不能新增或复制。",
    "en": "Each studio scene supports at most 4 people. Adding and duplicating are disabled at the limit."
  },
  "場景單位 · Y向上 · 角度YXZ。木偶為靜態；參考圖只固定身份來源，不冒充照片外觀。": {
    "zh-CN": "场景单位 · Y向上 · 角度YXZ。人偶为静态；参考图只固定身份来源，不冒充照片外观。",
    "en": "Scene units · Y up · YXZ angles. Mannequins are static; references fix source identity without claiming photo likeness."
  },
  "選取人物": {
    "zh-CN": "选取人物",
    "en": "Select person"
  },
  "請選擇人物": {
    "zh-CN": "请选择人物",
    "en": "Choose a person"
  },
  "空場景 · 0人": {
    "zh-CN": "空场景 · 0人",
    "en": "Empty scene · 0 people"
  },
  "每個攝影棚場景最多4人，未新增。": {
    "zh-CN": "每个摄影棚场景最多4人，未新增。",
    "en": "Limit: 4 people per studio scene. No person was added."
  },
  "新增人物": {
    "zh-CN": "新增人物",
    "en": "Add person"
  },
  "從穩定人物清單選取；被遮擋或鏡頭外人物仍保留。": {
    "zh-CN": "从稳定人物清单选取；被遮挡或镜头外人物仍保留。",
    "en": "Select from stable person identities. Occluded and off-camera people are retained."
  },
  "明確空場景；不會自動新增預設人物。": {
    "zh-CN": "明确空场景；不会自动新增预设人物。",
    "en": "Explicitly empty scene. No default person is added automatically."
  },
  "場景": {
    "zh-CN": "场景",
    "en": "Scene"
  },
  "· 內建 person@1": {
    "zh-CN": "· 内建 person@1",
    "en": "· Built-in person@1"
  },
  "人物名稱": {
    "zh-CN": "人物名称",
    "en": "Person name"
  },
  "人物身份": {
    "zh-CN": "人物身份",
    "en": "Person identity"
  },
  "人物標記色": {
    "zh-CN": "人物标记色",
    "en": "Person marker color"
  },
  "朝向": {
    "zh-CN": "朝向",
    "en": "Orientation"
  },
  "人物朝向": {
    "zh-CN": "人物朝向",
    "en": "Person orientation"
  },
  "人物姿勢": {
    "zh-CN": "人物姿势",
    "en": "Person pose"
  },
  "自訂靜態姿勢": {
    "zh-CN": "自订静态姿势",
    "en": "Custom static pose"
  },
  "人物固定參考圖": {
    "zh-CN": "人物固定参考图",
    "en": "Fixed person reference image"
  },
  "只用內建人偶版本": {
    "zh-CN": "只用内建人偶版本",
    "en": "Use built-in mannequin version only"
  },
  "保留固定歷史／缺失版本": {
    "zh-CN": "保留固定历史／缺失版本",
    "en": "Keep fixed historical / missing version"
  },
  "· 不可用": {
    "zh-CN": "· 不可用",
    "en": "· Unavailable"
  },
  "固定版本": {
    "zh-CN": "固定版本",
    "en": "Fixed version"
  },
  "人物上移": {
    "zh-CN": "人物上移",
    "en": "Move person up"
  },
  "人物下移": {
    "zh-CN": "人物下移",
    "en": "Move person down"
  },
  "每個攝影棚場景最多4人，未複製。": {
    "zh-CN": "每个摄影棚场景最多4人，未复制。",
    "en": "Limit: 4 people per studio scene. No person was duplicated."
  },
  "複製人物": {
    "zh-CN": "复制人物",
    "en": "Duplicate person"
  },
  "刪除選取人物": {
    "zh-CN": "删除选取人物",
    "en": "Delete selected person"
  },
  "機位": {
    "zh-CN": "机位",
    "en": "Camera view"
  },
  "已保留目前機位；相機位置、朝向及焦距不變。": {
    "zh-CN": "已保留目前机位；相机位置、朝向及焦距不变。",
    "en": "Current camera view retained. Position, orientation and focal length are unchanged."
  },
  "無效的機位選項；原構圖保留。": {
    "zh-CN": "无效的机位选项；原构图保留。",
    "en": "Invalid camera view. Original scene preserved."
  },
  "已切換至": {
    "zh-CN": "已切换至",
    "en": "Switched to"
  },
  "機位；尚未套用構圖。": {
    "zh-CN": "机位；尚未应用构图。",
    "en": "view; scene has not been applied."
  },
  "目前機位（選擇預設）": {
    "zh-CN": "目前机位（选择预设）",
    "en": "Current view (choose a preset)"
  },
  "相機鎖定主體": {
    "zh-CN": "相机锁定主体",
    "en": "Camera targets subject"
  },
  "鎖定主體": {
    "zh-CN": "锁定主体",
    "en": "Target subject"
  },
  "自由朝向": {
    "zh-CN": "自由朝向",
    "en": "Free orientation"
  },
  "相機旋轉": {
    "zh-CN": "相机旋转",
    "en": "Camera rotation"
  },
  "焦距（mm）": {
    "zh-CN": "焦距（mm）",
    "en": "Focal length (mm)"
  },
  "焦距": {
    "zh-CN": "焦距",
    "en": "Focal length"
  },
  "畫面比例": {
    "zh-CN": "画面比例",
    "en": "Frame aspect ratio"
  },
  "背景色": {
    "zh-CN": "背景色",
    "en": "Background color"
  },
  "燈光強度": {
    "zh-CN": "灯光强度",
    "en": "Light intensity"
  },
  "場景操作": {
    "zh-CN": "场景操作",
    "en": "Scene controls"
  },
  "場景操作對象": {
    "zh-CN": "场景操作对象",
    "en": "Scene control target"
  },
  "操作方式": {
    "zh-CN": "操作方式",
    "en": "Control mode"
  },
  "旋轉": {
    "zh-CN": "旋转",
    "en": "Rotate"
  },
  "移動": {
    "zh-CN": "移动",
    "en": "Move"
  },
  "· 有未套用的構圖調整": {
    "zh-CN": "· 有未应用的构图调整",
    "en": "· Unapplied scene changes"
  },
  "重做構圖": {
    "zh-CN": "重做构图",
    "en": "Redo scene"
  },
  "撤銷上次構圖": {
    "zh-CN": "撤销上次构图",
    "en": "Undo last scene change"
  },
  "套用構圖": {
    "zh-CN": "应用构图",
    "en": "Apply scene"
  },
  "套用並匯出到畫布": {
    "zh-CN": "应用并导出到画布",
    "en": "Apply and export to canvas"
  },
  "取消擷取": {
    "zh-CN": "取消撷取",
    "en": "Cancel capture"
  },
  "以原請求查詢／重取回執": {
    "zh-CN": "以原请求查询／重取回执",
    "en": "Query / retrieve the original receipt"
  },
  "返回預覽": {
    "zh-CN": "返回预览",
    "en": "Return to preview"
  },
  "播放影片": {
    "zh-CN": "播放视频",
    "en": "Play video"
  },
  "返回可右鍵操作的預覽；不改選取": {
    "zh-CN": "返回可右键操作的预览；不改选取",
    "en": "Return to the preview context menu without changing selection"
  },
  "在框內播放；預覽中央可右鍵操作": {
    "zh-CN": "在框内播放；预览中央可右键操作",
    "en": "Play inside the card; right-click the preview center for actions"
  },
  "▶ 播放影片": {
    "zh-CN": "▶ 播放视频",
    "en": "▶ Play video"
  },
  "待確認": {
    "zh-CN": "待确认",
    "en": "Awaiting confirmation"
  },
  "已修改": {
    "zh-CN": "已修改",
    "en": "Modified"
  },
  "已拒絕": {
    "zh-CN": "已拒绝",
    "en": "Rejected"
  },
  "已失效": {
    "zh-CN": "已失效",
    "en": "Invalidated"
  },
  "畫布已更新": {
    "zh-CN": "画布已更新",
    "en": "Canvas updated"
  },
  "小時": {
    "zh-CN": "小时",
    "en": "hours"
  },
  "分": {
    "zh-CN": "分",
    "en": "minutes"
  },
  "（上海時間）": {
    "zh-CN": "（上海时间）",
    "en": "(Shanghai time)"
  },
  "修改前：": {
    "zh-CN": "修改前：",
    "en": "Before:"
  },
  "修改後：": {
    "zh-CN": "修改后：",
    "en": "After:"
  },
  "原版本": {
    "zh-CN": "原版本",
    "en": "Original version"
  },
  "確認後使用的版本": {
    "zh-CN": "确认后使用的版本",
    "en": "Version after confirmation"
  },
  "素材預覽無法讀取，請重新提出修改。": {
    "zh-CN": "素材预览无法读取，请重新提出修改。",
    "en": "Media preview is unavailable. Propose the change again."
  },
  "框內提示詞": {
    "zh-CN": "框内提示词",
    "en": "Inline prompt"
  },
  "外部文字": {
    "zh-CN": "外部文字",
    "en": "External text"
  },
  "外部文字後接框內提示詞": {
    "zh-CN": "外部文字后接框内提示词",
    "en": "External text followed by inline prompt"
  },
  "框內提示詞後接外部文字": {
    "zh-CN": "框内提示词后接外部文字",
    "en": "Inline prompt followed by external text"
  },
  "查看詳情": {
    "zh-CN": "查看详情",
    "en": "View details"
  },
  "關閉協作提醒": {
    "zh-CN": "关闭协作提醒",
    "en": "Close collaboration notice"
  },
  "Codex 同圖協作": {
    "zh-CN": "Codex 同图协作",
    "en": "Codex canvas collaboration"
  },
  "關閉協作面板": {
    "zh-CN": "关闭协作面板",
    "en": "Close collaboration panel"
  },
  "讓 Codex 準備影片草稿": {
    "zh-CN": "让 Codex 准备视频草稿",
    "en": "Ask Codex for a video draft"
  },
  "只開本圖短效讀取與草稿；不生成、不自動套用或保存。": {
    "zh-CN": "只开本图短效读取与草稿；不生成、不自动应用或保存。",
    "en": "Opens short-lived read and draft access for this canvas only. No generation, automatic application or saving."
  },
  "先看修改前後的差異；按一次「確認修改」就會套用到這張畫布。保存由你決定。": {
    "zh-CN": "先看修改前后的差异；按一次「确认修改」就会应用到这张画布。保存由你决定。",
    "en": "Review before and after, then confirm once to apply to this canvas. You decide when to save."
  },
  "有效至": {
    "zh-CN": "有效至",
    "en": "Valid until"
  },
  "· 剩餘": {
    "zh-CN": "· 剩余",
    "en": "· Remaining"
  },
  "讀取與建圖草稿限此項目；修改需一次確認。生成另按一批批准，保存仍手動。": {
    "zh-CN": "读取与建图草稿限此项目；修改需一次确认。生成另按一批批准，保存仍手动。",
    "en": "Reading and graph drafts are limited to this project. Applying requires one confirmation. Generation requires batch approval; saving remains manual."
  },
  "在目前具有本機終端能力的 Codex 說出要打開的項目與任務，就能開始協作。": {
    "zh-CN": "在目前具有本机终端能力的 Codex 说出要打开的项目与任务，就能开始协作。",
    "en": "Tell a Codex client with local terminal access which project and task to open to start collaboration."
  },
  "連線診斷與舊式工程檢查": {
    "zh-CN": "连线诊断与旧式工程检查",
    "en": "Connection diagnostics and legacy engineering checks"
  },
  "当前只开放这个合成项目与画布。Codex 读图、定位和提草稿；你逐次确认套用，再决定手动保存。": {
    "zh-CN": "当前只开放这个合成项目与画布。Codex 读图、定位和提草稿；你逐次确认应用，再决定手动保存。",
    "en": "Access is limited to this synthetic project and canvas. Codex reads, locates and proposes drafts. Confirm each application yourself and choose when to save."
  },
  "已允许读取与草稿": {
    "zh-CN": "已允许读取与草稿",
    "en": "Read and draft allowed"
  },
  "已允许读取": {
    "zh-CN": "已允许读取",
    "en": "Read allowed"
  },
  "已连接 · 尚未授权": {
    "zh-CN": "已连接 · 尚未授权",
    "en": "Connected · Not authorized"
  },
  "等待独立 CLI 连接": {
    "zh-CN": "等待独立 CLI 连接",
    "en": "Waiting for independent CLI connection"
  },
  "尚未连接": {
    "zh-CN": "尚未连接",
    "en": "Not connected"
  },
  "截止": {
    "zh-CN": "截止",
    "en": "Expires"
  },
  "· 剩余": {
    "zh-CN": "· 剩余",
    "en": "· Remaining"
  },
  "新会话最长 2 小时，从准备时计时": {
    "zh-CN": "新会话最长 2 小时，从准备时计时",
    "en": "New sessions last at most 2 hours from preparation"
  },
  "授权不延长本次截止时间；可随时撤销，断开或关闭程序后失效。": {
    "zh-CN": "授权不延长本次截止时间；可随时撤销，断开或关闭程序后失效。",
    "en": "Authorization does not extend this deadline. Revoke at any time. Disconnecting or closing the app invalidates it."
  },
  "工程测试窗口；自动输入不代表 Owner 亲测": {
    "zh-CN": "工程测试窗口；自动输入不代表 Owner 亲测",
    "en": "Engineering test window; automation is not Owner hands-on acceptance"
  },
  "本机会话；不以按钮名称推定 Owner 身份": {
    "zh-CN": "本机会话；不以按钮名称推定 Owner 身份",
    "en": "Local session; button labels do not establish Owner identity"
  },
  "1. 准备短效连接": {
    "zh-CN": "1. 准备短效连接",
    "en": "1. Prepare short-lived connection"
  },
  "2. 打开独立 Codex CLI": {
    "zh-CN": "2. 打开独立 Codex CLI",
    "en": "2. Open independent Codex CLI"
  },
  "选择测试附件并打开 Codex": {
    "zh-CN": "选择测试附件并打开 Codex",
    "en": "Choose test attachment and open Codex"
  },
  "允许读取此画布": {
    "zh-CN": "允许读取此画布",
    "en": "Allow reading this canvas"
  },
  "允许读取与提出草稿": {
    "zh-CN": "允许读取与提出草稿",
    "en": "Allow reading and draft proposals"
  },
  "撤销当前权限": {
    "zh-CN": "撤销当前权限",
    "en": "Revoke current permissions"
  },
  "断开连接": {
    "zh-CN": "断开连接",
    "en": "Disconnect"
  },
  "本次待发送附件": {
    "zh-CN": "本次待发送附件",
    "en": "Attachment to send"
  },
  "字节": {
    "zh-CN": "字节",
    "en": "bytes"
  },
  "SHA256": {
    "zh-CN": "SHA256",
    "en": "SHA256"
  },
  "尚未发送。确认后仅交付这一文件的受管副本，不授权原目录或画布业务。图片视觉与原始字节读取分别核实；文本为本地文件交接。": {
    "zh-CN": "尚未发送。确认后仅交付这一文件的受管副本，不授权原目录或画布业务。图片视觉与原始字节读取分别核实；文本为本地文件交接。",
    "en": "Not sent yet. Confirmation shares only a managed copy of this file; it does not authorize the original folder or canvas operations. Image appearance and original bytes are verified separately; text uses local file handoff."
  },
  "取消附件": {
    "zh-CN": "取消附件",
    "en": "Cancel attachment"
  },
  "确认发送并打开 Codex": {
    "zh-CN": "确认发送并打开 Codex",
    "en": "Confirm send and open Codex"
  },
  "CLI：": {
    "zh-CN": "CLI：",
    "en": "CLI:"
  },
  "状态未确认，请先核对本次终端，不要重复启动。": {
    "zh-CN": "状态未确认，请先核对本次终端，不要重复启动。",
    "en": "Status is uncertain. Check this terminal before starting another instance."
  },
  "附件副本清理待重试：": {
    "zh-CN": "附件副本清理待重试：",
    "en": "Attachment copy cleanup needs retry:"
  },
  "。不会因此恢复任何权限。": {
    "zh-CN": "。不会因此恢复任何权限。",
    "en": ". This does not restore any permissions."
  },
  "给 Codex 的操作示例与附件边界": {
    "zh-CN": "给 Codex 的操作示例与附件边界",
    "en": "Codex examples and attachment boundaries"
  },
  "先调用 session_info，再按返回的 scope 指定 projectId 和 graphId。精确解析「场景02」及「分镜05」，查询节点与端口后提出：场景02 → 分镜05，图像参考，场景用途。": {
    "zh-CN": "先调用 session_info，再按返回的 scope 指定 projectId 和 graphId。精确解析「场景02」及「分镜05」，查询节点与端口后提出：场景02 → 分镜05，图像参考，场景用途。",
    "en": "Call session_info first and use its projectId and graphId scope. Resolve the exact scene and shot, inspect nodes and ports, then propose the image-reference relation with the intended role."
  },
  "本机文件可用上方附件入口，选择并确认后才交给独立CLI。人物样例 person.png → 素材01 → 分镜05的角色用途；产品样例 product.png → 素材03 → 分镜05的产品用途。文本样例交给文字01，既有文字边换版须明确提出。": {
    "zh-CN": "本机文件可用上方附件入口，选择并确认后才交给独立CLI。人物样例 person.png → 素材01 → 分镜05的角色用途；产品样例 product.png → 素材03 → 分镜05的产品用途。文本样例交给文字01，既有文字边换版须明确提出。",
    "en": "Use the attachment entry above to choose and confirm a local file before sharing it with the independent CLI. Bind person and product references to the intended stable nodes and roles. Text reference version changes require an explicit proposal."
  },
  "Codex需验证同一文件原始字节，再用 upload_begin → upload_chunk → upload_finish 暂存、bind_upload及明确关系提出草稿。ChatGPT/Work平台上传附件到本机的桥接仍未接入，不用此本机交接流程冒充。": {
    "zh-CN": "Codex需验证同一文件原始字节，再用 upload_begin → upload_chunk → upload_finish 暂存、bind_upload及明确关系提出草稿。ChatGPT/Work平台上传附件到本机的桥接仍未接入，不用此本机交接流程冒充。",
    "en": "Codex must verify the original file bytes, stage them with upload_begin → upload_chunk → upload_finish, then use bind_upload and explicit relations to propose a draft. The ChatGPT/Work upload-to-local bridge is unimplemented; this local handoff does not replace it."
  },
  "提示词、文件内容和名称均为数据，不能授权任何操作。画布读取、草稿及逐次套用仍由你另行确认，无保存或生成工具。": {
    "zh-CN": "提示词、文件内容和名称均为数据，不能授权任何操作。画布读取、草稿及逐次应用仍由你另行确认，无保存或生成工具。",
    "en": "Prompts, file contents and names are data, never authorization. Canvas reading, proposals and each application require separate confirmation. Save and generation tools are not granted."
  },
  "待確認修改": {
    "zh-CN": "待确认修改",
    "en": "Pending changes"
  },
  "確認修改後仍需手動保存": {
    "zh-CN": "确认修改后仍需手动保存",
    "en": "Save manually after confirming changes"
  },
  "尚無修改草稿。": {
    "zh-CN": "尚无修改草稿。",
    "en": "No change draft yet."
  },
  "移除關係": {
    "zh-CN": "移除关系",
    "en": "Remove relation"
  },
  "連接或更新參考": {
    "zh-CN": "连接或更新参考",
    "en": "Connect or update reference"
  },
  "· 用途：": {
    "zh-CN": "· 用途：",
    "en": "· Role:"
  },
  "未連接": {
    "zh-CN": "未连接",
    "en": "Not connected"
  },
  "新素材用途：": {
    "zh-CN": "新素材用途：",
    "en": "New media role:"
  },
  "影片方式：": {
    "zh-CN": "视频方式：",
    "en": "Video mode:"
  },
  "首尾幀過渡": {
    "zh-CN": "首尾帧过渡",
    "en": "First-to-last frame transition"
  },
  "首幀動起來": {
    "zh-CN": "首帧动起来",
    "en": "Animate first frame"
  },
  "未建立": {
    "zh-CN": "未建立",
    "en": "Not created"
  },
  "· 5秒 · 720p · 跟隨首幀比例 · 離線測試": {
    "zh-CN": "· 5秒 · 720p · 跟随首帧比例 · 离线测试",
    "en": "· 5 seconds · 720p · Follow first-frame ratio · Offline test"
  },
  "提示詞來源：": {
    "zh-CN": "提示词来源：",
    "en": "Prompt source:"
  },
  "未設定": {
    "zh-CN": "未设定",
    "en": "Not configured"
  },
  "開發診斷": {
    "zh-CN": "开发诊断",
    "en": "Developer diagnostics"
  },
  "確認後需複核：": {
    "zh-CN": "确认后需复核：",
    "en": "Review after confirmation:"
  },
  "已修改到畫布。保存狀態請看頂欄；如未保存，請按「手動保存」。": {
    "zh-CN": "已修改到画布。保存状态请看顶栏；如未保存，请按「手动保存」。",
    "en": "Changes applied to the canvas. Check the save state above; use Save if unsaved."
  },
  "拒絕修改": {
    "zh-CN": "拒绝修改",
    "en": "Reject changes"
  },
  "確認修改": {
    "zh-CN": "确认修改",
    "en": "Confirm changes"
  },
  "本批方舟帳戶": {
    "zh-CN": "本批方舟帐户",
    "en": "Ark account for this batch"
  },
  "開啟本機一次性帳戶窗": {
    "zh-CN": "开启本机一次性帐户窗",
    "en": "Open one-time local account window"
  },
  "合併中": {
    "zh-CN": "合并中",
    "en": "Merging"
  },
  "已取消 · 原成片保留": {
    "zh-CN": "已取消 · 原成片保留",
    "en": "Canceled · Previous film preserved"
  },
  "合併失敗 · 原成片保留": {
    "zh-CN": "合并失败 · 原成片保留",
    "en": "Merge failed · Previous film preserved"
  },
  "編排或來源已變更": {
    "zh-CN": "编排或来源已变更",
    "en": "Composition or sources changed"
  },
  "成片已完成": {
    "zh-CN": "成片已完成",
    "en": "Film completed"
  },
  "等待合併": {
    "zh-CN": "等待合并",
    "en": "Waiting to merge"
  },
  "合併成片 · 離線": {
    "zh-CN": "合并成片 · 离线",
    "en": "Merge film · Offline"
  },
  "保存的播放順序": {
    "zh-CN": "保存的播放顺序",
    "en": "Saved playback order"
  },
  "缺來源": {
    "zh-CN": "缺来源",
    "en": "Source missing"
  },
  "已保存成片缺失或無法讀取。": {
    "zh-CN": "已保存成片缺失或无法读取。",
    "en": "Saved film is missing or unreadable."
  },
  "請恢復相同原字節；不會自動重編。": {
    "zh-CN": "请恢复相同原字节；不会自动重编。",
    "en": "Restore the identical original bytes. It will not be encoded again automatically."
  },
  "重新讀取": {
    "zh-CN": "重新读取",
    "en": "Reload"
  },
  "成片播放": {
    "zh-CN": "成片播放",
    "en": "Film playback"
  },
  "依保存的播放順序": {
    "zh-CN": "依保存的播放顺序",
    "en": "Uses saved playback order"
  },
  "合併為一支 MP4": {
    "zh-CN": "合并为一支 MP4",
    "en": "Merge into one MP4"
  },
  "正在查看舊版成片": {
    "zh-CN": "正在查看旧版成片",
    "en": "Viewing an older film"
  },
  "s ·": {
    "zh-CN": "s ·",
    "en": "s ·"
  },
  "取消合併": {
    "zh-CN": "取消合并",
    "en": "Cancel merge"
  },
  "取消": {
    "zh-CN": "取消",
    "en": "Cancel"
  },
  "此副本沒有上次編碼記錄；已保存成片仍可播放，不會自動重送。": {
    "zh-CN": "此副本没有上次编码记录；已保存成片仍可播放，不会自动重送。",
    "en": "This copy has no previous encoding record. Saved films remain playable; nothing is resubmitted automatically."
  },
  "更新來源並合併": {
    "zh-CN": "更新来源并合并",
    "en": "Update sources and merge"
  },
  "合併更新": {
    "zh-CN": "合并更新",
    "en": "Update merge"
  },
  "一鍵合併": {
    "zh-CN": "一键合并",
    "en": "Merge"
  },
  "排序裁切音量": {
    "zh-CN": "排序裁切音量",
    "en": "Order, trim and volume"
  },
  "設定": {
    "zh-CN": "设定",
    "en": "Settings"
  },
  "更多操作": {
    "zh-CN": "更多操作",
    "en": "More actions"
  },
  "另存到…": {
    "zh-CN": "另存到…",
    "en": "Save as…"
  },
  "開啟所在資料夾": {
    "zh-CN": "开启所在资料夹",
    "en": "Open containing folder"
  },
  "存放：": {
    "zh-CN": "存放：",
    "en": "Location:"
  },
  "專案內（位置待核對）": {
    "zh-CN": "项目内（位置待核对）",
    "en": "Inside project (location needs verification)"
  },
  "畫布編排／來源關係尚未手動保存": {
    "zh-CN": "画布编排／来源关系尚未手动保存",
    "en": "Canvas composition / source links are unsaved"
  },
  "編排及來源關係已保存": {
    "zh-CN": "编排及来源关系已保存",
    "en": "Composition and source links saved"
  },
  "· 成片檔已落盤": {
    "zh-CN": "· 成片档已落盘",
    "en": "· Film saved to disk"
  },
  "保留": {
    "zh-CN": "保留",
    "en": "Retain"
  },
  "個成片版本": {
    "zh-CN": "个成片版本",
    "en": "film versions"
  },
  "· 最新成片": {
    "zh-CN": "· 最新成片",
    "en": "· Latest film"
  },
  "播放來源": {
    "zh-CN": "播放来源",
    "en": "Playback source"
  },
  "配樂來源": {
    "zh-CN": "配乐来源",
    "en": "Music source"
  },
  "成片輸出": {
    "zh-CN": "成片输出",
    "en": "Film output"
  },
  "配樂": {
    "zh-CN": "配乐",
    "en": "Music"
  },
  "成片": {
    "zh-CN": "成片",
    "en": "Film"
  },
  "設定未套用，請檢查裁切範圍或音量。": {
    "zh-CN": "设定未应用，请检查裁切范围或音量。",
    "en": "Settings not applied. Check trim range or volume."
  },
  "移除": {
    "zh-CN": "移除",
    "en": "Remove"
  },
  "· 固定版本": {
    "zh-CN": "· 固定版本",
    "en": "· Fixed version"
  },
  "開始": {
    "zh-CN": "开始",
    "en": "Start"
  },
  "結束": {
    "zh-CN": "结束",
    "en": "End"
  },
  "音量 %": {
    "zh-CN": "音量 %",
    "en": "Volume %"
  },
  "入場": {
    "zh-CN": "入场",
    "en": "Entry"
  },
  "取消草稿": {
    "zh-CN": "取消草稿",
    "en": "Cancel draft"
  },
  "成片排序裁切音量": {
    "zh-CN": "成片排序裁切音量",
    "en": "Film order, trim and volume"
  },
  "收起成片設定": {
    "zh-CN": "收起成片设定",
    "en": "Collapse film settings"
  },
  "此成片自己的設定。裁切對齊24fps最近影格；不改原片。": {
    "zh-CN": "此成片自己的设定。裁切对齐24fps最近影格；不改原片。",
    "en": "Settings for this film only. Trim snaps to the nearest 24fps frame; originals are unchanged."
  },
  "播放順序": {
    "zh-CN": "播放顺序",
    "en": "Playback order"
  },
  "保留原片聲音，可逐片調整音量／靜音，也可加入音軌。": {
    "zh-CN": "保留原片声音，可逐片调整音量／静音，也可加入音轨。",
    "en": "Original audio is retained. Adjust each clip’s volume / mute, or add a track."
  },
  "加入來源": {
    "zh-CN": "加入来源",
    "en": "Add source"
  },
  "選擇畫布影片／聲音…": {
    "zh-CN": "选择画布视频／声音…",
    "en": "Choose canvas video / audio…"
  },
  "撤銷此成片編排": {
    "zh-CN": "撤销此成片编排",
    "en": "Undo this film composition"
  },
  "來源已有新版；原成片保留。按下方按鈕會明確更新來源版本後合併。": {
    "zh-CN": "来源已有新版；原成片保留。按下方按钮会明确更新来源版本后合并。",
    "en": "Sources have newer versions; the previous film is preserved. The action below explicitly updates source versions before merging."
  },
  "有未套用裁切草稿。切換節點會保留草稿，合併／保存前請套用或取消。": {
    "zh-CN": "有未应用裁切草稿。切换节点会保留草稿，合并／保存前请应用或取消。",
    "en": "There is an unapplied trim draft. Switching nodes preserves it. Apply or cancel before merging / saving."
  },
  "合併更新此成片": {
    "zh-CN": "合并更新此成片",
    "en": "Update and merge this film"
  },
  "分鏡助手與攝影棚的已保存凍結來源，直接回到同一畫布接續。保留來源身份、版本與用途；不改寫原分鏡或棚場景。": {
    "zh-CN": "分镜助手与摄影棚的已保存冻结来源，直接回到同一画布接续。保留来源身份、版本与用途；不改写原分镜或棚场景。",
    "en": "Continue with saved frozen storyboard and studio sources on the same canvas. Source identity, version and role are preserved; original storyboards and studio scenes are unchanged."
  },
  "目前尚無凍結來源。可在「項目」匯入已保存工作台的完整備份副本；原庫保持不變。": {
    "zh-CN": "目前尚无冻结来源。可在「项目」汇入已保存工作台的完整备份副本；原库保持不变。",
    "en": "No frozen sources yet. Import a complete saved workbench backup in Projects; the original library is unchanged."
  },
  "分鏡助手": {
    "zh-CN": "分镜助手",
    "en": "Storyboard assistant"
  },
  "攝影棚 PNG": {
    "zh-CN": "摄影棚 PNG",
    "en": "Studio PNG"
  },
  "來源已換版：下列為歷史來源，不代表目前媒體。": {
    "zh-CN": "来源已换版：下列为历史来源，不代表目前媒体。",
    "en": "Source version changed. This is historical provenance, not current media."
  },
  "鏡頭版本": {
    "zh-CN": "镜头版本",
    "en": "Shot version"
  },
  "本地棚場景 v": {
    "zh-CN": "本地棚场景 v",
    "en": "Local studio scene v"
  },
  "固定輸出": {
    "zh-CN": "固定输出",
    "en": "Fixed output"
  },
  "來源待核對": {
    "zh-CN": "来源待核对",
    "en": "Source needs checking"
  },
  "固定媒體": {
    "zh-CN": "固定媒体",
    "en": "Fixed media"
  },
  "在同一畫布接續 ·": {
    "zh-CN": "在同一画布接续 ·",
    "en": "Continue on this canvas ·"
  },
  "來源、版本與用途": {
    "zh-CN": "来源、版本与用途",
    "en": "Source, version and role"
  },
  "離線來源演練會明示；未映射輸入不會暗中當作已接入。": {
    "zh-CN": "离线来源演练会明示；未映射输入不会暗中当作已接入。",
    "en": "Offline source tests are labeled explicitly. Unmapped inputs are never presented as connected."
  },
  "生成": {
    "zh-CN": "生成",
    "en": "Generate"
  },
  "素材用途": {
    "zh-CN": "素材用途",
    "en": "Media roles"
  },
  "記錄": {
    "zh-CN": "记录",
    "en": "Records"
  },
  "圖片模型": {
    "zh-CN": "图片模型",
    "en": "Image model"
  },
  "· 舊模型": {
    "zh-CN": "· 旧模型",
    "en": "· Older model"
  },
  "圖片比例": {
    "zh-CN": "图片比例",
    "en": "Image aspect ratio"
  },
  "相容 ·": {
    "zh-CN": "相容 ·",
    "en": "Compatible ·"
  },
  "BytePlus · ap-southeast-1": {
    "zh-CN": "BytePlus · ap-southeast-1",
    "en": "BytePlus · ap-southeast-1"
  },
  "下次API model：": {
    "zh-CN": "下次API model：",
    "en": "Next API model:"
  },
  "官方模型 ID 路由；未指定接入點。": {
    "zh-CN": "官方模型 ID 路由；未指定接入点。",
    "en": "Official model ID route; no specific Endpoint selected."
  },
  "工程離線驗證；403未宣告解決，真實出圖待驗。": {
    "zh-CN": "工程离线验证；403未宣告解决，真实出图待验。",
    "en": "Offline engineering validation. HTTP 403 is unresolved; live image output is unverified."
  },
  "放素材 → 選用途 → 寫需求 → 生成 → 看結果": {
    "zh-CN": "放素材 → 选用途 → 写需求 → 生成 → 看结果",
    "en": "Add media → Choose roles → Write prompt → Generate → Review"
  },
  "寫需求": {
    "zh-CN": "写需求",
    "en": "Write prompt"
  },
  "可只用參考素材，也可以先寫需求": {
    "zh-CN": "可只用参考素材，也可以先写需求",
    "en": "Use reference media alone or write a prompt first"
  },
  "選素材與用途 ·": {
    "zh-CN": "选素材与用途 ·",
    "en": "Choose media and roles ·"
  },
  "項": {
    "zh-CN": "项",
    "en": "items"
  },
  "實際使用素材與用途": {
    "zh-CN": "实际使用素材与用途",
    "en": "Media and roles for this request"
  },
  "圖": {
    "zh-CN": "图",
    "en": "image"
  },
  "素材尚未就緒": {
    "zh-CN": "素材尚未就绪",
    "en": "Media is not ready"
  },
  "這次只使用文字需求": {
    "zh-CN": "这次只使用文字需求",
    "en": "Use only the text prompt for this request"
  },
  "按順序提交圖片，並把每張用途寫進提示詞。模型可能無法完全遵循。": {
    "zh-CN": "按顺序提交图片，并把每张用途写进提示词。模型可能无法完全遵循。",
    "en": "Images are submitted in order, with their roles added to the prompt. Model adherence is not guaranteed."
  },
  "素材或需求有更新，先核對這次使用的版本。": {
    "zh-CN": "素材或需求有更新，先核对这次使用的版本。",
    "en": "Media or prompt changed. Check the versions for this request first."
  },
  "查看並處理": {
    "zh-CN": "查看并处理",
    "en": "Review and resolve"
  },
  "任務進行中…": {
    "zh-CN": "任务进行中…",
    "en": "Task in progress…"
  },
  "生成圖片": {
    "zh-CN": "生成图片",
    "en": "Generate image"
  },
  "BytePlus · 本次收費生成會先顯示確認": {
    "zh-CN": "BytePlus · 本次收费生成会先显示确认",
    "en": "BytePlus · Paid generation shows confirmation first"
  },
  "Key只在本機設定；普通編輯不需確認，收費送出需確認": {
    "zh-CN": "Key只在本机设定；普通编辑不需确认，收费送出需确认",
    "en": "Key stays in local settings. Ordinary edits require no confirmation; paid submission does."
  },
  "每張素材都選用途；同圖多用途可再加入一次。上下移動會改變提交順序。": {
    "zh-CN": "每张素材都选用途；同图多用途可再加入一次。上下移动会改变提交顺序。",
    "en": "Choose a role for every image. Add the same image again for another role. Reordering changes submission order."
  },
  "參考素材": {
    "zh-CN": "参考素材",
    "en": "Reference media"
  },
  "未就緒": {
    "zh-CN": "未就绪",
    "en": "Not ready"
  },
  "來源已刪除": {
    "zh-CN": "来源已删除",
    "en": "Source deleted"
  },
  "移除素材用途": {
    "zh-CN": "移除素材用途",
    "en": "Remove media role"
  },
  "用途": {
    "zh-CN": "用途",
    "en": "Role"
  },
  "固定版本 ·": {
    "zh-CN": "固定版本 ·",
    "en": "Fixed version ·"
  },
  "等待圖片": {
    "zh-CN": "等待图片",
    "en": "Waiting for image"
  },
  "上移素材": {
    "zh-CN": "上移素材",
    "en": "Move media up"
  },
  "下移素材": {
    "zh-CN": "下移素材",
    "en": "Move media down"
  },
  "構圖參考圖；": {
    "zh-CN": "构图参考图；",
    "en": "Composition reference;"
  },
  "已保存棚PNG；出處與快照見上方原工程來源。": {
    "zh-CN": "已保存棚PNG；出处与快照见上方原工程来源。",
    "en": "Saved studio PNG. Original project provenance and snapshot appear above."
  },
  "一般構圖參考；沒有已確認棚來源，不冒充棚輸出。": {
    "zh-CN": "一般构图参考；没有已确认棚来源，不冒充棚输出。",
    "en": "General composition reference. No verified studio provenance; not presented as studio output."
  },
  "從畫布選素材": {
    "zh-CN": "从画布选素材",
    "en": "Choose media from canvas"
  },
  "選擇圖片素材": {
    "zh-CN": "选择图片素材",
    "en": "Choose image media"
  },
  "請選擇": {
    "zh-CN": "请选择",
    "en": "Choose"
  },
  "新素材用途": {
    "zh-CN": "新素材用途",
    "en": "New media role"
  },
  "加入這個用途": {
    "zh-CN": "加入这个用途",
    "en": "Add this role"
  },
  "最多10項用途；同圖多用途合併成一張上傳。每圖最多30MB；JSON含Base64最多64MB為本地資源保護；本地解碼限24MP。文字需求另外填寫。": {
    "zh-CN": "最多10项用途；同图多用途合并成一张上传。每图最多30MB；JSON含Base64最多64MB为本地资源保护；本地解码限24MP。文字需求另外填写。",
    "en": "Up to 10 role assignments. Multiple roles for one image share one upload. Each image: up to 30MB. JSON with Base64: up to 64MB for local resource protection. Local decoding: up to 24MP. Enter the text prompt separately."
  },
  "已保留先前結果。請核對上方固定版本與本次需求。": {
    "zh-CN": "已保留先前结果。请核对上方固定版本与本次需求。",
    "en": "Previous result preserved. Check the fixed versions above and this request’s prompt."
  },
  "已核對這次固定素材、用途、順序與需求，保留所列版本": {
    "zh-CN": "已核对这次固定素材、用途、顺序与需求，保留所列版本",
    "en": "I checked the fixed media, roles, order and prompt, and will use the listed versions"
  },
  "已核對，使用所列版本": {
    "zh-CN": "已核对，使用所列版本",
    "en": "Reviewed; use listed versions"
  },
  "人物用途與肖像來源／平台准入分開。普通本地圖來源未知，不會自動標為影片受信素材。": {
    "zh-CN": "人物用途与肖像来源／平台准入分开。普通本地图来源未知，不会自动标为视频受信素材。",
    "en": "Person roles are separate from portrait provenance and platform admission. Unknown local images are never automatically trusted for video."
  },
  "生成後，結果會回到這個圖片框。": {
    "zh-CN": "生成后，结果会回到这个图片框。",
    "en": "The generated result returns to this image card."
  },
  "預覽結果": {
    "zh-CN": "预览结果",
    "en": "Preview result"
  },
  "圖片結果": {
    "zh-CN": "图片结果",
    "en": "Image result"
  },
  "版本": {
    "zh-CN": "版本",
    "en": "Version"
  },
  "· 下游所選": {
    "zh-CN": "· 下游所选",
    "en": "· Selected downstream"
  },
  "BytePlus原始結果": {
    "zh-CN": "BytePlus原始结果",
    "en": "Original BytePlus result"
  },
  "工程替身 · 非真實生成": {
    "zh-CN": "离线模拟 · 非真实生成",
    "en": "Offline simulation · Not live generation"
  },
  "方舟文生圖原始結果": {
    "zh-CN": "方舟文生图原始结果",
    "en": "Original Ark text-to-image result"
  },
  "HTTP 模擬圖片 · 非真實生成": {
    "zh-CN": "HTTP 模拟图片 · 非真实生成",
    "en": "HTTP-simulated image · Not live generation"
  },
  "合成圖片 · 非真實生成": {
    "zh-CN": "合成图片 · 非真实生成",
    "en": "Synthetic image · Not live generation"
  },
  "查看此版": {
    "zh-CN": "查看此版",
    "en": "View this version"
  },
  "選作下游": {
    "zh-CN": "选作下游",
    "en": "Use downstream"
  },
  "接受此版": {
    "zh-CN": "接受此版",
    "en": "Accept this version"
  },
  "BytePlus 原操作；工程替身另標非真實生成，實際費用以平台帳戶核對為準，查看原操作不會重送": {
    "zh-CN": "BytePlus 原操作；离线模拟另标非真实生成，实际费用以平台帐户核对为准，查看原操作不会重送",
    "en": "Original BytePlus operation; substitutes are labeled as non-live generation. Check actual charges in the provider account. Viewing does not resubmit."
  },
  "固定批次執行；實際費用以帳戶核對為準，查看原操作不會重送": {
    "zh-CN": "固定批次执行；实际费用以帐户核对为准，查看原操作不会重送",
    "en": "Fixed batch execution. Check actual charges in the account. Viewing does not resubmit."
  },
  "來源與費用請見原操作紀錄；未知操作不會自動重新送出": {
    "zh-CN": "来源与费用请见原操作纪录；未知操作不会自动重新送出",
    "en": "See the original operation for source and costs. Unknown operations are not resubmitted automatically."
  },
  "正在等待圖片任務": {
    "zh-CN": "正在等待图片任务",
    "en": "Waiting for image task"
  },
  "原提交結果未知": {
    "zh-CN": "原提交结果未知",
    "en": "Original submission result unknown"
  },
  "查看原操作": {
    "zh-CN": "查看原操作",
    "en": "View original operation"
  },
  "停止本地等待": {
    "zh-CN": "停止本地等待",
    "en": "Stop local waiting"
  },
  "停止等待不代表供應商取消或退款；未知提交不會自動重送。": {
    "zh-CN": "停止等待不代表供应商取消或退款；未知提交不会自动重送。",
    "en": "Stopping local waiting does not mean provider cancellation or refund. Unknown submissions are not automatically resent."
  },
  "未保存前的原操作仍保留": {
    "zh-CN": "未保存前的原操作仍保留",
    "en": "Original operation before saving is retained"
  },
  "原操作仍未知，已停止等待": {
    "zh-CN": "原操作仍未知，已停止等待",
    "en": "Original operation still unknown; local waiting stopped"
  },
  "為避免重複提交，這個圖片框暫時不能再送出。可查看原紀錄，沒有自動重新生成。": {
    "zh-CN": "为避免重复提交，这个图片框暂时不能再送出。可查看原纪录，没有自动重新生成。",
    "en": "To prevent duplicate submissions, this image card cannot submit again yet. Check the original record; no automatic regeneration occurs."
  },
  "查看未結原操作": {
    "zh-CN": "查看未结原操作",
    "en": "View unresolved original operation"
  },
  "媒体": {
    "zh-CN": "媒体",
    "en": "Media"
  },
  "文字": {
    "zh-CN": "文字",
    "en": "Text"
  },
  "提示词": {
    "zh-CN": "提示词",
    "en": "Prompt"
  },
  "图像参考": {
    "zh-CN": "图像参考",
    "en": "Image reference"
  },
  "首帧": {
    "zh-CN": "首帧",
    "en": "First frame"
  },
  "尾帧": {
    "zh-CN": "尾帧",
    "en": "Last frame"
  },
  "视频参考": {
    "zh-CN": "视频参考",
    "en": "Video reference"
  },
  "声音参考": {
    "zh-CN": "声音参考",
    "en": "Audio reference"
  },
  "候选来源": {
    "zh-CN": "候选来源",
    "en": "Candidate source"
  },
  "来源（服务专用）": {
    "zh-CN": "来源（服务专用）",
    "en": "Source (service only)"
  },
  "关闭弹窗": {
    "zh-CN": "关闭弹窗",
    "en": "Close dialog"
  },
  "影片排序／合併：明確勾選任務與順序，工程請手動保存": {
    "zh-CN": "视频排序／合并：明确勾选任务与顺序，工程请手动保存",
    "en": "Video order / merge: explicitly select tasks and order. Save the project manually."
  },
  "Codex 未連接": {
    "zh-CN": "Codex 未连接",
    "en": "Codex not connected"
  },
  "畫布已變更，這次拖曳已取消；請重新拖動。": {
    "zh-CN": "画布已变更，这次拖曳已取消；请重新拖动。",
    "en": "Canvas changed. This drag was canceled; drag again."
  },
  "圖片已提供；": {
    "zh-CN": "图片已提供；",
    "en": "Image provided;"
  },
  "本批已放入": {
    "zh-CN": "本批已放入",
    "en": "This batch placed"
  },
  "張；": {
    "zh-CN": "张；",
    "en": "images;"
  },
  "仍須手動保存工程": {
    "zh-CN": "仍须手动保存工程",
    "en": "Save the project manually"
  },
  "工程目前已保存": {
    "zh-CN": "工程目前已保存",
    "en": "Project is saved"
  },
  "請先套用或取消目前未提交的輸入，再重新明確開啟項目；草稿已保留。": {
    "zh-CN": "请先应用或取消目前未提交的输入，再重新明确开启项目；草稿已保留。",
    "en": "Apply or cancel unsubmitted input before explicitly opening a project again. Drafts are preserved."
  },
  "導航期間有新的未提交輸入；原輸入與視圖保留。": {
    "zh-CN": "导航期间有新的未提交输入；原输入与视图保留。",
    "en": "New unsubmitted input appeared during navigation. Original input and view are preserved."
  },
  "畫布尚未符合指定項目；未確認導航完成。": {
    "zh-CN": "画布尚未符合指定项目；未确认导航完成。",
    "en": "Canvas does not match the requested project. Navigation is not confirmed."
  },
  "畫面已保留，但導航確認未送達：": {
    "zh-CN": "画面已保留，但导航确认未送达：",
    "en": "View preserved, but navigation acknowledgment was not delivered:"
  },
  "請先放開滑鼠完成拖曳，再進行操作。": {
    "zh-CN": "请先放开滑鼠完成拖曳，再进行操作。",
    "en": "Release the mouse and finish dragging before this action."
  },
  "拖曳目標或版本已變更，未送出位置修改。": {
    "zh-CN": "拖曳目标或版本已变更，未送出位置修改。",
    "en": "Drag target or revision changed. No position change was submitted."
  },
  "图尚未读取": {
    "zh-CN": "图尚未读取",
    "en": "Graph is not loaded"
  },
  "已查到原命令回执：": {
    "zh-CN": "已查到原命令回执：",
    "en": "Original command receipt found:"
  },
  "；请查看当前图后再决定": {
    "zh-CN": "；请查看当前图后再决定",
    "en": "; review the current graph before deciding"
  },
  "原命令结果未知，未自动创建替代操作": {
    "zh-CN": "原命令结果未知，未自动创建替代操作",
    "en": "Original command result is unknown. No replacement operation was created automatically."
  },
  "；已重读最新图，请复核后再次明确操作": {
    "zh-CN": "；已重读最新图，请复核后再次明确操作",
    "en": "; latest graph reloaded. Review it and explicitly act again."
  },
  "請在原生視窗核對這次生成": {
    "zh-CN": "请在原生视窗核对这次生成",
    "en": "Review this generation in the native window"
  },
  "操作已套用 · 請手動保存": {
    "zh-CN": "操作已应用 · 请手动保存",
    "en": "Applied · Save manually"
  },
  "請先完成拖曳，再排列節點。": {
    "zh-CN": "请先完成拖曳，再排列节点。",
    "en": "Finish dragging before arranging nodes."
  },
  "節點已排列 · 未選取框保持原位 · 請手動保存": {
    "zh-CN": "节点已排列 · 未选取框保持原位 · 请手动保存",
    "en": "Nodes arranged. Unselected cards stayed in place. Save manually."
  },
  "節點已在排列位置；未新增修改": {
    "zh-CN": "节点已在排列位置；未新增修改",
    "en": "Nodes are already arranged. No new change."
  },
  "工作台修改已確認 · 請手動保存整庫": {
    "zh-CN": "工作台修改已确认 · 请手动保存整库",
    "en": "Workbench changes confirmed. Save the library manually."
  },
  "已切換項目；未保存修改仍保留": {
    "zh-CN": "已切换项目；未保存修改仍保留",
    "en": "Project switched. Unsaved changes are preserved."
  },
  "素材已不在目前工作庫；請重新讀取。": {
    "zh-CN": "素材已不在目前工作库；请重新读取。",
    "en": "Media is no longer in this library. Reload."
  },
  "此區域沒有可用的新框位置；既有框未變。": {
    "zh-CN": "此区域没有可用的新框位置；既有框未变。",
    "en": "No free card position here. Existing cards are unchanged."
  },
  "素材已引用到同一畫布": {
    "zh-CN": "素材已引用到同一画布",
    "en": "Media referenced on the same canvas"
  },
  "任務紀錄已保留，但對應畫布節點已移除；可從原工程來源核對，不會暗中重建或生成。": {
    "zh-CN": "任务纪录已保留，但对应画布节点已移除；可从原工程来源核对，不会暗中重建或生成。",
    "en": "Task record retained, but its canvas node was removed. Check original project provenance; it will not be recreated or generated silently."
  },
  "已查询原运行；若仍未知，可明确停止本地等待后再决定新模拟": {
    "zh-CN": "已查询原运行；若仍未知，可明确停止本地等待后再决定新模拟",
    "en": "Original run queried. If still unknown, explicitly stop local waiting before deciding on a new simulation."
  },
  "请先确认或取消已有框内草稿；切换选择不会丢弃它": {
    "zh-CN": "请先确认或取消已有框内草稿；切换选择不会丢弃它",
    "en": "Confirm or cancel the inline draft first. Changing selection will preserve it."
  },
  "来源框已删除；请明确取消这份草稿": {
    "zh-CN": "来源框已删除；请明确取消这份草稿",
    "en": "Source card was deleted. Explicitly cancel this draft."
  },
  "框内提示词已确认 · 没有自动运行": {
    "zh-CN": "框内提示词已确认 · 没有自动运行",
    "en": "Inline prompt confirmed. Nothing ran automatically."
  },
  "已查看这个明确版本；未自动接受": {
    "zh-CN": "已查看这个明确版本；未自动接受",
    "en": "Viewing this exact version. It was not accepted automatically."
  },
  "此區域沒有可用的新框位置；請平移畫布，或在空白處指定位置。既有框未變。": {
    "zh-CN": "此区域没有可用的新框位置；请平移画布，或在空白处指定位置。既有框未变。",
    "en": "No free card position here. Pan the canvas or choose blank space. Existing cards are unchanged."
  },
  "圖片已提供；可指示Codex放入，尚未建立素材或保存工程": {
    "zh-CN": "图片已提供；可指示Codex放入，尚未建立素材或保存工程",
    "en": "Image provided. Ask Codex to place it; no media card or project save has been created yet."
  },
  "已取消圖片選取；畫布與待加入清單未變": {
    "zh-CN": "已取消图片选取；画布与待加入清单未变",
    "en": "Image selection canceled. Canvas and pending list are unchanged."
  },
  "已清除暫存；原檔與已放入畫布的素材保留": {
    "zh-CN": "已清除暂存；原档与已放入画布的素材保留",
    "en": "Temporary input cleared. Original files and placed media are preserved."
  },
  "圖片已放入畫布；仍須手動保存工程": {
    "zh-CN": "图片已放入画布；仍须手动保存工程",
    "en": "Image placed on canvas. Save manually."
  },
  "节点已创建 · 尚未保存": {
    "zh-CN": "节点已创建 · 尚未保存",
    "en": "Node created · Unsaved"
  },
  "請先套用或取消裁切／文字草稿": {
    "zh-CN": "请先应用或取消裁切／文字草稿",
    "en": "Apply or cancel trim / text drafts first"
  },
  "已明確更新此成片的來源版本": {
    "zh-CN": "已明确更新此成片的来源版本",
    "en": "Source versions for this film explicitly updated"
  },
  "已開始本地合併 · 原片與舊成片保留，工程仍須手動保存": {
    "zh-CN": "已开始本地合并 · 原片与旧成片保留，工程仍须手动保存",
    "en": "Local merge started. Original clips and older films are preserved. Save the project manually."
  },
  "已取消合併；舊成片保留": {
    "zh-CN": "已取消合并；旧成片保留",
    "en": "Merge canceled. Previous film preserved."
  },
  "已取消另存；專案成片保留": {
    "zh-CN": "已取消另存；项目成片保留",
    "en": "Save as canceled. Project film preserved."
  },
  "已另存：": {
    "zh-CN": "已另存：",
    "en": "Saved as:"
  },
  "已請求開啟成片所在位置": {
    "zh-CN": "已请求开启成片所在位置",
    "en": "Requested opening the film location"
  },
  "請先套用或取消裁切／文字草稿，再手動保存畫布": {
    "zh-CN": "请先应用或取消裁切／文字草稿，再手动保存画布",
    "en": "Apply or cancel trim / text drafts before saving the canvas manually"
  },
  "原保存已明确失败，旧文件保留；修复后可再次手动保存": {
    "zh-CN": "原保存已明确失败，旧文件保留；修复后可再次手动保存",
    "en": "Original save failed definitively. Old files are preserved. Repair before saving again manually."
  },
  "原保存状态未知，请保留窗口与暂存，不会自动重发": {
    "zh-CN": "原保存状态未知，请保留窗口与暂存，不会自动重发",
    "en": "Original save status is unknown. Keep the window and temporary files. It will not be resent automatically."
  },
  "已保存版本": {
    "zh-CN": "已保存版本",
    "en": "Saved revision"
  },
  "· 磁盘回执": {
    "zh-CN": "· 磁盘回执",
    "en": "· Disk receipt"
  },
  "請先處理草稿。": {
    "zh-CN": "请先处理草稿。",
    "en": "Resolve drafts first."
  },
  "整組素材已追加；既有引用保留，可整筆撤銷": {
    "zh-CN": "整组素材已追加；既有引用保留，可整笔撤销",
    "en": "Selected media appended as a group. Existing references are preserved; undo is atomic."
  },
  "已取消連接；原選取與引用保持不變。": {
    "zh-CN": "已取消连接；原选取与引用保持不变。",
    "en": "Connection canceled. Original selection and references are unchanged."
  },
  "個框 ·": {
    "zh-CN": "个框 ·",
    "en": "cards ·"
  },
  "請先套用或取消已有草稿，避免快速操作影響未套用內容": {
    "zh-CN": "请先应用或取消已有草稿，避免快速操作影响未应用内容",
    "en": "Apply or cancel existing drafts before quick actions"
  },
  "請先完成或取消本地編碼，再調整這組框或連線": {
    "zh-CN": "请先完成或取消本地编码，再调整这组框或连线",
    "en": "Finish or cancel local encoding before changing these cards or connections"
  },
  "已複製": {
    "zh-CN": "已复制",
    "en": "Duplicated"
  },
  "個框；集合內連線保留、框外輸入未複製，原選取保留 · 請手動保存": {
    "zh-CN": "个框；集合内连线保留、框外输入未复制，原选取保留 · 请手动保存",
    "en": "cards. Internal links retained; external inputs not copied. Original selection preserved. Save manually."
  },
  "點選目標圖片或影片任務以追加整組素材；Esc 取消。": {
    "zh-CN": "点选目标图片或视频任务以追加整组素材；Esc 取消。",
    "en": "Click a target image or video task to append the selected media. Esc cancels."
  },
  "已移除此連線；兩端節點、素材及原節點選取保留，可撤銷": {
    "zh-CN": "已移除此连线；两端节点、素材及原节点选取保留，可撤销",
    "en": "Connection removed. Both nodes, media and original node selection are preserved. Undo is available."
  },
  "先套用或取消草稿，再撤銷／重做": {
    "zh-CN": "先应用或取消草稿，再撤销／重做",
    "en": "Apply or cancel drafts before undo / redo"
  },
  "沒有可撤銷的畫布編輯": {
    "zh-CN": "没有可撤销的画布编辑",
    "en": "No canvas edit to undo"
  },
  "沒有可重做的撤銷": {
    "zh-CN": "没有可重做的撤销",
    "en": "No undo to redo"
  },
  "已撤銷最近畫布編輯；歷史及原媒體保留": {
    "zh-CN": "已撤销最近画布编辑；历史及原媒体保留",
    "en": "Latest canvas edit undone. History and original media are preserved."
  },
  "已重做；衝突時整筆拒絕": {
    "zh-CN": "已重做；冲突时整笔拒绝",
    "en": "Redone. Conflicts reject the entire change."
  },
  "請先選取要移除的框或連線": {
    "zh-CN": "请先选取要移除的框或连线",
    "en": "Select cards or connections to remove first"
  },
  "先處理草稿／執行中的任務，再移除所選": {
    "zh-CN": "先处理草稿／执行中的任务，再移除所选",
    "en": "Resolve drafts / running tasks before removing the selection"
  },
  "成片播放／配樂線請在成片編排移除；本次未修改任何對象": {
    "zh-CN": "成片播放／配乐线请在成片编排移除；本次未修改任何对象",
    "en": "Remove film playback / music links in film composition. Nothing changed."
  },
  "先套用或取消已有草稿，再建立／複製框": {
    "zh-CN": "先应用或取消已有草稿，再建立／复制框",
    "en": "Apply or cancel drafts before creating / duplicating cards"
  },
  "請先選取要複製的框": {
    "zh-CN": "请先选取要复制的框",
    "en": "Select cards to duplicate first"
  },
  "請選中一個圖片或影片任務，再編輯提示詞": {
    "zh-CN": "请选中一个图片或视频任务，再编辑提示词",
    "en": "Select one image or video task to edit its prompt"
  },
  "依赖已连接 · 绑定创建时的固定版本": {
    "zh-CN": "依赖已连接 · 绑定创建时的固定版本",
    "en": "Dependency connected · Bound to the fixed version at creation"
  },
  "畫布已變更，這次拖曳未提交。": {
    "zh-CN": "画布已变更，这次拖曳未提交。",
    "en": "Canvas changed. This drag was not submitted."
  },
  "位置已更新 · 請手動保存": {
    "zh-CN": "位置已更新 · 请手动保存",
    "en": "Position updated · Save manually"
  },
  "依赖已连接 · 固定版本已绑定": {
    "zh-CN": "依赖已连接 · 固定版本已绑定",
    "en": "Dependency connected · Fixed version bound"
  },
  "· 待结果": {
    "zh-CN": "· 待结果",
    "en": "· Awaiting result"
  },
  "正在读取独立项目…": {
    "zh-CN": "正在读取独立项目…",
    "en": "Reading isolated project…"
  },
  "项目已进入只读诊断": {
    "zh-CN": "项目已进入只读诊断",
    "en": "Project opened in read-only diagnostics"
  },
  "原記錄已恢復；沒有恢復生成權或重新提交": {
    "zh-CN": "原记录已恢复；没有恢复生成权或重新提交",
    "en": "Original record recovered. Generation rights were not restored; nothing was resubmitted."
  },
  "檢查死程序並恢復原記錄 · 不重新生成": {
    "zh-CN": "检查死程序并恢复原记录 · 不重新生成",
    "en": "Check dead process and recover original record · No regeneration"
  },
  "原項目未被覆蓋。請保留整個項目目錄、work.sqlite 及存在的 SQLite 配套檔案，交給 Codex 核查。": {
    "zh-CN": "原项目未被覆盖。请保留整个项目目录、work.sqlite 及存在的 SQLite 配套文件，交给 Codex 核查。",
    "en": "Original project was not overwritten. Preserve the complete project folder, work.sqlite and any SQLite companion files for Codex inspection."
  },
  "已有完整备份可恢复到新目录，当前损坏原件保留。": {
    "zh-CN": "已有完整备份可恢复到新目录，当前损坏原件保留。",
    "en": "A complete backup can be restored into a new folder. Damaged originals are preserved."
  },
  "恢复备份 v": {
    "zh-CN": "恢复备份 v",
    "en": "Restore backup v"
  },
  "到新目录并打开": {
    "zh-CN": "到新目录并打开",
    "en": "to a new folder and open"
  },
  "退出": {
    "zh-CN": "退出",
    "en": "Exit"
  },
  "AICG · 統一創作工作台": {
    "zh-CN": "AICG · 统一创作工作台",
    "en": "AICG · Creative workbench"
  },
  "先建立項目，或匯入已保存副本": {
    "zh-CN": "先建立项目，或汇入已保存副本",
    "en": "Create a project or import a saved copy first"
  },
  "同一工作庫，共用素材、任務與畫布；工程只在手動保存時提交。": {
    "zh-CN": "同一工作库，共用素材、任务与画布；工程只在手动保存时提交。",
    "en": "One library shares media, tasks and canvas. Changes are committed only when saved manually."
  },
  "首尾幀離線準備 · 尚未真實生成": {
    "zh-CN": "首尾帧离线准备 · 尚未真实生成",
    "en": "First/last-frame offline preparation · No live generation yet"
  },
  "首幀遠景 → 尾幀近景 · 真實測試等待一次新批准": {
    "zh-CN": "首帧远景 → 尾帧近景 · 真实测试等待一次新批准",
    "en": "First-frame wide shot → Last-frame close-up · Live test requires fresh approval"
  },
  "隔離整合恢復副本 · 原影片已回填": {
    "zh-CN": "隔离整合恢复副本 · 原视频已回填",
    "en": "Isolated integration restore copy · Original video received"
  },
  "已保存 revision4 為來源；未保存修改仍未知 · 供應商API停用": {
    "zh-CN": "已保存 revision4 为来源；未保存修改仍未知 · 供应商API停用",
    "en": "Saved revision 4 is the source; unsaved changes remain unknown · Provider API disabled"
  },
  "A": {
    "zh-CN": "A",
    "en": "A"
  },
  "AICG": {
    "zh-CN": "AICG",
    "en": "AICG"
  },
  "工作台": {
    "zh-CN": "工作台",
    "en": "Workbench"
  },
  "項目 · 素材 · 任務 · 畫布": {
    "zh-CN": "项目 · 素材 · 任务 · 画布",
    "en": "Projects · Media · Tasks · Canvas"
  },
  "目前項目": {
    "zh-CN": "目前项目",
    "en": "Current project"
  },
  "BytePlus · 驗收候選": {
    "zh-CN": "BytePlus · 验收候选",
    "en": "BytePlus · Acceptance candidate"
  },
  "有修改待保存": {
    "zh-CN": "有修改待保存",
    "en": "Unsaved changes"
  },
  "已保存 · 庫r": {
    "zh-CN": "已保存 · 库r",
    "en": "Saved · Library r"
  },
  "/ 圖v": {
    "zh-CN": "/ 图v",
    "en": "/ Graph v"
  },
  "空白项目": {
    "zh-CN": "空白项目",
    "en": "Blank project"
  },
  "請先套用或取消未提交的輸入；草稿已保留。": {
    "zh-CN": "请先应用或取消未提交的输入；草稿已保留。",
    "en": "Apply or cancel unsubmitted input first. Drafts are preserved."
  },
  "工作台首頁": {
    "zh-CN": "工作台首页",
    "en": "Workbench home"
  },
  "BytePlus 已設定": {
    "zh-CN": "BytePlus 已设定",
    "en": "BytePlus configured"
  },
  "連接 BytePlus": {
    "zh-CN": "连接 BytePlus",
    "en": "Connect BytePlus"
  },
  "切换浅色": {
    "zh-CN": "切换浅色",
    "en": "Switch to light theme"
  },
  "切换深色": {
    "zh-CN": "切换深色",
    "en": "Switch to dark theme"
  },
  "畫布內合併": {
    "zh-CN": "画布内合并",
    "en": "Merge on canvas"
  },
  "快捷鍵設定": {
    "zh-CN": "快捷键设定",
    "en": "Keyboard shortcuts"
  },
  "手动保存": {
    "zh-CN": "手动保存",
    "en": "Save manually"
  },
  "备份 / 恢复": {
    "zh-CN": "备份 / 恢复",
    "en": "Backup / restore"
  },
  "退出画布": {
    "zh-CN": "退出画布",
    "en": "Exit canvas"
  },
  "已查原操作，不重新生成": {
    "zh-CN": "已查原操作，不重新生成",
    "en": "Original operation queried. No regeneration."
  },
  "原結果已加入；請手動保存": {
    "zh-CN": "原结果已加入；请手动保存",
    "en": "Original result added. Save manually."
  },
  "有未套用的成片裁切草稿": {
    "zh-CN": "有未应用的成片裁切草稿",
    "en": "Unapplied film trim draft"
  },
  "返回草稿": {
    "zh-CN": "返回草稿",
    "en": "Return to draft"
  },
  "有尚未納入已保存畫布的合併工作。啟動時編排與來源快照已保留。": {
    "zh-CN": "有尚未纳入已保存画布的合并工作。启动时编排与来源快照已保留。",
    "en": "Some merge jobs are not included in the saved canvas. Their initial composition and source snapshots are preserved."
  },
  "已恢復合併工作到畫布 · 請手動保存": {
    "zh-CN": "已恢复合并工作到画布 · 请手动保存",
    "en": "Merge job restored to canvas. Save manually."
  },
  "恢復": {
    "zh-CN": "恢复",
    "en": "Restore"
  },
  "已完成成片": {
    "zh-CN": "已完成成片",
    "en": "Completed film"
  },
  "中斷編排": {
    "zh-CN": "中断编排",
    "en": "Interrupted composition"
  },
  "工程範圍": {
    "zh-CN": "工程范围",
    "en": "Engineering scope"
  },
  "素材 → 圖片 → 首幀影片 → 畫布成片 · 工程仍須手動保存": {
    "zh-CN": "素材 → 图片 → 首帧视频 → 画布成片 · 工程仍须手动保存",
    "en": "Media → Image → First-frame video → Canvas film · Save the project manually"
  },
  "创建工具": {
    "zh-CN": "创建工具",
    "en": "Creation tools"
  },
  "項目管理": {
    "zh-CN": "项目管理",
    "en": "Project management"
  },
  "項目": {
    "zh-CN": "项目",
    "en": "Projects"
  },
  "統一素材庫": {
    "zh-CN": "统一素材库",
    "en": "Shared media library"
  },
  "圖片影片任務": {
    "zh-CN": "图片视频任务",
    "en": "Image and video tasks"
  },
  "任務": {
    "zh-CN": "任务",
    "en": "Tasks"
  },
  "分鏡與棚來源": {
    "zh-CN": "分镜与棚来源",
    "en": "Storyboard and studio sources"
  },
  "來源": {
    "zh-CN": "来源",
    "en": "Sources"
  },
  "開啟攝影棚": {
    "zh-CN": "开启摄影棚",
    "en": "Open studio"
  },
  "创建空图片框": {
    "zh-CN": "创建空图片框",
    "en": "Create empty image card"
  },
  "空图片框": {
    "zh-CN": "空图片框",
    "en": "Empty image card"
  },
  "创建空视频框": {
    "zh-CN": "创建空视频框",
    "en": "Create empty video card"
  },
  "影片任務": {
    "zh-CN": "视频任务",
    "en": "Video task"
  },
  "创建文字节点": {
    "zh-CN": "创建文字节点",
    "en": "Create text node"
  },
  "文字节点": {
    "zh-CN": "文字节点",
    "en": "Text node"
  },
  "更多节点": {
    "zh-CN": "更多节点",
    "en": "More nodes"
  },
  "导入本地素材": {
    "zh-CN": "导入本地素材",
    "en": "Import local media"
  },
  "导入": {
    "zh-CN": "导入",
    "en": "Import"
  },
  "查找节点": {
    "zh-CN": "查找节点",
    "en": "Find node"
  },
  "查找": {
    "zh-CN": "查找",
    "en": "Find"
  },
  "支持格式与导入限额": {
    "zh-CN": "支持格式与导入限额",
    "en": "Supported formats and import limits"
  },
  "关闭节点列表": {
    "zh-CN": "关闭节点列表",
    "en": "Close node list"
  },
  "搜索节点": {
    "zh-CN": "搜索节点",
    "en": "Search nodes"
  },
  "编号或名称": {
    "zh-CN": "编号或名称",
    "en": "Code or name"
  },
  "节点画布": {
    "zh-CN": "节点画布",
    "en": "Node canvas"
  },
  "箭頭選取": {
    "zh-CN": "箭头选取",
    "en": "Arrow selection"
  },
  "箭頭": {
    "zh-CN": "箭头",
    "en": "Arrow"
  },
  "手掌平移": {
    "zh-CN": "手掌平移",
    "en": "Hand panning"
  },
  "手掌": {
    "zh-CN": "手掌",
    "en": "Hand"
  },
  "已重新读取当前图；不会自动重试命令": {
    "zh-CN": "已重新读取当前图；不会自动重试命令",
    "en": "Current graph reloaded. Commands will not be retried automatically."
  },
  "重新读取": {
    "zh-CN": "重新读取",
    "en": "Reload"
  },
  "撤销最近图编辑": {
    "zh-CN": "撤销最近图编辑",
    "en": "Undo latest graph edit"
  },
  "撤銷 ·": {
    "zh-CN": "撤销 ·",
    "en": "Undo ·"
  },
  "未綁定": {
    "zh-CN": "未绑定",
    "en": "Unbound"
  },
  "↶ 撤銷": {
    "zh-CN": "↶ 撤销",
    "en": "↶ Undo"
  },
  "重做": {
    "zh-CN": "重做",
    "en": "Redo"
  },
  "重做 ·": {
    "zh-CN": "重做 ·",
    "en": "Redo ·"
  },
  "↷ 重做": {
    "zh-CN": "↷ 重做",
    "en": "↷ Redo"
  },
  "排列選取節點": {
    "zh-CN": "排列选取节点",
    "en": "Arrange selected nodes"
  },
  "排列全部節點": {
    "zh-CN": "排列全部节点",
    "en": "Arrange all nodes"
  },
  "排列選取": {
    "zh-CN": "排列选取",
    "en": "Arrange selected"
  },
  "排列全部": {
    "zh-CN": "排列全部",
    "en": "Arrange all"
  },
  "适应全部节点": {
    "zh-CN": "适应全部节点",
    "en": "Fit all nodes"
  },
  "键盘连线": {
    "zh-CN": "键盘连线",
    "en": "Keyboard connection"
  },
  "参考用途": {
    "zh-CN": "参考用途",
    "en": "Reference role"
  },
  "拖线参考用途": {
    "zh-CN": "拖线参考用途",
    "en": "Drag connection role"
  },
  "收起属性": {
    "zh-CN": "收起属性",
    "en": "Collapse properties"
  },
  "展开属性": {
    "zh-CN": "展开属性",
    "en": "Expand properties"
  },
  "已選": {
    "zh-CN": "已选",
    "en": "Selected"
  },
  "個素材，點選目標任務追加；Esc 取消。": {
    "zh-CN": "个素材，点选目标任务追加；Esc 取消。",
    "en": "media items. Click a target task to append them; Esc cancels."
  },
  "取消連接": {
    "zh-CN": "取消连接",
    "en": "Cancel connection"
  },
  "選片順序已套用 · 請手動保存": {
    "zh-CN": "选片顺序已应用 · 请手动保存",
    "en": "Video order applied · Save manually"
  },
  "創作畫布": {
    "zh-CN": "创作画布",
    "en": "Creative canvas"
  },
  "请将连线放到明确的输入端口；也可使用「键盘连线」": {
    "zh-CN": "请将连线放到明确的输入端口；也可使用「键盘连线」",
    "en": "Drop the connection on an explicit input port, or use Keyboard connection"
  },
  "按 Enter 选中节点；方向键移动，Shift 加速。使用顶部键盘连线建立依赖。": {
    "zh-CN": "按 Enter 选中节点；方向键移动，Shift 加速。使用顶部键盘连线建立依赖。",
    "en": "Enter selects a node. Arrow keys move it; Shift accelerates. Use Keyboard connection above to establish dependencies."
  },
  "适应全部": {
    "zh-CN": "适应全部",
    "en": "Fit all"
  },
  "放大": {
    "zh-CN": "放大",
    "en": "Zoom in"
  },
  "缩小": {
    "zh-CN": "缩小",
    "en": "Zoom out"
  },
  "切换交互": {
    "zh-CN": "切换交互",
    "en": "Toggle interaction"
  },
  "開始創作": {
    "zh-CN": "开始创作",
    "en": "Start creating"
  },
  "從一個素材開始": {
    "zh-CN": "从一个素材开始",
    "en": "Start with one reference"
  },
  "新增圖片框或文字，也可以導入素材、拖到畫布空白處。": {
    "zh-CN": "新增图片框或文字，也可以导入素材、拖到画布空白处。",
    "en": "Add an image card or text, import media, or drop it on blank canvas space."
  },
  "新增圖片框": {
    "zh-CN": "新增图片框",
    "en": "Add image card"
  },
  "導入素材": {
    "zh-CN": "导入素材",
    "en": "Import media"
  },
  "右鍵框／連線：快速操作 · 空白右鍵：新增 · Shift+F10 ·": {
    "zh-CN": "右键框／连线：快速操作 · 空白右键：新增 · Shift+F10 ·",
    "en": "Right-click card / connection: actions · Right-click blank space: add · Shift+F10 ·"
  },
  "箭頭：空白拖曳框選、Shift 增減選；拖框可群移": {
    "zh-CN": "箭头：空白拖曳框选、Shift 增减选；拖框可群移",
    "en": "Arrow: drag blank space to select; Shift adds / removes; drag selected cards as a group"
  },
  "手掌：拖曳平移畫布": {
    "zh-CN": "手掌：拖曳平移画布",
    "en": "Hand: drag to pan the canvas"
  },
  "连线与固定版本": {
    "zh-CN": "连线与固定版本",
    "en": "Connections and fixed versions"
  },
  "节点属性": {
    "zh-CN": "节点属性",
    "en": "Node properties"
  },
  "图概览": {
    "zh-CN": "图概览",
    "en": "Graph overview"
  },
  "v": {
    "zh-CN": "v",
    "en": "v"
  },
  "正在查看右鍵目標：": {
    "zh-CN": "正在查看右键目标：",
    "en": "Viewing context-menu target:"
  },
  "連線": {
    "zh-CN": "连线",
    "en": "Connection"
  },
  "。左鍵選取仍保留；在畫布左鍵選取可接管側欄。": {
    "zh-CN": "。左键选取仍保留；在画布左键选取可接管侧栏。",
    "en": ". Original selection is retained. Left-click the canvas to retarget the sidebar."
  },
  "内部身份": {
    "zh-CN": "内部身份",
    "en": "Internal identity"
  },
  "名稱與節點操作": {
    "zh-CN": "名称与节点操作",
    "en": "Name and node actions"
  },
  "节点名称": {
    "zh-CN": "节点名称",
    "en": "Node name"
  },
  "复制此框": {
    "zh-CN": "复制此框",
    "en": "Duplicate this card"
  },
  "删除此框": {
    "zh-CN": "删除此框",
    "en": "Delete this card"
  },
  "编辑完整原文": {
    "zh-CN": "编辑完整原文",
    "en": "Edit full original text"
  },
  "当前内容 v": {
    "zh-CN": "当前内容 v",
    "en": "Current content v"
  },
  "；旧连线仍保留创建时的文字版本。": {
    "zh-CN": "；旧连线仍保留创建时的文字版本。",
    "en": "; existing connections retain the text version from their creation."
  },
  "空输出没有媒体、runId 或 resultId。下游引用会明确显示「未就绪」。": {
    "zh-CN": "空输出没有媒体、runId 或 resultId。下游引用会明确显示「未就绪」。",
    "en": "Empty outputs have no media, runId or resultId. Downstream references explicitly show Not ready."
  },
  "用于": {
    "zh-CN": "用于",
    "en": "Use for"
  },
  "媒体信息": {
    "zh-CN": "媒体信息",
    "en": "Media information"
  },
  "编码": {
    "zh-CN": "编码",
    "en": "Codec"
  },
  "宽": {
    "zh-CN": "宽",
    "en": "Width"
  },
  "时长 ms": {
    "zh-CN": "时长 ms",
    "en": "Duration ms"
  },
  "采样率": {
    "zh-CN": "采样率",
    "en": "Sample rate"
  },
  "声道": {
    "zh-CN": "声道",
    "en": "Channels"
  },
  "帧率": {
    "zh-CN": "帧率",
    "en": "Frame rate"
  },
  "重新定位相同原文件": {
    "zh-CN": "重新定位相同原文件",
    "en": "Relocate identical original file"
  },
  "Shift 點選多支影片，直接在畫布指定順序並合併。": {
    "zh-CN": "Shift 点选多支视频，直接在画布指定顺序并合并。",
    "en": "Shift-select videos, then choose their order and merge on the canvas."
  },
  "输入与来源": {
    "zh-CN": "输入与来源",
    "en": "Inputs and sources"
  },
  "尚无输入连线": {
    "zh-CN": "尚无输入连线",
    "en": "No input connections yet"
  },
  "未就绪占位": {
    "zh-CN": "未就绪占位",
    "en": "Not-ready placeholder"
  },
  "固定文字 v": {
    "zh-CN": "固定文字 v",
    "en": "Fixed text v"
  },
  "固定媒体版本": {
    "zh-CN": "固定媒体版本",
    "en": "Fixed media version"
  },
  "来源已删除：": {
    "zh-CN": "来源已删除：",
    "en": "Source deleted:"
  },
  "· 请重新连接输入": {
    "zh-CN": "· 请重新连接输入",
    "en": "· Reconnect the input"
  },
  "来源或连线已明确删除": {
    "zh-CN": "来源或连线已明确删除",
    "en": "Source or connection explicitly deleted"
  },
  "已清除這條歷史斷開提示；有效素材和連線保留，可撤銷": {
    "zh-CN": "已清除这条历史断开提示；有效素材和连线保留，可撤销",
    "en": "Historical disconnect notice cleared. Valid media and links are preserved. Undo is available."
  },
  "清除已斷開提示": {
    "zh-CN": "清除已断开提示",
    "en": "Clear disconnected notice"
  },
  "关系": {
    "zh-CN": "关系",
    "en": "Relation"
  },
  "输入顺序": {
    "zh-CN": "输入顺序",
    "en": "Input order"
  },
  "解析状态": {
    "zh-CN": "解析状态",
    "en": "Resolution state"
  },
  "未就绪": {
    "zh-CN": "未就绪",
    "en": "Not ready"
  },
  "固定版本已解析": {
    "zh-CN": "固定版本已解析",
    "en": "Fixed version resolved"
  },
  "源端口": {
    "zh-CN": "源端口",
    "en": "Source port"
  },
  "目标端口": {
    "zh-CN": "目标端口",
    "en": "Target port"
  },
  "固定版本缺失 · 阻断": {
    "zh-CN": "固定版本缺失 · 阻断",
    "en": "Fixed version missing · Blocked"
  },
  "来源已有新版；此连线仍使用以上旧版。": {
    "zh-CN": "来源已有新版；此连线仍使用以上旧版。",
    "en": "Source has a newer version. This connection still uses the old version above."
  },
  "查看并确认换用新版": {
    "zh-CN": "查看并确认换用新版",
    "en": "Review and confirm new version"
  },
  "查看并确认换用已接受新版": {
    "zh-CN": "查看并确认换用已接受新版",
    "en": "Review and confirm accepted new version"
  },
  "更多連線操作": {
    "zh-CN": "更多连线操作",
    "en": "More connection actions"
  },
  "自由组织，本地保留": {
    "zh-CN": "自由组织，本地保留",
    "en": "Organize freely, keep locally"
  },
  "从左侧导入媒体或创建节点。输出端口在右，输入端口在左。连线保存用途与明确版本。": {
    "zh-CN": "从左侧导入媒体或创建节点。输出端口在右，输入端口在左。连线保存用途与明确版本。",
    "en": "Import media or create nodes on the left. Output ports are on the right; inputs on the left. Connections save explicit roles and versions."
  },
  "/100": {
    "zh-CN": "/100",
    "en": "/100"
  },
  "节点": {
    "zh-CN": "节点",
    "en": "nodes"
  },
  "/200": {
    "zh-CN": "/200",
    "en": "/200"
  },
  "因果边": {
    "zh-CN": "因果边",
    "en": "causal edges"
  },
  "三个独立概念": {
    "zh-CN": "三个独立概念",
    "en": "Three separate concepts"
  },
  "画布位置：组织空间": {
    "zh-CN": "画布位置：组织空间",
    "en": "Canvas position: organization in space"
  },
  "因果连线：输入与来源": {
    "zh-CN": "因果连线：输入与来源",
    "en": "Causal connections: inputs and sources"
  },
  "顺序草稿：音视频先后": {
    "zh-CN": "顺序草稿：音视频先后",
    "en": "Sequence draft: audiovisual order"
  },
  "在畫布中編輯素材與任務、合併影片。Codex 與你共用目前項目；明確可撤銷修改可直接執行，要求先提案時只提出草稿。": {
    "zh-CN": "在画布中编辑素材与任务、合并视频。Codex 与你共用目前项目；明确可撤销修改可直接执行，要求先提案时只提出草稿。",
    "en": "Edit media and tasks and merge videos on the canvas. Codex shares the current project. Explicit undoable changes can execute directly; when asked for a proposal, it only proposes a draft."
  },
  "成片的排序、裁切與音量在它自己的設定側欄。": {
    "zh-CN": "成片的排序、裁切与音量在它自己的设定侧栏。",
    "en": "Each film has its own order, trim and volume sidebar."
  },
  "原未保存影片記錄 · 不會重新生成": {
    "zh-CN": "原未保存视频记录 · 不会重新生成",
    "en": "Original unsaved video record · No regeneration"
  },
  "原影片已保留": {
    "zh-CN": "原视频已保留",
    "en": "Original video retained"
  },
  "原任務可恢復下載": {
    "zh-CN": "原任务可恢复下载",
    "en": "Original task download can resume"
  },
  "原提交未知，已阻止重送": {
    "zh-CN": "原提交未知，已阻止重送",
    "en": "Original submission unknown; resubmission blocked"
  },
  "查看原任務": {
    "zh-CN": "查看原任务",
    "en": "View original task"
  },
  "节点 ·": {
    "zh-CN": "节点 ·",
    "en": "nodes ·"
  },
  "边 ·": {
    "zh-CN": "边 ·",
    "en": "edges ·"
  },
  "已选": {
    "zh-CN": "已选",
    "en": "selected"
  },
  "已删节点": {
    "zh-CN": "已删节点",
    "en": "Deleted node"
  },
  "有未确认提示词": {
    "zh-CN": "有未确认提示词",
    "en": "Unconfirmed prompt"
  },
  "返回编辑": {
    "zh-CN": "返回编辑",
    "en": "Return to editing"
  },
  "明确放弃草稿": {
    "zh-CN": "明确放弃草稿",
    "en": "Discard draft explicitly"
  },
  "查看明确媒体版本": {
    "zh-CN": "查看明确媒体版本",
    "en": "View exact media version"
  },
  "方舟原始結果": {
    "zh-CN": "方舟原始结果",
    "en": "Original Ark result"
  },
  "BytePlus 原始結果": {
    "zh-CN": "BytePlus 原始结果",
    "en": "Original BytePlus result"
  },
  "結果來源請見版本記錄": {
    "zh-CN": "结果来源请见版本记录",
    "en": "See version records for result provenance"
  },
  "· 已記錄查看，未自動接受": {
    "zh-CN": "· 已记录查看，未自动接受",
    "en": "· Viewed; not accepted automatically"
  },
  "本地參考素材": {
    "zh-CN": "本地参考素材",
    "en": "Local reference media"
  },
  "返回画布": {
    "zh-CN": "返回画布",
    "en": "Return to canvas"
  },
  "已接受明确结果版本；下游未自动运行": {
    "zh-CN": "已接受明确结果版本；下游未自动运行",
    "en": "Exact result version accepted. Downstream tasks were not run automatically."
  },
  "保留技术草稿。空输出尚无媒体；由服务提供结果后才可解析。": {
    "zh-CN": "保留技术草稿。空输出尚无媒体；由服务提供结果后才可解析。",
    "en": "Technical draft retained. Empty outputs have no media until a service provides a result."
  },
  "手动备份与新目录恢复": {
    "zh-CN": "手动备份与新目录恢复",
    "en": "Manual backup and restore to a new folder"
  },
  "当前目录：": {
    "zh-CN": "当前目录：",
    "en": "Current folder:"
  },
  "。備份只捕獲已提交整庫版本 r": {
    "zh-CN": "。备份只捕获已提交整库版本 r",
    "en": ". Backup captures only the committed library revision r"
  },
  "，不会暗存未保存编辑。": {
    "zh-CN": "，不会暗存未保存编辑。",
    "en": "; unsaved edits are not saved implicitly."
  },
  "已核验备份：图、媒体、文字与运行历史完整": {
    "zh-CN": "已核验备份：图、媒体、文字与运行历史完整",
    "en": "Backup verified: graph, media, text and run history are complete"
  },
  "備份已保存整庫": {
    "zh-CN": "备份已保存整库",
    "en": "Back up saved library"
  },
  "独立备份目录": {
    "zh-CN": "独立备份目录",
    "en": "Separate backup folder"
  },
  "已恢复并核验到全新目录；原项目保留": {
    "zh-CN": "已恢复并核验到全新目录；原项目保留",
    "en": "Restored and verified in a new folder. Original project preserved."
  },
  "恢复到新目录": {
    "zh-CN": "恢复到新目录",
    "en": "Restore to new folder"
  },
  "恢复副本已就绪": {
    "zh-CN": "恢复副本已就绪",
    "en": "Restored copy ready"
  },
  "新目录：": {
    "zh-CN": "新目录：",
    "en": "New folder:"
  },
  "打開副本會切換此視窗的工程。請先保存目前修改並套用裁切／文字草稿。": {
    "zh-CN": "打开副本会切换此视窗的工程。请先保存目前修改并应用裁切／文字草稿。",
    "en": "Opening the copy switches the project in this window. Save current changes and apply trim / text drafts first."
  },
  "留在当前项目": {
    "zh-CN": "留在当前项目",
    "en": "Stay in current project"
  },
  "打开恢复副本": {
    "zh-CN": "打开恢复副本",
    "en": "Open restored copy"
  },
  "完整提示词 / 文本原文": {
    "zh-CN": "完整提示词 / 文本原文",
    "en": "Full prompt / original text"
  },
  "保留完整原文与换行。确认编辑创建新版本；现有连线仍固定原文字，须另行确认换版。": {
    "zh-CN": "保留完整原文与换行。确认编辑创建新版本；现有连线仍固定原文字，须另行确认换版。",
    "en": "Original text and line breaks are preserved. Confirming creates a new version. Existing connections retain the old text until explicitly updated."
  },
  "完整提示词原文": {
    "zh-CN": "完整提示词原文",
    "en": "Full original prompt"
  },
  "/ 32000 字符": {
    "zh-CN": "/ 32000 字符",
    "en": "/ 32000 characters"
  },
  "草稿尚未确认": {
    "zh-CN": "草稿尚未确认",
    "en": "Draft unconfirmed"
  },
  "当前版本原文": {
    "zh-CN": "当前版本原文",
    "en": "Current version’s original text"
  },
  "关联用途": {
    "zh-CN": "关联用途",
    "en": "Linked role"
  },
  "· 固定 v": {
    "zh-CN": "· 固定 v",
    "en": "· Fixed v"
  },
  "文字已确认；现有连线继续固定旧版。请手动保存": {
    "zh-CN": "文字已确认；现有连线继续固定旧版。请手动保存",
    "en": "Text confirmed. Existing connections retain the old version. Save manually."
  },
  "确认文字版本": {
    "zh-CN": "确认文字版本",
    "en": "Confirm text version"
  },
  "保留还是放弃文字草稿": {
    "zh-CN": "保留还是放弃文字草稿",
    "en": "Keep or discard text draft"
  },
  "尚未确认的文字不会进入画布保存。": {
    "zh-CN": "尚未确认的文字不会进入画布保存。",
    "en": "Unconfirmed text is not included when saving the canvas."
  },
  "批量導入本地素材": {
    "zh-CN": "批量导入本地素材",
    "en": "Batch import local media"
  },
  "請在批量導入面板取消剩餘或按完成；成功項保留。": {
    "zh-CN": "请在批量导入面板取消剩余或按完成；成功项保留。",
    "en": "Cancel remaining files or finish in the batch import panel. Successful items are preserved."
  },
  "预览原字节重新定位": {
    "zh-CN": "预览原字节重新定位",
    "en": "Preview original-byte relocation"
  },
  "预览并确认导入": {
    "zh-CN": "预览并确认导入",
    "en": "Preview and confirm import"
  },
  "MiB": {
    "zh-CN": "MiB",
    "en": "MiB"
  },
  "已检查文件内容与实际解码。确认前只暂存；不会上传素材。": {
    "zh-CN": "已检查文件内容与实际解码。确认前只暂存；不会上传素材。",
    "en": "File content and actual decoding were checked. Files are staged until confirmation. Nothing is uploaded."
  },
  "重新定位要求与原 SHA256 一致。": {
    "zh-CN": "重新定位要求与原 SHA256 一致。",
    "en": "Relocation requires the original SHA256."
  },
  "确认后写入本候选的独立媒体仓库。": {
    "zh-CN": "确认后写入本候选的独立媒体仓库。",
    "en": "Confirmation writes to this candidate’s isolated media store."
  },
  "取消导入": {
    "zh-CN": "取消导入",
    "en": "Cancel import"
  },
  "原媒体已重新定位": {
    "zh-CN": "原媒体已重新定位",
    "en": "Original media relocated"
  },
  "素材已导入独立仓库 · 请手动保存": {
    "zh-CN": "素材已导入独立仓库 · 请手动保存",
    "en": "Media imported into isolated store · Save manually"
  },
  "确认重新定位": {
    "zh-CN": "确认重新定位",
    "en": "Confirm relocation"
  },
  "确认导入": {
    "zh-CN": "确认导入",
    "en": "Confirm import"
  },
  "键盘连线 · 与拖线共用校验": {
    "zh-CN": "键盘连线 · 与拖线共用校验",
    "en": "Keyboard connection · Same validation as dragging"
  },
  "先选来源输出，再选目标输入；端口身份、类型、用途、输入顺序分别保存。": {
    "zh-CN": "先选来源输出，再选目标输入；端口身份、类型、用途、输入顺序分别保存。",
    "en": "Choose source output, then target input. Port identity, type, role and input order are saved separately."
  },
  "来源节点": {
    "zh-CN": "来源节点",
    "en": "Source node"
  },
  "请选择": {
    "zh-CN": "请选择",
    "en": "Choose"
  },
  "输出端口": {
    "zh-CN": "输出端口",
    "en": "Output port"
  },
  "目标节点": {
    "zh-CN": "目标节点",
    "en": "Target node"
  },
  "输入端口": {
    "zh-CN": "输入端口",
    "en": "Input port"
  },
  "连接用途": {
    "zh-CN": "连接用途",
    "en": "Connection role"
  },
  "输入顺序（从 0 开始）": {
    "zh-CN": "输入顺序（从 0 开始）",
    "en": "Input order (starting at 0)"
  },
  "不兼容端口、自连、循环或超限会明确拒绝，保留原图。": {
    "zh-CN": "不兼容端口、自连、循环或超限会明确拒绝，保留原图。",
    "en": "Incompatible ports, self-links, cycles and excess limits are rejected explicitly. Original graph is preserved."
  },
  "建立依赖": {
    "zh-CN": "建立依赖",
    "en": "Create dependency"
  },
  "确认删除及依赖影响": {
    "zh-CN": "确认删除及依赖影响",
    "en": "Confirm deletion and dependency impact"
  },
  "將刪除": {
    "zh-CN": "将删除",
    "en": "This will delete"
  },
  "個框與": {
    "zh-CN": "个框与",
    "en": "cards and"
  },
  "條關聯連線，影響": {
    "zh-CN": "条关联连线，影响",
    "en": "linked connections, affecting"
  },
  "個任務。": {
    "zh-CN": "个任务。",
    "en": "tasks."
  },
  "確認後解除引用；已完成影片、不可變生成紀錄與原媒體保留。可整筆撤銷。": {
    "zh-CN": "确认后解除引用；已完成视频、不可变生成纪录与原媒体保留。可整笔撤销。",
    "en": "Confirmation removes references. Completed videos, immutable generation records and original media are preserved. Undo is atomic."
  },
  "受影響任務：": {
    "zh-CN": "受影响任务：",
    "en": "Affected tasks:"
  },
  "已明確刪除並解除引用；原結果保留，可整筆撤銷": {
    "zh-CN": "已明确删除并解除引用；原结果保留，可整笔撤销",
    "en": "Explicitly deleted and references removed. Original results preserved. Undo is atomic."
  },
  "确认删除": {
    "zh-CN": "确认删除",
    "en": "Confirm deletion"
  },
  "确认固定输入换版": {
    "zh-CN": "确认固定输入换版",
    "en": "Confirm fixed input version update"
  },
  "当前固定版本": {
    "zh-CN": "当前固定版本",
    "en": "Current fixed version"
  },
  "将换为来源当前已确认版": {
    "zh-CN": "将换为来源当前已确认版",
    "en": "Will use the source’s current confirmed version"
  },
  "来源没有已接受版本，将阻止换版": {
    "zh-CN": "来源没有已接受版本，将阻止换版",
    "en": "Source has no accepted version. Update will be blocked."
  },
  "只修改这一条连线，其他分支继续使用各自固定版本。": {
    "zh-CN": "只修改这一条连线，其他分支继续使用各自固定版本。",
    "en": "Only this connection changes. Other branches retain their own fixed versions."
  },
  "保留原版": {
    "zh-CN": "保留原版",
    "en": "Keep original version"
  },
  "已明确确认此连线换用当前版本，并复核本节点其余固定输入": {
    "zh-CN": "已明确确认此连线换用当前版本，并复核本节点其余固定输入",
    "en": "I explicitly confirm this connection’s current version and reviewed this node’s other fixed inputs"
  },
  "此连线已明确换版；旧运行与结果保留 · 请手动保存": {
    "zh-CN": "此连线已明确换版；旧运行与结果保留 · 请手动保存",
    "en": "Connection version explicitly updated. Old runs and results preserved · Save manually"
  },
  "确认换用当前版": {
    "zh-CN": "确认换用当前版",
    "en": "Confirm current version"
  },
  "素材库 · 隔离演示": {
    "zh-CN": "素材库 · 隔离演示",
    "en": "Media library · Isolated demo"
  },
  "摄影棚 · 尚未接入": {
    "zh-CN": "摄影棚 · 尚未接入",
    "en": "Studio · Not integrated"
  },
  "支持格式与隔离限额": {
    "zh-CN": "支持格式与隔离限额",
    "en": "Supported formats and isolation limits"
  },
  "这里只查看当前 C3 项目媒体，不连接已有正式素材库。": {
    "zh-CN": "这里只查看当前 C3 项目媒体，不连接已有正式素材库。",
    "en": "Shows media from the current C3 project only; no existing production library is connected."
  },
  "尚未导入媒体。": {
    "zh-CN": "尚未导入媒体。",
    "en": "No media imported yet."
  },
  "保留摄影棚入口，待 C6 接回原模块": {
    "zh-CN": "保留摄影棚入口，待 C6 接回原模块",
    "en": "Studio entry retained until C6 integration"
  },
  "当前不连接或操作现有摄影棚窗口。这里没有真实 3D 构图、套用或生成能力。": {
    "zh-CN": "当前不连接或操作现有摄影棚窗口。这里没有真实 3D 构图、应用或生成能力。",
    "en": "No existing studio window is connected or controlled here. No real 3D composition, application or generation is available at this entry."
  },
  "格式": {
    "zh-CN": "格式",
    "en": "Format"
  },
  "单文件与解码限制": {
    "zh-CN": "单文件与解码限制",
    "en": "Per-file and decode limits"
  },
  "PNG / JPEG / 静态 WebP": {
    "zh-CN": "PNG / JPEG / 静态 WebP",
    "en": "PNG / JPEG / static WebP"
  },
  "32 MiB · 每边 8192 · 总像素 24 MP；拒绝动画": {
    "zh-CN": "32 MiB · 每边 8192 · 总像素 24 MP；拒绝动画",
    "en": "32 MiB · 8192 per side · 24 MP total; animation rejected"
  },
  "MP4：H.264 8bit，可选 AAC": {
    "zh-CN": "MP4：H.264 8bit，可选 AAC",
    "en": "MP4: H.264 8-bit, optional AAC"
  },
  "128 MiB · 120 秒 · 3840×2160 · 60 fps": {
    "zh-CN": "128 MiB · 120 秒 · 3840×2160 · 60 fps",
    "en": "128 MiB · 120 seconds · 3840×2160 · 60 fps"
  },
  "PCM16/24 WAV / MP3": {
    "zh-CN": "PCM16/24 WAV / MP3",
    "en": "PCM16/24 WAV / MP3"
  },
  "64 MiB · 10 分钟 · 双声道 · 8–48 kHz": {
    "zh-CN": "64 MiB · 10 分钟 · 双声道 · 8–48 kHz",
    "en": "64 MiB · 10 minutes · Stereo · 8–48 kHz"
  },
  "UTF-8 TXT": {
    "zh-CN": "UTF-8 TXT",
    "en": "UTF-8 TXT"
  },
  "256 KiB · 单节点 32000 字符；拒绝二进制": {
    "zh-CN": "256 KiB · 单节点 32000 字符；拒绝二进制",
    "en": "256 KiB · 32000 characters per node; binary rejected"
  },
  "唯一媒体总量 ≤256 MiB；每張畫布 ≤8 MiB；整庫提交載荷 ≤32 MiB；100 节点 / 200 边。单文件探测、完整解码各最多 10 秒。按扩展名、内容签名、编码与解码交叉校验。": {
    "zh-CN": "唯一媒体总量 ≤256 MiB；每张画布 ≤8 MiB；整库提交载荷 ≤32 MiB；100 节点 / 200 边。单文件探测、完整解码各最多 10 秒。按扩展名、内容签名、编码与解码交叉校验。",
    "en": "Unique media ≤256 MiB; canvas payload ≤8 MiB; library commit payload ≤32 MiB; 100 nodes / 200 edges. Probe and full decode each have a 10-second limit. Extension, signature, codec and decoding are cross-checked."
  },
  "不自动下载 URL，不接收 SVG / HTML / GIF / HEVC，不自动转码。": {
    "zh-CN": "不自动下载 URL，不接收 SVG / HTML / GIF / HEVC，不自动转码。",
    "en": "No automatic URL downloads, SVG / HTML / GIF / HEVC input, or automatic transcoding."
  },
  "畫布影片合併順序": {
    "zh-CN": "画布视频合并顺序",
    "en": "Canvas video merge order"
  },
  "合併": {
    "zh-CN": "合并",
    "en": "Merge"
  },
  "支已完成影片": {
    "zh-CN": "支已完成视频",
    "en": "completed videos"
  },
  "請指定先後；一般連線和位置不決定播放順序": {
    "zh-CN": "请指定先后；一般连线和位置不决定播放顺序",
    "en": "Choose the order explicitly; ordinary connections and positions do not determine playback order"
  },
  "合併採用下列明確順序": {
    "zh-CN": "合并采用下列明确顺序",
    "en": "Merge uses this explicit order"
  },
  "合併順序上移": {
    "zh-CN": "合并顺序上移",
    "en": "Move up in merge order"
  },
  "合併順序下移": {
    "zh-CN": "合并顺序下移",
    "en": "Move down in merge order"
  },
  "第": {
    "zh-CN": "第",
    "en": "Clip"
  },
  "支：": {
    "zh-CN": "支：",
    "en": ":"
  },
  "一鍵合併成新節點": {
    "zh-CN": "一键合并成新节点",
    "en": "Merge into a new node"
  },
  "先套用現有裁切草稿，再合併。": {
    "zh-CN": "先应用现有裁切草稿，再合并。",
    "en": "Apply the existing trim draft before merging."
  },
  "来源": {
    "zh-CN": "来源",
    "en": "Source"
  },
  "只用框内提示词": {
    "zh-CN": "只用框内提示词",
    "en": "Inline prompt only"
  },
  "只用外部文字": {
    "zh-CN": "只用外部文字",
    "en": "External text only"
  },
  "外部文字 → 框内提示词": {
    "zh-CN": "外部文字 → 框内提示词",
    "en": "External text → Inline prompt"
  },
  "框内提示词 → 外部文字": {
    "zh-CN": "框内提示词 → 外部文字",
    "en": "Inline prompt → External text"
  },
  "任務進行中": {
    "zh-CN": "任务进行中",
    "en": "Task in progress"
  },
  "任務完成": {
    "zh-CN": "任务完成",
    "en": "Task completed"
  },
  "任務失敗": {
    "zh-CN": "任务失败",
    "en": "Task failed"
  },
  "已停止": {
    "zh-CN": "已停止",
    "en": "Stopped"
  },
  "狀態未知": {
    "zh-CN": "状态未知",
    "en": "Unknown state"
  },
  "媒体无法读取": {
    "zh-CN": "媒体无法读取",
    "en": "Media unreadable"
  },
  "检查来源或重新定位原文件": {
    "zh-CN": "检查来源或重新定位原文件",
    "en": "Check the source or relocate the original file"
  },
  "文字版本缺失": {
    "zh-CN": "文字版本缺失",
    "en": "Text version missing"
  },
  "视频任务": {
    "zh-CN": "视频任务",
    "en": "Video task"
  },
  "图片任务": {
    "zh-CN": "图片任务",
    "en": "Image task"
  },
  "空输出": {
    "zh-CN": "空输出",
    "en": "Empty output"
  },
  "参考素材": {
    "zh-CN": "参考素材",
    "en": "Reference media"
  },
  "框内写提示词": {
    "zh-CN": "框内写提示词",
    "en": "Write prompt in card"
  },
  "影片設定": {
    "zh-CN": "视频设定",
    "en": "Video settings"
  },
  "查看版本": {
    "zh-CN": "查看版本",
    "en": "View versions"
  },
  "编辑文字": {
    "zh-CN": "编辑文字",
    "en": "Edit text"
  },
  "放大预览": {
    "zh-CN": "放大预览",
    "en": "Expand preview"
  },
  "空白文字 · 双击编辑": {
    "zh-CN": "空白文字 · 双击编辑",
    "en": "Blank text · Double-click to edit"
  },
  "媒体缺失或损坏": {
    "zh-CN": "媒体缺失或损坏",
    "en": "Media missing or damaged"
  },
  "HTTP 模擬示例": {
    "zh-CN": "HTTP 模拟示例",
    "en": "HTTP simulation example"
  },
  "離線測試示例": {
    "zh-CN": "离线测试示例",
    "en": "Offline test example"
  },
  "空视频框": {
    "zh-CN": "空视频框",
    "en": "Empty video card"
  },
  "選首幀或首尾幀": {
    "zh-CN": "选择视频方式并填写需求",
    "en": "Choose a video mode and describe motion"
  },
  "写提示词，或连接参考素材": {
    "zh-CN": "写提示词，或连接参考素材",
    "en": "Write a prompt or connect reference media"
  },
  "等待结果": {
    "zh-CN": "等待结果",
    "en": "Awaiting result"
  },
  "写提示词": {
    "zh-CN": "写提示词",
    "en": "Write prompt"
  },
  "生成中": {
    "zh-CN": "生成中",
    "en": "Generating"
  },
  "測試中": {
    "zh-CN": "测试中",
    "en": "Testing"
  },
  "· 已选": {
    "zh-CN": "· 已选",
    "en": "· Selected"
  },
  "· 候选": {
    "zh-CN": "· 候选",
    "en": "· Candidate"
  },
  "未运行": {
    "zh-CN": "未运行",
    "en": "Not run"
  },
  "完整原文": {
    "zh-CN": "完整原文",
    "en": "Full original text"
  },
  "参考": {
    "zh-CN": "参考",
    "en": "Reference"
  },
  "本支 2.5 首幀影片 · Owner效果合格": {
    "zh-CN": "本支 2.5 首帧视频 · Owner效果合格",
    "en": "This 2.5 first-frame video · Owner accepted its visual result"
  },
  "项依赖待复核": {
    "zh-CN": "项依赖待复核",
    "en": "dependencies need review"
  },
  "查看": {
    "zh-CN": "查看",
    "en": "View"
  },
  "输入": {
    "zh-CN": "输入",
    "en": "Input"
  },
  "输出": {
    "zh-CN": "输出",
    "en": "Output"
  },
  "快捷提示词编辑": {
    "zh-CN": "快捷提示词编辑",
    "en": "Quick prompt editor"
  },
  "框内提示词": {
    "zh-CN": "框内提示词",
    "en": "Inline prompt"
  },
  "取消框内编辑": {
    "zh-CN": "取消框内编辑",
    "en": "Cancel inline edit"
  },
  "完整原文 ·": {
    "zh-CN": "完整原文 ·",
    "en": "Full original text ·"
  },
  "/32000": {
    "zh-CN": "/32000",
    "en": "/32000"
  },
  "确认提示词": {
    "zh-CN": "确认提示词",
    "en": "Confirm prompt"
  },
  "生成节点检查": {
    "zh-CN": "生成节点检查",
    "en": "Generation node inspector"
  },
  "运行": {
    "zh-CN": "运行",
    "en": "Runs"
  },
  "在框内编辑提示词": {
    "zh-CN": "在框内编辑提示词",
    "en": "Edit prompt inside card"
  },
  "框内尚未填写提示词": {
    "zh-CN": "框内尚未填写提示词",
    "en": "No inline prompt yet"
  },
  "提示词来源": {
    "zh-CN": "提示词来源",
    "en": "Prompt source"
  },
  "确认来源策略": {
    "zh-CN": "确认来源策略",
    "en": "Confirm source policy"
  },
  "实际有效完整提示词": {
    "zh-CN": "实际有效完整提示词",
    "en": "Full effective prompt"
  },
  "（无有效文字）": {
    "zh-CN": "（无有效文字）",
    "en": "(No effective text)"
  },
  "按所选顺序各使用一次；相同完整原文去重。未确认草稿不参与。": {
    "zh-CN": "按所选顺序各使用一次；相同完整原文去重。未确认草稿不参与。",
    "en": "Use each source once in the selected order; identical full texts are deduplicated. Unconfirmed drafts are excluded."
  },
  "主动模拟": {
    "zh-CN": "主动模拟",
    "en": "Run simulation"
  },
  "本地示例，不按提示词实际生成": {
    "zh-CN": "本地示例，不按提示词实际生成",
    "en": "Local example; not generated from the prompt"
  },
  "模拟情景": {
    "zh-CN": "模拟情景",
    "en": "Simulation scenario"
  },
  "成功并提供本地示例": {
    "zh-CN": "成功并提供本地示例",
    "en": "Success with local example"
  },
  "等待5秒，可取消/编辑": {
    "zh-CN": "等待5秒，可取消/编辑",
    "en": "Wait 5 seconds; cancel / edit allowed"
  },
  "模拟失败": {
    "zh-CN": "模拟失败",
    "en": "Simulated failure"
  },
  "模拟提交状态未知": {
    "zh-CN": "模拟提交状态未知",
    "en": "Simulated unknown submission"
  },
  "端口与连线保存用途和固定版本。点击下方来源可查看绑定，逐边确认换版。": {
    "zh-CN": "端口与连线保存用途和固定版本。点击下方来源可查看绑定，逐边确认换版。",
    "en": "Ports and connections save roles and fixed versions. Inspect bindings below and confirm each version change separately."
  },
  "已删来源": {
    "zh-CN": "已删来源",
    "en": "Deleted source"
  },
  "有效输入已变化": {
    "zh-CN": "有效输入已变化",
    "en": "Effective input changed"
  },
  "来源已断开": {
    "zh-CN": "来源已断开",
    "en": "Source disconnected"
  },
  "上游有新版，固定旧版待复核": {
    "zh-CN": "上游有新版，固定旧版待复核",
    "en": "Upstream has a newer version; fixed old version needs review"
  },
  "已断开": {
    "zh-CN": "已断开",
    "en": "Disconnected"
  },
  "本节点": {
    "zh-CN": "本节点",
    "en": "This node"
  },
  "明确保留当前固定输入与旧结果，已复核这次变化": {
    "zh-CN": "明确保留当前固定输入与旧结果，已复核这次变化",
    "en": "I explicitly retain the fixed inputs and old result and reviewed this change"
  },
  "保留当前输入与旧结果": {
    "zh-CN": "保留当前输入与旧结果",
    "en": "Keep current inputs and old result"
  },
  "没有待复核的依赖": {
    "zh-CN": "没有待复核的依赖",
    "en": "No dependencies need review"
  },
  "查看、接受与选作下游是分别记录的决定。现有连线不会暗换版。": {
    "zh-CN": "查看、接受与选作下游是分别记录的决定。现有连线不会暗换版。",
    "en": "Viewing, accepting and selecting downstream are separate decisions. Existing connections never change versions silently."
  },
  "还没有结果。请先主动模拟。": {
    "zh-CN": "还没有结果。请先主动模拟。",
    "en": "No results yet. Start a simulation explicitly."
  },
  "预览版本": {
    "zh-CN": "预览版本",
    "en": "Preview version"
  },
  "· 下游所选": {
    "zh-CN": "· 下游所选",
    "en": "· Selected downstream"
  },
  "已接受": {
    "zh-CN": "已接受",
    "en": "Accepted"
  },
  "待查看/接受": {
    "zh-CN": "待查看/接受",
    "en": "Awaiting review / acceptance"
  },
  "· 模拟示例": {
    "zh-CN": "· 模拟示例",
    "en": "· Simulation example"
  },
  "选作下游": {
    "zh-CN": "选作下游",
    "en": "Use downstream"
  },
  "尚未运行；编辑不会自动执行。": {
    "zh-CN": "尚未运行；编辑不会自动执行。",
    "en": "Not run. Editing never executes automatically."
  },
  "查询原模拟": {
    "zh-CN": "查询原模拟",
    "en": "Query original simulation"
  },
  "停止此模拟": {
    "zh-CN": "停止此模拟",
    "en": "Stop this simulation"
  },
  "原記錄代碼：": {
    "zh-CN": "原记录代码：",
    "en": "Original record code:"
  },
  "工程替身，非真實生成。": {
    "zh-CN": "离线模拟，非真实生成。",
    "en": "Offline simulation, not live generation."
  },
  "BytePlus原操作；費用依帳單。": {
    "zh-CN": "BytePlus原操作；费用依帐单。",
    "en": "Original BytePlus operation; charges follow the provider bill."
  },
  "不會重新生成；原畫布不會被自動重建或保存。": {
    "zh-CN": "不会重新生成；原画布不会被自动重建或保存。",
    "en": "No regeneration. Original canvas is not recreated or saved automatically."
  },
  "核對原失敗記錄": {
    "zh-CN": "核对原失败记录",
    "en": "Reconcile original failed record"
  },
  "接回已核對原結果": {
    "zh-CN": "接回已核对原结果",
    "en": "Receive verified original result"
  },
  "查看並取回原任務": {
    "zh-CN": "查看并取回原任务",
    "en": "View and recover original task"
  },
  "把原結果加入畫布": {
    "zh-CN": "把原结果加入画布",
    "en": "Add original result to canvas"
  },
  "原嘗試：": {
    "zh-CN": "原尝试：",
    "en": "Original attempt:"
  },
  "型號未記錄": {
    "zh-CN": "型号未记录",
    "en": "Model not recorded"
  },
  "建立時間未記錄": {
    "zh-CN": "建立时间未记录",
    "en": "Creation time not recorded"
  },
  "查看同節點": {
    "zh-CN": "查看同节点",
    "en": "View this node’s"
  },
  "個不同嘗試": {
    "zh-CN": "个不同尝试",
    "en": "distinct attempts"
  },
  "期限與安全錯誤細節": {
    "zh-CN": "期限与安全错误细节",
    "en": "Deadlines and safe error details"
  },
  "原taskId截止：": {
    "zh-CN": "原taskId截止：",
    "en": "Original taskId deadline:"
  },
  "Draft截止：": {
    "zh-CN": "Draft截止：",
    "en": "Draft deadline:"
  },
  "回報執行截止：": {
    "zh-CN": "回报执行截止：",
    "en": "Reported execution deadline:"
  },
  "媒體URL截止：": {
    "zh-CN": "媒体URL截止：",
    "en": "Media URL deadline:"
  },
  "已記錄HTTP：": {
    "zh-CN": "已记录HTTP：",
    "en": "Recorded HTTP:"
  },
  "未記錄": {
    "zh-CN": "未记录",
    "en": "Not recorded"
  },
  "· 階段：": {
    "zh-CN": "· 阶段：",
    "en": "· Phase:"
  },
  "原任務查詢，非媒體下載": {
    "zh-CN": "原任务查询，非媒体下载",
    "en": "Original task query, not media download"
  },
  "未記錄；不能作為下載HTTP判斷": {
    "zh-CN": "未记录；不能作为下载HTTP判断",
    "en": "Not recorded; cannot infer download HTTP"
  },
  "供應商碼未記錄": {
    "zh-CN": "供应商码未记录",
    "en": "Provider code not recorded"
  },
  "供應商詳細原因未取得或未通過安全白名單": {
    "zh-CN": "供应商详细原因未取得或未通过安全白名单",
    "en": "Provider detail unavailable or excluded by the safety allowlist"
  },
  "上次下載失敗HTTP：": {
    "zh-CN": "上次下载失败HTTP：",
    "en": "Last failed download HTTP:"
  },
  "（與原任務查詢HTTP分開）": {
    "zh-CN": "（与原任务查询HTTP分开）",
    "en": "(separate from original task query HTTP)"
  },
  "Request ID：": {
    "zh-CN": "Request ID：",
    "en": "Request ID:"
  },
  "已觀察下載HTTP；不能單憑403或404推定過期，原任務查詢HTTP另行顯示。": {
    "zh-CN": "已观察下载HTTP；不能单凭403或404推定过期，原任务查询HTTP另行显示。",
    "en": "Download HTTP was observed. HTTP 403 or 404 alone does not establish expiry; original task query HTTP is shown separately."
  },
  "媒體下載未通過校驗；原記錄沒有下載HTTP細節，不由查詢HTTP或此代碼推定過期。": {
    "zh-CN": "媒体下载未通过校验；原记录没有下载HTTP细节，不由查询HTTP或此代码推定过期。",
    "en": "Media download failed validation. The original record has no download HTTP details; query HTTP or this code cannot establish expiry."
  },
  "已保存合法無音軌影片；不因無聲重試": {
    "zh-CN": "已保存合法无音轨视频；不因无声重试",
    "en": "Valid video without audio saved. Silence does not trigger retry."
  },
  "已保存音軌：": {
    "zh-CN": "已保存音轨：",
    "en": "Saved audio track:"
  },
  "已保存影片；音軌資訊未記錄": {
    "zh-CN": "已保存视频；音轨资讯未记录",
    "en": "Video saved; audio information not recorded"
  },
  "已保存圖片": {
    "zh-CN": "已保存图片",
    "en": "Image saved"
  },
  "· 原結果": {
    "zh-CN": "· 原结果",
    "en": "· Original result"
  },
  "原結果": {
    "zh-CN": "原结果",
    "en": "Original result"
  },
  "原生成操作恢復": {
    "zh-CN": "原生成操作恢复",
    "en": "Original generation recovery"
  },
  "BytePlus 原任務歷史": {
    "zh-CN": "BytePlus 原任务历史",
    "en": "BytePlus original task history"
  },
  "BytePlus 原任務歷史（": {
    "zh-CN": "BytePlus 原任务历史（",
    "en": "BytePlus original task history ("
  },
  "查找原任務": {
    "zh-CN": "查找原任务",
    "en": "Find original task"
  },
  "查找 BytePlus 原任務": {
    "zh-CN": "查找 BytePlus 原任务",
    "en": "Find original BytePlus task"
  },
  "記錄狀態": {
    "zh-CN": "记录状态",
    "en": "Record state"
  },
  "BytePlus 歷史狀態": {
    "zh-CN": "BytePlus 历史状态",
    "en": "BytePlus history state"
  },
  "全部": {
    "zh-CN": "全部",
    "en": "All"
  },
  "失敗／未送出": {
    "zh-CN": "失败／未送出",
    "en": "Failed / Not submitted"
  },
  "已保存": {
    "zh-CN": "已保存",
    "en": "Saved"
  },
  "回執未知": {
    "zh-CN": "回执未知",
    "en": "Receipt unknown"
  },
  "等待": {
    "zh-CN": "等待",
    "en": "Waiting"
  },
  "顯示": {
    "zh-CN": "显示",
    "en": "Showing"
  },
  "筆；不同嘗試不覆寫。其他供應商期限不在此頁推定。": {
    "zh-CN": "笔；不同尝试不覆写。其他供应商期限不在此页推定。",
    "en": "records; distinct attempts never overwrite each other. Other providers’ deadlines are not inferred here."
  },
  "顯示更多原記錄": {
    "zh-CN": "显示更多原记录",
    "en": "Show more original records"
  },
  "原工程與凍結來源": {
    "zh-CN": "原工程与冻结来源",
    "en": "Original project and frozen source"
  },
  "已保存工作台任務": {
    "zh-CN": "已保存工作台任务",
    "en": "Saved workbench task"
  },
  "已保存素材／攝影棚PNG": {
    "zh-CN": "已保存素材／摄影棚PNG",
    "en": "Saved media / studio PNG"
  },
  "已有生成結果原字節": {
    "zh-CN": "已有生成结果原字节",
    "en": "Existing result’s original bytes"
  },
  "素材庫固定引用": {
    "zh-CN": "素材库固定引用",
    "en": "Fixed library reference"
  },
  "已保存畫布副本": {
    "zh-CN": "已保存画布副本",
    "en": "Saved canvas copy"
  },
  "· 保留原身份與版本": {
    "zh-CN": "· 保留原身份与版本",
    "en": "· Original identity and version preserved"
  },
  "媒體已換版；原凍結來源保留為歷史，不代表目前媒體。": {
    "zh-CN": "媒体已换版；原冻结来源保留为历史，不代表目前媒体。",
    "en": "Media version changed. Frozen provenance is preserved as history, not represented as current media."
  },
  "此舊引用未保存來源鏈，不推測來源。": {
    "zh-CN": "此旧引用未保存来源链，不推测来源。",
    "en": "This older reference has no saved provenance chain. No source is inferred."
  },
  "原名稱：": {
    "zh-CN": "原名称：",
    "en": "Original name:"
  },
  "來源庫": {
    "zh-CN": "来源库",
    "en": "Source library"
  },
  "來源任務": {
    "zh-CN": "来源任务",
    "en": "Source task"
  },
  "快照": {
    "zh-CN": "快照",
    "en": "Snapshot"
  },
  "輸出": {
    "zh-CN": "输出",
    "en": "Output"
  },
  "分鏡板": {
    "zh-CN": "分镜板",
    "en": "Storyboard"
  },
  "場景簽章": {
    "zh-CN": "场景签章",
    "en": "Scene signature"
  },
  "原需求：": {
    "zh-CN": "原需求：",
    "en": "Original prompt:"
  },
  "原模型／模式：": {
    "zh-CN": "原模型／模式：",
    "en": "Original model / mode:"
  },
  "· 規劃": {
    "zh-CN": "· 规划",
    "en": "· Plan"
  },
  "原攝影棚補充：": {
    "zh-CN": "原摄影棚补充：",
    "en": "Original studio notes:"
  },
  "原分鏡補充：": {
    "zh-CN": "原分镜补充：",
    "en": "Original storyboard notes:"
  },
  "查看已保存結果 ·": {
    "zh-CN": "查看已保存结果 ·",
    "en": "View saved result ·"
  },
  "下列舊輸入完整保留，但不能猜成目前設定；離線執行前請核對畫布配置。": {
    "zh-CN": "下列旧输入完整保留，但不能猜成目前设定；离线执行前请核对画布配置。",
    "en": "Historical inputs below are preserved, but do not establish current settings. Check the canvas configuration before offline execution."
  },
  "已核對，使用目前畫布配置": {
    "zh-CN": "已核对，使用目前画布配置",
    "en": "Reviewed; use current canvas configuration"
  },
  "完整原始字段及收據保存在整合庫的來源快照。此處不恢復舊執行授權。": {
    "zh-CN": "完整原始字段及收据保存在整合库的来源快照。此处不恢复旧执行授权。",
    "en": "Full original fields and receipts remain in the integration library source snapshot. No historical execution rights are restored here."
  },
  "只用框內提示詞": {
    "zh-CN": "只用框内提示词",
    "en": "Inline prompt only"
  },
  "外部文字 → 框內提示詞": {
    "zh-CN": "外部文字 → 框内提示词",
    "en": "External text → Inline prompt"
  },
  "框內提示詞 → 外部文字": {
    "zh-CN": "框内提示词 → 外部文字",
    "en": "Inline prompt → External text"
  },
  "提示詞拼接": {
    "zh-CN": "提示词拼接",
    "en": "Prompt composition"
  },
  "提示詞來源": {
    "zh-CN": "提示词来源",
    "en": "Prompt source"
  },
  "提示詞來源策略": {
    "zh-CN": "提示词来源策略",
    "en": "Prompt source policy"
  },
  "編輯框內原文": {
    "zh-CN": "编辑框内原文",
    "en": "Edit original inline text"
  },
  "切換只套用來源策略，不改寫原文、不保存、不生成。相同完整原文只使用一次。": {
    "zh-CN": "切换只应用来源策略，不改写原文、不保存、不生成。相同完整原文只使用一次。",
    "en": "Switching applies only the source policy. Original text is not rewritten; no save or generation. Identical full text is used once."
  },
  "固定文字來源": {
    "zh-CN": "固定文字来源",
    "en": "Fixed text sources"
  },
  "框內": {
    "zh-CN": "框内",
    "en": "Inline"
  },
  "外部": {
    "zh-CN": "外部",
    "en": "External"
  },
  "實際檔名": {
    "zh-CN": "实际文件名",
    "en": "Actual filename"
  },
  "· 節點": {
    "zh-CN": "· 节点",
    "en": "· Node"
  },
  "實際有效完整提示詞": {
    "zh-CN": "实际有效完整提示词",
    "en": "Full effective prompt"
  },
  "（無有效文字）": {
    "zh-CN": "（无有效文字）",
    "en": "(No effective text)"
  },
  "固定版本依所選順序拼接；未確認草稿不參與。框名、實際檔名及文字內容不互相替換。": {
    "zh-CN": "固定版本依所选顺序拼接；未确认草稿不参与。框名、实际文件名及文字内容不互相替换。",
    "en": "Fixed versions are joined in selected order. Unconfirmed drafts are excluded. Card name, actual filename and text content never substitute for each other."
  },
  "本次提供給畫布的圖片": {
    "zh-CN": "本次提供给画布的图片",
    "en": "Images provided to this canvas"
  },
  "圖片": {
    "zh-CN": "图片",
    "en": "Images"
  },
  "正在核對圖片": {
    "zh-CN": "正在核对图片",
    "en": "Checking images"
  },
  "已放入": {
    "zh-CN": "已放入",
    "en": "Placed"
  },
  "· 待處理": {
    "zh-CN": "· 待处理",
    "en": "· Pending"
  },
  "張": {
    "zh-CN": "张",
    "en": "images"
  },
  "本機圖片，可交給 Codex 放入": {
    "zh-CN": "本机图片，可交给 Codex 放入",
    "en": "Local images available for Codex to place"
  },
  "先完成或明確清除待處理項，不會覆蓋它們": {
    "zh-CN": "先完成或明确清除待处理项，不会覆盖它们",
    "en": "Resolve or explicitly clear pending items first; they will not be overwritten"
  },
  "再選圖片": {
    "zh-CN": "再选图片",
    "en": "Choose more images"
  },
  "選圖片": {
    "zh-CN": "选图片",
    "en": "Choose images"
  },
  "收起圖片": {
    "zh-CN": "收起图片",
    "en": "Collapse images"
  },
  "管理圖片": {
    "zh-CN": "管理图片",
    "en": "Manage images"
  },
  "原圖與來源已保存在畫布素材中。此清單只供核對，再選或清除不會刪除畫布素材。": {
    "zh-CN": "原图与来源已保存在画布素材中。此清单只供核对，再选或清除不会删除画布素材。",
    "en": "Original images and provenance are stored as canvas media. This list is for review only; choosing or clearing does not delete canvas media."
  },
  "本機提供的固定原圖，尚待 Codex 或你放入畫布。請依編號說明用途；不會猜測分類，也不是聊天附件自動同步。": {
    "zh-CN": "本机提供的固定原图，尚待 Codex 或你放入画布。请依编号说明用途；不会猜测分类，也不是聊天附件自动同步。",
    "en": "Fixed local originals await placement by Codex or you. Refer to their numbers and explain the roles. Classification is never guessed; this is not automatic chat attachment synchronization."
  },
  "暫存清理待處理；已放入原圖保留，工程保存不受影響。": {
    "zh-CN": "暂存清理待处理；已放入原图保留，工程保存不受影响。",
    "en": "Temporary cleanup is pending. Placed originals are preserved; project saving is unaffected."
  },
  "本次提供圖片": {
    "zh-CN": "本次提供图片",
    "en": "Images provided this time"
  },
  "· SHA": {
    "zh-CN": "· SHA",
    "en": "· SHA"
  },
  "已放入畫布": {
    "zh-CN": "已放入画布",
    "en": "Placed on canvas"
  },
  "待加入": {
    "zh-CN": "待加入",
    "en": "Awaiting placement"
  },
  "已過期，請重新提供": {
    "zh-CN": "已过期，请重新提供",
    "en": "Expired; provide again"
  },
  "待處理，請重新提供": {
    "zh-CN": "待处理，请重新提供",
    "en": "Pending; provide again"
  },
  "素材分類": {
    "zh-CN": "素材分类",
    "en": "Media category"
  },
  "未分類": {
    "zh-CN": "未分类",
    "en": "Uncategorized"
  },
  "產品": {
    "zh-CN": "产品",
    "en": "Product"
  },
  "按所選分類放入畫布": {
    "zh-CN": "按所选分类放入画布",
    "en": "Place using selected category"
  },
  "清除已完成清單": {
    "zh-CN": "清除已完成清单",
    "en": "Clear completed list"
  },
  "清除待加入圖片": {
    "zh-CN": "清除待加入图片",
    "en": "Clear pending images"
  },
  "換用畫布內素材": {
    "zh-CN": "换用画布内素材",
    "en": "Use media already on canvas"
  },
  "提示詞引用關係": {
    "zh-CN": "提示词引用关系",
    "en": "Prompt reference relation"
  },
  "保留此節點名稱與身份、舊版本及原檔；仍引用此素材框的任務輸入會同步更新，已生成結果不變，不會自動重新生成。": {
    "zh-CN": "保留此节点名称与身份、旧版本及原档；仍引用此素材框的任务输入会同步更新，已生成结果不变，不会自动重新生成。",
    "en": "This node’s name, identity, old versions and original files are retained. Inputs still referencing this media card update together; generated results stay unchanged and are not regenerated automatically."
  },
  "固定使用所選文字版本；影片首尾幀與圖片參考用途在各自設定中。": {
    "zh-CN": "固定使用所选文字版本；视频首尾帧与图片参考用途在各自设定中。",
    "en": "Use the selected text version explicitly. Video frame and image reference roles are configured in their own settings."
  },
  "替換來源": {
    "zh-CN": "替换来源",
    "en": "Replace source"
  },
  "文字來源": {
    "zh-CN": "文字来源",
    "en": "Text source"
  },
  "替換素材來源": {
    "zh-CN": "替换素材来源",
    "en": "Replace media source"
  },
  "提示詞引用來源": {
    "zh-CN": "提示词引用来源",
    "en": "Prompt reference source"
  },
  "換用此素材": {
    "zh-CN": "换用此素材",
    "en": "Use this media"
  },
  "設定提示詞引用": {
    "zh-CN": "设定提示词引用",
    "en": "Set prompt reference"
  },
  "· 固定文字版本": {
    "zh-CN": "· 固定文字版本",
    "en": "· Fixed text version"
  },
  "移除此提示詞引用": {
    "zh-CN": "移除此提示词引用",
    "en": "Remove this prompt reference"
  },
  "無法開啟此結果位置": {
    "zh-CN": "无法开启此结果位置",
    "en": "Cannot open this result location"
  },
  "開啟檔案位置": {
    "zh-CN": "开启文件位置",
    "en": "Open file location"
  },
  "（安全摘要）": {
    "zh-CN": "（安全摘要）",
    "en": "(Safe summary)"
  },
  "Request ID 未取得": {
    "zh-CN": "Request ID 未取得",
    "en": "Request ID unavailable"
  },
  "原紀錄未保存供應商詳細原因或 Request ID。": {
    "zh-CN": "原纪录未保存供应商详细原因或 Request ID。",
    "en": "The original record has no provider detail or Request ID."
  },
  "查看錯誤不會重新送出；結果未知時先核對原操作。": {
    "zh-CN": "查看错误不会重新送出；结果未知时先核对原操作。",
    "en": "Viewing errors does not resubmit. Check the original operation when the result is unknown."
  },
  "快捷鍵已保存於本機；工程保存狀態不變": {
    "zh-CN": "快捷键已保存于本机；工程保存状态不变",
    "en": "Shortcuts saved locally. Project save state is unchanged."
  },
  "按想用的組合鍵；Esc取消錄入，Tab移到按鈕": {
    "zh-CN": "按想用的组合键；Esc取消录入，Tab移到按钮",
    "en": "Press the desired combination. Esc cancels capture; Tab moves to buttons."
  },
  "已取消錄入，原綁定不變": {
    "zh-CN": "已取消录入，原绑定不变",
    "en": "Capture canceled. Original binding unchanged."
  },
  "請先放開按鍵，再錄入一次": {
    "zh-CN": "请先放开按键，再录入一次",
    "en": "Release the keys before capturing again"
  },
  "請再按一個非修飾鍵": {
    "zh-CN": "请再按一个非修饰键",
    "en": "Press one non-modifier key too"
  },
  "已錄入": {
    "zh-CN": "已录入",
    "en": "Captured"
  },
  "；按「套用鍵位」才會修改": {
    "zh-CN": "；按「应用键位」才会修改",
    "en": "; changes only after Apply shortcut"
  },
  "畫布快捷鍵設定": {
    "zh-CN": "画布快捷键设定",
    "en": "Canvas shortcut settings"
  },
  "畫布快捷鍵": {
    "zh-CN": "画布快捷键",
    "en": "Canvas shortcuts"
  },
  "關閉快捷鍵設定": {
    "zh-CN": "关闭快捷键设定",
    "en": "Close shortcut settings"
  },
  "只在畫布有焦點時使用；輸入、播放器、對話框與選單優先。點畫布空白或框後即可使用。停用只關閉該按鍵，原操作仍可點按鈕／右鍵完成。此候選為Windows，使用Ctrl；不提供Mac／Cmd、Alt／Win組合或全系統快捷鍵。": {
    "zh-CN": "只在画布有焦点时使用；输入、播放器、对话框与选单优先。点画布空白或框后即可使用。停用只关闭该按键，原操作仍可点按钮／右键完成。此候选为Windows，使用Ctrl；不提供Mac／Cmd、Alt／Win组合或全系统快捷键。",
    "en": "Active only when the canvas has focus. Inputs, players, dialogs and menus take priority. Click blank canvas or a card first. Disabling a shortcut leaves its button / context-menu action available. This candidate uses Windows Ctrl; Mac / Cmd, Alt / Win and system-wide shortcuts are unavailable."
  },
  "偏好自動保存於此候選的本機個人設定，與工程「手动保存」分開；不跟工程備份或跨裝置同步。": {
    "zh-CN": "偏好自动保存于此候选的本机个人设定，与工程「手动保存」分开；不跟工程备份或跨装置同步。",
    "en": "Preferences save automatically to this candidate’s local profile, separate from manual project saving. They are not included in project backups or cross-device sync."
  },
  "快捷操作": {
    "zh-CN": "快捷操作",
    "en": "Quick action"
  },
  "預設：": {
    "zh-CN": "预设：",
    "en": "Default:"
  },
  "目前綁定": {
    "zh-CN": "目前绑定",
    "en": "Current binding"
  },
  "修改": {
    "zh-CN": "修改",
    "en": "Edit"
  },
  "停用鍵位": {
    "zh-CN": "停用键位",
    "en": "Disable shortcut"
  },
  "恢復預設": {
    "zh-CN": "恢复预设",
    "en": "Restore default"
  },
  "錄入快捷鍵": {
    "zh-CN": "录入快捷键",
    "en": "Capture shortcut"
  },
  "修改：": {
    "zh-CN": "修改：",
    "en": "Editing:"
  },
  "按下新的組合鍵": {
    "zh-CN": "按下新的组合键",
    "en": "Press a new key combination"
  },
  "請按組合鍵…": {
    "zh-CN": "请按组合键…",
    "en": "Press combination…"
  },
  "尚未錄入": {
    "zh-CN": "尚未录入",
    "en": "Not captured"
  },
  "重新錄入": {
    "zh-CN": "重新录入",
    "en": "Capture again"
  },
  "套用鍵位": {
    "zh-CN": "应用键位",
    "en": "Apply shortcut"
  },
  "取消錄入": {
    "zh-CN": "取消录入",
    "en": "Cancel capture"
  },
  "停用「": {
    "zh-CN": "停用「",
    "en": "Disable shortcut for “"
  },
  "」的鍵位": {
    "zh-CN": "」的键位",
    "en": "”"
  },
  "哪些鍵不提供綁定？": {
    "zh-CN": "哪些键不提供绑定？",
    "en": "Which keys cannot be assigned?"
  },
  "Alt／Win、Ctrl+Alt（含AltGr）、文字與焦點導覽鍵、視窗關閉／重新載入／開發工具／剪貼簿等保留組合不提供。只接受本版可安全處理的字母、數字、Delete、=、-、/、F2/F4/F7/F8/F9及允許的Ctrl／Shift組合。系統未傳入的鍵無法錄入，並非所有按鍵都能攔截。": {
    "zh-CN": "Alt／Win、Ctrl+Alt（含AltGr）、文字与焦点导览键、视窗关闭／重新加载／开发工具／剪贴簿等保留组合不提供。只接受本版可安全处理的字母、数字、Delete、=、-、/、F2/F4/F7/F8/F9及允许的Ctrl／Shift组合。系统未传入的键无法录入，并非所有按键都能拦截。",
    "en": "Alt / Win, Ctrl+Alt (including AltGr), text and focus-navigation keys, and reserved close / reload / developer-tool / clipboard combinations are unavailable. Only safely handled letters, numbers, Delete, =, -, /, F2/F4/F7/F8/F9 and allowed Ctrl / Shift combinations are accepted. Keys the system does not deliver cannot be captured; not every key can be intercepted."
  },
  "全部恢復預設": {
    "zh-CN": "全部恢复预设",
    "en": "Restore all defaults"
  },
  "Codex 與目前畫布": {
    "zh-CN": "Codex 与目前画布",
    "en": "Codex and current canvas"
  },
  "按需讀取 Canvas Context Snapshot，透過同一畫布提出修改。允許本次真實 Codex 讀取當前項目及執行建立任務／文字框、加入本次提供圖片及普通可撤銷編輯／提出草稿，本次軟體工作階段；明確執行指令直接回到畫布，明說先提出才保留草稿確認，工程仍手動保存。一般人工工作不需要此連線。": {
    "zh-CN": "按需读取 Canvas Context Snapshot，透过同一画布提出修改。允许本次真实 Codex 读取当前项目及执行建立任务／文字框、加入本次提供图片及普通可撤销编辑／提出草稿，本次软体工作阶段；明确执行指令直接回到画布，明说先提出才保留草稿确认，工程仍手动保存。一般人工工作不需要此连线。",
    "en": "Read Canvas Context Snapshot on demand and modify the same canvas. This session allows the genuine Codex client to read the current project, create task / text cards, place provided images, perform ordinary undoable edits or propose drafts. Explicit execution updates the canvas directly; proposal-only requests wait for confirmation. Save manually. Manual creation does not require this connection."
  },
  "準備本次 Codex 協作": {
    "zh-CN": "准备本次 Codex 协作",
    "en": "Prepare this Codex session"
  },
  "中斷本次連線": {
    "zh-CN": "中断本次连线",
    "en": "Disconnect this session"
  },
  "查看目前畫布": {
    "zh-CN": "查看目前画布",
    "en": "View current canvas"
  },
  "已核對真實 Codex 身分 · 可撤銷編輯／提案": {
    "zh-CN": "已核对真实 Codex 身分 · 可撤销编辑／提案",
    "en": "Genuine Codex identity verified · Undoable edits / proposals"
  },
  "已準備，等待目前 Codex 連入": {
    "zh-CN": "已准备，等待目前 Codex 连入",
    "en": "Prepared; awaiting current Codex client"
  },
  "尚未連接真實 Codex": {
    "zh-CN": "尚未连接真实 Codex",
    "en": "Genuine Codex not connected"
  },
  "· 截止": {
    "zh-CN": "· 截止",
    "en": "· Expires"
  },
  "在目前 Codex 對話告訴它「讀取目前畫布，包括空白狀態」。它會使用本候選的受控入口；不需要提供素材 ID、重傳影片或設定全域 MCP。": {
    "zh-CN": "在目前 Codex 对话告诉它「读取目前画布，包括空白状态」。它会使用本候选的受控入口；不需要提供素材 ID、重传视频或设定全域 MCP。",
    "en": "Ask the current Codex conversation to read the canvas, including an empty canvas. It uses this candidate’s controlled entry. No media IDs, video reuploads or global MCP setup are needed."
  },
  "本候選的 Codex 連接入口": {
    "zh-CN": "本候选的 Codex 连接入口",
    "en": "Codex connection entry for this candidate"
  },
  "此命令由目前 Codex 執行。普通 shell／假 client 不能代替身分核對。": {
    "zh-CN": "此命令由目前 Codex 执行。普通 shell／假 client 不能代替身分核对。",
    "en": "This command must be run by the current Codex client. A plain shell / fake client cannot replace identity verification."
  },
  "本次讀取使用：": {
    "zh-CN": "本次读取使用：",
    "en": "This read uses:"
  },
  "目前授權畫布（零節點）": {
    "zh-CN": "目前授权画布（零节点）",
    "en": "Authorized current canvas (zero nodes)"
  },
  "本次讀取授權畫布；零節點也可接續建立，不依賴選取。": {
    "zh-CN": "本次读取授权画布；零节点也可接续建立，不依赖选取。",
    "en": "This authorized canvas can be read and extended even with zero nodes, without selection."
  },
  "本次以讀取時選取為工作目標。": {
    "zh-CN": "本次以读取时选取为工作目标。",
    "en": "The selection at read time is the work target."
  },
  "本次依明確名稱或固定ID取得最新狀態，不依賴GUI選取。": {
    "zh-CN": "本次依明确名称或固定ID取得最新状态，不依赖GUI选取。",
    "en": "Latest state is resolved by explicit name or fixed ID, independent of GUI selection."
  },
  "之後點別處不會替換這次工作目標。": {
    "zh-CN": "之后点别处不会替换这次工作目标。",
    "en": "Later clicks do not replace this work target."
  },
  "讀取當時畫布選取：": {
    "zh-CN": "读取当时画布选取：",
    "en": "Canvas selection at read time:"
  },
  "未選取": {
    "zh-CN": "未选取",
    "en": "Nothing selected"
  },
  "工作修訂": {
    "zh-CN": "工作修订",
    "en": "Working revision"
  },
  "· 選取修訂": {
    "zh-CN": "· 选取修订",
    "en": "· Selection revision"
  },
  "含已套用未保存修改": {
    "zh-CN": "含已应用未保存修改",
    "en": "Includes applied unsaved changes"
  },
  "目前已保存": {
    "zh-CN": "目前已保存",
    "en": "Currently saved"
  },
  "目前畫布：": {
    "zh-CN": "目前画布：",
    "en": "Current canvas:"
  },
  "個節點；選取：": {
    "zh-CN": "个节点；选取：",
    "en": "nodes; selection:"
  },
  "無": {
    "zh-CN": "无",
    "en": "None"
  },
  "已套用但未保存的修改可讀": {
    "zh-CN": "已应用但未保存的修改可读",
    "en": "Applied unsaved changes are readable"
  },
  "有未套用草稿，只提示存在": {
    "zh-CN": "有未应用草稿，只提示存在",
    "en": "Unapplied draft exists; presence only is reported"
  },
  "沒有未套用草稿": {
    "zh-CN": "没有未应用草稿",
    "en": "No unapplied draft"
  },
  "快照範圍與來源核對": {
    "zh-CN": "快照范围与来源核对",
    "en": "Snapshot scope and source verification"
  },
  "本次工程保存授權": {
    "zh-CN": "本次工程保存授权",
    "en": "Project persistence permission for this request"
  },
  "保存整個工作庫": {
    "zh-CN": "保存整个工作库",
    "en": "Save entire library"
  },
  "備份已保存工作庫": {
    "zh-CN": "备份已保存工作库",
    "en": "Back up saved library"
  },
  "恢復到新副本": {
    "zh-CN": "恢复到新副本",
    "en": "Restore into new copy"
  },
  "合成工程測試客戶端；不是真實 Codex 連線或 Owner 驗收。": {
    "zh-CN": "合成工程测试客户端；不是真实 Codex 连线或 Owner 验收。",
    "en": "Synthetic engineering client; not genuine Codex connection or Owner acceptance."
  },
  "已保存版本 r": {
    "zh-CN": "已保存版本 r",
    "en": "Saved revision r"
  },
  "個項目 ·": {
    "zh-CN": "个项目 ·",
    "en": "projects ·"
  },
  "包含已套用未保存修改": {
    "zh-CN": "包含已应用未保存修改",
    "en": "Includes applied unsaved changes"
  },
  "· 圖v": {
    "zh-CN": "· 图v",
    "en": "· Graph v"
  },
  "備份：": {
    "zh-CN": "备份：",
    "en": "Backup:"
  },
  "· r": {
    "zh-CN": "· r",
    "en": "· r"
  },
  "摘要已過期，請重新讀取及提出。": {
    "zh-CN": "摘要已过期，请重新读取及提出。",
    "en": "Summary expired. Read and propose again."
  },
  "已批准這一次，等待執行；仍可取消。": {
    "zh-CN": "已批准这一次，等待执行；仍可取消。",
    "en": "Approved once; awaiting execution. You can still cancel."
  },
  "普通創作權沒有保存權。以下只批准這份摘要一次。": {
    "zh-CN": "普通创作权没有保存权。以下只批准这份摘要一次。",
    "en": "Ordinary creation rights do not include saving. This approves only this summary once."
  },
  "批准這次操作": {
    "zh-CN": "批准这次操作",
    "en": "Approve this operation"
  },
  "取消這次操作": {
    "zh-CN": "取消这次操作",
    "en": "Cancel this operation"
  },
  "本次可撤銷操作記錄": {
    "zh-CN": "本次可撤销操作记录",
    "en": "Undoable operation records for this session"
  },
  "未套用": {
    "zh-CN": "未应用",
    "en": "Not applied"
  },
  "請以畫布與原回執核對": {
    "zh-CN": "请以画布与原回执核对",
    "en": "Check the canvas and original receipt"
  },
  "不代表已手動保存": {
    "zh-CN": "不代表已手动保存",
    "en": "Does not imply manual saving"
  },
  "目前沒有待確認提案。普通執行指令不需再確認。關閉面板可繼續操作畫布，連線不因此中斷。": {
    "zh-CN": "目前没有待确认提案。普通执行指令不需再确认。关闭面板可继续操作画布，连线不因此中断。",
    "en": "No proposal awaits confirmation. Ordinary execution commands need no extra confirmation. Closing this panel keeps the canvas usable and the connection active."
  },
  "本次選取／來源：": {
    "zh-CN": "本次选取／来源：",
    "en": "Selection / sources for this request:"
  },
  "。修改對象以以下差異為準，使用該次快照版本。": {
    "zh-CN": "。修改对象以以下差异为准，使用该次快照版本。",
    "en": ". The differences below determine the target and use that snapshot revision."
  },
  "原引用": {
    "zh-CN": "原引用",
    "en": "Original reference"
  },
  "新引用": {
    "zh-CN": "新引用",
    "en": "New reference"
  },
  "無此引用": {
    "zh-CN": "无此引用",
    "en": "No such reference"
  },
  "用途：": {
    "zh-CN": "用途：",
    "en": "Role:"
  },
  "提示詞": {
    "zh-CN": "提示词",
    "en": "Prompt"
  },
  "風格": {
    "zh-CN": "风格",
    "en": "Style"
  },
  "參考": {
    "zh-CN": "参考",
    "en": "Reference"
  },
  "· 順序": {
    "zh-CN": "· 顺序",
    "en": "· Order"
  },
  "目標輸入": {
    "zh-CN": "目标输入",
    "en": "Target input"
  },
  "修改已回到同一畫布，請手動保存；可繼續編輯或安全撤銷。": {
    "zh-CN": "修改已回到同一画布，请手动保存；可继续编辑或安全撤销。",
    "en": "Changes returned to the same canvas. Save manually; continue editing or undo safely."
  },
  "已過期，請 Codex 重讀": {
    "zh-CN": "已过期，请 Codex 重读",
    "en": "Expired; ask Codex to read again"
  },
  "有未套用草稿；快照不會採用它，請先套用或取消再確認修改。": {
    "zh-CN": "有未应用草稿；快照不会采用它，请先应用或取消再确认修改。",
    "en": "An unapplied draft exists and is excluded from the snapshot. Apply or cancel before confirming changes."
  },
  "正在核對來源": {
    "zh-CN": "正在核对来源",
    "en": "Checking sources"
  },
  "正在固定原片": {
    "zh-CN": "正在固定原片",
    "en": "Freezing originals"
  },
  "正在直接拼接": {
    "zh-CN": "正在直接拼接",
    "en": "Joining streams directly"
  },
  "正在驗證成片": {
    "zh-CN": "正在验证成片",
    "en": "Verifying film"
  },
  "正在安全保存": {
    "zh-CN": "正在安全保存",
    "en": "Saving safely"
  },
  "未完成": {
    "zh-CN": "未完成",
    "en": "Incomplete"
  },
  "上次操作中斷": {
    "zh-CN": "上次操作中断",
    "en": "Previous operation interrupted"
  },
  "狀態待核對": {
    "zh-CN": "状态待核对",
    "en": "State needs checking"
  },
  "已取消本次本地合併；原片、舊成片與排序保留。": {
    "zh-CN": "已取消本次本地合并；原片、旧成片与排序保留。",
    "en": "Local merge canceled. Original clips, previous films and order preserved."
  },
  "影片或音軌串流不相容；已停止，沒有轉碼或補音軌。": {
    "zh-CN": "视频或音轨串流不相容；已停止，没有转码或补音轨。",
    "en": "Video or audio streams are incompatible. Stopped without transcoding or adding audio."
  },
  "原片在合併期間被修改或移動；已安全停止。": {
    "zh-CN": "原片在合并期间被修改或移动；已安全停止。",
    "en": "An original clip changed or moved during merging. Stopped safely."
  },
  "原片或成片的身份／雜湊不符；請核對本地檔案。": {
    "zh-CN": "原片或成片的身份／杂凑不符；请核对本地文件。",
    "en": "Original or output identity / hash mismatch. Check local files."
  },
  "上次合併中斷；沒有自動重跑，工程已解除鎖定。": {
    "zh-CN": "上次合并中断；没有自动重跑，工程已解除锁定。",
    "en": "Previous merge interrupted. No automatic rerun; project editing is unlocked."
  },
  "成片串流或時長驗證未通過；沒有發布未完成成片。": {
    "zh-CN": "成片串流或时长验证未通过；没有发布未完成成片。",
    "en": "Output stream or duration validation failed. No incomplete film was published."
  },
  "成片記錄未可靠保存；請保留工程供核查，原片不變。": {
    "zh-CN": "成片记录未可靠保存；请保留工程供核查，原片不变。",
    "en": "Film record was not saved reliably. Preserve the project for inspection; originals are unchanged."
  },
  "本地合併未完成；請重新驗證原片，原片與舊成果保留。": {
    "zh-CN": "本地合并未完成；请重新验证原片，原片与旧成果保留。",
    "en": "Local merge did not finish. Revalidate originals. Original clips and older outputs are preserved."
  },
  "診斷：": {
    "zh-CN": "诊断：",
    "en": "Diagnostics:"
  },
  "已取消另存；原成片保留": {
    "zh-CN": "已取消另存；原成片保留",
    "en": "Save as canceled. Original film preserved."
  },
  "另存完成：": {
    "zh-CN": "另存完成：",
    "en": "Save as completed:"
  },
  "已要求開啟檔案位置": {
    "zh-CN": "已要求开启文件位置",
    "en": "Requested opening file location"
  },
  "直接合併成片": {
    "zh-CN": "直接合并成片",
    "en": "Directly merged films"
  },
  "尚無已驗證成片；原任務與片段保留。": {
    "zh-CN": "尚无已验证成片；原任务与片段保留。",
    "en": "No verified film yet. Original tasks and clips are preserved."
  },
  "段 · 串流直接複製 ·": {
    "zh-CN": "段 · 串流直接复制 ·",
    "en": "clips · Direct stream copy ·"
  },
  "原音軌保留": {
    "zh-CN": "原音轨保留",
    "en": "Original audio retained"
  },
  "原片均無音軌": {
    "zh-CN": "原片均无音轨",
    "en": "All originals have no audio"
  },
  "另存成片": {
    "zh-CN": "另存成片",
    "en": "Save film as"
  },
  "開啟成片位置": {
    "zh-CN": "开启成片位置",
    "en": "Open film location"
  },
  "清單未通過驗證：": {
    "zh-CN": "清单未通过验证：",
    "en": "List validation failed:"
  },
  "；請重新驗證。": {
    "zh-CN": "；请重新验证。",
    "en": "; verify again."
  },
  "讀取未完成；請重新驗證。": {
    "zh-CN": "读取未完成；请重新验证。",
    "en": "Read did not finish. Verify again."
  },
  "工程身份不可用；未修改順序。": {
    "zh-CN": "工程身份不可用；未修改顺序。",
    "en": "Project identity unavailable. Order unchanged."
  },
  "順序未套用；請查看畫布提示並重新驗證。": {
    "zh-CN": "顺序未应用；请查看画布提示并重新验证。",
    "en": "Order was not applied. Check canvas notices and verify again."
  },
  "提交回執未知；請讀取合併狀態，不要重複提交。": {
    "zh-CN": "提交回执未知；请读取合并状态，不要重复提交。",
    "en": "Submission receipt unknown. Read merge status; do not submit again."
  },
  "此本地影片無法播放；請重新驗證或明確排除。": {
    "zh-CN": "此本地视频无法播放；请重新验证或明确排除。",
    "en": "This local video cannot play. Revalidate or explicitly exclude it."
  },
  "影片排序／合併": {
    "zh-CN": "视频排序／合并",
    "en": "Video order / merge"
  },
  "合併中 · 查看／取消": {
    "zh-CN": "合并中 · 查看／取消",
    "en": "Merging · View / cancel"
  },
  "影片排序與合併": {
    "zh-CN": "视频排序与合并",
    "en": "Video order and merge"
  },
  "勾選任務，再拖曳調整順序。使用目前成功的本地原片，原片與歷史版本保留。": {
    "zh-CN": "勾选任务，再拖曳调整顺序。使用目前成功的本地原片，原片与历史版本保留。",
    "en": "Select tasks, then drag to reorder. Uses current successful local originals. Original clips and history are preserved."
  },
  "關閉影片排序": {
    "zh-CN": "关闭视频排序",
    "en": "Close video ordering"
  },
  "返回畫布查看；本次合併仍繼續": {
    "zh-CN": "返回画布查看；本次合并仍继续",
    "en": "Return to canvas; this merge keeps running"
  },
  "已勾選": {
    "zh-CN": "已勾选",
    "en": "Selected"
  },
  "項 · 順序已套用至畫布，請手動保存工程": {
    "zh-CN": "项 · 顺序已应用至画布，请手动保存工程",
    "en": "items · Order applied to canvas; save manually"
  },
  "重新驗證本地原片": {
    "zh-CN": "重新验证本地原片",
    "en": "Revalidate local originals"
  },
  "請先套用或取消畫布草稿，再修改順序；仍可查看影片。": {
    "zh-CN": "请先应用或取消画布草稿，再修改顺序；仍可查看视频。",
    "en": "Apply or cancel canvas drafts before changing order. You can still view videos."
  },
  "正在驗證已保存的本地原片…": {
    "zh-CN": "正在验证已保存的本地原片…",
    "en": "Verifying saved local originals…"
  },
  "已明確選用這個歷史成功結果；本次失敗記錄保留": {
    "zh-CN": "已明确选用这个历史成功结果；本次失败记录保留",
    "en": "Explicitly selected this historical successful result. Current failure record preserved."
  },
  "勾選影片任務": {
    "zh-CN": "勾选视频任务",
    "en": "Select video task"
  },
  "拖曳調整順序": {
    "zh-CN": "拖曳调整顺序",
    "en": "Drag to reorder"
  },
  "先勾選再排序": {
    "zh-CN": "先勾选再排序",
    "en": "Select before ordering"
  },
  "暫停影片": {
    "zh-CN": "暂停视频",
    "en": "Pause video"
  },
  "無可用首幀": {
    "zh-CN": "无可用首帧",
    "en": "No available first frame"
  },
  "本地影片無法讀取／解碼；請重新驗證或明確排除": {
    "zh-CN": "本地视频无法读取／解码；请重新验证或明确排除",
    "en": "Local video cannot be read / decoded. Revalidate or explicitly exclude it."
  },
  "任務 ID：": {
    "zh-CN": "任务 ID：",
    "en": "Task ID:"
  },
  "目前結果：": {
    "zh-CN": "目前结果：",
    "en": "Current result:"
  },
  "明確選用舊成功結果": {
    "zh-CN": "明确选用旧成功结果",
    "en": "Explicitly use an older successful result"
  },
  "舊版選擇": {
    "zh-CN": "旧版选择",
    "en": "Older version selection"
  },
  "尚未選用；保留停止狀態": {
    "zh-CN": "尚未选用；保留停止状态",
    "en": "Not selected; keep stopped"
  },
  "影片上移": {
    "zh-CN": "视频上移",
    "en": "Move video up"
  },
  "影片下移": {
    "zh-CN": "视频下移",
    "en": "Move video down"
  },
  "明確排除此項": {
    "zh-CN": "明确排除此项",
    "en": "Explicitly exclude this item"
  },
  "目前沒有影片任務；不會自動建立分鏡或成片框。": {
    "zh-CN": "目前没有视频任务；不会自动建立分镜或成片框。",
    "en": "No video tasks. Storyboard or film cards are never created automatically."
  },
  "停止：已勾選的": {
    "zh-CN": "停止：已勾选的",
    "en": "Stopped:"
  },
  "項尚不可用。請處理上列具體項目，或明確排除；不會偷用舊 V1。": {
    "zh-CN": "项尚不可用。请处理上列具体项目，或明确排除；不会偷用旧 V1。",
    "en": "selected items are unavailable. Resolve or explicitly exclude them; old V1 is never used silently."
  },
  "項。合併前仍須依當時結果重新驗證。": {
    "zh-CN": "项。合并前仍须依当时结果重新验证。",
    "en": "items. Current results will be revalidated before merging."
  },
  "成片檔名": {
    "zh-CN": "成片文件名",
    "en": "Film filename"
  },
  "直接合併檔名": {
    "zh-CN": "直接合并文件名",
    "en": "Direct merge filename"
  },
  "驗證並直接合併": {
    "zh-CN": "验证并直接合并",
    "en": "Verify and merge directly"
  },
  "% · 工作庫編輯已鎖定": {
    "zh-CN": "% · 工作库编辑已锁定",
    "en": "% · Library editing locked"
  },
  "取消本次合併": {
    "zh-CN": "取消本次合并",
    "en": "Cancel this merge"
  },
  "只直接複製相容的影片與音軌，不轉碼、不補音軌、不生成；失敗／取消保留原片與順序。": {
    "zh-CN": "只直接复制相容的视频与音轨，不转码、不补音轨、不生成；失败／取消保留原片与顺序。",
    "en": "Only compatible video and audio streams are copied directly. No transcoding, added audio or generation. Failure / cancellation preserves originals and order."
  },
  "模型音訊開啟": {
    "zh-CN": "模型音讯开启",
    "en": "Model audio enabled"
  },
  "一般參考": {
    "zh-CN": "一般参考",
    "en": "General reference"
  },
  "首尾幀": {
    "zh-CN": "首尾帧",
    "en": "First and last frames"
  },
  "選圖片 → 寫動作 → 看影片": {
    "zh-CN": "选图片 → 写动作 → 看视频",
    "en": "Choose image → Describe motion → Review video"
  },
  "多圖參考影片": {
    "zh-CN": "多图参考视频",
    "en": "Multiple-image reference video"
  },
  "依序參考人物、產品、場景與構圖；不保證固定首尾幀。": {
    "zh-CN": "依序参考人物、产品、场景与构图；不保证固定首尾帧。",
    "en": "Reference people, products, scenes and composition in order. Fixed first / last frames are not guaranteed."
  },
  "從這張圖開始，讓畫面自然動起來。": {
    "zh-CN": "从这张图开始，让画面自然动起来。",
    "en": "Start from this image and let it move naturally."
  },
  "指定開始與結束的畫面，中間由模型生成。": {
    "zh-CN": "指定开始与结束的画面，中间由模型生成。",
    "en": "Specify the opening and closing frames; the model generates the transition."
  },
  "影片比例": {
    "zh-CN": "视频比例",
    "en": "Video aspect ratio"
  },
  "由模型選擇": {
    "zh-CN": "由模型选择",
    "en": "Model chooses"
  },
  "加入影片參考": {
    "zh-CN": "加入视频参考",
    "en": "Add video reference"
  },
  "從畫布選圖片（最多30張）": {
    "zh-CN": "从画布选图片（最多30张）",
    "en": "Choose canvas images (up to 30)"
  },
  "影片參考順序": {
    "zh-CN": "视频参考顺序",
    "en": "Video reference order"
  },
  "影片參考": {
    "zh-CN": "视频参考",
    "en": "Video reference"
  },
  "首幀 · 開始畫面": {
    "zh-CN": "首帧 · 开始画面",
    "en": "First frame · Opening"
  },
  "尾幀 · 結束畫面": {
    "zh-CN": "尾帧 · 结束画面",
    "en": "Last frame · Ending"
  },
  "選擇首幀": {
    "zh-CN": "选择首帧",
    "en": "Choose first frame"
  },
  "選擇尾幀": {
    "zh-CN": "选择尾帧",
    "en": "Choose last frame"
  },
  "請從畫布選圖片": {
    "zh-CN": "请从画布选图片",
    "en": "Choose an image from the canvas"
  },
  "首幀固定版本": {
    "zh-CN": "首帧固定版本",
    "en": "Fixed first-frame version"
  },
  "尾幀固定版本": {
    "zh-CN": "尾帧固定版本",
    "en": "Fixed last-frame version"
  },
  "首尾幀與多圖參考互斥；請明確移除首尾幀引用，來源素材不會刪除。": {
    "zh-CN": "首尾帧与多图参考互斥；请明确移除首尾帧引用，来源素材不会删除。",
    "en": "First/last frames and multi-image references are mutually exclusive. Remove frame references explicitly; source media is not deleted."
  },
  "引用": {
    "zh-CN": "引用",
    "en": "Reference"
  },
  "不關閉模型音訊。可在提示詞描述對白、音效和環境音；實際是否有聲音由模型決定，既有影片不會被改動。": {
    "zh-CN": "不关闭模型音讯。可在提示词描述对白、音效和环境音；实际是否有声音由模型决定，既有视频不会被改动。",
    "en": "Model audio is not disabled. Describe dialogue, effects and ambience in the prompt. The model determines whether audio is present; existing videos are unchanged."
  },
  "影片每圖小於30MB；JSON含Base64與參數最多64MB。無8MiB原圖總量限制。PNG/JPEG/靜態WebP；本地解碼另限24MP。首尾幀只按首幀比例，多圖參考可選比例。": {
    "zh-CN": "视频每图小于30MB；JSON含Base64与参数最多64MB。无8MiB原图总量限制。PNG/JPEG/静态WebP；本地解码另限24MP。首尾帧只按首帧比例，多图参考可选比例。",
    "en": "Each video reference image must be under 30MB. JSON including Base64 and parameters is limited to 64MB, without an 8MiB original-image total limit. PNG/JPEG/static WebP; local decoding is limited to 24MP. Frame modes follow the first-frame ratio; multi-reference mode allows a ratio choice."
  },
  "仍有尾幀連線。": {
    "zh-CN": "仍有尾帧连线。",
    "en": "A last-frame connection remains."
  },
  "移除尾幀": {
    "zh-CN": "移除尾帧",
    "en": "Remove last frame"
  },
  "或切回首尾幀，避免用途混淆。": {
    "zh-CN": "或切回首尾帧，避免用途混淆。",
    "en": "or return to first/last-frame mode to avoid role confusion."
  },
  "寫動作與鏡頭需求": {
    "zh-CN": "写动作与镜头需求",
    "en": "Describe motion and camera"
  },
  "例如：鏡頭慢慢靠近，柔光隨畫面移動": {
    "zh-CN": "例如：镜头慢慢靠近，柔光随画面移动",
    "en": "Example: the camera slowly moves closer as soft light moves across the scene"
  },
  "Dreamina Seedance 2.5 · 4秒 · 480p": {
    "zh-CN": "Dreamina Seedance 2.5 · 4秒 · 480p",
    "en": "Dreamina Seedance 2.5 · 4 seconds · 480p"
  },
  "多圖參考 ·": {
    "zh-CN": "多图参考 ·",
    "en": "Multiple references ·"
  },
  "依首幀選擇比例": {
    "zh-CN": "依首帧选择比例",
    "en": "Follow first-frame aspect ratio"
  },
  "· 水印開啟": {
    "zh-CN": "· 水印开启",
    "en": "· Watermark enabled"
  },
  "影片接入點：": {
    "zh-CN": "视频接入点：",
    "en": "Video Endpoint:"
  },
  "；目前帳戶權限仍待真測。": {
    "zh-CN": "；目前帐户权限仍待真测。",
    "en": "; current account access still needs live verification."
  },
  "首尾幀與多圖參考互斥；多圖時可在提示詞指定起始構圖，但不保證固定首幀。影片／音頻參考尚未接入。": {
    "zh-CN": "首尾帧与多图参考互斥；多图时可在提示词指定起始构图，但不保证固定首帧。视频／音频参考尚未接入。",
    "en": "Frame modes and multi-image reference are mutually exclusive. Multi-reference prompts can describe the opening composition but cannot guarantee a fixed first frame. Video / audio references are not integrated at this legacy entry."
  },
  "需求或素材更新，請核對固定版本。": {
    "zh-CN": "需求或素材更新，请核对固定版本。",
    "en": "Prompt or media changed. Review the fixed versions."
  },
  "已核對本次首尾幀、用途及需求，保留所列固定版本": {
    "zh-CN": "已核对本次首尾帧、用途及需求，保留所列固定版本",
    "en": "I reviewed the frames, roles and prompt and will retain the listed fixed versions"
  },
  "原影片生成中…": {
    "zh-CN": "原视频生成中…",
    "en": "Original video generating…"
  },
  "影片任務進行中…": {
    "zh-CN": "视频任务进行中…",
    "en": "Video task in progress…"
  },
  "生成影片": {
    "zh-CN": "生成视频",
    "en": "Generate video"
  },
  "BytePlus · 4秒 · 480p ·": {
    "zh-CN": "BytePlus · 4秒 · 480p ·",
    "en": "BytePlus · 4 seconds · 480p ·"
  },
  "依首幀比例": {
    "zh-CN": "依首帧比例",
    "en": "Follow first-frame ratio"
  },
  "· 水印": {
    "zh-CN": "· 水印",
    "en": "· Watermark"
  },
  "每次送出會核對固定素材與收費任務，未知不會重送。": {
    "zh-CN": "每次送出会核对固定素材与收费任务，未知不会重送。",
    "en": "Every submission checks fixed media and the paid task. Unknown submissions are not resent."
  },
  "影片完成後會回到這個任務框。": {
    "zh-CN": "视频完成后会回到这个任务框。",
    "en": "Completed video returns to this task card."
  },
  "BytePlus 影片原始結果 · 費用待核對": {
    "zh-CN": "BytePlus 视频原始结果 · 费用待核对",
    "en": "Original BytePlus video result · Charges need checking"
  },
  "HTTP合成影片 · 非真實生成": {
    "zh-CN": "HTTP合成视频 · 非真实生成",
    "en": "HTTP-synthetic video · Not live generation"
  },
  "播放此版": {
    "zh-CN": "播放此版",
    "en": "Play this version"
  },
  "BytePlus原操作；工程替身會另標非真實生成，費用依實際帳單。": {
    "zh-CN": "BytePlus原操作；离线模拟会另标非真实生成，费用依实际帐单。",
    "en": "Original BytePlus operation. Substitutes are separately labeled as non-live generation; charges follow the actual bill."
  },
  "供應商原任務；實扣待核對，停止等待不保證取消或退款。": {
    "zh-CN": "供应商原任务；实扣待核对，停止等待不保证取消或退款。",
    "en": "Original provider task. Charges need reconciliation. Stopping local waiting does not guarantee cancellation or refund."
  },
  "固定首尾幀版本與需求已保留；沒有供應商費用。": {
    "zh-CN": "固定首尾帧版本与需求已保留；没有供应商费用。",
    "en": "Fixed frame versions and prompt are preserved. No provider charge."
  },
  "正在測試影片閉環": {
    "zh-CN": "正在测试视频闭环",
    "en": "Testing video workflow"
  },
  "原操作仍保留": {
    "zh-CN": "原操作仍保留",
    "en": "Original operation retained"
  },
  "查看原任務／恢復下載": {
    "zh-CN": "查看原任务／恢复下载",
    "en": "View original task / resume download"
  },
  "重新接通原批次 · 只恢復下載": {
    "zh-CN": "重新接通原批次 · 只恢复下载",
    "en": "Reconnect original batch · Resume download only"
  },
  "查看原任務不重新生成。停止等待不表示供應商取消或退款。": {
    "zh-CN": "查看原任务不重新生成。停止等待不表示供应商取消或退款。",
    "en": "Viewing an original task does not generate again. Stopping waiting does not imply provider cancellation or refund."
  },
  "連接原影片": {
    "zh-CN": "连接原视频",
    "en": "Connecting original video"
  },
  "原影片下載中": {
    "zh-CN": "原视频下载中",
    "en": "Downloading original video"
  },
  "正在驗證影片": {
    "zh-CN": "正在验证视频",
    "en": "Verifying video"
  },
  "影片已就緒": {
    "zh-CN": "视频已就绪",
    "en": "Video ready"
  },
  "片段已保留，等待續傳": {
    "zh-CN": "片段已保留，等待续传",
    "en": "Partial file preserved; awaiting continuation"
  },
  "下載已暫停": {
    "zh-CN": "下载已暂停",
    "en": "Download paused"
  },
  "已停止本機等待": {
    "zh-CN": "已停止本机等待",
    "en": "Local waiting stopped"
  },
  "原任務進度": {
    "zh-CN": "原任务进度",
    "en": "Original task progress"
  },
  "bytes": {
    "zh-CN": "bytes",
    "en": "bytes"
  },
  "最後收到資料：": {
    "zh-CN": "最后收到资料：",
    "en": "Last data received:"
  },
  "片段已保留，可繼續同一任務。": {
    "zh-CN": "片段已保留，可继续同一任务。",
    "en": "Partial file preserved. Continue the same task."
  },
  "下載總時限600秒 · 60秒無資料才中斷。關閉進度不會停止。": {
    "zh-CN": "下载总时限600秒 · 60秒无资料才中断。关闭进度不会停止。",
    "en": "Download limit: 600 seconds; interruption after 60 seconds without data. Closing progress does not stop it."
  },
  "繼續原任務": {
    "zh-CN": "继续原任务",
    "en": "Continue original task"
  },
  "停止本機等待": {
    "zh-CN": "停止本机等待",
    "en": "Stop local waiting"
  },
  "請填寫項目名稱。": {
    "zh-CN": "请填写项目名称。",
    "en": "Enter a project name."
  },
  "項目尚未建立，請查看提示後重試。": {
    "zh-CN": "项目尚未建立，请查看提示后重试。",
    "en": "Project was not created. Check the notice and try again."
  },
  "未能建立項目，請保留名稱並重試。": {
    "zh-CN": "未能建立项目，请保留名称并重试。",
    "en": "Could not create project. Keep the name and try again."
  },
  "AICG 工作台": {
    "zh-CN": "AICG 工作台",
    "en": "AICG Workbench"
  },
  "素材、任務與畫布，同一個項目": {
    "zh-CN": "素材、任务与画布，同一个项目",
    "en": "Media, tasks and canvas in one project"
  },
  "隔離驗收候選 · 未替換現有版本": {
    "zh-CN": "隔离验收候选 · 未替换现有版本",
    "en": "Isolated acceptance candidate · Existing version unchanged"
  },
  "從項目進入創作畫布": {
    "zh-CN": "从项目进入创作画布",
    "en": "Open a project to start creating"
  },
  "匯入素材、生成圖片與影片，再在畫布內合併成片。內容修改後，請手動保存。": {
    "zh-CN": "汇入素材、生成图片与视频，再在画布内合并成片。内容修改后，请手动保存。",
    "en": "Import media, generate images and videos, then merge on the canvas. Save manually after editing."
  },
  "BytePlus 生成服務": {
    "zh-CN": "BytePlus 生成服务",
    "en": "BytePlus generation service"
  },
  "本機連接已設定": {
    "zh-CN": "本机连接已设定",
    "en": "Local connection configured"
  },
  "尚未連接": {
    "zh-CN": "尚未连接",
    "en": "Not connected"
  },
  "待設定": {
    "zh-CN": "待设定",
    "en": "Not configured"
  },
  "更新 BytePlus 連接": {
    "zh-CN": "更新 BytePlus 连接",
    "en": "Update BytePlus connection"
  },
  "清除本次連接": {
    "zh-CN": "清除本次连接",
    "en": "Clear this connection"
  },
  "Key 只在本機專用視窗輸入。本機設定狀態不代表帳戶或 Key 已通過驗證，服務可用性以實際 API 結果為準。": {
    "zh-CN": "Key 只在本机专用视窗输入。本机设定状态不代表帐户或 Key 已通过验证，服务可用性以实际 API 结果为准。",
    "en": "Enter the Key only in the separate local window. Local configuration does not validate the account or Key; availability follows actual API results."
  },
  "新建項目": {
    "zh-CN": "新建项目",
    "en": "New project"
  },
  "項目名稱": {
    "zh-CN": "项目名称",
    "en": "Project name"
  },
  "建立成功後，直接進入這個項目的畫布。": {
    "zh-CN": "建立成功后，直接进入这个项目的画布。",
    "en": "A successfully created project opens directly on its canvas."
  },
  "建立中…": {
    "zh-CN": "建立中…",
    "en": "Creating…"
  },
  "建立項目並開啟畫布": {
    "zh-CN": "建立项目并开启画布",
    "en": "Create project and open canvas"
  },
  "你的項目": {
    "zh-CN": "你的项目",
    "en": "Your projects"
  },
  "個項目": {
    "zh-CN": "个项目",
    "en": "projects"
  },
  "未命名項目": {
    "zh-CN": "未命名项目",
    "en": "Untitled project"
  },
  "開啟項目：": {
    "zh-CN": "开启项目：",
    "en": "Open project:"
  },
  "素材、任務與成片，在同一張畫布接續。": {
    "zh-CN": "素材、任务与成片，在同一张画布接续。",
    "en": "Media, tasks and films continue on one canvas."
  },
  "個任務 ·": {
    "zh-CN": "个任务 ·",
    "en": "tasks ·"
  },
  "開啟畫布": {
    "zh-CN": "开启画布",
    "en": "Open canvas"
  },
  "先為這次創作建立一個項目": {
    "zh-CN": "先为这次创作建立一个项目",
    "en": "Create a project for this session"
  },
  "在上方填寫名稱，就能開始整理素材與畫布。": {
    "zh-CN": "在上方填写名称，就能开始整理素材与画布。",
    "en": "Enter a name above to start organizing media and canvas."
  },
  "創作與合併都在畫布內完成。成片落盤與項目保存分開；請在離開前手動保存需要保留的修改。": {
    "zh-CN": "创作与合并都在画布内完成。成片落盘与项目保存分开；请在离开前手动保存需要保留的修改。",
    "en": "Create and merge on the canvas. Film output and project saving are separate; save wanted changes before leaving."
  },
  "統一工作台": {
    "zh-CN": "统一工作台",
    "en": "Shared workbench"
  },
  "同一工作庫 · 手動保存": {
    "zh-CN": "同一工作库 · 手动保存",
    "en": "One library · Manual save"
  },
  "素材庫": {
    "zh-CN": "素材库",
    "en": "Media library"
  },
  "圖片與影片任務": {
    "zh-CN": "图片与视频任务",
    "en": "Image and video tasks"
  },
  "收起工作台面板": {
    "zh-CN": "收起工作台面板",
    "en": "Collapse workbench panel"
  },
  "切換項目保留已套用但未保存的修改。未套用草稿請先處理。": {
    "zh-CN": "切换项目保留已应用但未保存的修改。未应用草稿请先处理。",
    "en": "Switching projects preserves applied unsaved edits. Resolve unapplied drafts first."
  },
  "新項目名稱": {
    "zh-CN": "新项目名称",
    "en": "New project name"
  },
  "說明": {
    "zh-CN": "说明",
    "en": "Description"
  },
  "新項目說明": {
    "zh-CN": "新项目说明",
    "en": "New project description"
  },
  "建立項目": {
    "zh-CN": "建立项目",
    "en": "Create project"
  },
  "匯入已保存工作台副本": {
    "zh-CN": "汇入已保存工作台副本",
    "en": "Import saved workbench copy"
  },
  "只讀完整備份，匯入新整合庫；原庫和原始備份保留。來源未知字段不丟棄。": {
    "zh-CN": "只读完整备份，汇入新整合库；原库和原始备份保留。来源未知字段不丢弃。",
    "en": "Read a complete backup into a new integration library. Original library and backup are preserved. Unknown provenance fields are retained."
  },
  "選取 complete.json": {
    "zh-CN": "选取 complete.json",
    "en": "Choose complete.json"
  },
  "· DTO": {
    "zh-CN": "· DTO",
    "en": "· DTO"
  },
  "· 原保存 r": {
    "zh-CN": "· 原保存 r",
    "en": "· Original saved r"
  },
  "任務 /": {
    "zh-CN": "任务 /",
    "en": "Tasks /"
  },
  "媒體": {
    "zh-CN": "媒体",
    "en": "Media"
  },
  "副本已匯入記憶體，請手動保存整庫。": {
    "zh-CN": "副本已汇入记忆体，请手动保存整库。",
    "en": "Copy imported into memory. Save the whole library manually."
  },
  "匯入到目前整合副本": {
    "zh-CN": "汇入到目前整合副本",
    "en": "Import into current integration copy"
  },
  "同一資料與保存路徑": {
    "zh-CN": "同一资料与保存路径",
    "en": "Shared data and save path"
  },
  "素材、任務結果與成片使用同一受管媒體。相同字節只存一份；來源身份與版本保留。": {
    "zh-CN": "素材、任务结果与成片使用同一受管媒体。相同字节只存一份；来源身份与版本保留。",
    "en": "Media, task results and films use the same managed store. Identical bytes are stored once; source identity and versions are retained."
  },
  "查找素材": {
    "zh-CN": "查找素材",
    "en": "Find media"
  },
  "查找素材庫": {
    "zh-CN": "查找素材库",
    "en": "Search media library"
  },
  "素材庫分類": {
    "zh-CN": "素材库分类",
    "en": "Media category"
  },
  "份素材": {
    "zh-CN": "份素材",
    "en": "media items"
  },
  "媒資": {
    "zh-CN": "媒资",
    "en": "Media asset"
  },
  "來源保留": {
    "zh-CN": "来源保留",
    "en": "Provenance retained"
  },
  "尚未映射": {
    "zh-CN": "尚未映射",
    "en": "Not mapped"
  },
  "已接受任務結果": {
    "zh-CN": "已接受任务结果",
    "en": "Accepted task result"
  },
  "候選任務結果": {
    "zh-CN": "候选任务结果",
    "en": "Candidate task result"
  },
  "畫布成片": {
    "zh-CN": "画布成片",
    "en": "Canvas film"
  },
  "本地素材": {
    "zh-CN": "本地素材",
    "en": "Local media"
  },
  "來源待映射": {
    "zh-CN": "来源待映射",
    "en": "Source needs mapping"
  },
  "在畫布定位／引用": {
    "zh-CN": "在画布定位／引用",
    "en": "Locate / reference on canvas"
  },
  "引用到此項目畫布": {
    "zh-CN": "引用到此项目画布",
    "en": "Reference on this project canvas"
  },
  "來源與固定版本": {
    "zh-CN": "来源与固定版本",
    "en": "Provenance and fixed version"
  },
  "Agent 提供圖片（外部生成來源未驗證）": {
    "zh-CN": "Agent 提供图片（外部生成来源未验证）",
    "en": "Agent-provided image (external generation provenance unverified)"
  },
  "本機原圖": {
    "zh-CN": "本机原图",
    "en": "Local original image"
  },
  "原始 SHA256": {
    "zh-CN": "原始 SHA256",
    "en": "Original SHA256"
  },
  "目前使用另一版本；原始匯入僅作歷史記錄": {
    "zh-CN": "目前使用另一版本；原始汇入仅作历史记录",
    "en": "Another version is in use. Original import is historical only."
  },
  "保留版本": {
    "zh-CN": "保留版本",
    "en": "Retain version"
  },
  "任務和畫布節點共用穩定ID。點選可回到畫布內編輯、查看結果；實際生成與本地演練會分別標示。": {
    "zh-CN": "任务和画布节点共用稳定ID。点选可回到画布内编辑、查看结果；实际生成与本地演练会分别标示。",
    "en": "Tasks and canvas nodes share stable IDs. Click to edit or view results on the canvas. Live generation and local simulations are labeled separately."
  },
  "影片": {
    "zh-CN": "视频",
    "en": "Video"
  },
  "未歸屬項目": {
    "zh-CN": "未归属项目",
    "en": "No project assigned"
  },
  "整庫提交 r": {
    "zh-CN": "整库提交 r",
    "en": "Library commit r"
  },
  "· 編輯版本": {
    "zh-CN": "· 编辑版本",
    "en": "· Edit revision"
  },
  "成片落盤不會自動保存工程；收費生成送出前會另行確認，實際費用以平台帳戶為準。": {
    "zh-CN": "成片落盘不会自动保存工程；收费生成送出前会另行确认，实际费用以平台帐户为准。",
    "en": "Saving film output does not save the project automatically. Paid generation requires separate confirmation; actual charges follow the provider account."
  },
  "Open project: {name}": {
    "zh-CN": "打开项目：{name}",
    "en": "Open project: {name}"
  },
  "Interface language": {
    "zh-CN": "界面语言",
    "en": "Interface language"
  },
  "Language preference could not be saved. It applies to this session only.": {
    "zh-CN": "语言偏好未能保存，仅本次会话生效。",
    "en": "Language preference could not be saved. It applies to this session only."
  },
  "Diagnostics": {
    "zh-CN": "诊断信息",
    "en": "Diagnostics"
  },
  "Operation did not finish. Your input and previous results are preserved.": {
    "zh-CN": "未能确认操作结果。你的输入和之前的结果已保留。",
    "en": "The operation could not be confirmed. Your input and previous results are preserved."
  },
  "Check the original operation before trying again. An unknown receipt must not be resubmitted.": {
    "zh-CN": "请先核对原操作。回执未知时不要重复提交。",
    "en": "Check the original operation before trying again. An unknown receipt must not be resubmitted."
  },
  "Details are masked. No permission is granted by viewing them.": {
    "zh-CN": "详细信息已遮罩。查看不授予任何操作权限。",
    "en": "Details are masked. No permission is granted by viewing them."
  },
  "Close diagnostics": {
    "zh-CN": "关闭诊断信息",
    "en": "Close diagnostics"
  },
  "Image": {
    "zh-CN": "图片",
    "en": "Image"
  },
  "Video": {
    "zh-CN": "视频",
    "en": "Video"
  },
  "Audio": {
    "zh-CN": "音频",
    "en": "Audio"
  },
  "Text": {
    "zh-CN": "文字",
    "en": "Text"
  },
  "Language": {
    "zh-CN": "语言",
    "en": "Language"
  },
  "User content is kept in its original language.": {
    "zh-CN": "用户内容保留原文。",
    "en": "User content is kept in its original language."
  },
  "已連線": {
    "zh-CN": "已连线",
    "en": "Connected"
  },
  "連線中": {
    "zh-CN": "连线中",
    "en": "Connecting"
  },
  "已斷線": {
    "zh-CN": "已断线",
    "en": "Disconnected"
  },
  "已停止本次協作": {
    "zh-CN": "已停止本次协作",
    "en": "This collaboration session stopped"
  },
  "等待身份核實": {
    "zh-CN": "等待身份核实",
    "en": "Awaiting identity verification"
  },
  "目前沒有活動通道": {
    "zh-CN": "目前没有活动通道",
    "en": "No active channel"
  },
  "結果已取得": {
    "zh-CN": "结果已取得",
    "en": "Result received"
  },
  "生成失敗": {
    "zh-CN": "生成失败",
    "en": "Generation failed"
  },
  "已停止本地等待": {
    "zh-CN": "已停止本地等待",
    "en": "Local waiting stopped"
  },
  "任務狀態未知": {
    "zh-CN": "任务状态未知",
    "en": "Task state unknown"
  },
  "工程替身進行中": {
    "zh-CN": "离线模拟进行中",
    "en": "Offline simulation in progress"
  },
  "工程替身完成": {
    "zh-CN": "离线模拟完成",
    "en": "Offline simulation completed"
  },
  "工程替身失敗": {
    "zh-CN": "离线模拟失败",
    "en": "Offline simulation failed"
  },
  "工程替身已停止": {
    "zh-CN": "离线模拟已停止",
    "en": "Offline simulation stopped"
  },
  "工程替身結果待核對": {
    "zh-CN": "离线模拟结果待核对",
    "en": "Offline simulation result needs checking"
  },
  "工程替身狀態未知": {
    "zh-CN": "离线模拟状态未知",
    "en": "Offline simulation state unknown"
  },
  "模擬進行中": {
    "zh-CN": "模拟进行中",
    "en": "Simulation in progress"
  },
  "模擬完成": {
    "zh-CN": "模拟完成",
    "en": "Simulation completed"
  },
  "模擬失敗": {
    "zh-CN": "模拟失败",
    "en": "Simulation failed"
  },
  "模擬已停止": {
    "zh-CN": "模拟已停止",
    "en": "Simulation stopped"
  },
  "模擬狀態未知": {
    "zh-CN": "模拟状态未知",
    "en": "Simulation state unknown"
  },
  "任務已完成": {
    "zh-CN": "任务已完成",
    "en": "Task completed"
  },
  "原結果待核對": {
    "zh-CN": "原结果待核对",
    "en": "Original result needs checking"
  },
  "撤銷最近畫布編輯": {
    "zh-CN": "撤销最近画布编辑",
    "en": "Undo latest canvas edit"
  },
  "重做最近撤銷": {
    "zh-CN": "重做最近撤销",
    "en": "Redo latest undo"
  },
  "複製所選框": {
    "zh-CN": "复制所选框",
    "en": "Duplicate selected cards"
  },
  "不複製成片；集合外輸入不自動複製": {
    "zh-CN": "不复制成片；集合外输入不自动复制",
    "en": "Films are not copied; external inputs are not copied automatically"
  },
  "移除所選框／連線": {
    "zh-CN": "移除所选框／连线",
    "en": "Remove selected cards / connections"
  },
  "原媒體保留、可撤銷；成片播放線在編排中調整": {
    "zh-CN": "原媒体保留、可撤销；成片播放线在编排中调整",
    "en": "Original media retained; undo available. Edit film playback links in composition."
  },
  "搜尋畫布節點": {
    "zh-CN": "搜寻画布节点",
    "en": "Search canvas nodes"
  },
  "新建圖片任務框": {
    "zh-CN": "新建图片任务框",
    "en": "New image task card"
  },
  "新建影片任務框": {
    "zh-CN": "新建视频任务框",
    "en": "New video task card"
  },
  "新建文字框": {
    "zh-CN": "新建文字框",
    "en": "New text card"
  },
  "編輯所選任務提示詞": {
    "zh-CN": "编辑所选任务提示词",
    "en": "Edit selected task prompt"
  },
  "只在選中一個圖片／影片任務時可用": {
    "zh-CN": "只在选中一个图片／视频任务时可用",
    "en": "Available only when one image / video task is selected"
  },
  "放大畫布": {
    "zh-CN": "放大画布",
    "en": "Zoom canvas in"
  },
  "縮小畫布": {
    "zh-CN": "缩小画布",
    "en": "Zoom canvas out"
  },
  "適應全部節點": {
    "zh-CN": "适应全部节点",
    "en": "Fit all nodes"
  },
  "畫布縮放至100%": {
    "zh-CN": "画布缩放至100%",
    "en": "Canvas zoom to 100%"
  },
  "手動保存工程": {
    "zh-CN": "手动保存工程",
    "en": "Save project manually"
  },
  "只有畫布有焦點且無未套用草稿時執行": {
    "zh-CN": "只有画布有焦点且无未应用草稿时执行",
    "en": "Runs only while the canvas has focus and no unapplied draft exists"
  },
  "請錄入一組有效按鍵": {
    "zh-CN": "请录入一组有效按键",
    "en": "Capture a valid key combination"
  },
  "按鍵格式無效": {
    "zh-CN": "按键格式无效",
    "en": "Invalid key format"
  },
  "此候選只支援 Windows；不將 Cmd 假當 Ctrl": {
    "zh-CN": "此候选只支援 Windows；不将 Cmd 假当 Ctrl",
    "en": "This candidate supports Windows only; Cmd is not treated as Ctrl"
  },
  "本版不綁 Alt／Win 或 Ctrl+Alt 組合，保留系統與輸入法操作": {
    "zh-CN": "本版不绑 Alt／Win 或 Ctrl+Alt 组合，保留系统与输入法操作",
    "en": "Alt / Win and Ctrl+Alt are reserved for system and input-method actions"
  },
  "Shift+Delete 保留給系統／剪貼簿操作；畫布移除預設為 Delete": {
    "zh-CN": "Shift+Delete 保留给系统／剪贴簿操作；画布移除预设为 Delete",
    "en": "Shift+Delete is reserved for system / clipboard actions. Canvas removal defaults to Delete."
  },
  "此鍵保留給輸入、導覽或系統；可用字母、數字、Delete、=、-、/、F2/F4/F7/F8/F9": {
    "zh-CN": "此键保留给输入、导览或系统；可用字母、数字、Delete、=、-、/、F2/F4/F7/F8/F9",
    "en": "This key is reserved for input, navigation or system actions. Allowed: letters, numbers, Delete, =, -, /, F2/F4/F7/F8/F9."
  },
  "此組合保留給剪貼簿、視窗或瀏覽器操作，請換一組": {
    "zh-CN": "此组合保留给剪贴簿、视窗或浏览器操作，请换一组",
    "en": "This combination is reserved for clipboard, window or browser actions. Choose another."
  },
  "此組合保留給開發工具或系統，請換一組": {
    "zh-CN": "此组合保留给开发工具或系统，请换一组",
    "en": "This combination is reserved for developer tools or the system. Choose another."
  },
  "輸入法組字中，不錄入或執行快捷鍵": {
    "zh-CN": "输入法组字中，不录入或执行快捷键",
    "en": "Input-method composition in progress. Shortcuts are not captured or executed."
  },
  "AltGr 保留給文字輸入": {
    "zh-CN": "AltGr 保留给文字输入",
    "en": "AltGr is reserved for text input"
  },
  "快捷操作清單不完整或含未知操作": {
    "zh-CN": "快捷操作清单不完整或含未知操作",
    "en": "Shortcut action list is incomplete or contains unknown actions"
  },
  "已用於「": {
    "zh-CN": "已用于「",
    "en": "Already assigned to “"
  },
  "」，請更換或明確停用該操作": {
    "zh-CN": "」，请更换或明确停用该操作",
    "en": "”. Choose another or explicitly disable that action."
  },
  "未知快捷操作": {
    "zh-CN": "未知快捷操作",
    "en": "Unknown shortcut action"
  },
  "已停用": {
    "zh-CN": "已停用",
    "en": "Disabled"
  },
  "查看用途與固定版本": {
    "zh-CN": "查看用途与固定版本",
    "en": "View roles and fixed versions"
  },
  "編輯成片編排": {
    "zh-CN": "编辑成片编排",
    "en": "Edit film composition"
  },
  "移除這條連線（可撤銷）": {
    "zh-CN": "移除这条连线（可撤销）",
    "en": "Remove this connection (undoable)"
  },
  "連接到任務框（追加）": {
    "zh-CN": "连接到任务框（追加）",
    "en": "Connect to task card (append)"
  },
  "複製": {
    "zh-CN": "复制",
    "en": "Duplicate"
  },
  "個框": {
    "zh-CN": "个框",
    "en": "cards"
  },
  "新身份；複製集合內連線，不複製框外輸入": {
    "zh-CN": "新身份；复制集合内连线，不复制框外输入",
    "en": "New identities; internal links copied, external inputs excluded"
  },
  "個框（可撤銷）": {
    "zh-CN": "个框（可撤销）",
    "en": "cards (undoable)"
  },
  "先處理執行中或未知任務，再移除整組": {
    "zh-CN": "先处理执行中或未知任务，再移除整组",
    "en": "Resolve running or unknown tasks before removing the group"
  },
  "原檔保留；整組一起撤銷": {
    "zh-CN": "原档保留；整组一起撤销",
    "en": "Original files retained; undo the group together"
  },
  "編輯提示詞": {
    "zh-CN": "编辑提示词",
    "en": "Edit prompt"
  },
  "查看首尾幀素材": {
    "zh-CN": "查看首尾帧素材",
    "en": "View frame media"
  },
  "查看參考素材與用途": {
    "zh-CN": "查看参考素材与用途",
    "en": "View reference media and roles"
  },
  "複製任務框": {
    "zh-CN": "复制任务框",
    "en": "Duplicate task card"
  },
  "新身份；不複製框外輸入連線": {
    "zh-CN": "新身份；不复制框外输入连线",
    "en": "New identity; external input connections excluded"
  },
  "移除這個任務（可撤銷）": {
    "zh-CN": "移除这个任务（可撤销）",
    "en": "Remove this task (undoable)"
  },
  "刪除所選素材（先查看影響）": {
    "zh-CN": "删除所选素材（先查看影响）",
    "en": "Delete selected media (review impact first)"
  },
  "更換畫布內素材": {
    "zh-CN": "更换画布内素材",
    "en": "Replace canvas media"
  },
  "重新命名": {
    "zh-CN": "重新命名",
    "en": "Rename"
  },
  "查看用途與來源": {
    "zh-CN": "查看用途与来源",
    "en": "View roles and provenance"
  },
  "排序、裁切與音量": {
    "zh-CN": "排序、裁切与音量",
    "en": "Order, trim and volume"
  },
  "編輯文字": {
    "zh-CN": "编辑文字",
    "en": "Edit text"
  },
  "複製文字框": {
    "zh-CN": "复制文字框",
    "en": "Duplicate text card"
  },
  "移除這個文字框（可撤銷）": {
    "zh-CN": "移除这个文字框（可撤销）",
    "en": "Remove this text card (undoable)"
  },
  "查看節點屬性": {
    "zh-CN": "查看节点属性",
    "en": "View node properties"
  },
  "畫布已變更，請重新開啟此對象的快速操作": {
    "zh-CN": "画布已变更，请重新开启此对象的快速操作",
    "en": "Canvas changed. Reopen quick actions for this target."
  },
  "右鍵集合已變更，請重新開啟選單": {
    "zh-CN": "右键集合已变更，请重新开启选单",
    "en": "Context-menu group changed. Reopen the menu."
  },
  "此對象已不存在或不支援這個操作": {
    "zh-CN": "此对象已不存在或不支援这个操作",
    "en": "This target no longer exists or does not support this action"
  },
  "只核對原任務，不重新生成；舊成果保留。": {
    "zh-CN": "只核对原任务，不重新生成；旧成果保留。",
    "en": "Check the original task only; no regeneration. Previous results are preserved."
  },
  "正在停止本地等待": {
    "zh-CN": "正在停止本地等待",
    "en": "Stopping local waiting"
  },
  "正在查原任務": {
    "zh-CN": "正在查原任务",
    "en": "Querying original task"
  },
  "本地等待正在結束；不代表雲端取消或退款。": {
    "zh-CN": "本地等待正在结束；不代表云端取消或退款。",
    "en": "Local waiting is ending. This does not imply cloud cancellation or a refund."
  },
  "已核對原結果，待接回畫布": {
    "zh-CN": "已核对原结果，待接回画布",
    "en": "Original result verified; awaiting canvas receipt"
  },
  "原結果已保留": {
    "zh-CN": "原结果已保留",
    "en": "Original result retained"
  },
  "原片保留，格式尚不支援合併": {
    "zh-CN": "原片保留，格式尚不支援合并",
    "en": "Original clip retained; format cannot be merged yet"
  },
  "供應商回報任務執行已過期": {
    "zh-CN": "供应商回报任务执行已过期",
    "en": "Provider reports task execution expired"
  },
  "這是供應商執行終態；不等於下載URL或taskId查詢期限，原結果保留。": {
    "zh-CN": "这是供应商执行终态；不等于下载URL或taskId查询期限，原结果保留。",
    "en": "This is a provider execution terminal state, separate from media URL or taskId query validity. Original results are retained."
  },
  "媒體下載來源／授權期限已到": {
    "zh-CN": "媒体下载来源／授权期限已到",
    "en": "Media download source / sharing authorization expired"
  },
  "媒體載體有效性檢查未通過，與官方任務期限不同；實際URL截止未回報時仍未知，原結果保留。": {
    "zh-CN": "媒体载体有效性检查未通过，与官方任务期限不同；实际URL截止未回报时仍未知，原结果保留。",
    "en": "Media carrier validity check failed, separate from the official task deadline. Actual URL expiry remains unknown if not reported. Original results are retained."
  },
  "上次媒體下載受拒（HTTP": {
    "zh-CN": "上次媒体下载受拒（HTTP",
    "en": "Last media download denied (HTTP"
  },
  "這是下載HTTP，不是原任務查詢狀態；未證實URL過期，不重新生成，已下載結果保留。": {
    "zh-CN": "这是下载HTTP，不是原任务查询状态；未证实URL过期，不重新生成，已下载结果保留。",
    "en": "This is download HTTP, not original task query status. URL expiry is unproven; no regeneration. Downloaded results are retained."
  },
  "媒體下載／驗證未完成": {
    "zh-CN": "媒体下载／验证未完成",
    "en": "Media download / verification incomplete"
  },
  "原任務回報仍保留；下載HTTP若未記錄則保持未知，不推定到期或Key錯誤。": {
    "zh-CN": "原任务回报仍保留；下载HTTP若未记录则保持未知，不推定到期或Key错误。",
    "en": "Original task reports are retained. Missing download HTTP stays unknown; expiry or Key failure is not inferred."
  },
  "原請求受拒（HTTP 403），未證實過期": {
    "zh-CN": "原请求受拒（HTTP 403），未证实过期",
    "en": "Original request denied (HTTP 403); expiry unproven"
  },
  "需依原Request ID及安全錯誤碼核對；403本身不證明Key錯誤或URL到期。": {
    "zh-CN": "需依原Request ID及安全错误码核对；403本身不证明Key错误或URL到期。",
    "en": "Check the original Request ID and safe error code. HTTP 403 alone proves neither a Key error nor URL expiry."
  },
  "原請求未能取得（HTTP 404）": {
    "zh-CN": "原请求未能取得（HTTP 404）",
    "en": "Original request unavailable (HTTP 404)"
  },
  "原記錄未證實是不存在、存取限制或期限問題；不因404重新提交。": {
    "zh-CN": "原记录未证实是不存在、存取限制或期限问题；不因404重新提交。",
    "en": "The record does not establish absence, access restriction or expiry. HTTP 404 does not trigger resubmission."
  },
  "原嘗試未送出，確認已失效": {
    "zh-CN": "原尝试未送出，确认已失效",
    "en": "Original attempt was not sent; confirmation invalidated"
  },
  "原提交已失敗，待核對畫布狀態": {
    "zh-CN": "原提交已失败，待核对画布状态",
    "en": "Original submission failed; canvas state needs reconciliation"
  },
  "原提交失敗，沒有重新送出": {
    "zh-CN": "原提交失败，没有重新送出",
    "en": "Original submission failed; no resubmission"
  },
  "原taskId查詢有效期已到": {
    "zh-CN": "原taskId查询有效期已到",
    "en": "Original taskId query validity expired"
  },
  "原查詢期限已知到期；不代表已下載本地結果失效，也不授權新POST。": {
    "zh-CN": "原查询期限已知到期；不代表已下载本地结果失效，也不授权新POST。",
    "en": "The original query deadline is known to have passed. Local downloaded results remain valid; no new POST is authorized."
  },
  "提交回執未知，沒有可靠 taskId": {
    "zh-CN": "提交回执未知，没有可靠 taskId",
    "en": "Submission receipt unknown; no reliable taskId"
  },
  "停止重送；請核對平台原請求，不能以重開或恢復按鈕新 POST。": {
    "zh-CN": "停止重送；请核对平台原请求，不能以重开或恢复按钮新 POST。",
    "en": "Do not resend. Check the original provider request. Reopening or recovery cannot create a new POST."
  },
  "已手動停止本地等待": {
    "zh-CN": "已手动停止本地等待",
    "en": "Local waiting stopped manually"
  },
  "原 taskId 與輸入快照保留；不代表雲端取消或退款。": {
    "zh-CN": "原 taskId 与输入快照保留；不代表云端取消或退款。",
    "en": "Original taskId and input snapshot are retained. This does not imply cloud cancellation or refund."
  },
  "重開後原提交回執待核對": {
    "zh-CN": "重开后原提交回执待核对",
    "en": "Original submission receipt needs checking after reopen"
  },
  "持久記錄顯示派送未獲確認；不推斷事故原因，也不重新提交。": {
    "zh-CN": "持久记录显示派送未获确认；不推断事故原因，也不重新提交。",
    "en": "The persistent record has no dispatch acknowledgment. No cause is inferred and nothing is resubmitted."
  },
  "原任務通訊未完成": {
    "zh-CN": "原任务通讯未完成",
    "en": "Original task communication incomplete"
  },
  "原記錄顯示查詢／下載未完成；網路或平台原因尚待核對，只能續查原 taskId。": {
    "zh-CN": "原记录显示查询／下载未完成；网路或平台原因尚待核对，只能续查原 taskId。",
    "en": "The record shows an incomplete query / download. Network or provider causes need checking; only the original taskId can be queried."
  },
  "最近回報：供應商排隊中": {
    "zh-CN": "最近回报：供应商排队中",
    "en": "Latest report: queued by provider"
  },
  "最近回報：供應商執行中": {
    "zh-CN": "最近回报：供应商执行中",
    "en": "Latest report: running at provider"
  },
  "等待不等於供應商失敗；目前未在本地輪詢，可依原門檻續查原taskId。": {
    "zh-CN": "等待不等于供应商失败；目前未在本地轮询，可依原门槛续查原taskId。",
    "en": "Waiting is not provider failure. Local polling is inactive; original recovery rules govern continued querying."
  },
  "從持久記錄載入的未完成原任務": {
    "zh-CN": "从持久记录加载的未完成原任务",
    "en": "Incomplete original task loaded from durable record"
  },
  "目前沒有本地等待；上次是否異常退出或斷線未記錄，不作推斷。": {
    "zh-CN": "目前没有本地等待；上次是否异常退出或断线未记录，不作推断。",
    "en": "No local waiting is active. Previous abnormal exit or disconnection was not recorded; neither is inferred."
  },
  "有未保存的原操作": {
    "zh-CN": "有未保存的原操作",
    "en": "Unsaved original operation exists"
  },
  "原任務待核對": {
    "zh-CN": "原任务待核对",
    "en": "Original task needs checking"
  },
  "目前沒有本地等待；暫停原因未記錄，不自動重新提交。": {
    "zh-CN": "目前没有本地等待；暂停原因未记录，不自动重新提交。",
    "en": "No local waiting is active. Pause cause was not recorded; no automatic resubmission."
  },
  "BytePlus Seedance 2.5 · 封存官方合同 2026-11-11": {
    "zh-CN": "BytePlus Seedance 2.5 · 封存官方合同 2026-11-11",
    "en": "BytePlus Seedance 2.5 · Archived official contract 2026-11-11"
  },
  "一般 taskId 自 created_at 起7天；Draft在2026-10-28 10:00 UTC+8起建立為14天，較早為7天。": {
    "zh-CN": "一般 taskId 自 created_at 起7天；Draft在2026-10-28 10:00 UTC+8起建立为14天，较早为7天。",
    "en": "Normal taskId validity is 7 days from created_at. Drafts created from 2026-10-28 10:00 UTC+8 have 14 days; earlier drafts have 7 days."
  },
  "execution_expires_after：預設172800秒（48小時），允許3600–259200秒；這是執行窗口，不是下載期限。": {
    "zh-CN": "execution_expires_after：预设172800秒（48小时），允许3600–259200秒；这是执行窗口，不是下载期限。",
    "en": "execution_expires_after defaults to 172800 seconds (48 hours), with 3600–259200 allowed. This is the execution window, not the download deadline."
  },
  "輸出影片URL一般24小時、最多100次下載；API未提供實際URL截止時保持未知，不由任務created_at推算。": {
    "zh-CN": "输出视频URL一般24小时、最多100次下载；API未提供实际URL截止时保持未知，不由任务created_at推算。",
    "en": "Output video URLs normally last 24 hours with at most 100 downloads. Actual URL expiry stays unknown if absent from the API; it is not derived from task created_at."
  },
  "BytePlus Seedream 5.0 Pro · 封存官方合同 2026-11-11": {
    "zh-CN": "BytePlus Seedream 5.0 Pro · 封存官方合同 2026-11-11",
    "en": "BytePlus Seedream 5.0 Pro · Archived official contract 2026-11-11"
  },
  "同步圖片合同沒有可查詢的影片taskId期限；不可套用影片7天規則。": {
    "zh-CN": "同步图片合同没有可查询的视频taskId期限；不可应用视频7天规则。",
    "en": "Synchronous images have no video taskId query deadline. The video 7-day rule does not apply."
  },
  "同步請求的等待上限屬本地策略；未核得本模型官方完成時限，保持未知。": {
    "zh-CN": "同步请求的等待上限属本地策略；未核得本模型官方完成时限，保持未知。",
    "en": "Synchronous request waiting limits are local policy. An official completion deadline for this model is unverified and remains unknown."
  },
  "圖片URL在生成後24小時有效；Base64回應不依賴遠端下載URL。": {
    "zh-CN": "图片URL在生成后24小时有效；Base64回应不依赖远端下载URL。",
    "en": "Image URLs remain valid for 24 hours after generation. Base64 responses do not depend on remote download URLs."
  },
  "此供應商／型號期限未核實": {
    "zh-CN": "此供应商／型号期限未核实",
    "en": "Deadlines for this provider / model are unverified"
  },
  "官方taskId查詢期限未知。": {
    "zh-CN": "官方taskId查询期限未知。",
    "en": "Official taskId query deadline is unknown."
  },
  "官方執行期限未知；本地逾時不等於供應商失敗。": {
    "zh-CN": "官方执行期限未知；本地逾时不等于供应商失败。",
    "en": "Official execution deadline is unknown. Local timeout does not imply provider failure."
  },
  "官方媒體下載期限未知；不沿用其他模型TTL。": {
    "zh-CN": "官方媒体下载期限未知；不沿用其他模型TTL。",
    "en": "Official media download deadline is unknown. Other models’ TTLs do not apply."
  },
  "未知／未記錄": {
    "zh-CN": "未知／未记录",
    "en": "Unknown / Not recorded"
  },
  "依圖片回應created及封存24小時規則": {
    "zh-CN": "依图片回应created及封存24小时规则",
    "en": "Based on image response created and the archived 24-hour rule"
  },
  "Base64回應，不適用遠端URL": {
    "zh-CN": "Base64回应，不适用远端URL",
    "en": "Base64 response; remote URL deadline does not apply"
  },
  "API未提供／舊記錄未保存；不能由影片created_at或403推算": {
    "zh-CN": "API未提供／旧记录未保存；不能由视频created_at或403推算",
    "en": "Not supplied by API / absent from old record; cannot infer from video created_at or HTTP 403"
  },
  "已發布本地結果可獨立查看；遠端URL過期不會撤銷或重試本地檔案。": {
    "zh-CN": "已发布本地结果可独立查看；远端URL过期不会撤销或重试本地文件。",
    "en": "Published local results can be viewed independently. Remote URL expiry does not revoke or retry local files."
  },
  "尚無可直接查看的已發布本地結果；保留原嘗試。": {
    "zh-CN": "尚无可直接查看的已发布本地结果；保留原尝试。",
    "en": "No published local result is directly viewable yet. Original attempt retained."
  },
  "本地正在等待原任務。": {
    "zh-CN": "本地正在等待原任务。",
    "en": "Waiting locally for the original task."
  },
  "不需要恢復遠端任務即可查看本地結果。": {
    "zh-CN": "不需要恢复远端任务即可查看本地结果。",
    "en": "Local results can be viewed without recovering the remote task."
  },
  "依原門檻可核對原紀錄；仍須通過主程序身份與憑據校驗。": {
    "zh-CN": "依原门槛可核对原纪录；仍须通过主程序身份与凭据校验。",
    "en": "Original rules allow record checking, subject to main-process identity and credential validation."
  },
  "原taskId查詢有效期已到；沒有恢復或新POST權利。": {
    "zh-CN": "原taskId查询有效期已到；没有恢复或新POST权利。",
    "en": "Original taskId query validity expired. No recovery or new POST right."
  },
  "此記錄目前不可恢復；不自動建立新付費嘗試。": {
    "zh-CN": "此记录目前不可恢复；不自动建立新付费尝试。",
    "en": "This record cannot be recovered currently. No new paid attempt is created automatically."
  },
  "影片勾選順序格式或版本無效": {
    "zh-CN": "视频勾选顺序格式或版本无效",
    "en": "Video selection order format or version is invalid"
  },
  "順序只接受影片任務；失效項須明確排除": {
    "zh-CN": "顺序只接受视频任务；失效项须明确排除",
    "en": "Order accepts video tasks only. Invalid items must be explicitly excluded."
  },
  "已移除的影片任務": {
    "zh-CN": "已移除的视频任务",
    "en": "Removed video task"
  },
  "尚無成功影片；不會代用其他任務或歷史檔案": {
    "zh-CN": "尚无成功视频；不会代用其他任务或历史文件",
    "en": "No successful video; other tasks or historical files are not substituted"
  },
  "任務已移除；請明確排除這一項": {
    "zh-CN": "任务已移除；请明确排除这一项",
    "en": "Task removed. Explicitly exclude this item."
  },
  "此身份不是影片任務": {
    "zh-CN": "此身份不是视频任务",
    "en": "This identity is not a video task"
  },
  "目前任務的執行記錄缺失": {
    "zh-CN": "目前任务的执行记录缺失",
    "en": "Current task run record is missing"
  },
  "目前執行記錄歸屬不符": {
    "zh-CN": "目前执行记录归属不符",
    "en": "Current run owner mismatch"
  },
  "正在生成／下載；請等待本次結果，不會默用舊 V1": {
    "zh-CN": "正在生成／下载；请等待本次结果，不会默用旧 V1",
    "en": "Generating / downloading. Wait for this result; old V1 is never used silently."
  },
  "本次提交狀態未知；只查原任務，不會默用舊 V1": {
    "zh-CN": "本次提交状态未知；只查原任务，不会默用旧 V1",
    "en": "Current submission state unknown. Only query the original task; old V1 is never used silently."
  },
  "；舊結果保留。可明確排除；使用舊版須另行明確決定": {
    "zh-CN": "；旧结果保留。可明确排除；使用旧版须另行明确决定",
    "en": "; old results retained. Exclude explicitly, or explicitly decide to use an older result."
  },
  "目前執行狀態無法確認": {
    "zh-CN": "目前执行状态无法确认",
    "en": "Current run state cannot be verified"
  },
  "目前成功執行的影片結果缺失或不唯一": {
    "zh-CN": "目前成功执行的视频结果缺失或不唯一",
    "en": "Current successful video result is missing or ambiguous"
  },
  "目前結果未完整保存或媒體已失效；請重新驗證或明確排除": {
    "zh-CN": "目前结果未完整保存或媒体已失效；请重新验证或明确排除",
    "en": "Current result is not completely saved or its media is unavailable. Revalidate or explicitly exclude."
  },
  "目前結果的媒體身份或完整性資料無效": {
    "zh-CN": "目前结果的媒体身份或完整性资料无效",
    "en": "Current result media identity or integrity metadata is invalid"
  },
  "目前成功結果 · 本地原片": {
    "zh-CN": "目前成功结果 · 本地原片",
    "en": "Current successful result · Local original"
  },
  "文字生圖": {
    "zh-CN": "文字生图",
    "en": "Text to image"
  },
  "參考圖生成": {
    "zh-CN": "参考图生成",
    "en": "Generate from reference image"
  },
  "圖片互動編輯": {
    "zh-CN": "图片互动编辑",
    "en": "Interactive image edit"
  },
  "圖片層分解": {
    "zh-CN": "图片层分解",
    "en": "Image layer decomposition"
  },
  "人物站立，双腿伸直，双臂自然下垂。": {
    "zh-CN": "人物站立，双腿伸直，双臂自然下垂。",
    "en": "Standing with straight legs and arms relaxed by the sides."
  },
  "T 型": {
    "zh-CN": "T 型",
    "en": "T-pose"
  },
  "人物呈T字站姿，双腿伸直，双臂向两侧伸展。": {
    "zh-CN": "人物呈T字站姿，双腿伸直，双臂向两侧伸展。",
    "en": "Standing in a T-pose with straight legs and arms extended sideways."
  },
  "人物双腿前后错开、双臂交错摆动，呈行走动作的静态定格。": {
    "zh-CN": "人物双腿前后错开、双臂交错摆动，呈行走动作的静态定格。",
    "en": "A static walking pose with staggered legs and opposite arms."
  },
  "动作定格，不是动画；仅最低支撑点接地。": {
    "zh-CN": "动作定格，不是动画；仅最低支撑点接地。",
    "en": "Static pose, not animation. Only the lowest support point touches the ground."
  },
  "人物身体前倾，双腿与双臂大幅前后错开，呈跑步动作的静态定格。": {
    "zh-CN": "人物身体前倾，双腿与双臂大幅前后错开，呈跑步动作的静态定格。",
    "en": "A static running pose with the body leaning forward and arms and legs widely staggered."
  },
  "静态定格，无步态与重心模拟。": {
    "zh-CN": "静态定格，无步态与重心模拟。",
    "en": "Static pose, without gait or center-of-mass simulation."
  },
  "人物髋部和双膝弯曲，大腿前伸、小腿向下，呈静态坐姿。": {
    "zh-CN": "人物髋部和双膝弯曲，大腿前伸、小腿向下，呈静态坐姿。",
    "en": "A static seated pose with bent hips and knees, thighs forward and lower legs down."
  },
  "仅姿态，未添加椅子；可另行搭配座具。": {
    "zh-CN": "仅姿态，未添加椅子；可另行搭配座具。",
    "en": "Pose only; no chair is added. Add seating separately."
  },
  "蹲下": {
    "zh-CN": "蹲下",
    "en": "Squatting"
  },
  "人物髋膝深度弯曲，身体降低，双臂位于身前，呈静态蹲姿。": {
    "zh-CN": "人物髋膝深度弯曲，身体降低，双臂位于身前，呈静态蹲姿。",
    "en": "A low static squat with deeply bent hips and knees and arms in front."
  },
  "刚性腿段，无锁脚或平衡求解。": {
    "zh-CN": "刚性腿段，无锁脚或平衡求解。",
    "en": "Rigid leg segments; no foot locking or balance solver."
  },
  "单膝跪": {
    "zh-CN": "单膝跪",
    "en": "One knee"
  },
  "人物一条腿向前自然屈膝、前脚掌平放，后膝接地，小腿向后接近地面，呈直身单膝跪的静态姿态。": {
    "zh-CN": "人物一条腿向前自然屈膝、前脚掌平放，后膝接地，小腿向后接近地面，呈直身单膝跪的静态姿态。",
    "en": "Upright on one knee, front leg bent with sole flat, rear knee down and lower leg near the ground."
  },
  "后小腿离水平7.5°，后脚尖接近地面、脚跟抬起；现有踝范围不支持脚背平贴。": {
    "zh-CN": "后小腿离水平7.5°，后脚尖接近地面、脚跟抬起；现有踝范围不支持脚背平贴。",
    "en": "Rear lower leg is 7.5° above horizontal. Toes are near ground, heel raised; ankle range cannot place the instep flat."
  },
  "双膝跪": {
    "zh-CN": "双膝跪",
    "en": "Both knees"
  },
  "人物直身双膝接地，小腿自然向后并接近地面，呈双膝跪的静态姿态。": {
    "zh-CN": "人物直身双膝接地，小腿自然向后并接近地面，呈双膝跪的静态姿态。",
    "en": "An upright kneeling pose with both knees down and lower legs extending behind near the ground."
  },
  "小腿离水平7.5°，后脚尖接近地面、脚跟抬起；不宣称脚背平贴或臀部坐到脚跟。": {
    "zh-CN": "小腿离水平7.5°，后脚尖接近地面、脚跟抬起；不宣称脚背平贴或臀部坐到脚跟。",
    "en": "Lower legs are 7.5° above horizontal, toes near ground and heels raised. Flat insteps or sitting on heels are not claimed."
  },
  "叉腿": {
    "zh-CN": "叉腿",
    "en": "Wide stance"
  },
  "人物双腿向左右分开，呈静态分腿站姿。": {
    "zh-CN": "人物双腿向左右分开，呈静态分腿站姿。",
    "en": "A static standing pose with legs spread sideways."
  },
  "此处“叉腿”指分腿站立，不是盘腿坐。": {
    "zh-CN": "此处“叉腿”指分腿站立，不是盘腿坐。",
    "en": "Wide standing stance, not cross-legged sitting."
  },
  "人物躯干向侧方倾斜，双腿不对称，呈侧倚的静态姿态。": {
    "zh-CN": "人物躯干向侧方倾斜，双腿不对称，呈侧倚的静态姿态。",
    "en": "A static side-leaning pose with an asymmetric stance."
  },
  "仅侧倚姿态，未添加墙或支撑物，不模拟接触。": {
    "zh-CN": "仅侧倚姿态，未添加墙或支撑物，不模拟接触。",
    "en": "Pose only; no wall or support is added, and contact is not simulated."
  },
  "人物上身前倾、头颈低垂，呈静态鞠躬姿态。": {
    "zh-CN": "人物上身前倾、头颈低垂，呈静态鞠躬姿态。",
    "en": "A static bow with torso, head and neck leaning forward."
  },
  "躯干前倾上限35°，不宣称90°深鞠躬。": {
    "zh-CN": "躯干前倾上限35°，不宣称90°深鞠躬。",
    "en": "Torso forward tilt is limited to 35°; not a 90° deep bow."
  },
  "人物一侧前臂抬向下颌附近，另一侧手臂弯曲，呈静态思考姿态。": {
    "zh-CN": "人物一侧前臂抬向下颌附近，另一侧手臂弯曲，呈静态思考姿态。",
    "en": "A static thinking pose with one forearm near the chin and the other arm bent."
  },
  "没有手指关节，手与下颌为近似位置关系。": {
    "zh-CN": "没有手指关节，手与下颌为近似位置关系。",
    "en": "No finger joints; hand-to-chin placement is approximate."
  },
  "格斗": {
    "zh-CN": "格斗",
    "en": "Fighting"
  },
  "人物双臂屈肘抬至身前，双腿错开，呈格斗防守的静态姿态。": {
    "zh-CN": "人物双臂屈肘抬至身前，双腿错开，呈格斗防守的静态姿态。",
    "en": "A static defensive fighting pose with bent arms in front and staggered legs."
  },
  "手为既有整体块，无握拳手指。": {
    "zh-CN": "手为既有整体块，无握拳手指。",
    "en": "Hands are solid blocks, without articulated fists."
  },
  "踢球": {
    "zh-CN": "踢球",
    "en": "Kicking"
  },
  "人物一腿抬起向前伸出，双臂展开平衡，呈踢腿动作的静态定格。": {
    "zh-CN": "人物一腿抬起向前伸出，双臂展开平衡，呈踢腿动作的静态定格。",
    "en": "A static kick with one leg lifted forward and arms spread for balance."
  },
  "未添加球；不模拟踢球接触或运动。": {
    "zh-CN": "未添加球；不模拟踢球接触或运动。",
    "en": "No ball is added. Contact and motion are not simulated."
  },
  "投掷": {
    "zh-CN": "投掷",
    "en": "Throwing"
  },
  "人物一臂抬起屈肘，另一臂向前展开，上身扭转，呈投掷动作的静态定格。": {
    "zh-CN": "人物一臂抬起屈肘，另一臂向前展开，上身扭转，呈投掷动作的静态定格。",
    "en": "A static throwing pose with one arm raised and bent, the other forward, and a twisted torso."
  },
  "未添加投掷物；没有手指握持或运动轨迹。": {
    "zh-CN": "未添加投掷物；没有手指握持或运动轨迹。",
    "en": "No projectile, finger grip or motion trajectory is added."
  },
  "推进": {
    "zh-CN": "推进",
    "en": "Pushing"
  },
  "人物双臂向前伸出，身体前倾，双腿错开，呈向前推的静态姿态。": {
    "zh-CN": "人物双臂向前伸出，身体前倾，双腿错开，呈向前推的静态姿态。",
    "en": "A static forward push with arms extended, body leaning and legs staggered."
  },
  "未添加被推物；掌形为现有整体块，非精确掌面接触。": {
    "zh-CN": "未添加被推物；掌形为现有整体块，非精确掌面接触。",
    "en": "No pushed object is added. Hands are solid blocks, without precise palm contact."
  },
  "招手": {
    "zh-CN": "招手",
    "en": "Waving"
  },
  "人物一臂举高并轻微屈肘，呈招手动作的静态定格。": {
    "zh-CN": "人物一臂举高并轻微屈肘，呈招手动作的静态定格。",
    "en": "A static wave with one arm raised and slightly bent."
  },
  "无手指展开或挥动动画。": {
    "zh-CN": "无手指展开或挥动动画。",
    "en": "No articulated fingers or waving animation."
  },
  "人物一臂向前伸出，另一臂自然放松，呈静态伸手姿态。": {
    "zh-CN": "人物一臂向前伸出，另一臂自然放松，呈静态伸手姿态。",
    "en": "A static reach with one arm forward and the other relaxed."
  },
  "不添加抓取对象或手指抓握。": {
    "zh-CN": "不添加抓取对象或手指抓握。",
    "en": "No object or finger grasp is added."
  },
  "人物双臂屈肘交叠于身前，呈近似抱臂的静态姿态。": {
    "zh-CN": "人物双臂屈肘交叠于身前，呈近似抱臂的静态姿态。",
    "en": "An approximate static folded-arms pose with elbows bent across the torso."
  },
  "刚性臂段与固定手块，仅近似交叠，不能手指扣臂或软组织贴合。": {
    "zh-CN": "刚性臂段与固定手块，仅近似交叠，不能手指扣臂或软组织贴合。",
    "en": "Rigid arm segments and fixed hand blocks only approximate overlap; fingers cannot grip arms and soft tissue is not simulated."
  },
  "看手机": {
    "zh-CN": "看手机",
    "en": "Looking at phone"
  },
  "人物双臂弯曲、双手靠近身前，头颈低垂，呈低头查看的静态姿态。": {
    "zh-CN": "人物双臂弯曲、双手靠近身前，头颈低垂，呈低头查看的静态姿态。",
    "en": "A static downward-looking pose with bent arms, hands in front and head lowered."
  },
  "未添加手机；无手指握持或屏幕注视求解。": {
    "zh-CN": "未添加手机；无手指握持或屏幕注视求解。",
    "en": "No phone, finger grip or screen-gaze solver is added."
  },
  "Key僅保留在目前本機程序記憶體；不寫入工程、不交給Codex或日誌。此步只設定連接，不提交生成或測試API。關閉工作台或清除連接後需重新輸入。": {
    "zh-CN": "Key仅保留在目前本机程序记忆体；不写入工程、不交给Codex或日志。此步只设定连接，不提交生成或测试API。关闭工作台或清除连接后需重新输入。",
    "en": "The Key stays only in this local process’s memory, outside projects, Codex and logs. This configures a connection without generation or an API test. Re-enter it after closing the workbench or clearing the connection."
  },
  "設定本機連接": {
    "zh-CN": "设定本机连接",
    "en": "Set local connection"
  },
  "授權分享這份參考影片來源": {
    "zh-CN": "授权分享这份参考视频来源",
    "en": "Authorize this reference video source"
  },
  "僅授權將以下精確來源與固定素材用於指定 BytePlus 生成。此步不提交生成、不讀取 API Key、不收費。來源會在生成確認及提交前重新讀取並比對內容；此處不保證供應商日後能取用。您必須具有分享這份來源的權利。": {
    "zh-CN": "仅授权将以下精确来源与固定素材用于指定 BytePlus 生成。此步不提交生成、不读取 API Key、不收费。来源会在生成确认及提交前重新读取并比对内容；此处不保证供应商日后能取用。您必须具有分享这份来源的权利。",
    "en": "Authorize only the exact source and fixed media below for the specified BytePlus request. No generation, Key access or charge occurs here. Source content is rechecked before confirmation and submission; future provider access is not guaranteed. You must have the right to share it."
  },
  "分享目的地 / 範圍 / 素材 / 到期": {
    "zh-CN": "分享目的地 / 范围 / 素材 / 到期",
    "en": "Destination / scope / media / expiry"
  },
  "精確來源（私密，請勿分享截圖）": {
    "zh-CN": "精确来源（私密，请勿分享截图）",
    "en": "Exact private source (do not share screenshots)"
  },
  "授權分享這一份來源": {
    "zh-CN": "授权分享这一份来源",
    "en": "Authorize this exact source"
  },
  "本次將分享的精確來源（私密，請勿分享截圖）": {
    "zh-CN": "本次将分享的精确来源（私密，请勿分享截图）",
    "en": "Exact source to share (private; do not share screenshots)"
  },
  "核对 BytePlus 离线单次尝试": {
    "zh-CN": "核对 BytePlus 离线单次尝试",
    "en": "Review one BytePlus offline attempt"
  },
  "核对 BytePlus 单次付费尝试": {
    "zh-CN": "核对 BytePlus 单次付费尝试",
    "en": "Review one BytePlus paid attempt"
  },
  "；外部传输为合成注入，不扣费。": {
    "zh-CN": "；外部传输为合成注入，不扣费。",
    "en": "; external transport is synthetically injected, without charge."
  },
  "；账户与 Endpoint 尚未预验，供应商依本次请求决定权限，可能计费。": {
    "zh-CN": "；账户与 Endpoint 尚未预验，供应商依本次请求决定权限，可能计费。",
    "en": "; account and Endpoint access are unverified. The provider decides access for this request and may charge."
  },
  "原生确认只授权这一个请求；未知结果不自动重送。": {
    "zh-CN": "原生确认只授权这一个请求；未知结果不自动重送。",
    "en": "Native confirmation authorizes only this request. Unknown results are not resubmitted automatically."
  },
  "当前隔离环境禁止真实请求，不会读取凭据或发送。": {
    "zh-CN": "当前隔离环境禁止真实请求，不会读取凭据或发送。",
    "en": "This isolated environment blocks live requests. No credentials are read and nothing is sent."
  },
  "确认 BytePlus 正式合同": {
    "zh-CN": "确认 BytePlus 正式合同",
    "en": "Confirm BytePlus formal contract"
  },
  "确认 BytePlus 离线注入请求": {
    "zh-CN": "确认 BytePlus 离线注入请求",
    "en": "Confirm BytePlus offline injected request"
  },
  "确认 BytePlus 离线 Mock 请求": {
    "zh-CN": "确认 BytePlus 离线 Mock 请求",
    "en": "Confirm BytePlus offline Mock request"
  },
  "；账户与 Endpoint 资格尚未核实，当前真实提交受阻；不会读取凭据或发送。": {
    "zh-CN": "；账户与 Endpoint 资格尚未核实，当前真实提交受阻；不会读取凭据或发送。",
    "en": "; account and Endpoint access are unverified and live submission is blocked. No credentials are read and nothing is sent."
  },
  "；本次仅使用离线注入传输，不扣费，不自动重试。": {
    "zh-CN": "；本次仅使用离线注入传输，不扣费，不自动重试。",
    "en": "; offline injected transport only, without charge or automatic retry."
  },
  "授权与资格": {
    "zh-CN": "授权与资格",
    "en": "Authorization and eligibility"
  },
  "任务身份": {
    "zh-CN": "任务身份",
    "en": "Task identity"
  },
  "连接 / Key epoch": {
    "zh-CN": "连接 / Key epoch",
    "en": "Connection / Key epoch"
  },
  "固定模型 / Endpoint / 合同版本": {
    "zh-CN": "固定模型 / Endpoint / 合同版本",
    "en": "Fixed model / Endpoint / contract revision"
  },
  "操作 / 参数": {
    "zh-CN": "操作 / 参数",
    "en": "Operation / parameters"
  },
  "有序固定素材": {
    "zh-CN": "有序固定素材",
    "en": "Ordered fixed media"
  },
  "输出图层数量范围": {
    "zh-CN": "输出图层数量范围",
    "en": "Output layer count range"
  },
  "请求 SHA256": {
    "zh-CN": "请求 SHA256",
    "en": "Request SHA256"
  },
  "确认一次合成注入尝试": {
    "zh-CN": "确认一次合成注入尝试",
    "en": "Confirm one synthetic injected attempt"
  },
  "授权本次付费请求尝试": {
    "zh-CN": "授权本次付费请求尝试",
    "en": "Authorize this paid request attempt"
  },
  "核对确认（隔离环境禁止发送）": {
    "zh-CN": "核对确认（隔离环境禁止发送）",
    "en": "Confirm review (isolated environment blocks sending)"
  },
  "核对原生确认（真实提交受阻）": {
    "zh-CN": "核对原生确认（真实提交受阻）",
    "en": "Native review (live submission blocked)"
  },
  "确认一次离线提交": {
    "zh-CN": "确认一次离线提交",
    "en": "Confirm one offline submission"
  },
  "確認這次收費生成": {
    "zh-CN": "确认这次收费生成",
    "en": "Confirm this paid generation"
  },
  "；只送出本次1個": {
    "zh-CN": "；只送出本次1个",
    "en": "; submit only this one"
  },
  "任務，沒有自動重試。": {
    "zh-CN": "任务，没有自动重试。",
    "en": "task, without automatic retry."
  },
  "實際送出的需求": {
    "zh-CN": "实际送出的需求",
    "en": "Actual request prompt"
  },
  "實際費用未知，以供應商帳單為準；本機不估價或設定美元消費上限。": {
    "zh-CN": "实际费用未知，以供应商帐单为准；本机不估价或设定美元消费上限。",
    "en": "Actual cost is unknown and follows the provider bill. No local dollar estimate or spending limit is supplied."
  },
  "工程替身 · 不收費；沒有發送真實 API": {
    "zh-CN": "离线模拟 · 不收费；没有发送真实 API",
    "en": "Offline simulation · No charge; no live API sent"
  },
  "首尾幀 · 依首幀比例": {
    "zh-CN": "首尾帧 · 依首帧比例",
    "en": "First / last frames · Follow first-frame ratio"
  },
  "· 4秒 · 480p ·": {
    "zh-CN": "· 4秒 · 480p ·",
    "en": "· 4 seconds · 480p ·"
  },
  "模型音訊開啟（實際由模型決定）": {
    "zh-CN": "模型音讯开启（实际由模型决定）",
    "en": "Model audio enabled (actual audio decided by model)"
  },
  "歷史音訊關閉": {
    "zh-CN": "历史音讯关闭",
    "en": "Historical audio disabled"
  },
  "· 1張 · 水印": {
    "zh-CN": "· 1张 · 水印",
    "en": "· 1 image · Watermark"
  },
  "開啟": {
    "zh-CN": "开启",
    "en": "On"
  },
  "關閉": {
    "zh-CN": "关闭",
    "en": "Off"
  },
  "影片模型：": {
    "zh-CN": "视频模型：",
    "en": "Video model:"
  },
  "· API model實際送出：": {
    "zh-CN": "· API model实际送出：",
    "en": "· API model sent:"
  },
  "· 此帳戶Endpoint權限與目前對應模型尚未真測": {
    "zh-CN": "· 此帐户Endpoint权限与目前对应模型尚未真测",
    "en": "· Account Endpoint access and current model binding have no live verification"
  },
  "模型 ID：": {
    "zh-CN": "模型 ID：",
    "en": "Model ID:"
  },
  "· Project（使用者提供，Key歸屬未驗證）：": {
    "zh-CN": "· Project（使用者提供，Key归属未验证）：",
    "en": "· Project (user-declared; Key ownership unverified):"
  },
  "· Endpoint對應模型尚未真測": {
    "zh-CN": "· Endpoint对应模型尚未真测",
    "en": "· Endpoint model binding unverified"
  },
  "· 官方模型 ID 路由；未設定指定接入點": {
    "zh-CN": "· 官方模型 ID 路由；未设定指定接入点",
    "en": "· Official model ID route; no specific Endpoint"
  },
  "選定素材與提示詞將提交BytePlus。": {
    "zh-CN": "选定素材与提示词将提交BytePlus。",
    "en": "Selected media and prompt will be submitted to BytePlus."
  },
  "。停止本地等待不保證平台取消或退款。人物只用身體局部也不保證平台允許；拒絕不會改道或自動重送。": {
    "zh-CN": "。停止本地等待不保证平台取消或退款。人物只用身体局部也不保证平台允许；拒绝不会改道或自动重送。",
    "en": ". Stopping local waiting does not guarantee provider cancellation or refund. Partial-body person references may still be rejected. Rejection never changes route or resubmits automatically."
  },
  "確認並送出這次收費生成": {
    "zh-CN": "确认并送出这次收费生成",
    "en": "Confirm and send this paid generation"
  },
  "執行工程替身 · 不收費": {
    "zh-CN": "执行离线模拟 · 不收费",
    "en": "Run offline simulation · No charge"
  },
  "未提供凭据": {
    "zh-CN": "未提供凭据",
    "en": "No credentials supplied"
  },
  "已提供 · 仅本次运行": {
    "zh-CN": "已提供 · 仅本次运行",
    "en": "Provided · This run only"
  },
  "已加密记住 · 重启后恢复": {
    "zh-CN": "已加密记住 · 重启后恢复",
    "en": "Remembered with encryption · Restored after restart"
  },
  "凭据已锁定 · 请重新输入或删除": {
    "zh-CN": "凭据已锁定 · 请重新输入或删除",
    "en": "Credentials locked · Re-enter or delete"
  },
  "Windows 加密暂不可用 · 请重试": {
    "zh-CN": "Windows 加密暂不可用 · 请重试",
    "en": "Windows encryption temporarily unavailable · Try again"
  },
  "凭据不可用": {
    "zh-CN": "凭据不可用",
    "en": "Credentials unavailable"
  },
  "；真实连接未验证。": {
    "zh-CN": "；真实连接未验证。",
    "en": "; live connection unverified."
  },
  "凭据操作未完成，请重试。": {
    "zh-CN": "凭据操作未完成，请重试。",
    "en": "Credential operation incomplete. Try again."
  },
  "连接 ID：": {
    "zh-CN": "连接 ID：",
    "en": "Connection ID:"
  },
  "无法安全打开此连接。请关闭后重试。": {
    "zh-CN": "无法安全打开此连接。请关闭后重试。",
    "en": "Cannot open this connection safely. Close and try again."
  },
  "操作未完成。凭据不可用时不会保存明文或发出请求；请重试、重新输入或删除。": {
    "zh-CN": "操作未完成。凭据不可用时不会保存明文或发出请求；请重试、重新输入或删除。",
    "en": "Operation incomplete. Unavailable credentials will not be saved as plaintext or used for requests. Retry, re-enter or delete."
  },
  "操作或編碼正在完成，請稍後退出": {
    "zh-CN": "操作或编码正在完成，请稍后退出",
    "en": "An operation or encoding is finishing. Exit later."
  },
  "繼續編輯": {
    "zh-CN": "继续编辑",
    "en": "Keep editing"
  },
  "工程有未保存修改": {
    "zh-CN": "工程有未保存修改",
    "en": "Project has unsaved changes"
  },
  "保存並退出會在保存成功後關閉；不保存並退出會丟失未保存修改。未套用的素材或草稿請先返回處理。": {
    "zh-CN": "保存并退出会在保存成功后关闭；不保存并退出会丢失未保存修改。未应用的素材或草稿请先返回处理。",
    "en": "Save and exit closes only after a successful save. Exit without saving loses unsaved changes. Return to resolve unapplied media or drafts first."
  },
  "保存並退出": {
    "zh-CN": "保存并退出",
    "en": "Save and exit"
  },
  "不保存並退出": {
    "zh-CN": "不保存并退出",
    "en": "Exit without saving"
  },
  "請先套用或取消未提交的素材／草稿": {
    "zh-CN": "请先应用或取消未提交的素材／草稿",
    "en": "Apply or cancel unsubmitted media / drafts first"
  },
  "視窗和現有修改已保留，沒有自動套用或丟棄。": {
    "zh-CN": "视窗和现有修改已保留，没有自动应用或丢弃。",
    "en": "Window and current changes preserved. Nothing was applied or discarded automatically."
  },
  "保存未確認成功，已取消退出": {
    "zh-CN": "保存未确认成功，已取消退出",
    "en": "Save was not confirmed. Exit canceled."
  },
  "· 視窗和現有修改保留。請檢查保存狀態後再操作；不會自動重試。": {
    "zh-CN": "· 视窗和现有修改保留。请检查保存状态后再操作；不会自动重试。",
    "en": "· Window and changes preserved. Check the save state before acting; no automatic retry."
  },
  "確認不保存並退出？": {
    "zh-CN": "确认不保存并退出？",
    "en": "Exit without saving?"
  },
  "本次未保存修改將丟失，已保存版本和原素材保留。": {
    "zh-CN": "本次未保存修改将丢失，已保存版本和原素材保留。",
    "en": "Unsaved changes will be lost. Saved versions and original media are preserved."
  },
  "確認不保存並退出": {
    "zh-CN": "确认不保存并退出",
    "en": "Confirm exit without saving"
  },
  "關閉確認期間工程或工作已變更，本次退出已取消": {
    "zh-CN": "关闭确认期间工程或工作已变更，本次退出已取消",
    "en": "Project or work changed during close confirmation. Exit canceled."
  },
  "新修改與在途操作保留。請處理完成後再決定退出。": {
    "zh-CN": "新修改与在途操作保留。请处理完成后再决定退出。",
    "en": "New changes and in-flight operations preserved. Resolve them before deciding to exit."
  },
  "退出清理尚未完成": {
    "zh-CN": "退出清理尚未完成",
    "en": "Exit cleanup incomplete"
  },
  "· 未強行關閉視窗，請保留現場供檢查。": {
    "zh-CN": "· 未强行关闭视窗，请保留现场供检查。",
    "en": "· Window was not forced closed. Preserve the current state for inspection."
  },
  "保留視窗": {
    "zh-CN": "保留视窗",
    "en": "Keep window open"
  },
  "復原文字編輯": {
    "zh-CN": "复原文字编辑",
    "en": "Undo text edit"
  },
  "重做文字編輯": {
    "zh-CN": "重做文字编辑",
    "en": "Redo text edit"
  },
  "剪下": {
    "zh-CN": "剪下",
    "en": "Cut"
  },
  "貼上": {
    "zh-CN": "贴上",
    "en": "Paste"
  },
  "全選": {
    "zh-CN": "全选",
    "en": "Select all"
  },
  "請先進入可用項目": {
    "zh-CN": "请先进入可用项目",
    "en": "Open an available project first"
  },
  "退出處理尚未完成，暫停寫入以保留現有內容": {
    "zh-CN": "退出处理尚未完成，暂停写入以保留现有内容",
    "en": "Exit handling incomplete. Writes paused to preserve content."
  },
  "另一項工程操作正在完成": {
    "zh-CN": "另一项工程操作正在完成",
    "en": "Another project operation is finishing"
  },
  "另存成片 MP4": {
    "zh-CN": "另存成片 MP4",
    "en": "Save film MP4 as"
  },
  "MP4 影片": {
    "zh-CN": "MP4 视频",
    "en": "MP4 video"
  },
  "本地媒體不可用": {
    "zh-CN": "本地媒体不可用",
    "en": "Local media unavailable"
  },
  "AICG 工作台 · Seedream Pro 候選 p6s2": {
    "zh-CN": "AICG 工作台 · Seedream Pro 候选 p6s2",
    "en": "AICG Workbench"
  },
  "请先保存并选择有效连接": {
    "zh-CN": "请先保存并选择有效连接",
    "en": "Save and select a valid connection first"
  },
  "确认一次提交": {
    "zh-CN": "确认一次提交",
    "en": "Confirm one submission"
  },
  "OpenAI 单次生成确认": {
    "zh-CN": "OpenAI 单次生成确认",
    "en": "OpenAI single generation confirmation"
  },
  "OpenAI 工程 Mock wire · 不扣费": {
    "zh-CN": "OpenAI 工程 Mock wire · 不扣费",
    "en": "OpenAI engineering Mock wire · No charge"
  },
  "确认向 OpenAI 提交一次图片任务": {
    "zh-CN": "确认向 OpenAI 提交一次图片任务",
    "en": "Confirm one image task to OpenAI"
  },
  "模型：": {
    "zh-CN": "模型：",
    "en": "Model:"
  },
  "连接：": {
    "zh-CN": "连接：",
    "en": "Connection:"
  },
  "模式：": {
    "zh-CN": "模式：",
    "en": "Mode:"
  },
  "本次使用：": {
    "zh-CN": "本次使用：",
    "en": "For this request:"
  },
  "张图片，1 个输出 参数：": {
    "zh-CN": "张图片，1 个输出 参数：",
    "en": "images, 1 output Parameters:"
  },
  "费用与账户权限未验证。图片同步返回；视频保存 request_id 并仅查询原 ID。超时或未知不会自动重发。": {
    "zh-CN": "费用与账户权限未验证。图片同步返回；视频保存 request_id 并仅查询原 ID。超时或未知不会自动重发。",
    "en": "Cost and account access are unverified. Images return synchronously; video recovery queries the original request_id. Timeout or uncertainty never resubmits automatically."
  },
  "BFL 单次生成确认": {
    "zh-CN": "BFL 单次生成确认",
    "en": "BFL single generation confirmation"
  },
  "BFL 工程 Mock wire · 不扣费": {
    "zh-CN": "BFL 工程 Mock wire · 不扣费",
    "en": "BFL engineering Mock wire · No charge"
  },
  "确认向 BFL 提交一次图片任务": {
    "zh-CN": "确认向 BFL 提交一次图片任务",
    "en": "Confirm one image task to BFL"
  },
  "确认向 BFL 提交一次视频任务": {
    "zh-CN": "确认向 BFL 提交一次视频任务",
    "en": "Confirm one video task to BFL"
  },
  "费用与账户权限未验证。所有任务异步返回；保存原 id 和受控 polling_url，仅查询原任务。Video 为 Preview。账户与地域权限未预验；原生确认只授权本次请求尝试，由供应商实际判权，可能计费。当前执行环境：": {
    "zh-CN": "费用与账户权限未验证。所有任务异步返回；保存原 id 和受控 polling_url，仅查询原任务。Video 为 Preview。账户与地域权限未预验；原生确认只授权本次请求尝试，由供应商实际判权，可能计费。当前执行环境：",
    "en": "Cost and account access are unverified. All tasks are asynchronous; original id and controlled polling_url are retained for queries only. Video is Preview. Account and regional access are unverified. Native confirmation authorizes one attempt; the provider decides access and may charge. Execution environment:"
  },
  "单次尝试已获运行环境准入": {
    "zh-CN": "单次尝试已获运行环境准入",
    "en": "This attempt has runtime admission"
  },
  "隔离环境禁止真实请求，不读取凭据或发送": {
    "zh-CN": "隔离环境禁止真实请求，不读取凭据或发送",
    "en": "Live requests blocked in isolation; no credential read or send"
  },
  "。超时或未知不会自动重发。": {
    "zh-CN": "。超时或未知不会自动重发。",
    "en": ". Timeout or uncertainty never resubmits automatically."
  },
  "MiniMax 单次生成确认": {
    "zh-CN": "MiniMax 单次生成确认",
    "en": "MiniMax single generation confirmation"
  },
  "MiniMax 工程 Mock wire · 不扣费": {
    "zh-CN": "MiniMax 工程 Mock wire · 不扣费",
    "en": "MiniMax engineering Mock wire · No charge"
  },
  "确认向 MiniMax 提交一次图片任务": {
    "zh-CN": "确认向 MiniMax 提交一次图片任务",
    "en": "Confirm one image task to MiniMax"
  },
  "确认向 MiniMax 提交一次视频任务": {
    "zh-CN": "确认向 MiniMax 提交一次视频任务",
    "en": "Confirm one video task to MiniMax"
  },
  "费用与账户权限未验证。图片同步返回；视频保存 task_id 并仅查询原 ID。超时或未知不会自动重发。": {
    "zh-CN": "费用与账户权限未验证。图片同步返回；视频保存 task_id 并仅查询原 ID。超时或未知不会自动重发。",
    "en": "Cost and account access are unverified. Images return synchronously; video recovery queries the original task_id. Timeout or uncertainty never resubmits automatically."
  },
  "xAI 单次生成确认": {
    "zh-CN": "xAI 单次生成确认",
    "en": "xAI single generation confirmation"
  },
  "xAI 工程 Mock wire · 不扣费": {
    "zh-CN": "xAI 工程 Mock wire · 不扣费",
    "en": "xAI engineering Mock wire · No charge"
  },
  "确认向 xAI 提交一次图片任务": {
    "zh-CN": "确认向 xAI 提交一次图片任务",
    "en": "Confirm one image task to xAI"
  },
  "确认向 xAI 提交一次视频任务": {
    "zh-CN": "确认向 xAI 提交一次视频任务",
    "en": "Confirm one video task to xAI"
  },
  "Kling 单次生成确认": {
    "zh-CN": "Kling 单次生成确认",
    "en": "Kling single generation confirmation"
  },
  "Kling 工程 Mock wire · 不扣费": {
    "zh-CN": "Kling 工程 Mock wire · 不扣费",
    "en": "Kling engineering Mock wire · No charge"
  },
  "确认向 Kling 提交一次图片任务": {
    "zh-CN": "确认向 Kling 提交一次图片任务",
    "en": "Confirm one image task to Kling"
  },
  "确认向 Kling 提交一次视频任务": {
    "zh-CN": "确认向 Kling 提交一次视频任务",
    "en": "Confirm one video task to Kling"
  },
  "费用与账户权限未验证。图片与视频异步返回；保存原任务 ID 并仅查询原 ID。超时或未知不会自动重发。": {
    "zh-CN": "费用与账户权限未验证。图片与视频异步返回；保存原任务 ID 并仅查询原 ID。超时或未知不会自动重发。",
    "en": "Cost and account access are unverified. Image and video tasks are asynchronous; only original task IDs are queried. Timeout or uncertainty never resubmits automatically."
  },
  "Wan 单次生成确认": {
    "zh-CN": "Wan 单次生成确认",
    "en": "Wan single generation confirmation"
  },
  "Wan 工程 Mock wire · 不扣费": {
    "zh-CN": "Wan 工程 Mock wire · 不扣费",
    "en": "Wan engineering Mock wire · No charge"
  },
  "确认向 阿里云百炼 Wan 3.0 提交一次生成任务": {
    "zh-CN": "确认向 阿里云百炼 Wan 3.0 提交一次生成任务",
    "en": "Confirm one generation task to Alibaba Cloud Bailian Wan 3.0"
  },
  "费用与账户权限未验证。异步请求保存 task_id；恢复只查询原 ID。超时或未知不会自动重发。": {
    "zh-CN": "费用与账户权限未验证。异步请求保存 task_id；恢复只查询原 ID。超时或未知不会自动重发。",
    "en": "Cost and account access are unverified. Asynchronous task_id is retained; recovery only queries the original ID. Timeout or uncertainty never resubmits automatically."
  },
  "缺少当前任务素材授权": {
    "zh-CN": "缺少当前任务素材授权",
    "en": "Current task media authorization missing"
  },
  "图片引用或版本已改变": {
    "zh-CN": "图片引用或版本已改变",
    "en": "Image reference or version changed"
  },
  "Gemini 单次生成确认": {
    "zh-CN": "Gemini 单次生成确认",
    "en": "Gemini single generation confirmation"
  },
  "Gemini 工程 Mock wire · 不扣费": {
    "zh-CN": "Gemini 工程 Mock wire · 不扣费",
    "en": "Gemini engineering Mock wire · No charge"
  },
  "确认向 Google Gemini API 提交一次生成任务": {
    "zh-CN": "确认向 Google Gemini API 提交一次生成任务",
    "en": "Confirm one generation task to Google Gemini API"
  },
  "费用与账户权限未验证。同步请求会存储 interaction 供原 ID 恢复。超时或未知不会自动重发。": {
    "zh-CN": "费用与账户权限未验证。同步请求会存储 interaction 供原 ID 恢复。超时或未知不会自动重发。",
    "en": "Cost and account access are unverified. Synchronous requests retain interaction for original-ID recovery. Timeout or uncertainty never resubmits automatically."
  },
  "Runway 单次生成确认": {
    "zh-CN": "Runway 单次生成确认",
    "en": "Runway single generation confirmation"
  },
  "Runway 工程 Mock wire · 不扣费": {
    "zh-CN": "Runway 工程 Mock wire · 不扣费",
    "en": "Runway engineering Mock wire · No charge"
  },
  "确认向 Runway 提交一次生成任务": {
    "zh-CN": "确认向 Runway 提交一次生成任务",
    "en": "Confirm one generation task to Runway"
  },
  "完整提示词和图片选择以刚才的请求摘要为准。 费用与账户权限未验证。超时或未知不会自动重发。": {
    "zh-CN": "完整提示词和图片选择以刚才的请求摘要为准。 费用与账户权限未验证。超时或未知不会自动重发。",
    "en": "The preceding summary determines the full prompt and image selection. Cost and account access are unverified. Timeout or uncertainty never resubmits automatically."
  },
  "请选择连接": {
    "zh-CN": "请选择连接",
    "en": "Choose a connection"
  },
  "画布或工程版本已更新，请重新选择任务": {
    "zh-CN": "画布或工程版本已更新，请重新选择任务",
    "en": "Canvas or project revision changed. Select the task again."
  },
  "请选择一个画布生成任务": {
    "zh-CN": "请选择一个画布生成任务",
    "en": "Choose a canvas generation task"
  },
  "请先保存设置或处理画布草稿": {
    "zh-CN": "请先保存设置或处理画布草稿",
    "en": "Save settings or resolve canvas drafts first"
  },
  "请先处理未提交草稿，原确认不会重送": {
    "zh-CN": "请先处理未提交草稿，原确认不会重送",
    "en": "Resolve unsubmitted drafts first. Original confirmation is not resubmitted."
  },
  "请先处理未提交草稿": {
    "zh-CN": "请先处理未提交草稿",
    "en": "Resolve unsubmitted drafts first"
  },
  "請先套用或取消草稿": {
    "zh-CN": "请先应用或取消草稿",
    "en": "Apply or cancel drafts first"
  },
  "先處理草稿": {
    "zh-CN": "先处理草稿",
    "en": "Resolve drafts first"
  },
  "只允許本次QA素材": {
    "zh-CN": "只允许本次QA素材",
    "en": "Only media from this QA run is allowed"
  },
  "提供1–2張本地圖片給目前畫布": {
    "zh-CN": "提供1–2张本地图片给目前画布",
    "en": "Provide 1–2 local images to this canvas"
  },
  "先套用或取消草稿，不會暗中採用": {
    "zh-CN": "先应用或取消草稿，不会暗中采用",
    "en": "Apply or cancel drafts first. They will not be used silently."
  },
  "請先套用或取消畫布草稿": {
    "zh-CN": "请先应用或取消画布草稿",
    "en": "Apply or cancel canvas drafts first"
  },
  "請套用或取消未套用草稿": {
    "zh-CN": "请应用或取消未应用草稿",
    "en": "Apply or cancel unapplied drafts"
  },
  "只能選隔離測試備份": {
    "zh-CN": "只能选隔离测试备份",
    "en": "Choose an isolated test backup only"
  },
  "匯入已保存的工作台備份副本": {
    "zh-CN": "汇入已保存的工作台备份副本",
    "en": "Import saved workbench backup copy"
  },
  "完整備份完成標記 complete.json": {
    "zh-CN": "完整备份完成标记 complete.json",
    "en": "Complete backup marker complete.json"
  },
  "請選舊工作台完整備份的complete.json": {
    "zh-CN": "请选旧工作台完整备份的complete.json",
    "en": "Choose complete.json from a complete older workbench backup"
  },
  "本輪只接DTO4／DTO5保存副本，其他版本原件保留": {
    "zh-CN": "本轮只接DTO4／DTO5保存副本，其他版本原件保留",
    "en": "Only DTO4 / DTO5 saved copies are supported here. Other original versions are preserved."
  },
  "副本選取已不屬於目前工作庫": {
    "zh-CN": "副本选取已不属于目前工作库",
    "en": "Selected copy no longer belongs to this library"
  },
  "工程已切換，原批次不會改另一工程。": {
    "zh-CN": "工程已切换，原批次不会改另一工程。",
    "en": "Project switched. Original batch will not modify another project."
  },
  "先套用或取消草稿／退出處理。": {
    "zh-CN": "先应用或取消草稿／退出处理。",
    "en": "Apply or cancel drafts / exit handling first."
  },
  "批次不屬於目前工程。": {
    "zh-CN": "批次不属于目前工程。",
    "en": "Batch does not belong to this project."
  },
  "單次最多50檔。": {
    "zh-CN": "单次最多50档。",
    "en": "At most 50 files per import."
  },
  "只接受本輪合成檔案": {
    "zh-CN": "只接受本轮合成文件",
    "en": "Only synthetic files from this test are accepted"
  },
  "批量導入本地素材（單次最多50檔）": {
    "zh-CN": "批量导入本地素材（单次最多50档）",
    "en": "Batch import local media (up to 50 per import)"
  },
  "本地媒體": {
    "zh-CN": "本地媒体",
    "en": "Local media"
  },
  "選檔期間工程已切換": {
    "zh-CN": "选档期间工程已切换",
    "en": "Project switched while choosing files"
  },
  "導入本地素材至 C5 副本": {
    "zh-CN": "导入本地素材至 C5 副本",
    "en": "Import local media into C5 copy"
  },
  "請在本機核對並按本次摘要": {
    "zh-CN": "请在本机核对并按本次摘要",
    "en": "Review locally and click this summary"
  },
  "請先開啟專案": {
    "zh-CN": "请先开启项目",
    "en": "Open a project first"
  },
  "請先開啟可用專案": {
    "zh-CN": "请先开启可用项目",
    "en": "Open an available project first"
  },
  "先套用或取消草稿": {
    "zh-CN": "先应用或取消草稿",
    "en": "Apply or cancel drafts first"
  },
  "請先套用或取消裁切草稿": {
    "zh-CN": "请先应用或取消裁切草稿",
    "en": "Apply or cancel trim drafts first"
  },
  "請在成片節點按另存或開啟位置": {
    "zh-CN": "请在成片节点按另存或开启位置",
    "en": "Use Save as or Open location on the film card"
  },
  "請先套用裁切／文字草稿": {
    "zh-CN": "请先应用裁切／文字草稿",
    "en": "Apply trim / text drafts first"
  },
  "本机安全存储": {
    "zh-CN": "本机安全存储",
    "en": "Secure local storage"
  },
  "连接凭据": {
    "zh-CN": "连接凭据",
    "en": "Connection credentials"
  },
  "正在读取状态…": {
    "zh-CN": "正在读取状态…",
    "en": "Reading status…"
  },
  "API Key（不回显已保存的值）": {
    "zh-CN": "API Key（不回显已保存的值）",
    "en": "API Key (saved value is never shown)"
  },
  "仅在此窗口输入。保存后立即清空，不进入画布、工程或 MCP。": {
    "zh-CN": "仅在此窗口输入。保存后立即清空，不进入画布、工程或 MCP。",
    "en": "Enter only in this window. Cleared immediately after saving; excluded from canvas, projects and MCP."
  },
  "记住 Key · 使用 Windows 加密，重启后恢复": {
    "zh-CN": "记住 Key · 使用 Windows 加密，重启后恢复",
    "en": "Remember Key · Encrypt with Windows and restore after restart"
  },
  "不勾选则仅本次运行有效；原先记住的副本会被删除。保存不验证账户，也不调用 API。": {
    "zh-CN": "不勾选则仅本次运行有效；原先记住的副本会被删除。保存不验证账户，也不调用 API。",
    "en": "If unchecked, valid for this run only; any previously remembered copy is deleted. Saving does not validate the account or call an API."
  },
  "保存或更换 Key": {
    "zh-CN": "保存或更换 Key",
    "en": "Save or replace Key"
  },
  "彻底删除 Key": {
    "zh-CN": "彻底删除 Key",
    "en": "Delete Key completely"
  },
  "上次媒體下載受拒（HTTP {status}）": {
    "zh-CN": "上次媒体下载受拒（HTTP {status}）",
    "en": "Last media download denied (HTTP {status})"
  },
  "已保存版本 {revision} · 磁盘回执 {receipt}": {
    "zh-CN": "已保存版本 {revision} · 磁盘回执 {receipt}",
    "en": "Saved revision {revision} · Disk receipt {receipt}"
  },
  "已加入素材庫及目前畫布。": {
    "zh-CN": "已加入素材库及目前画布。",
    "en": "Added to the media library and current canvas."
  },
  "已加入素材庫。": {
    "zh-CN": "已加入素材库。",
    "en": "Added to the media library."
  },
  "已切換至 {view} 機位；尚未套用構圖。": {
    "zh-CN": "已切换至 {view} 机位；尚未应用构图。",
    "en": "Switched to {view} view; scene has not been applied."
  },
  "Internal details": {
    "zh-CN": "技术详情",
    "en": "Technical details"
  },
  "Connection setup is local only. Account access and live requests remain unverified.": {
    "zh-CN": "此处仅设置本机连接，账户权限与真实请求仍未验证。",
    "en": "Connection setup is local only. Account access and live requests remain unverified."
  },
  "Pause": {
    "zh-CN": "暂停",
    "en": "Pause"
  },
  "Current result": {
    "zh-CN": "当前结果",
    "en": "Current result"
  },
  "Historical result": {
    "zh-CN": "历史结果",
    "en": "Historical result"
  },
  "文字生影片": {
    "zh-CN": "文字生视频",
    "en": "Text to video"
  },
  "指定首幀": {
    "zh-CN": "指定首帧",
    "en": "Specified first frame"
  },
  "指定首尾幀": {
    "zh-CN": "指定首尾帧",
    "en": "Specified first and last frames"
  },
  "多參考圖": {
    "zh-CN": "多参考图",
    "en": "Multiple reference images"
  },
  "參考影片生影片": {
    "zh-CN": "参考视频生视频",
    "en": "Reference video to video"
  },
  "來源媒體：": {
    "zh-CN": "来源媒体：",
    "en": "Source media:"
  },
  "固定版本：": {
    "zh-CN": "固定版本：",
    "en": "Fixed version:"
  },
  "來源：": {
    "zh-CN": "来源：",
    "en": "Source:"
  },
  "已不在目前畫布": {
    "zh-CN": "已不在目前画布",
    "en": "No longer on this canvas"
  },
  "裁切：": {
    "zh-CN": "裁切：",
    "en": "Trim:"
  },
  "· 入場": {
    "zh-CN": "· 入场",
    "en": "· Entry"
  },
  "音量：": {
    "zh-CN": "音量：",
    "en": "Volume:"
  },
  "未靜音": {
    "zh-CN": "未静音",
    "en": "Not muted"
  },
  "輸出：": {
    "zh-CN": "输出：",
    "en": "Output:"
  },
  "沒有額外音軌": {
    "zh-CN": "没有额外音轨",
    "en": "No additional audio track"
  },
  "指定人物外貌、髮型與服裝，維持同一人物": {
    "zh-CN": "指定人物外貌、发型与服装，维持同一人物",
    "en": "Reference appearance, hair and clothing to retain the same person"
  },
  "保留產品形狀、顏色、包裝與細節": {
    "zh-CN": "保留产品形状、颜色、包装与细节",
    "en": "Preserve product shape, color, packaging and detail"
  },
  "參考環境、背景、空間與氛圍": {
    "zh-CN": "参考环境、背景、空间与氛围",
    "en": "Reference environment, background, space and atmosphere"
  },
  "參考色調、光影與質感": {
    "zh-CN": "参考色调、光影与质感",
    "en": "Reference color, lighting and texture"
  },
  "參考構圖、姿勢、機位與產品位置": {
    "zh-CN": "参考构图、姿势、机位与产品位置",
    "en": "Reference composition, pose, camera and product placement"
  },
  "依照主需求使用這張參考圖": {
    "zh-CN": "依照主需求使用这张参考图",
    "en": "Use this reference according to the main prompt"
  },
  "第一輪只測圖片；影片首尾幀留第二輪": {
    "zh-CN": "第一轮只测图片；视频首尾帧留第二轮",
    "en": "This legacy test supports images only; video frame inputs use their separate entry"
  },
  "只支援所選圖片模型列出的 PNG 尺寸": {
    "zh-CN": "只支援所选图片模型列出的 PNG 尺寸",
    "en": "Only PNG sizes listed for the selected image model are supported"
  },
  "此模型不支援這個素材用途或媒體類型": {
    "zh-CN": "此模型不支援这个素材用途或媒体类型",
    "en": "This model does not support that media role or type"
  },
  "請使用 PNG、JPEG 或靜態 WebP": {
    "zh-CN": "请使用 PNG、JPEG 或静态 WebP",
    "en": "Use PNG, JPEG or static WebP"
  },
  "參考圖片超過本候選尺寸／容量限制": {
    "zh-CN": "参考图片超过本候选尺寸／容量限制",
    "en": "Reference image exceeds this candidate’s size / capacity limits"
  },
  "參考圖片": {
    "zh-CN": "参考图片",
    "en": "Reference image"
  },
  "Seedream 5.0每次最多10張不同參考圖；每張最多30MB，另有明示本地64MB JSON資源保護": {
    "zh-CN": "Seedream 5.0每次最多10张不同参考图；每张最多30MB，另有明示本地64MB JSON资源保护",
    "en": "Seedream 5.0 accepts up to 10 different reference images per request, each at most 30MB, with an explicit local 64MB JSON resource limit"
  },
  "這次要生成的素材用途：": {
    "zh-CN": "这次要生成的素材用途：",
    "en": "Media role to generate:"
  },
  "）。請依這個用途製作一張可獨立使用的素材圖。": {
    "zh-CN": "）。请依这个用途制作一张可独立使用的素材图。",
    "en": "). Create an independently usable image for this role."
  },
  "以下圖片按提交順序編號，僅依標註用途參考；同一張圖可有多種明確用途。": {
    "zh-CN": "以下图片按提交顺序编号，仅依标注用途参考；同一张图可有多种明确用途。",
    "en": "Images below are numbered in submission order and used only for their labeled roles. One image can have multiple explicit roles."
  },
  "先寫需求或選擇參考素材": {
    "zh-CN": "先写需求或选择参考素材",
    "en": "Write a prompt or choose reference media first"
  },
  "包含素材用途的提示詞超過本候選16KB限制": {
    "zh-CN": "包含素材用途的提示词超过本候选16KB限制",
    "en": "Prompt including media roles exceeds the local 16KB limit"
  },
  "用途由有序圖片及文字映射，效果不保證完全遵循": {
    "zh-CN": "用途由有序图片及文字映射，效果不保证完全遵循",
    "en": "Roles are mapped through ordered images and text. Full adherence is not guaranteed."
  },
  "攝影棚原生入口尚未接入；普通圖指定構圖用途不等於來源快照": {
    "zh-CN": "摄影棚原生入口尚未接入；普通图指定构图用途不等于来源快照",
    "en": "This legacy entry has no native studio integration; assigning a composition role does not establish a studio source snapshot"
  },
  "離線測試只驗證接線，輸出為合成圖片": {
    "zh-CN": "离线测试只验证接线，输出为合成图片",
    "en": "Offline test validates wiring only and outputs synthetic images"
  },
  "Seedance 2.5 · 4秒 · 480p · 影片一律有聲 · 水印；首尾幀只支援依首幀比例，多圖參考可選比例": {
    "zh-CN": "Seedance 2.5 · 4秒 · 480p · 视频一律有声 · 水印；首尾帧只支援依首帧比例，多图参考可选比例",
    "en": "Legacy Seedance 2.5 policy: 4 seconds, 480p, audio enabled and watermark. Frame modes follow the first-frame ratio; multi-reference allows a ratio choice."
  },
  "影片聲音策略不支援": {
    "zh-CN": "视频声音策略不支援",
    "en": "Unsupported video audio policy"
  },
  "請選擇影片任務框": {
    "zh-CN": "请选择视频任务框",
    "en": "Choose a video task card"
  },
  "產品外觀": {
    "zh-CN": "产品外观",
    "en": "Product appearance"
  },
  "人物身份與衣著": {
    "zh-CN": "人物身份与衣着",
    "en": "Person identity and clothing"
  },
  "場景環境": {
    "zh-CN": "场景环境",
    "en": "Scene environment"
  },
  "攝影棚構圖與姿勢": {
    "zh-CN": "摄影棚构图与姿势",
    "en": "Studio composition and pose"
  },
  "多圖參考與首幀／尾幀互斥，請明確移除衝突連線；來源素材仍保留": {
    "zh-CN": "多图参考与首帧／尾帧互斥，请明确移除冲突连线；来源素材仍保留",
    "en": "Multi-image references and frame inputs are mutually exclusive. Remove conflicting links explicitly; source media is preserved."
  },
  "多圖參考需要1–30張圖片": {
    "zh-CN": "多图参考需要1–30张图片",
    "en": "Multi-image reference requires 1–30 images"
  },
  "影片參考圖需為PNG/JPEG/靜態WebP、300–6000像素、比例0.4–2.5且小於30MB": {
    "zh-CN": "视频参考图需为PNG/JPEG/静态WebP、300–6000像素、比例0.4–2.5且小于30MB",
    "en": "Video reference images must be PNG/JPEG/static WebP, 300–6000 pixels, ratio 0.4–2.5 and under 30MB"
  },
  "固定圖片": {
    "zh-CN": "固定图片",
    "en": "Fixed image"
  },
  "@圖像": {
    "zh-CN": "@图像",
    "en": "@image"
  },
  "含逐圖用途的有效提示詞超過本地16KB保護限制": {
    "zh-CN": "含逐图用途的有效提示词超过本地16KB保护限制",
    "en": "Effective prompt with per-image roles exceeds the local 16KB limit"
  },
  "此模式只使用首幀／尾幀；先移除其他參考，不能混為多模態參考": {
    "zh-CN": "此模式只使用首帧／尾帧；先移除其他参考，不能混为多模态参考",
    "en": "This mode uses first / last frames only. Remove other references first; they cannot be mixed as multimodal references."
  },
  "請選擇一張首幀圖片": {
    "zh-CN": "请选择一张首帧图片",
    "en": "Choose one first-frame image"
  },
  "請選擇一張尾幀圖片": {
    "zh-CN": "请选择一张尾帧图片",
    "en": "Choose one last-frame image"
  },
  "圖片需為PNG/JPEG/WebP、300–6000像素、比例0.4–2.5且小於30MB": {
    "zh-CN": "图片需为PNG/JPEG/WebP、300–6000像素、比例0.4–2.5且小于30MB",
    "en": "Images must be PNG/JPEG/WebP, 300–6000 pixels, ratio 0.4–2.5 and under 30MB"
  },
  "BytePlus 連接與生成": {
    "zh-CN": "BytePlus 连接与生成",
    "en": "BytePlus connection and generation"
  },
  "確認": {
    "zh-CN": "确认",
    "en": "Confirm"
  },
  "Native dialogs could not switch language. Current input is preserved.": {
    "zh-CN": "原生窗口暂时无法切换语言，当前输入已保留。",
    "en": "Native dialogs could not switch language. Current input is preserved."
  },
  "VIDEO": {
    "zh-CN": "视频",
    "en": "Video"
  },
  "IMAGE": {
    "zh-CN": "图片",
    "en": "Image"
  },
  "CONFLICT": {
    "zh-CN": "来源冲突",
    "en": "Conflicting sources"
  },
  "KNOWN": {
    "zh-CN": "已有文档依据",
    "en": "Documented"
  },
  "ORIGINAL": {
    "zh-CN": "原厂",
    "en": "Official"
  },
  "THIRD_PARTY": {
    "zh-CN": "第三方",
    "en": "Third party"
  },
  "CUSTOM": {
    "zh-CN": "自定义",
    "en": "Custom"
  },
  "Pro width": {
    "zh-CN": "Pro 图片宽度",
    "en": "Pro image width"
  },
  "Pro height": {
    "zh-CN": "Pro 图片高度",
    "en": "Pro image height"
  },
  "Pro output_format": {
    "zh-CN": "Pro 输出格式",
    "en": "Pro output format"
  },
  "Pro response_format": {
    "zh-CN": "Pro 回传方式",
    "en": "Pro response format"
  },
  "Pro background": {
    "zh-CN": "Pro 背景",
    "en": "Pro background"
  },
  "png": {
    "zh-CN": "PNG",
    "en": "PNG"
  },
  "jpeg": {
    "zh-CN": "JPEG",
    "en": "JPEG"
  },
  "b64_json": {
    "zh-CN": "Base64",
    "en": "Base64"
  },
  "url": {
    "zh-CN": "URL",
    "en": "URL"
  },
  "opaque": {
    "zh-CN": "不透明",
    "en": "Opaque"
  },
  "transparent": {
    "zh-CN": "透明",
    "en": "Transparent"
  },
  "合併成片": {
    "zh-CN": "合并视频",
    "en": "Merged film"
  },
  "图像素材": {
    "zh-CN": "图片素材",
    "en": "Image media"
  },
  "视频素材": {
    "zh-CN": "视频素材",
    "en": "Video media"
  },
  "音频素材": {
    "zh-CN": "音频素材",
    "en": "Audio media"
  },
  "文本素材": {
    "zh-CN": "文本素材",
    "en": "Text media"
  },
  "图像生成": {
    "zh-CN": "图片生成",
    "en": "Image generation"
  },
  "视频生成": {
    "zh-CN": "视频生成",
    "en": "Video generation"
  },
  "图像输出占位": {
    "zh-CN": "图片输出占位",
    "en": "Image output placeholder"
  },
  "视频输出占位": {
    "zh-CN": "视频输出占位",
    "en": "Video output placeholder"
  },
  "音频输出占位": {
    "zh-CN": "音频输出占位",
    "en": "Audio output placeholder"
  },
  "image": {
    "zh-CN": "图片",
    "en": "Image"
  },
  "video": {
    "zh-CN": "视频",
    "en": "Video"
  },
  "audio": {
    "zh-CN": "音频",
    "en": "Audio"
  },
  "text": {
    "zh-CN": "文字",
    "en": "Text"
  },
  "reference_image": {
    "zh-CN": "参考图片",
    "en": "Reference image"
  },
  "reference_video": {
    "zh-CN": "参考视频",
    "en": "Reference video"
  },
  "reference_audio": {
    "zh-CN": "参考音频",
    "en": "Reference audio"
  },
  "first_frame": {
    "zh-CN": "首帧",
    "en": "First frame"
  },
  "last_frame": {
    "zh-CN": "尾帧",
    "en": "Last frame"
  },
  "scene": {
    "zh-CN": "场景",
    "en": "Scene"
  },
  "character": {
    "zh-CN": "人物",
    "en": "Person"
  },
  "product": {
    "zh-CN": "产品",
    "en": "Product"
  },
  "style": {
    "zh-CN": "风格",
    "en": "Style"
  },
  "studio": {
    "zh-CN": "摄影棚",
    "en": "Studio"
  },
  "reference": {
    "zh-CN": "一般参考",
    "en": "General reference"
  },
  "錯誤詳情": {
    "zh-CN": "错误详情",
    "en": "Error details"
  },
  "Saved as: {name}": {
    "zh-CN": "另存为：{name}",
    "en": "Saved as: {name}"
  },
  "Captured {binding}; use Apply shortcut to change it": {
    "zh-CN": "已录入 {binding}；点击“应用键位”才会修改",
    "en": "Captured {binding}; use Apply shortcut to change it"
  },
  "Placed {count} images; save the project manually": {
    "zh-CN": "已放入 {count} 张图片，请手动保存项目",
    "en": "Placed {count} images; save the project manually"
  },
  "Duplicated {count} cards. Internal links retained; external inputs excluded. Save manually.": {
    "zh-CN": "已复制 {count} 个框；内部连线保留，未复制外部输入。请手动保存。",
    "en": "Duplicated {count} cards. Internal links retained; external inputs excluded. Save manually."
  },
  "USER_DECLARED": {
    "zh-CN": "用户声明",
    "en": "User-declared"
  },
  "DOCUMENTED": {
    "zh-CN": "文档依据",
    "en": "Documented"
  },
  "NONE": {
    "zh-CN": "无",
    "en": "None"
  },
  "BEARER": {
    "zh-CN": "Bearer Key",
    "en": "Bearer Key"
  },
  "HEADER_KEY": {
    "zh-CN": "Header Key",
    "en": "Header Key"
  },
  "auto": {
    "zh-CN": "自动",
    "en": "Automatic"
  },
  "Review the operation details before continuing.": {
    "zh-CN": "请查看操作详情后再继续。",
    "en": "Review the operation details before continuing."
  },
  "产品": {
    "zh-CN": "产品",
    "en": "Product"
  },
  "场景": {
    "zh-CN": "场景",
    "en": "Scene"
  },
  "风格": {
    "zh-CN": "风格",
    "en": "Style"
  },
  "完整提示词": {
    "zh-CN": "完整提示词",
    "en": "Full prompt"
  },
  "BytePlus ModelArk · 视频": {
    "zh-CN": "BytePlus ModelArk · 视频",
    "en": "BytePlus ModelArk · Video"
  },
  "BytePlus ModelArk · 图片": {
    "zh-CN": "BytePlus ModelArk · 图片",
    "en": "BytePlus ModelArk · Image"
  },
  "Google Gemini · 图片": {
    "zh-CN": "Google Gemini · 图片",
    "en": "Google Gemini · Image"
  },
  "Google Gemini Omni · 视频（非 Veo）": {
    "zh-CN": "Google Gemini Omni · 视频（非 Veo）",
    "en": "Google Gemini Omni · Video (not Veo)"
  },
  "Google Veo Cloud · 视频": {
    "zh-CN": "Google Veo Cloud · 视频",
    "en": "Google Veo Cloud · Video"
  },
  "OpenAI Images · 图片": {
    "zh-CN": "OpenAI Images · 图片",
    "en": "OpenAI Images · Image"
  },
  "xAI Imagine · 图片": {
    "zh-CN": "xAI Imagine · 图片",
    "en": "xAI Imagine · Image"
  },
  "xAI Imagine · 视频": {
    "zh-CN": "xAI Imagine · 视频",
    "en": "xAI Imagine · Video"
  },
  "Alibaba Cloud Wan · 视频": {
    "zh-CN": "Alibaba Cloud Wan · 视频",
    "en": "Alibaba Cloud Wan · Video"
  },
  "Alibaba Cloud Wan · 图片": {
    "zh-CN": "Alibaba Cloud Wan · 图片",
    "en": "Alibaba Cloud Wan · Image"
  },
  "Kling 3.0 · 视频 / 图片": {
    "zh-CN": "Kling 3.0 · 视频 / 图片",
    "en": "Kling 3.0 · Video / Image"
  },
  "Runway · 图片 / 视频": {
    "zh-CN": "Runway · 图片 / 视频",
    "en": "Runway · Image / Video"
  },
  "MiniMax Hailuo · 视频 · v1": {
    "zh-CN": "MiniMax Hailuo · 视频 · v1",
    "en": "MiniMax Hailuo · Video · v1"
  },
  "MiniMax Hailuo · 视频 · v2": {
    "zh-CN": "MiniMax Hailuo · 视频 · v2",
    "en": "MiniMax Hailuo · Video · v2"
  },
  "MiniMax Hailuo · 图片": {
    "zh-CN": "MiniMax Hailuo · 图片",
    "en": "MiniMax Hailuo · Image"
  },
  "Luma · 图片 / 视频": {
    "zh-CN": "Luma · 图片 / 视频",
    "en": "Luma · Image / Video"
  },
  "Pika · 视频": {
    "zh-CN": "Pika · 视频",
    "en": "Pika · Video"
  },
  "Black Forest Labs FLUX · 图片 / 视频": {
    "zh-CN": "Black Forest Labs FLUX · 图片 / 视频",
    "en": "Black Forest Labs FLUX · Image / Video"
  },
  "Stability AI · SD3.5 图片": {
    "zh-CN": "Stability AI · SD3.5 图片",
    "en": "Stability AI · SD3.5 Image"
  },
  "fal.ai · 图片 / 视频": {
    "zh-CN": "fal.ai · 图片 / 视频",
    "en": "fal.ai · Image / Video"
  },
  "Replicate · 图片 / 视频": {
    "zh-CN": "Replicate · 图片 / 视频",
    "en": "Replicate · Image / Video"
  },
  "自定义 API": {
    "zh-CN": "自定义 API",
    "en": "Custom API"
  },
  "本地 / 自架服务": {
    "zh-CN": "本地 / 自架服务",
    "en": "Local / self-hosted"
  },
  "Mock 演示（不联网）": {
    "zh-CN": "Mock 演示（不联网）",
    "en": "Mock demo (offline)"
  },
  "MiniMax Hailuo · 视频 · v1 · 中国": {
    "zh-CN": "MiniMax Hailuo · 视频 · v1 · 中国",
    "en": "MiniMax Hailuo · Video · v1 · China"
  },
  "MiniMax Hailuo · 视频 · v2 · 中国": {
    "zh-CN": "MiniMax Hailuo · 视频 · v2 · 中国",
    "en": "MiniMax Hailuo · Video · v2 · China"
  },
  "MiniMax Hailuo · 图片 · 中国": {
    "zh-CN": "MiniMax Hailuo · 图片 · 中国",
    "en": "MiniMax Hailuo · Image · China"
  },
  "MiniMax H3 Image · 国际": {
    "zh-CN": "MiniMax H3 Image · 国际",
    "en": "MiniMax H3 Image · International"
  },
  "MiniMax H3 Image · 中国": {
    "zh-CN": "MiniMax H3 Image · 中国",
    "en": "MiniMax H3 Image · China"
  },
  "场景编辑 WebGL 视口": {
    "zh-CN": "场景编辑 WebGL 视口",
    "en": "Scene editing WebGL viewport"
  },
  "拍摄摄影机 WebGL 实时取景": {
    "zh-CN": "拍摄摄影机 WebGL 实时取景",
    "en": "Live camera WebGL view"
  }
};

Object.assign(messages,{
  "来源诊断": {
    "zh-CN": "来源诊断",
    "en": "Source diagnostics"
  },
  "运行本地模拟": {
    "zh-CN": "运行本地模拟",
    "en": "Run local simulation"
  },
  "本地模拟视频确认": {
    "zh-CN": "本地模拟视频确认",
    "en": "Confirm local video simulation"
  },
  "仅运行本地模拟，不调用供应商、不付费": {
    "zh-CN": "仅运行本地模拟，不调用供应商、不付费",
    "en": "Run a local simulation only. No Provider call or charge."
  },
  "128 MiB · 长边 3840 / 短边 2160 · 60 fps；支持竖屏": {
    "zh-CN": "128 MiB · 长边 3840 / 短边 2160 · 60 fps；支持竖屏",
    "en": "128 MiB · long side 3840 / short side 2160 · 60 fps; portrait supported"
  },
  "64 MiB · 双声道 · 8–48 kHz": {
    "zh-CN": "64 MiB · 双声道 · 8–48 kHz",
    "en": "64 MiB · stereo · 8–48 kHz"
  },
  "每张画布 ≤8 MiB；整库提交载荷 ≤32 MiB。素材累计数量与总容量不另设固定配额；仍受磁盘和内存资源约束。单文件探测、完整解码各最多 10 秒。模型请求另按各自合同校验，不等同本地导入限制。": {
    "zh-CN": "每张画布 ≤8 MiB；整库提交载荷 ≤32 MiB。素材累计数量与总容量不另设固定配额；仍受磁盘和内存资源约束。单文件探测、完整解码各最多 10 秒。模型请求另按各自合同校验，不等同本地导入限制。",
    "en": "Each canvas ≤8 MiB; whole-library commit payload ≤32 MiB. No separate fixed cumulative item or media-byte quota; disk and memory resources still apply. Probe and complete decode each allow 10 seconds per file. Model requests follow their own contracts, independently of local import limits."
  }
});

Object.assign(messages,{
  "Placed {count}/{total} images; save the project manually": {
    "zh-CN": "本批已放入 {count}／{total} 张；仍须手动保存项目",
    "en": "Placed {count}/{total} images; save the project manually"
  },
  "本次操作作用於整個已套用工作庫。未套用草稿不會採用；沒有生成或付費權限。恢復只建立新副本，不切換或覆蓋目前工程。": {
    "zh-CN": "本次操作作用于整个已应用工作库。不会采用未应用的草稿；不授予生成或付费权限。恢复只建立新副本，不切换或覆盖当前项目。",
    "en": "This operation covers the whole applied library. Unapplied drafts are excluded; no generation or payment permission is granted. Restore creates a new copy without switching or overwriting the current project."
  }
});

Object.assign(messages,{"候选":{"zh-CN":"候选","en":"Candidate"}});

Object.assign(messages,{"解除與任務的引用（選擇任務）": {"zh-CN": "解除与任务的引用（选择任务）", "en": "Disconnect from a task (choose task)"}, "已解除所選素材與此任務的引用；其他引用與素材保留，可整筆撤銷": {"zh-CN": "已解除所选素材与此任务的引用；其他引用与素材保留，可整笔撤销", "en": "Selected references disconnected from this task. Other references and materials are preserved; undo is available."}, "點選要解除引用的圖片或影片任務；只移除所選素材的引用，Esc 取消。": {"zh-CN": "点击要解除引用的图片或视频任务；只移除所选素材的引用，Esc 取消。", "en": "Click the image or video task to disconnect only selected references. Esc cancels."}, "個素材，點選目標任務解除引用；Esc 取消。": {"zh-CN": "个素材，点击目标任务解除引用；Esc 取消。", "en": "materials. Click a task to disconnect these references; Esc cancels."}, "所選素材與此任務沒有可解除的引用。": {"zh-CN": "所选素材与此任务没有可解除的引用。", "en": "These materials have no references to disconnect from this task."}});

Object.assign(messages,{"自由调姿与姿势库": {"zh-CN": "自由调姿与姿势库", "en": "Free pose and pose library"}, "结束关节调整": {"zh-CN": "结束关节调整", "en": "Finish joint editing"}, "调整人物关节": {"zh-CN": "调整人物关节", "en": "Edit person joints"}, "人物关节": {"zh-CN": "人物关节", "en": "Person joint"}, "关节角度": {"zh-CN": "关节角度", "en": "Joint angle"}, "姿势名称": {"zh-CN": "姿势名称", "en": "Pose name"}, "保存目前姿势": {"zh-CN": "保存目前姿势", "en": "Save current pose"}, "我的姿势": {"zh-CN": "我的姿势", "en": "My poses"}, "选择已保存姿势": {"zh-CN": "选择已保存姿势", "en": "Choose a saved pose"}, "载入姿势": {"zh-CN": "载入姿势", "en": "Load pose"}, "刷新姿势库": {"zh-CN": "刷新姿势库", "en": "Refresh pose library"}, "导入姿势JSON": {"zh-CN": "导入姿势JSON", "en": "Import pose JSON"}, "导出姿势JSON": {"zh-CN": "导出姿势JSON", "en": "Export pose JSON"}, "查询原姿势保存结果": {"zh-CN": "查询原姿势保存结果", "en": "Check original pose save result"}, "姿势已独立保存；不会自动套用或保存画布。": {"zh-CN": "姿势已独立保存；不会自动套用或保存画布。", "en": "Pose saved independently. The scene and canvas are not automatically applied or saved."}, "姿势已载入草稿；人物身份、站位和相机保持不变。": {"zh-CN": "姿势已载入草稿；人物身份、站位和相机保持不变。", "en": "Pose loaded into the draft. Person identity, position and camera are unchanged."}, "躯干": {"zh-CN": "躯干", "en": "Torso"}, "颈部": {"zh-CN": "颈部", "en": "Neck"}, "头部": {"zh-CN": "头部", "en": "Head"}, "左肩": {"zh-CN": "左肩", "en": "Left shoulder"}, "右肩": {"zh-CN": "右肩", "en": "Right shoulder"}, "左肘": {"zh-CN": "左肘", "en": "Left elbow"}, "右肘": {"zh-CN": "右肘", "en": "Right elbow"}, "左腕": {"zh-CN": "左腕", "en": "Left wrist"}, "右腕": {"zh-CN": "右腕", "en": "Right wrist"}, "左髋": {"zh-CN": "左髋", "en": "Left hip"}, "右髋": {"zh-CN": "右髋", "en": "Right hip"}, "左膝": {"zh-CN": "左膝", "en": "Left knee"}, "右膝": {"zh-CN": "右膝", "en": "Right knee"}, "左踝": {"zh-CN": "左踝", "en": "Left ankle"}, "右踝": {"zh-CN": "右踝", "en": "Right ankle"}});

Object.assign(messages,{"缩图读取失败": {"zh-CN": "缩图读取失败", "en": "Could not read thumbnail"}, "重试缩图": {"zh-CN": "重试缩图", "en": "Retry thumbnail"}, "姿势库：未确认的名称、操作或导入草稿": {"zh-CN": "姿势库：未确认的名称、操作或导入草稿", "en": "Pose library: unconfirmed name, operation or import draft"}, "已查询到姿势成功收据；该次操作已落盘。": {"zh-CN": "已查询到姿势成功收据；该次操作已落盘。", "en": "Original pose receipt confirmed; the operation is saved."}, "请先修正关节输入，再保存。": {"zh-CN": "请先修正关节输入，再保存。", "en": "Correct the joint input before saving."}, " 副本": {"zh-CN": " 副本", "en": " Copy"}, "这条姿势已改变，请刷新后重新确认；未覆盖。": {"zh-CN": "这条姿势已改变，请刷新后重新确认；未覆盖。", "en": "This pose changed. Refresh and confirm again; nothing was overwritten."}, "已写入新名称。": {"zh-CN": "已写入新名称。", "en": "New name saved."}, "已写入姿势库；取消场景草稿不会删除它。": {"zh-CN": "已写入姿势库；取消场景草稿不会删除它。", "en": "Pose saved. Cancelling the scene draft will not remove it."}, "已校验文件；请核对导入摘要，尚未写入。": {"zh-CN": "已校验文件；请核对导入摘要，尚未写入。", "en": "File validated. Review the import summary; nothing has been written."}, "文件超过1MiB，未读取导入。": {"zh-CN": "文件超过1MiB，未读取导入。", "en": "File exceeds 1 MiB; import was not read."}, "导入后超过200条（含回收区），未写入。": {"zh-CN": "导入后超过200条（含回收区），未写入。", "en": "Import would exceed 200 records including the recycle bin; nothing was written."}, "当前姿势备份": {"zh-CN": "当前姿势备份", "en": "Current pose backup"}, "JSON备份已交给浏览器下载；这不是模型或图片导出。": {"zh-CN": "JSON备份已交给浏览器下载；这不是模型或图片导出。", "en": "JSON backup sent to the browser download. This does not export a model or image."}, "找不到这条姿势，请刷新后重试。": {"zh-CN": "找不到这条姿势，请刷新后重试。", "en": "Pose not found. Refresh and try again."}, "整库含回收区": {"zh-CN": "整库含回收区", "en": "Whole library including recycle bin"}, "请先修正当前输入，再套用姿势。": {"zh-CN": "请先修正当前输入，再套用姿势。", "en": "Correct the current input before applying a pose."}, "姿势库": {"zh-CN": "姿势库", "en": "Pose library"}, "姿势与保存": {"zh-CN": "姿势与保存", "en": "Poses and saving"}, "姿势库保存与场景套用独立；取消场景草稿不会删除已保存姿势。预设为静态关节配置，不添加椅子、墙、球或手机。": {"zh-CN": "姿势库保存与场景套用独立；取消场景草稿不会删除已保存姿势。预设为静态关节配置，不添加椅子、墙、球或手机。", "en": "Pose-library saving is independent of applying the scene. Cancelling the scene draft keeps saved poses. Presets are static joints and do not add props."}, "内置预设自动将当前人偶最低几何点落到地面Y=0，保留原X/Z及全部根节点朝向。自订姿势按原合同仅存关节，场景根高度另随工作库保存。": {"zh-CN": "内置预设自动将当前人偶最低几何点落到地面Y=0，保留原X/Z及全部根节点朝向。自订姿势按原合同仅存关节，场景根高度另随工作库保存。", "en": "Built-in presets place the lowest mannequin geometry on the ground, retaining X/Z and root orientation. Custom poses store joints only; root height stays in the scene."}, "保存目前姿势": {"zh-CN": "保存目前姿势", "en": "Save current pose"}, "当前工作库姿势 p": {"zh-CN": "当前工作库姿势 p", "en": "Current-library poses p"}, "姿势提交中…": {"zh-CN": "姿势提交中…", "en": "Saving pose…"}, "姿势结果未确认": {"zh-CN": "姿势结果未确认", "en": "Pose outcome unknown"}, "姿势提交未完成": {"zh-CN": "姿势提交未完成", "en": "Pose save did not finish"}, "已确认的姿势已落盘": {"zh-CN": "已确认的姿势已落盘", "en": "Confirmed poses are saved"}, "查询姿势操作结果": {"zh-CN": "查询姿势操作结果", "en": "Check original pose operation"}, "姿势库类别": {"zh-CN": "姿势库类别", "en": "Pose categories"}, "内置姿势": {"zh-CN": "内置姿势", "en": "Built-in poses"}, "我的姿势": {"zh-CN": "我的姿势", "en": "My poses"}, "20个静态预设 · 先选姿势，再微调。": {"zh-CN": "20个静态预设 · 先选姿势，再微调。", "en": "20 static presets. Choose a pose, then adjust it."}, "20个静态姿势预设": {"zh-CN": "20个静态姿势预设", "en": "20 static pose presets"}, "搜索我的姿势": {"zh-CN": "搜索我的姿势", "en": "Search my poses"}, "输入名称…": {"zh-CN": "输入名称…", "en": "Enter a name…"}, "返回我的姿势": {"zh-CN": "返回我的姿势", "en": "Back to my poses"}, "姿势回收区": {"zh-CN": "姿势回收区", "en": "Pose recycle bin"}, "我的姿势列表": {"zh-CN": "我的姿势列表", "en": "My pose list"}, "缩图失败，姿势仍保留": {"zh-CN": "缩图失败，姿势仍保留", "en": "Thumbnail failed; pose is preserved"}, "缩图待生成": {"zh-CN": "缩图待生成", "en": "Thumbnail pending"}, "恢复": {"zh-CN": "恢复", "en": "Restore"}, "套用": {"zh-CN": "套用", "en": "Apply"}, "管理": {"zh-CN": "管理", "en": "Manage"}, "正在读取姿势库…": {"zh-CN": "正在读取姿势库…", "en": "Reading pose library…"}, "没有匹配的姿势。": {"zh-CN": "没有匹配的姿势。", "en": "No matching poses."}, "回收区为空。": {"zh-CN": "回收区为空。", "en": "Recycle bin is empty."}, "还没有自订姿势，先摆姿再保存。": {"zh-CN": "还没有自订姿势，先摆姿再保存。", "en": "No custom poses yet. Adjust the mannequin and save one."}, "上一页姿势": {"zh-CN": "上一页姿势", "en": "Previous poses"}, "条 ·": {"zh-CN": "条 ·", "en": "records ·"}, "页": {"zh-CN": "页", "en": "page"}, "下一页姿势": {"zh-CN": "下一页姿势", "en": "Next poses"}, "管理「": {"zh-CN": "管理「", "en": "Manage “"}, "改名": {"zh-CN": "改名", "en": "Rename"}, "另存副本": {"zh-CN": "另存副本", "en": "Save a copy"}, "以目前姿势更新": {"zh-CN": "以目前姿势更新", "en": "Update with current pose"}, "导出此姿势JSON": {"zh-CN": "导出此姿势JSON", "en": "Export this pose JSON"}, "删除": {"zh-CN": "删除", "en": "Delete"}, "姿势库操作": {"zh-CN": "姿势库操作", "en": "Pose-library operation"}, "姿势名称": {"zh-CN": "姿势名称", "en": "Pose name"}, "仅移到回收区，可恢复；已套用任务不改变。": {"zh-CN": "仅移到回收区，可恢复；已套用任务不改变。", "en": "Move to recycle bin only. Existing scene snapshots do not change."}, "只替换库中这条姿势；已套用任务不追溯改变。": {"zh-CN": "只替换库中这条姿势；已套用任务不追溯改变。", "en": "Only replace this library pose. Existing scene snapshots do not change."}, "取消库操作": {"zh-CN": "取消库操作", "en": "Cancel library operation"}, "正在写入…": {"zh-CN": "正在写入…", "en": "Writing…"}, "确认移到回收区": {"zh-CN": "确认移到回收区", "en": "Confirm move to recycle bin"}, "确认更新这条姿势": {"zh-CN": "确认更新这条姿势", "en": "Confirm pose update"}, "确认改名": {"zh-CN": "确认改名", "en": "Confirm rename"}, "保存到姿势库": {"zh-CN": "保存到姿势库", "en": "Save to pose library"}, "姿势导入摘要": {"zh-CN": "姿势导入摘要", "en": "Pose import summary"}, "导入摘要：新增": {"zh-CN": "导入摘要：新增", "en": "Import summary: add"}, "条": {"zh-CN": "条", "en": "records"}, "有效": {"zh-CN": "有效", "en": "Valid"}, "条；来源ID冲突": {"zh-CN": "条；来源ID冲突", "en": "records; source-ID conflicts"}, "条。全部分配新ID；重复导入将新增副本，重名以以下名称新增，不覆盖。缩图只从已验证姿态本地重建。": {"zh-CN": "条。全部分配新ID；重复导入将新增副本，重名以以下名称新增，不覆盖。缩图只从已验证姿态本地重建。", "en": "records. All receive new IDs. Reimport adds copies with the shown unique names and never overwrites. Thumbnails are rebuilt locally from validated poses."}, "（回收区）": {"zh-CN": "（回收区）", "en": "(recycle bin)"}, "取消导入": {"zh-CN": "取消导入", "en": "Cancel import"}, "确认新增姿势": {"zh-CN": "确认新增姿势", "en": "Confirm new poses"}, "刷新姿势库": {"zh-CN": "刷新姿势库", "en": "Refresh pose library"}, "导入姿势JSON": {"zh-CN": "导入姿势JSON", "en": "Import pose JSON"}, "整库导出JSON": {"zh-CN": "整库导出JSON", "en": "Export whole-library JSON"}, "导出当前姿势JSON": {"zh-CN": "导出当前姿势JSON", "en": "Export current pose JSON"}, "导入姿势JSON文件": {"zh-CN": "导入姿势JSON文件", "en": "Import pose JSON file"}, "正在处理，请稍候…": {"zh-CN": "正在处理，请稍候…", "en": "Processing, please wait…"}, "个自订姿势 ·": {"zh-CN": "个自订姿势 ·", "en": "custom poses ·"}, "个在回收区。": {"zh-CN": "个在回收区。", "en": "in recycle bin."}, "仅当前工作库共享；已提交姿势及缩图纳入完整备份，核心资料仍须手动保存。": {"zh-CN": "仅当前工作库共享；已提交姿势及缩图纳入完整备份，核心资料仍须手动保存。", "en": "Shared only within the current library. Committed poses and thumbnails are included in full backups. Core project data still needs manual saving."}, "仅此浏览器与网址保存；清除站点资料会丢失，建议定期导出JSON备份。": {"zh-CN": "仅此浏览器与网址保存；清除站点资料会丢失，建议定期导出JSON备份。", "en": "Saved only in this browser and site. Clearing site data loses them; export JSON backups regularly."}});

Object.assign(messages,{"读取姿势库失败：{error}": {"zh-CN": "读取姿势库失败：{error}", "en": "Could not read pose library: {error}"}, "已移到回收区：「{name}」。": {"zh-CN": "已移到回收区：「{name}」。", "en": "Moved “{name}” to the recycle bin."}, "已更新「{name}」；其他任务快照不变。": {"zh-CN": "已更新「{name}」；其他任务快照不变。", "en": "Updated “{name}”. Other scene snapshots are unchanged."}, "已新增{count}条姿势；原有ID和名称未被覆盖。": {"zh-CN": "已新增{count}条姿势；原有ID和名称未被覆盖。", "en": "Added {count} poses. Existing IDs and names were not overwritten."}, "「{name}」已载入当前场景草稿；尚未套用构图。": {"zh-CN": "「{name}」已载入当前场景草稿；尚未套用构图。", "en": "“{name}” loaded into the current draft. Apply the composition explicitly."}, "查看回收区（{count}）": {"zh-CN": "查看回收区（{count}）", "en": "Recycle bin ({count})"}, "恢复 {name}": {"zh-CN": "恢复 {name}", "en": "Restore {name}"}, "已恢复「{name}」。": {"zh-CN": "已恢复「{name}」。", "en": "Restored “{name}”."}, "套用 {name}": {"zh-CN": "套用 {name}", "en": "Apply {name}"}, "管理 {name}": {"zh-CN": "管理 {name}", "en": "Manage {name}"}, "管理姿势 {name}": {"zh-CN": "管理姿势 {name}", "en": "Manage pose {name}"}, "另存「{name}」的副本": {"zh-CN": "另存「{name}」的副本", "en": "Save a copy of “{name}”"}, "改名「{name}」": {"zh-CN": "改名「{name}」", "en": "Rename “{name}”"}, "将以当前姿势更新「{name}」": {"zh-CN": "将以当前姿势更新「{name}」", "en": "Update “{name}” with the current pose"}, "删除「{name}」？": {"zh-CN": "删除「{name}」？", "en": "Delete “{name}”?"}, "{name}缩图": {"zh-CN": "{name}缩图", "en": "{name} thumbnail"}, "重试缩图 {name}": {"zh-CN": "重试缩图 {name}", "en": "Retry thumbnail {name}"}});

Object.assign(messages,{
  "參考來源記錄（進階）": {
    "zh-CN": "参考来源记录（进阶）",
    "en": "Reference source (advanced)"
  },
  "已綁定圖片": {
    "zh-CN": "已绑定图片",
    "en": "Image linked"
  },
  "來源圖片（僅記錄）": {
    "zh-CN": "来源图片（仅记录）",
    "en": "Source image (record only)"
  },
  "人物來源圖片（僅記錄）": {
    "zh-CN": "人物来源图片（仅记录）",
    "en": "Person source image (record only)"
  },
  "不綁定來源圖片": {
    "zh-CN": "不绑定来源图片",
    "en": "No source image link"
  },
  "僅記錄固定圖片版本，不改變人偶外觀，也不會自動加入生成。": {
    "zh-CN": "仅记录固定图片版本，不改变人偶外观，也不会自动加入生成。",
    "en": "Records a fixed image version. It does not change the mannequin appearance and is not automatically included in generation."
  },
  "生成參考請到圖片／影片任務中選擇。此清單包含目前畫布的各類圖片，不進行人物辨識。": {
    "zh-CN": "生成参考请到图片／视频任务中选择。此清单包含当前画布的各类图片，不进行人物识别。",
    "en": "Choose generation references in the image or video task. This list includes all image types on the current canvas; it does not identify people."
  },
  "未綁定來源": {
    "zh-CN": "未绑定来源",
    "en": "Not linked"
  }
});

Object.assign(messages,{"接入點由本次安裝設定；未配置時不提交。":{"zh-CN":"接入点由本次安装设置；未配置时不提交。","en":"Endpoints are configured for this installation. Unconfigured requests are blocked."}});

Object.assign(messages,{
  "Private TOS source": {
    "zh-CN": "私有 TOS 来源",
    "en": "Private TOS source"
  },
  "Presigned upload URL": {
    "zh-CN": "上传预签名 URL",
    "en": "Presigned upload URL"
  },
  "Presigned download URL for the same object": {
    "zh-CN": "同一对象的下载预签名 URL",
    "en": "Presigned download URL for the same object"
  },
  "Use your own private ap-southeast-1 bucket. Sign PUT with x-tos-forbid-overwrite=true. Storage and transfer charges may apply. No bucket or public permission is created. The GET URL must cover the task execution lifetime and safety margin.": {
    "zh-CN": "使用你自己的 ap-southeast-1 私有存储桶。PUT 签名必须包含 x-tos-forbid-overwrite=true。存储和传输可能计费；软件不创建存储桶或公开权限。下载链接必须覆盖任务执行期限及安全余量。",
    "en": "Use your own private ap-southeast-1 bucket. Sign PUT with x-tos-forbid-overwrite=true. Storage and transfer charges may apply. No bucket or public permission is created. The GET URL must cover the task execution lifetime and safety margin."
  },
  "Upload and share this exact reference video": {
    "zh-CN": "上传并分享这份固定参考视频",
    "en": "Upload and share this exact reference video"
  },
  "Only continue if you own these private TOS links and may share this exact video with BytePlus. Upload does not generate video. Generation requires another native confirmation. An uncertain upload is never sent again.": {
    "zh-CN": "只有当你拥有这些私有 TOS 链接、且有权向 BytePlus 分享这份视频时才继续。上传不会生成视频；生成仍需另一次原生确认。未知上传结果不会自动重发。",
    "en": "Only continue if you own these private TOS links and may share this exact video with BytePlus. Upload does not generate video. Generation requires another native confirmation. An uncertain upload is never sent again."
  },
  "Fixed video and destination region": {
    "zh-CN": "固定视频及目标地域",
    "en": "Fixed video and destination region"
  },
  "Upload, verify and authorize this source": {
    "zh-CN": "上传、核验并授权这个来源",
    "en": "Upload, verify and authorize this source"
  },
  "Upload this local video to your private TOS object": {
    "zh-CN": "将这段本地视频上传到你的私有 TOS 对象",
    "en": "Upload this local video to your private TOS object"
  },
  "Complete source upload in the native window, then verify its result here.": {
    "zh-CN": "请在原生窗口完成来源上传，再回到这里核验结果。",
    "en": "Complete source upload in the native window, then verify its result here."
  },
  "Local video upload requires your own private TOS presigned PUT and GET links in the native window. Existing HTTPS sources remain available. Live asset URI resolution is not yet available. No destination, public access or cost is selected automatically.": {
    "zh-CN": "上传本地视频时，请在原生窗口提供自己私有 TOS 对象的 PUT 与 GET 预签名链接。也可继续使用已有 HTTPS 来源。实时 asset URI 解析尚未开放；软件不会替你选择目的地、公开权限或费用。",
    "en": "Local video upload requires your own private TOS presigned PUT and GET links in the native window. Existing HTTPS sources remain available. Live asset URI resolution is not yet available. No destination, public access or cost is selected automatically."
  },
  "Show private URLs": {
    "zh-CN": "显示私密 URL",
    "en": "Show private URLs"
  },
  "Hide private URLs": {
    "zh-CN": "隐藏私密 URL",
    "en": "Hide private URLs"
  }
});

Object.assign(messages,{
  "Private asset download link": {
    "zh-CN": "私有素材下载链接",
    "en": "Private asset download link"
  },
  "Asset ID": {
    "zh-CN": "素材 ID",
    "en": "Asset ID"
  },
  "Project name": {
    "zh-CN": "所属项目名称",
    "en": "Project name"
  },
  "Asset group ID": {
    "zh-CN": "素材组 ID",
    "en": "Asset group ID"
  },
  "Task execution limit (seconds)": {
    "zh-CN": "任务执行期限（秒）",
    "en": "Task execution limit (seconds)"
  },
  "Task lifetime": {
    "zh-CN": "任务执行期限",
    "en": "Task lifetime"
  },
  "GetAsset is a read action using separate AK/SK permission. Keys stay in this native request and are not saved. The resulting HTTPS link lasts at most 12 hours. Choose a shorter task limit; this does not grant asset URI authority.": {
    "zh-CN": "GetAsset 是使用独立 AK/SK 权限的查询。密钥只用于本次原生请求，不保存。得到的 HTTPS 下载链接最长有效12小时，请明确选择较短任务期限；此路径不授予 asset URI 权限。",
    "en": "GetAsset is a read action using separate AK/SK permission. Keys stay in this native request and are not saved. The resulting HTTPS link lasts at most 12 hours. Choose a shorter task limit; this does not grant asset URI authority."
  },
  "Read and share this private asset as a temporary HTTPS source": {
    "zh-CN": "读取并分享这份私有素材的临时 HTTPS 来源",
    "en": "Read and share this private asset as a temporary HTTPS source"
  },
  "This reads only the exact asset in your project and group. The downloaded video must fully match the fixed local version. No upload, generation or account permission is created. You explicitly choose the task lifetime below; apply it in the workbench before generation.": {
    "zh-CN": "只查询指定项目和素材组中的精确素材。下载的视频必须与固定本地版本完整匹配。不创建上传、生成或账号权限。请明确选择任务期限，并在生成前回工作台套用。",
    "en": "This reads only the exact asset in your project and group. The downloaded video must fully match the fixed local version. No upload, generation or account permission is created. You explicitly choose the task lifetime below; apply it in the workbench before generation."
  },
  "Read, verify and authorize this temporary source": {
    "zh-CN": "读取、核验并授权这个临时来源",
    "en": "Read, verify and authorize this temporary source"
  },
  "Use a private asset download link": {
    "zh-CN": "使用私有素材的临时下载来源",
    "en": "Use a private asset download link"
  },
  "Only an explicit edit changes the saved task lifetime. Sources must remain valid for the selected lifetime plus the safety margin.": {
    "zh-CN": "只有明确修改并套用才改变已保存的任务期限。来源有效期必须覆盖所选任务期限及安全余量。",
    "en": "Only an explicit edit changes the saved task lifetime. Sources must remain valid for the selected lifetime plus the safety margin."
  },
  "Cancelling only stops local work. A sent upload may already exist remotely and incur storage or transfer charges. No remote object is deleted automatically.": {
    "zh-CN": "取消只停止本地工作；已发出的上传可能已在远端存在，并产生存储或流量费用。软件不会自动删除远端对象。",
    "en": "Cancelling only stops local work. A sent upload may already exist remotely and incur storage or transfer charges. No remote object is deleted automatically."
  },
  "Asset reads and downloads may incur supplier network charges. This step never submits paid generation.": {
    "zh-CN": "素材查询和下载可能产生供应商流量费用；这一步不会提交付费生成。",
    "en": "Asset reads and downloads may incur supplier network charges. This step never submits paid generation."
  }
});

Object.assign(messages,{"BytePlus project name":{"zh-CN":"BytePlus 云项目名称","en":"BytePlus project name"},"Task execution limit (seconds)":{"zh-CN":"云端任务等待与执行期限（秒，不是片长）","en":"Task queue/execution expiry (seconds, not video length)"}});

Object.assign(messages,{
  "DEPENDENCY_MISSING": {
    "zh-CN": "所需外部工具尚未安装或配置。请运行 5-Check-Dependencies.cmd 查看官方安装来源，安装后重新检查；原项目保留。",
    "en": "A required external tool is missing or unconfigured. Run 5-Check-Dependencies.cmd for official installation instructions, then check again. Your project is preserved."
  },
  "DEPENDENCY_CHANGED": {
    "zh-CN": "已配置外部工具发生变化。请正常关闭后运行 5-Check-Dependencies.cmd 核对版本与哈希并明确重新配置；原项目保留。",
    "en": "A configured external tool changed. Close normally, then use 5-Check-Dependencies.cmd to review and explicitly configure its exact version and hash. Your project is preserved."
  },
  "DEPENDENCY_PATH": {
    "zh-CN": "外部工具路径不符合本机安全要求。请运行 5-Check-Dependencies.cmd 选择受支持的本机工具；原项目保留。",
    "en": "The external tool path does not meet local safety requirements. Use 5-Check-Dependencies.cmd to select a supported local tool. Your project is preserved."
  },
  "DEPENDENCY_NAME": {
    "zh-CN": "软件请求了未声明的外部工具，请保留错误代码并联系维护者；不自动安装。",
    "en": "The application requested an undeclared external tool. Keep the error code and contact the maintainer. Nothing is installed automatically."
  },
  "DEPENDENCY_CONFIG_INTEGRITY": {
    "zh-CN": "依赖配置与安装证明不一致，请保留项目并通过原安装／依赖检查入口修复；不要手改证明或安全设置。",
    "en": "Dependency configuration does not match installation proof. Preserve your project and repair through the installer or dependency checker. Do not edit proofs or security settings."
  }
});

Object.assign(messages,{"模型": {"zh-CN": "模型", "en": "Model"}, "选择模型…": {"zh-CN": "选择模型…", "en": "Choose a model…"}, "原模型连接不可用": {"zh-CN": "原模型连接不可用", "en": "Original model connection unavailable"}, "提示词": {"zh-CN": "提示词", "en": "Prompt"}, "编辑提示词": {"zh-CN": "编辑提示词", "en": "Edit prompt"}, "描述你想创作的画面": {"zh-CN": "描述你想创作的画面", "en": "Describe what you want to create"}, "此模型的已支持选项在模型设置中。": {"zh-CN": "此模型的已支持选项在模型设置中。", "en": "Supported options for this model are available in model settings."}, "先选择模型，再设置本次创作。": {"zh-CN": "先选择模型，再设置本次创作。", "en": "Choose a model to set up this task."}, "应用模型": {"zh-CN": "应用模型", "en": "Apply model"}, "管理模型与连接": {"zh-CN": "管理模型与连接", "en": "Models and connections"}, "应用任务设置": {"zh-CN": "应用任务设置", "en": "Apply task settings"}, "有未应用的设置": {"zh-CN": "有未应用的设置", "en": "Unapplied settings"}, "取消更改": {"zh-CN": "取消更改", "en": "Cancel changes"}, "高级设置": {"zh-CN": "高级设置", "en": "Advanced settings"}, "提示词来源与顺序": {"zh-CN": "提示词来源与顺序", "en": "Prompt sources and order"}, "选择创作方式，描述画面": {"zh-CN": "选择创作方式，描述画面", "en": "Choose a mode and describe the scene"}, "模拟示例 · 非真实生成": {"zh-CN": "模拟示例 · 非真实生成", "en": "Simulated sample · not generated"}, "图片设置": {"zh-CN": "图片设置", "en": "Image settings"}, "影片设置": {"zh-CN": "影片设置", "en": "Video settings"}, "套用影片方式與選材": {"zh-CN": "应用任务设置", "en": "Apply task settings"}, "有未套用的影片輸入": {"zh-CN": "有未应用的设置", "en": "Unapplied settings"}, "放棄本次輸入修改": {"zh-CN": "取消更改", "en": "Cancel changes"}, "查看 BytePlus 單次摘要": {"zh-CN": "检查本次生成", "en": "Review generation"}, "查看 Pro 單次摘要": {"zh-CN": "检查本次生成", "en": "Review generation"}, "繼續到 BytePlus 原生確認": {"zh-CN": "继续确认", "en": "Continue to confirmation"}, "繼續到 Pro 原生確認": {"zh-CN": "继续确认", "en": "Continue to confirmation"}, "本次明確選材 · 固定版本": {"zh-CN": "参考素材", "en": "Reference materials"}, "Seedream Pro 圖片合同": {"zh-CN": "图片设置", "en": "Image settings"}, "BytePlus 五模式影片": {"zh-CN": "视频设置", "en": "Video settings"}, "BP_UI_CONFIGURATION_CHANGED": {"zh-CN": "任务已在其他地方修改，请取消本次草稿并重新读取。", "en": "This task changed elsewhere. Cancel your draft and reload before applying."}, "TASK_MODEL_CHANGED": {"zh-CN": "所选模型或连接已改变，请重新检查任务设置。", "en": "The selected model or connection changed. Review the task settings again."}, "TASK_SETTINGS_INVALID": {"zh-CN": "任务设置无效，请检查模型和选项。", "en": "These task settings are invalid. Check the model and selected options."}});

Object.assign(messages,{"任务模型":{"zh-CN":"任务模型","en":"Task model"}});

Object.assign(messages,{"图片尺寸":{"zh-CN":"图片尺寸","en":"Image size"},"自定义尺寸":{"zh-CN":"自定义尺寸","en":"Custom dimensions"}});

Object.assign(messages,{"任务生成模式": {"zh-CN": "任务生成模式", "en": "Task generation mode"}, "参考素材": {"zh-CN": "参考素材", "en": "Reference materials"}, "选择参考素材": {"zh-CN": "选择参考素材", "en": "Choose reference material"}, "选择图片…": {"zh-CN": "选择图片…", "en": "Choose an image…"}, "采用模型默认": {"zh-CN": "采用模型默认", "en": "Use model default"}, "生成确认摘要": {"zh-CN": "生成确认摘要", "en": "Generation review"}, "检查本次生成": {"zh-CN": "检查本次生成", "en": "Review generation"}, "提交前请核对实际接收方、模型、素材及费用风险。": {"zh-CN": "提交前请核对实际接收方、模型、素材及费用风险。", "en": "Review the actual recipient, model, materials and cost risk before submitting."}, "继续确认": {"zh-CN": "继续确认", "en": "Continue to confirmation"}, "此模型尚无可提交的已核实能力。请检查模型连接；原任务和结果保留。": {"zh-CN": "此模型尚无可提交的已核实能力。请检查模型连接；原任务和结果保留。", "en": "This model has no verified submission capability. Check its connection. Existing tasks and results are preserved."}, "TASK_SETTINGS_CHANGED": {"zh-CN": "任务提示词已改变，请重新检查已应用的任务设置。", "en": "The task prompt changed. Review the applied task settings again."}, "TASK_PROMPT_IN_CANVAS": {"zh-CN": "请关闭模型设置，在任务卡编辑提示词。", "en": "Close model settings and edit the prompt on the task card."}, "negative_prompt": {"zh-CN": "反向提示词", "en": "Negative prompt"}, "duration": {"zh-CN": "时长", "en": "Duration"}, "resolution": {"zh-CN": "分辨率", "en": "Resolution"}, "generate_audio": {"zh-CN": "生成声音", "en": "Generate audio"}, "output_format": {"zh-CN": "输出格式", "en": "Output format"}, "response_format": {"zh-CN": "回传方式", "en": "Response format"}, "watermark": {"zh-CN": "水印", "en": "Watermark"}});

Object.assign(messages,{"接收方与连接": {"zh-CN": "接收方与连接", "en": "Recipient and connection"}, "地域": {"zh-CN": "地域", "en": "Region"}, "未确认": {"zh-CN": "未确认", "en": "Not verified"}, "本次素材": {"zh-CN": "本次素材", "en": "Materials to send"}, "无素材，仅使用提示词": {"zh-CN": "无素材，仅使用提示词", "en": "No materials; prompt only"}, "固定素材": {"zh-CN": "固定素材", "en": "Fixed material"}, "本次请求可能产生费用，以该账户实际计费为准。下一步仍需本人核对并确认，才会发送。": {"zh-CN": "本次请求可能产生费用，以该账户实际计费为准。下一步仍需本人核对并确认，才会发送。", "en": "This request may incur charges under this account. You must review and confirm in the next native window before it is sent."}, "先为这段影片设置安全分享方式，再用于生成。": {"zh-CN": "先为这段影片设置安全分享方式，再用于生成。", "en": "Set up a safe sharing method for this video before generating."}, "参考素材按所列用途与顺序使用。若需要精确的开始和结束画面，请选择首尾帧。": {"zh-CN": "参考素材按所列用途与顺序使用。若需要精确的开始和结束画面，请选择首尾帧。", "en": "References are used with the listed roles and order. Choose first/last frames for a precise opening and ending."}, "可使用私有下载链接、已上传的私有素材，或在确认窗口提供自己的私有存储上传与下载地址。不会自动选择公开存储、地域或费用。": {"zh-CN": "可使用私有下载链接、已上传的私有素材，或在确认窗口提供自己的私有存储上传与下载地址。不会自动选择公开存储、地域或费用。", "en": "Use a private download link, an existing private asset, or provide your private storage upload and download links in the confirmation window. Public storage, region and cost are never chosen automatically."}});

Object.assign(messages,{"TASK_MODEL_KIND_REQUIRED": {"zh-CN": "此旧任务保留了多组选材，请重新应用明确模型后再生成。", "en": "This legacy task has multiple input sets. Reapply the intended model before generating."}, "重新应用当前模型": {"zh-CN": "重新应用当前模型", "en": "Reapply current model"}, "图片尺寸方式": {"zh-CN": "图片尺寸方式", "en": "Image sizing"}, "比例与尺寸预设": {"zh-CN": "比例与尺寸预设", "en": "Aspect ratio and size presets"}, "自定义宽高": {"zh-CN": "自定义宽高", "en": "Custom width and height"}, "不支持，请重新选择": {"zh-CN": "不支持，请重新选择", "en": "Unsupported; choose another value"}, "disable_pup": {"zh-CN": "关闭提示词增强", "en": "Prompt upsampling disabled"}, "prompt_upsampling": {"zh-CN": "提示词增强", "en": "Prompt upsampling"}});

Object.assign(messages,{"width": {"zh-CN": "宽", "en": "Width"}, "height": {"zh-CN": "高", "en": "Height"}, "grounding": {"zh-CN": "资料辅助", "en": "Grounding"}, "seed": {"zh-CN": "随机种子", "en": "Seed"}, "steps": {"zh-CN": "采样步数", "en": "Sampling steps"}, "guidance": {"zh-CN": "提示词强度", "en": "Prompt guidance"}, "保存的預設設定不合法；下方暫顯合同預設尚未採納，請修正本次覆寫。": {"zh-CN": "模型默认设置不兼容，请调整这次设置；原任务和结果保留。", "en": "The model defaults are incompatible. Adjust this task; its previous settings and results are preserved."}, "明確採用本次合同預設": {"zh-CN": "为这次任务使用模型默认", "en": "Use model defaults for this task"}});

Object.assign(messages,{"编辑补充文字": {"zh-CN": "编辑补充文字", "en": "Edit additional text"}, "查看文字来源": {"zh-CN": "查看文字来源", "en": "View text sources"}, "任务补充文字": {"zh-CN": "任务补充文字", "en": "Task additional text"}, "此处显示按来源顺序组合的提示词。外部文字固定在连线版本；在来源文字框编辑后，需明确确认这条连线使用新版，其他任务不会自动改变。": {"zh-CN": "此处显示按来源顺序组合的提示词。外部文字固定在连线版本；在来源文字框编辑后，需明确确认这条连线使用新版，其他任务不会自动改变。", "en": "This preview combines text in source order. External text uses the version fixed by its link. After editing the source text node, explicitly confirm that this link should use the new version; other tasks do not change automatically."}});

Object.assign(messages,{"Agent 与 MCP 连接": {"zh-CN": "Agent 与 MCP 连接", "en": "Agent and MCP connections"}, "支持本机标准 stdio 客户端。首次使用需明确登记具体程序、权限和项目范围；导出配置本身不授予权限。": {"zh-CN": "支持本机标准 stdio 客户端。首次使用需明确登记具体程序、权限和项目范围；导出配置本身不授予权限。", "en": "Local standard stdio clients are supported. Explicitly register the program, permissions and project scope first; exporting configuration grants no authority."}, "已登记客户端": {"zh-CN": "已登记客户端", "en": "Registered clients"}, "可撤销编辑": {"zh-CN": "可撤销编辑", "en": "Reversible editing"}, "只读": {"zh-CN": "只读", "en": "Read only"}, "已撤销": {"zh-CN": "已撤销", "en": "Revoked"}, "已到期": {"zh-CN": "已到期", "en": "Expired"}, "有效": {"zh-CN": "有效", "en": "Active"}, "MCP 配置（只读，可复制）": {"zh-CN": "MCP 配置（只读，可复制）", "en": "MCP configuration (read-only, copyable)"}, "请先检查并选择 Node.js 与 PowerShell 7。没有 Agent 不影响本地创作。": {"zh-CN": "请先检查并选择 Node.js 与 PowerShell 7。没有 Agent 不影响本地创作。", "en": "Select compatible Node.js and PowerShell 7 first. Local creation works without an Agent."}, "在本机运行 mcp-clients.cjs 明确登记或撤销客户端，步骤见 MCP-CLIENT-GUIDE.zh-CN.md。不会自动修改任何 Agent 的全局设置。": {"zh-CN": "在本机运行 mcp-clients.cjs 明确登记或撤销客户端，步骤见 MCP-CLIENT-GUIDE.zh-CN.md。不会自动修改任何 Agent 的全局设置。", "en": "Use the local mcp-clients.cjs command to explicitly register or revoke a client; see MCP-CLIENT-GUIDE.zh-CN.md. No Agent global settings are changed automatically."}, "未开启 HTTP 或远程服务。普通编辑权限不包含保存、付费或自动批准。": {"zh-CN": "未开启 HTTP 或远程服务。普通编辑权限不包含保存、付费或自动批准。", "en": "No HTTP or remote service is enabled. Ordinary editing grants no save, payment or automatic-approval authority."}, "MCP_CLIENT_NOT_REGISTERED": {"zh-CN": "此本机客户端尚未登记，请按连接指南选择精确程序及范围。", "en": "This local client is not registered. Select its exact program and scope in the connection setup guide."}, "MCP_CLIENT_READ_ONLY": {"zh-CN": "此客户端只有读取权限，原任务保留。", "en": "This client has read-only permission. Existing tasks are preserved."}, "MCP_CLIENT_SCOPE": {"zh-CN": "目标项目或资料副本不在此客户端授权范围。", "en": "The requested project or library copy is outside this client’s scope."}, "MCP_CLIENT_REVOKED": {"zh-CN": "此客户端的授权已撤销。", "en": "This client’s authorization was revoked."}, "MCP_CLIENT_EXPIRED": {"zh-CN": "此客户端的授权已到期。", "en": "This client’s authorization expired."}, "MCP_CLIENT_POLICY_CHANGED": {"zh-CN": "客户端授权已更改，请重新连接并读取新快照。", "en": "Client authorization changed. Reconnect and read a fresh snapshot."}, "MCP_CLIENT_ENTRY_REQUIRED": {"zh-CN": "此执行器还需明确固定客户端入口脚本。", "en": "This runtime needs an explicitly pinned client entry script."}, "MCP_CLIENT_BINARY_CHANGED": {"zh-CN": "客户端或入口脚本已改变，请核对后重新登记精确身份。", "en": "The selected client or entry script changed. Review and register its exact new identity."}, "MCP_CLIENT_LAUNCH_DENIED": {"zh-CN": "此客户端未获打开工作台的权限。", "en": "This client is not authorized to open the workbench."}, "目前畫布 Codex 連線": {"zh-CN": "当前画布 Agent 连接", "en": "Current canvas Agent connection"}, "正在等待目前 Codex；不需選擇範圍或重複確認": {"zh-CN": "正在等待已登记的 Agent；权限和范围以本机登记为准", "en": "Waiting for a registered Agent; its local registration determines permissions and scope"}});

Object.assign(messages,{"Agent 未配置": {"zh-CN": "Agent 尚未配置", "en": "Agent not configured"}, "本地功能可用；需要協作時請按安裝指南接入 MCP 客戶端": {"zh-CN": "本地功能可用；协作时按安装指南接入 MCP 客户端", "en": "Local features remain available. Follow the setup guide to connect an MCP client."}, "MCP_CLIENT_LIBRARY_REQUIRED": {"zh-CN": "请先打开此工作台，建立独立资料库后再登记客户端。", "en": "Open this workbench once to initialize its independent library before registering a client."}});

Object.assign(messages,{"Agent 与 MCP 连接": {"zh-CN": "Agent 与 MCP 连接", "en": "Agent and MCP connections"}, "为你选择的客户端建立连接，再复制配置。支持本地标准 stdio，无需登记客户端文件或哈希。": {"zh-CN": "为你选择的客户端建立连接，再复制配置。支持本地标准 stdio，无需登记客户端文件或哈希。", "en": "Create a connection for the client you choose, then copy its configuration. Supports local standard stdio without client executable or hash registration."}, "连接名称": {"zh-CN": "连接名称", "en": "Connection name"}, "权限": {"zh-CN": "权限", "en": "Permission"}, "范围": {"zh-CN": "范围", "en": "Scope"}, "当前项目": {"zh-CN": "当前项目", "en": "Current project"}, "当前素材库中的所有项目": {"zh-CN": "当前素材库中的所有项目", "en": "All projects in this library"}, "有效期": {"zh-CN": "有效期", "en": "Expires"}, "8 小时": {"zh-CN": "8 小时", "en": "8 hours"}, "24 小时": {"zh-CN": "24 小时", "en": "24 hours"}, "直到撤销": {"zh-CN": "直到撤销", "en": "Until revoked"}, "允许按需打开此工作台": {"zh-CN": "允许按需打开此工作台", "en": "Allow opening this workbench on demand"}, "不允许启动工作台": {"zh-CN": "不允许启动工作台", "en": "Workbench launch not allowed"}, "建立连接": {"zh-CN": "建立连接", "en": "Create connection"}, "查看配置": {"zh-CN": "查看配置", "en": "View configuration"}, "撤销连接": {"zh-CN": "撤销连接", "en": "Revoke connection"}, "只把此配置交给你授权的客户端。它使用当前 Windows 用户的私有连接凭据；不能防御同账户恶意软件。": {"zh-CN": "只把此配置交给你授权的客户端。它使用当前 Windows 用户的私有连接凭据；不能防御同账户恶意软件。", "en": "Give this configuration only to the client you authorize. It uses a private credential for this Windows user; it does not defend against malware running as the same user."}, "此授权不包含自动保存、付费生成或跳过真人确认。": {"zh-CN": "此授权不包含自动保存、付费生成或跳过真人确认。", "en": "This permission does not include automatic saving, paid generation, or bypassing human confirmation."}, "未开启 HTTP 或远程服务；不修改任何客户端的全局配置。": {"zh-CN": "未开启 HTTP 或远程服务；不修改任何客户端的全局配置。", "en": "No HTTP or remote listener is enabled. No client global configuration is changed."}, "只授权你选择的 MCP 客户端": {"zh-CN": "只授权你选择的 MCP 客户端", "en": "Authorize only the MCP client you choose"}, "连接 Agent": {"zh-CN": "连接 Agent", "en": "Connect an Agent"}, "允许连接": {"zh-CN": "允许连接", "en": "Allow connection"}});

Object.assign(messages,{"完整工作台操作":{"zh-CN":"完整工作台操作","en":"Full workbench operations"},"完整操作可执行已授权范围的保存等操作；付费生成仍须真人逐次确认。":{"zh-CN":"完整操作可执行已授权范围的保存等操作；付费生成仍须真人逐次确认。","en":"Full operations include explicit saving within the chosen scope. Each paid generation still requires human confirmation."}});


Object.assign(messages,{"完整操作包含所选项目的素材读取、编辑与明确保存；供应商生成或上传仍须真人确认。":{"zh-CN":"完整操作包含所选项目的素材读取、编辑与明确保存；供应商生成或上传仍须真人确认。","en":"Full operations include media reading, editing and explicit saving in the selected projects. Provider generation or upload still requires human confirmation."}});

Object.assign(messages,{"客户端可按请求读取所选范围的项目内容和素材；请只授权你信任的客户端。":{"zh-CN":"客户端可按请求读取所选范围的项目内容和素材；请只授权你信任的客户端。","en":"On request, the client can read project content and media within the chosen scope. Authorize only clients you trust."}});

Object.assign(messages,{
  "就绪": {
    "zh-CN": "就绪",
    "en": "Ready"
  },
  "正在应用修改…": {
    "zh-CN": "正在应用修改…",
    "en": "Applying changes…"
  },
  "正在准备生成…": {
    "zh-CN": "正在准备生成…",
    "en": "Preparing generation…"
  },
  "正在打开项目…": {
    "zh-CN": "正在打开项目…",
    "en": "Opening project…"
  },
  "正在读取项目…": {
    "zh-CN": "正在读取项目…",
    "en": "Reading project…"
  },
  "正在保存项目…": {
    "zh-CN": "正在保存项目…",
    "en": "Saving project…"
  },
  "正在读取素材…": {
    "zh-CN": "正在读取素材…",
    "en": "Reading media…"
  },
  "正在选择文件…": {
    "zh-CN": "正在选择文件…",
    "en": "Choosing files…"
  },
  "正在合并影片…": {
    "zh-CN": "正在合并影片…",
    "en": "Merging videos…"
  },
  "可导入的文件格式": {
    "zh-CN": "可导入的文件格式",
    "en": "Supported file formats"
  },
  "文件校验详情": {
    "zh-CN": "文件校验详情",
    "en": "File verification details"
  },
  "目前无法打开项目": {
    "zh-CN": "目前无法打开项目",
    "en": "Project unavailable"
  },
  "项目可能仍在另一个工作台中打开。请确认已关闭，再重新打开项目。项目文件已保留。": {
    "zh-CN": "项目可能仍在另一个工作台中打开。请确认已关闭，再重新打开项目。项目文件已保留。",
    "en": "This project may be open in another workbench. Close that window before reopening the project. Your files are preserved."
  },
  "已有完整备份可恢复到新目录，原文件会保留。": {
    "zh-CN": "已有完整备份可恢复到新目录，原文件会保留。",
    "en": "You can restore an existing backup to a new folder. Your original files are preserved."
  },
  "生成服务": {
    "zh-CN": "生成服务",
    "en": "Generation service"
  },
  "可先打开项目。需要生成时，再设置模型连接。": {
    "zh-CN": "可先打开项目。需要生成时，再设置模型连接。",
    "en": "Open a project first. Set up a model connection when you are ready to generate."
  },
  "查看生成设置": {
    "zh-CN": "查看生成设置",
    "en": "Review generation settings"
  },
  "前往生成确认": {
    "zh-CN": "前往生成确认",
    "en": "Continue to generation confirmation"
  },
  "请重新应用当前模型。原设置已保留。": {
    "zh-CN": "请重新应用当前模型。原设置已保留。",
    "en": "Apply the current model again. Your existing settings are preserved."
  },
  "一次最多导入 50 个文件。未导入的文件会逐项显示原因。": {
    "zh-CN": "一次最多导入 50 个文件。未导入的文件会逐项显示原因。",
    "en": "Import up to 50 files per batch. Each unsuccessful file shows a reason."
  },
  "导入成功后，每个文件会在画布上新增一个素材框。": {
    "zh-CN": "导入成功后，每个文件会在画布上新增一个素材框。",
    "en": "Each imported file creates a media card on the canvas."
  },
  "选择本机 Agent 可以访问的项目，再复制连接配置。": {
    "zh-CN": "选择本机 Agent 可以访问的项目，再复制连接配置。",
    "en": "Choose which projects your local agent can access, then copy its connection settings."
  },
  "项。保存项目后会保留此顺序。": {
    "zh-CN": "项。保存项目后会保留此顺序。",
    "en": "selected. Save the project to keep this order."
  },
  "项无法合并。请查看原因或取消勾选。": {
    "zh-CN": "项无法合并。请查看原因或取消勾选。",
    "en": "cannot be merged. Review the reasons or deselect them."
  },
  "添加模型": {
    "zh-CN": "添加模型",
    "en": "Add model"
  },
  "使用模型": {
    "zh-CN": "使用模型",
    "en": "Use a model"
  },
  "API 密钥": {
    "zh-CN": "API 密钥",
    "en": "API keys"
  },
  "编辑原始参数": {
    "zh-CN": "编辑原始参数",
    "en": "Edit raw parameters"
  },
  "原任务编号：": {
    "zh-CN": "原任务编号：",
    "en": "Original task ID: "
  }
});

Object.assign(messages,{"旧任务设置":{"zh-CN":"旧任务设置","en":"Legacy task settings"}});

Object.assign(messages,{"Agent 與目前畫布":{"zh-CN":"Agent 与当前画布","en":"Agent and current canvas"},"Agent 可在本次工作階段依授權讀取、修改目前畫布，包含建立任務或文字框、加入本次提供的圖片、執行可撤銷編輯和提出草稿。明確的執行指令會更新畫布；只請求提案時，草稿會等待確認。項目仍需手動保存。人工操作無需連線。":{"zh-CN":"Agent 可在本次会话中按授权读取和修改当前画布，包括创建任务或文字框、加入本次提供的图片、执行可撤销编辑和提出草稿。明确的执行指令会更新画布；只请求提案时，草稿会等待确认。项目仍需手动保存。手动操作无需连接。","en":"During this session, the Agent can read or edit the current canvas as authorized, including creating task or text cards, placing provided images, making undoable edits and proposing drafts. Execution requests update the canvas directly; proposals wait for confirmation. Save the project manually. Manual work needs no connection."},"準備本次 Agent 協作":{"zh-CN":"准备本次 Agent 协作","en":"Prepare this Agent session"},"已核對 Agent 身分 · 可撤銷編輯／提案":{"zh-CN":"已核对 Agent 身份 · 可撤销编辑或提案","en":"Agent identity verified · Undoable edits or proposals"},"已準備，等待 Agent 連入":{"zh-CN":"已准备，等待 Agent 接入","en":"Prepared; awaiting the Agent"},"尚未連接 Agent":{"zh-CN":"尚未连接 Agent","en":"No Agent connected"},"請 Agent「讀取目前畫布，包括空白狀態」。請使用已設定的協作入口，無需提供素材 ID、重傳影片或設定全域 MCP。":{"zh-CN":"请让 Agent「读取当前画布，包括空白状态」。请使用已配置的协作入口，无需提供素材 ID、重传视频或设置全局 MCP。","en":"Ask the Agent to read the current canvas, including an empty canvas. Use the configured collaboration entry. No media IDs, video reuploads or global MCP setup are needed."},"Agent 連線命令":{"zh-CN":"Agent 连接命令","en":"Agent connection command"},"請由此連線所指定的客戶端執行命令，並通過身分核對。":{"zh-CN":"请由此连接所指定的客户端执行命令，并通过身份验证。","en":"Run the command with the client designated for this connection. Identity verification still applies."},"工程測試客戶端 · 未驗證實際 Agent 連線或使用者驗收":{"zh-CN":"工程测试客户端 · 未验证实际 Agent 连接或用户验收","en":"Engineering test client · Live Agent connection and user acceptance unverified"},"已過期，請 Agent 重讀":{"zh-CN":"已过期，请 Agent 重新读取","en":"Expired; ask the Agent to read again"},"目前畫布 Agent 連線":{"zh-CN":"当前画布 Agent 连接","en":"Current canvas Agent connection"},"正在等待已登記的 Agent；權限和範圍以本機登記為準":{"zh-CN":"正在等待已登记的 Agent；权限和范围以本机登记为准","en":"Waiting for a registered Agent; its local registration determines permissions and scope"}});

Object.assign(messages,{"自定义与本地连接":{"zh-CN":"自定义与本地连接","en":"Custom and local connections"},"连接草稿":{"zh-CN":"连接草稿","en":"Connection drafts"},"保存只记录设置，不会联网或生成。协议尚未适配，草稿不能用于画布任务。请勿填写密钥。":{"zh-CN":"保存只记录设置，不会联网或生成。协议尚未适配，草稿不能用于画布任务。请勿填写密钥。","en":"Saving records the settings without contacting a service or generating anything. These drafts cannot run canvas tasks until their protocol is supported. Leave API keys out."},"连接草稿已保存，真实连接尚未验证。":{"zh-CN":"连接草稿已保存，真实连接尚未验证。","en":"Connection draft saved. The service has not been verified."},"连接类型":{"zh-CN":"连接类型","en":"Connection type"},"未知第三方（HTTPS）":{"zh-CN":"未知第三方（HTTPS）","en":"Unknown third party (HTTPS)"},"本地／自架服务":{"zh-CN":"本地／自架服务","en":"Local / self-hosted service"},"未知":{"zh-CN":"未知","en":"Unknown"},"无需认证":{"zh-CN":"无需认证","en":"No authentication"},"请求头密钥":{"zh-CN":"请求头密钥","en":"Header API key"},"模型显示名称":{"zh-CN":"模型显示名称","en":"Model display name"},"保存连接草稿":{"zh-CN":"保存连接草稿","en":"Save connection draft"},"新建连接草稿":{"zh-CN":"新建连接草稿","en":"New connection draft"},"未知第三方或本地服务可在「自定义与本地连接」保存草稿。真实调用需要对应的协议适配。":{"zh-CN":"未知第三方或本地服务可在「自定义与本地连接」保存草稿。真实调用需要对应的协议适配。","en":"Save unknown third-party or local services in Custom and local connections. Running them requires a supported protocol."}});

Object.assign(messages,{"Stable Diffusion WebUI（本地）": {"zh-CN": "Stable Diffusion WebUI（本地）", "en": "Stable Diffusion WebUI (local)"}, "本地平台": {"zh-CN": "本地平台", "en": "Local services"}, "填写 WebUI 模型清单中的完整标题": {"zh-CN": "填写 WebUI 模型清单中的完整标题", "en": "Enter the exact title from the WebUI checkpoint list"}, "仅支持同机 Stable Diffusion WebUI 文生图。服务须已开启 API 并返回 PNG；首次确认时核对已安装的模型。": {"zh-CN": "仅支持同机 Stable Diffusion WebUI 文生图。服务须已开启 API 并返回 PNG；首次确认时核对已安装的模型。", "en": "Text-to-image on this machine. Enable the WebUI API and use PNG output. The installed checkpoint is checked after confirmation."}, "协议已适配；保存不联网。生成前仍需确认，真实模型未经验证。": {"zh-CN": "协议已适配；保存不联网。生成前仍需确认，真实模型未经验证。", "en": "The protocol is supported. Saving stays offline. Generation requires confirmation. Actual models are unverified."}, "Stable Diffusion 本地生成摘要": {"zh-CN": "Stable Diffusion 本地生成摘要", "en": "Stable Diffusion local generation review"}, "图片将在本机服务生成。下一步仍需本人核对并确认。": {"zh-CN": "图片将在本机服务生成。下一步仍需本人核对并确认。", "en": "The image is generated by the local service. Review and confirm the request to continue."}});

Object.assign(messages,{"本地单次生成确认": {"zh-CN": "本地单次生成确认", "en": "Confirm local generation"}, "确认向本机 Stable Diffusion 提交一次图片任务": {"zh-CN": "确认向本机 Stable Diffusion 提交一次图片任务", "en": "Submit one image task to Stable Diffusion on this computer"}, "\n\n本次只向本机服务发送提示词和设置。超时或结果未知时不会自动重发。": {"zh-CN": "\n\n本次只向本机服务发送提示词和设置。超时或结果未知时不会自动重发。", "en": "\n\nOnly the prompt and settings are sent to the local service. The request is never automatically resent after a timeout or an unknown outcome."}, "本地图片已加入画布，请保存项目。": {"zh-CN": "本地图片已加入画布，请保存项目。", "en": "The local image is on the canvas. Save the project to keep it."}, "本地图片已保存到任务记录，未加入画布。": {"zh-CN": "本地图片已保存到任务记录，未加入画布。", "en": "The local image was saved in the task record. It was not added to the canvas."}, "请核对本机连接、模型及提示词。": {"zh-CN": "请核对本机连接、模型及提示词。", "en": "Review the local connection, model and prompt."}, "宽度（像素）": {"zh-CN": "宽度（像素）", "en": "Width (pixels)"}, "高度（像素）": {"zh-CN": "高度（像素）", "en": "Height (pixels)"}, "步数": {"zh-CN": "步数", "en": "Steps"}, "提示词引导强度": {"zh-CN": "提示词引导强度", "en": "Prompt guidance"}, "随机种子": {"zh-CN": "随机种子", "en": "Seed"}, "SD_CHECKPOINT_MISSING": {"zh-CN": "SD_CHECKPOINT_MISSING", "en": "The selected checkpoint was not found. Copy its full title from the local model list."}, "SD_LOCAL_SERVICE_UNAVAILABLE": {"zh-CN": "SD_LOCAL_SERVICE_UNAVAILABLE", "en": "The local Stable Diffusion service could not be reached."}, "SD_LOCAL_AUTH_UNSUPPORTED": {"zh-CN": "SD_LOCAL_AUTH_UNSUPPORTED", "en": "This connection uses an unauthenticated Stable Diffusion service on this computer."}, "SD_NETWORK_UNKNOWN": {"zh-CN": "SD_NETWORK_UNKNOWN", "en": "The local service did not return a confirmed response."}, "SD_OUTPUT_SCHEMA": {"zh-CN": "SD_OUTPUT_SCHEMA", "en": "The local service returned an unsupported image response."}});

Object.assign(messages,{"SD_CONNECTION_PROTOCOL_FIXED": {"zh-CN": "此连接已绑定本地生成协议。使用其他平台时，请新增连接。", "en": "This connection is bound to the local generation protocol. Add a new connection for a different platform."}});

Object.assign(messages,{"正在读取本机模型…": {"zh-CN": "正在读取本机模型…", "en": "Reading local models…"}, "读取本机模型": {"zh-CN": "读取本机模型", "en": "Read local models"}, "已安装的模型": {"zh-CN": "已安装的模型", "en": "Installed models"}, "选择本机模型…": {"zh-CN": "选择本机模型…", "en": "Select a local model…"}, "服务已连接，但没有可选择的模型。": {"zh-CN": "服务已连接，但没有可选择的模型。", "en": "The service responded. No selectable models were found."}, "只读取模型名称。生成前仍需确认。": {"zh-CN": "只读取模型名称。生成前仍需确认。", "en": "This reads model names only. Generating an image still requires confirmation."}, "SD_RESPONSE_INVALID": {"zh-CN": "SD_RESPONSE_INVALID", "en": "The local service did not return a recognized model list."}});

Object.assign(messages,{"在任务框编辑": {"zh-CN": "在任务框编辑", "en": "Edit in the task card"}, "文字来源": {"zh-CN": "文字来源", "en": "Text sources"}, "关联素材": {"zh-CN": "关联素材", "en": "Linked media"}, "正在等待影片结果": {"zh-CN": "正在等待影片结果", "en": "Waiting for the video result"}, "合并后的提示词": {"zh-CN": "合并后的提示词", "en": "Combined prompt"}, "选择模型后即可设置创作参数。": {"zh-CN": "选择模型后即可设置创作参数。", "en": "Choose a model to see its creation settings."}, "本次只使用提示词": {"zh-CN": "本次只使用提示词", "en": "This request uses the prompt only"}, "服务网址": {"zh-CN": "服务网址", "en": "Service URL"}, "更多连接信息": {"zh-CN": "更多连接信息", "en": "More connection details"}, "草稿已保存，暂不能生成。": {"zh-CN": "草稿已保存，暂不能生成。", "en": "Draft saved. Generation is unavailable for this connection."}});

Object.assign(messages,{"请求路径": {"zh-CN": "请求路径", "en": "Request path"}});
