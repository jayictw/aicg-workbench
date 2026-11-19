param([Parameter(Mandatory=$true)][int]$AppProcessId)
. "$PSScriptRoot/pipe-common.ps1"
try {
 $pins=Get-Content -LiteralPath "$PSScriptRoot/codex-open-pins.json" -Raw|ConvertFrom-Json
 $self=Proc $PID
 if([int]$self.ParentProcessId -ne $AppProcessId){throw 'MCP_LAUNCH_IDENTITY'}
 $hostApp=Proc $AppProcessId
 $a=[AcsPipeNative]::Args($hostApp.CommandLine)
 if(!(SamePath $hostApp.ExecutablePath $pins.electron) -or $a.Count -ne 3 -or !(SamePath $a[1] $pins.main) -or $a[2] -notmatch '^--codex-launch=[a-f0-9-]{36}$'){throw 'MCP_LAUNCH_IDENTITY'}
 $bridge=Proc $hostApp.ParentProcessId
 $b=[AcsPipeNative]::Args($bridge.CommandLine)
 if(!(SamePath $bridge.ExecutablePath $pins.node) -or $b.Count -ne 2 -or ![IO.Path]::IsPathFullyQualified($b[1]) -or !(SamePath $b[1] $pins.bridge)){throw 'MCP_LAUNCH_IDENTITY'}
 $shell=Proc $bridge.ParentProcessId
 $codex=Proc $shell.ParentProcessId
 if(!(SamePath $shell.ExecutablePath $pins.powershell) -or !(SamePath $codex.ExecutablePath $pins.codex)){throw 'MCP_LAUNCH_IDENTITY'}
 foreach($pair in @(@($pins.electron,$pins.electronSha256),@($pins.main,$pins.mainSha256),@($pins.node,$pins.nodeSha256),@($pins.bridge,$pins.bridgeSha256),@($pins.powershell,$pins.powershellSha256),@($pins.codex,$pins.codexSha256))){
  if((Get-FileHash -LiteralPath $pair[0] -Algorithm SHA256).Hash.ToLowerInvariant() -cne $pair[1]){throw 'MCP_LAUNCH_BINARY_CHANGED'}
 }
 Emit @{verified=$true;bridgePid=[int]$bridge.ProcessId;bridgeCreatedAtMs=([DateTimeOffset]$bridge.CreationDate).ToUnixTimeMilliseconds();shellCreatedAtMs=([DateTimeOffset]$shell.CreationDate).ToUnixTimeMilliseconds();codexCreatedAtMs=([DateTimeOffset]$codex.CreationDate).ToUnixTimeMilliseconds();bridgeExeSha256=$pins.nodeSha256;shellPid=[int]$shell.ProcessId;codexPid=[int]$codex.ProcessId;codexSha256=$pins.codexSha256}
} catch { Emit @{verified=$false;code=if($_.Exception.Message -match '^MCP_[A-Z_]+$'){$_.Exception.Message}else{'MCP_LAUNCH_IDENTITY'}};exit 2 }
