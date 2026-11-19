param([Parameter(Mandatory=$true)][string]$InvitationId)
. "$PSScriptRoot/pipe-common.ps1"
$pipe=$null
try {
 if($InvitationId -notmatch '^[a-f0-9-]{36}$'){throw 'MCP_INVITATION'}
 $self=Proc $PID;[AcsPipeNative]::WatchParent([int]$self.ParentProcessId)
 $cfg=Get-Content -LiteralPath "$PSScriptRoot/../../integration-build.json" -Raw|ConvertFrom-Json
 $file=Join-Path $cfg.runtimeRoot "external-sessions/$InvitationId.json"
 if((Get-Item -LiteralPath $file).Length -gt 8000){throw 'MCP_INVITATION'}
 $v=Get-Content -LiteralPath $file -Raw|ConvertFrom-Json
 if($v.version -ne 1 -or $v.invitationId -ne $InvitationId -or $v.expiresAt -le [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -or $v.pipeName -ne "acs-m9-$InvitationId"){throw 'MCP_INVITATION'}
 if($v.testMode -and $env:M9_EXTERNAL_TEST -ne '1'){throw 'MCP_TEST_TRANSPORT_DISABLED'}
 $pipe=[IO.Pipes.NamedPipeClientStream]::new('.',$v.pipeName,[IO.Pipes.PipeDirection]::InOut,[IO.Pipes.PipeOptions]::CurrentUserOnly)
 $pipe.Connect(5000)
 [uint32]$serverId=0
 if(![AcsPipeNative]::GetNamedPipeServerProcessId($pipe.SafePipeHandle,[ref]$serverId) -or $serverId -ne $v.serverPid){throw 'MCP_SERVER_IDENTITY'}
 $server=Proc $serverId;$parent=Proc $server.ParentProcessId
 $runtime=Get-Content -LiteralPath "$PSScriptRoot/external-runtime.json" -Raw|ConvertFrom-Json
 if(!(SamePath $server.ExecutablePath $runtime.powershell) -or !(FixedScript $server.CommandLine "$PSScriptRoot\pipe-server.ps1") -or $parent.ProcessId -ne $v.mainPid -or !(SamePath $parent.ExecutablePath $v.mainExe) -or !(Marker $parent.CommandLine $v.mainMarker)){throw 'MCP_SERVER_IDENTITY'}
 [AcsPipeNative]::WatchParent([int]$serverId)
 $reader=[IO.StreamReader]::new($pipe,[Text.UTF8Encoding]::new($false,$true),$false,4096,$true)
 $writer=[IO.StreamWriter]::new($pipe,[Text.UTF8Encoding]::new($false),4096,$true);$writer.AutoFlush=$true
 $hello=[AcsPipeNative]::Line($reader,1000)|ConvertFrom-Json;if($hello.type -ne 'connected'){throw 'MCP_SERVER_IDENTITY'};Emit $hello
 while($true){$line=[AcsPipeNative]::Line([Console]::In,20000);if($null -eq $line){break};$writer.WriteLine($line);$reply=[AcsPipeNative]::Line($reader,65536);if($null -eq $reply){break};[Console]::Out.WriteLine($reply);[Console]::Out.Flush()}
} catch { Emit @{type='rejected';code='MCP_CONNECTION_REJECTED'};exit 2 } finally { if($pipe){$pipe.Dispose()} }
