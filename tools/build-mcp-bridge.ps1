param([string]$Compiler=(Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'))
$ErrorActionPreference='Stop'
# Use this edition's modules when launched from PowerShell 7.
$env:PSModulePath=Join-Path $PSHOME 'Modules'
# Build the application-owned managed bridge; never downloads a compiler/runtime.
& $Compiler /nologo /target:exe /platform:x64 /optimize+ /r:System.Management.dll /r:System.Web.Extensions.dll /r:System.Security.dll /out:"$PSScriptRoot\AICG-MCP.exe" "$PSScriptRoot\AicgMcpBridge.cs"
if($LASTEXITCODE -ne 0){throw 'MCP_BRIDGE_BUILD_FAILED'}
Get-FileHash -LiteralPath "$PSScriptRoot\AICG-MCP.exe" -Algorithm SHA256
