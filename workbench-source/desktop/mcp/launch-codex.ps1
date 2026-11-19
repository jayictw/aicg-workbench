param([Parameter(Mandatory=$true)][string]$InvitationId,[switch]$VisibleConsole,[string]$LaunchAttemptId)
$reportFile=$null
$stage='validate'
$consoleVisible=$false
function Report-Launch([string]$phase,[string]$code='', $exitCode=$null) {
 if(!$reportFile){return}
 $row=@{attemptId=$LaunchAttemptId;invitationId=$InvitationId;phase=$phase;pid=$PID;visible=$consoleVisible;interactive=(!$([Console]::IsInputRedirected) -and !$([Console]::IsOutputRedirected));code=$code;exitCode=$exitCode;stage=$stage}
 $tmp="$reportFile.$PID.tmp"
 [IO.File]::WriteAllText($tmp,($row|ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))
 Move-Item -LiteralPath $tmp -Destination $reportFile -Force
}
try {
$ErrorActionPreference='Stop'
if($InvitationId -notmatch '^[a-f0-9-]{36}$'){throw 'MCP_INVITATION'}
$cfg=Get-Content -LiteralPath "$PSScriptRoot/../../integration-build.json" -Raw|ConvertFrom-Json
if($LaunchAttemptId){
 if($LaunchAttemptId -notmatch '^[a-f0-9-]{36}$'){throw 'MCP_LAUNCH_ATTEMPT'}
 $reportRoot=Join-Path $cfg.runtimeRoot 'external-launches'
 [IO.Directory]::CreateDirectory($reportRoot)|Out-Null
 $reportFile=Join-Path $reportRoot "$InvitationId-$LaunchAttemptId.json"
}
$runtime=Get-Content -LiteralPath "$PSScriptRoot/external-runtime.json" -Raw|ConvertFrom-Json
$file=Join-Path $cfg.runtimeRoot "external-sessions/$InvitationId.json"
$v=Get-Content -LiteralPath $file -Raw|ConvertFrom-Json
if($v.testMode -or $v.invitationId -ne $InvitationId -or $v.expiresAt -le [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()){throw 'MCP_INVITATION_EXPIRED'}
if((Get-FileHash -LiteralPath $runtime.codexCli -Algorithm SHA256).Hash.ToLowerInvariant() -ne $runtime.codexSha256){throw 'MCP_CODEX_BINARY_CHANGED'}
if(!$VisibleConsole){
 # This supervisor has redirected handles. Only Start-Process creates the interactive child.
 $stage='create-console'
 $args=@('-NoLogo','-NoProfile','-File',('"'+$PSCommandPath+'"'),'-InvitationId',$InvitationId,'-VisibleConsole')
 if($LaunchAttemptId){$args+=@('-LaunchAttemptId',$LaunchAttemptId)}
 # Select the installed Windows console host explicitly; do not change the system default.
 $consoleHost=Join-Path ([Environment]::SystemDirectory) 'conhost.exe'
 $hostArgs='-ForceNoHandoff -- "'+$runtime.powershell+'" '+($args -join ' ')
 $console=Start-Process -FilePath $consoleHost -ArgumentList $hostArgs -WorkingDirectory $cfg.codeRoot -WindowStyle Normal -PassThru
 Write-Output ('{"stage":"console-process-created","pid":'+$console.Id+'}')
 exit 0
}
$stage='interactive-console'
if([Console]::IsInputRedirected -or [Console]::IsOutputRedirected){throw 'MCP_CLI_CONSOLE_UNCONFIRMED'}
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class M9ConsoleWindow {
 [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [StructLayout(LayoutKind.Sequential)] public struct Rect { public int left,top,right,bottom; }
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h,out Rect rect);
}
'@
$consoleHandle=[M9ConsoleWindow]::GetConsoleWindow()
$rect=[M9ConsoleWindow+Rect]::new()
[M9ConsoleWindow]::GetWindowRect($consoleHandle,[ref]$rect)|Out-Null
$consoleVisible=[M9ConsoleWindow]::IsWindowVisible($consoleHandle) -and ($rect.right -gt $rect.left) -and ($rect.bottom -gt $rect.top)
if(!$consoleVisible){throw 'MCP_CLI_CONSOLE_UNCONFIRMED'}
Report-Launch 'console-ready'
# All values below are public process/transport metadata. No token, password or API Key exists.
$cmd=$runtime.node|ConvertTo-Json -Compress
$script=[IO.Path]::GetFullPath("$PSScriptRoot/external-adapter.cjs")|ConvertTo-Json -Compress
$id=$InvitationId|ConvertTo-Json -Compress
$override="mcp_servers={acs_m9_readonly={command=$cmd,args=[$script,$id],startup_timeout_sec=30,tool_timeout_sec=15}}"
$cwd=Join-Path $cfg.runtimeRoot 'codex-readonly-client'
[IO.Directory]::CreateDirectory($cwd)|Out-Null
Write-Host 'M9：独立真实 Codex CLI，R2 QA 临时会话。不会运行 mcp add，不改 config.toml。'
Write-Host '先问：请仅调用 acs_m9_readonly 的 session_info 和 scope_select，确认未授权时不能读取业务资料。'
Write-Host '再由 Owner 在原生 QA 窗口授权，然后问：列出目前授权 QA 工作库中的项目和任务；必须调用 MCP，不读取本地文件。'
Write-Host '提案需 Owner 另行点击允许提出草稿；再调用 change_target_get 和 proposal_*，每个 requestId 只用一次，未知先查 proposal_get。Agent 无套用或保存工具。撤销后问：重新调用同一 MCP 查询验证撤销；不要复述先前的数据。'
Write-Host '如客户端要求新增登录凭证或持久权限，请停止，返回 Owner 审批。退出本 CLI 不影响其他 Codex 会话。'
$initial='仅通过 acs_m9_readonly 实际调用 session_info、scope_select。确认当前未获原生授权时不能读取业务资料。不得读文件、调用 shell、写配置或创建提案。报告结果后等待 Owner 在原生 QA 窗口授权；不要代替 Owner 批准。'
# This visible console supports the interactive TUI; Codex's parent may export TERM=dumb.
# Scope this override to the child session and restore the launcher's environment afterwards.
$stage='start-cli'
Report-Launch 'cli-starting'
$priorTerm=$env:TERM
try {
 $env:TERM='xterm-256color'
 & $runtime.codexCli -c $override --sandbox read-only --ask-for-approval on-request --no-alt-screen -C $cwd $initial
} finally {
 if($null -eq $priorTerm){Remove-Item Env:TERM -ErrorAction SilentlyContinue}else{$env:TERM=$priorTerm}
}

$stage='cli-exit'
Report-Launch 'cli-exited' '' $LASTEXITCODE
} catch {
 $safeCode=if($_.Exception.Message -match '^MCP_[A-Z_]+$'){$_.Exception.Message}else{'MCP_CLI_START_FAILED'}
 try {Report-Launch 'failed' $safeCode} catch {}
 Write-Host "启动未完成：$safeCode。请在 QA 查看连接状态；确认本终端已关闭后，断开并重新准备短效接入。不会自动重试或授权。"
 exit 1
}
