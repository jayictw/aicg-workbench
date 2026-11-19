. "$PSScriptRoot/pipe-common.ps1"
$pipe=$null
try {
 $policy=[AcsPipeNative]::Line([Console]::In,12000) | ConvertFrom-Json
 if($policy.pipeName -notmatch '^acs-m9-[a-f0-9-]{36}$'){throw 'MCP_PIPE_POLICY'}
 $self=Proc $PID
 if([int]$self.ParentProcessId -ne [int]$policy.mainPid){throw 'MCP_PIPE_POLICY'}
 $parent=Proc $self.ParentProcessId
 if(!(SamePath $parent.ExecutablePath $policy.mainExe) -or !(Marker $parent.CommandLine $policy.mainMarker)){throw 'MCP_PIPE_POLICY'}
 [AcsPipeNative]::WatchParent([int]$policy.mainPid)
 $options=[IO.Pipes.PipeOptions]::CurrentUserOnly -bor [IO.Pipes.PipeOptions]::FirstPipeInstance
 $pipe=[IO.Pipes.NamedPipeServerStream]::new($policy.pipeName,[IO.Pipes.PipeDirection]::InOut,1,[IO.Pipes.PipeTransmissionMode]::Byte,$options,65536,65536)
 Emit @{type='ready';serverPid=$PID}
 $pipe.WaitForConnection()
 [uint32]$peerId=0
 if(![AcsPipeNative]::GetNamedPipeClientProcessId($pipe.SafePipeHandle,[ref]$peerId) -or $peerId -eq 0){throw 'MCP_PEER_IDENTITY'}
 $peer=Proc $peerId
 if(!(SamePath $peer.ExecutablePath $policy.powershell) -or !(FixedScript $peer.CommandLine $policy.clientScript @('-InvitationId',$policy.invitationId))){throw 'MCP_PEER_IDENTITY'}
 $adapter=Proc $peer.ParentProcessId
 $a=[AcsPipeNative]::Args($adapter.CommandLine)
 if(!(SamePath $adapter.ExecutablePath $policy.node) -or $a.Count -ne 3 -or !(SamePath $a[1] $policy.adapterScript) -or $a[2] -cne $policy.invitationId){throw 'MCP_PEER_IDENTITY'}
 $client=Proc $adapter.ParentProcessId
 if(!(SamePath $client.ExecutablePath $policy.clientExe) -or (Get-FileHash -LiteralPath $client.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $policy.clientSha256){throw 'MCP_PEER_IDENTITY'}
 if($policy.testMode -and !(Marker $client.CommandLine $policy.testMarker)){throw 'MCP_PEER_IDENTITY'}
 Emit @{type='peer';adapterPid=[int]$adapter.ProcessId;clientPid=[int]$client.ProcessId;clientSha256=$policy.clientSha256;testMode=[bool]$policy.testMode}
 $ack=[AcsPipeNative]::Line([Console]::In,1000)|ConvertFrom-Json
 if($ack.type -ne 'accept'){throw 'MCP_PEER_IDENTITY'}
 $reader=[IO.StreamReader]::new($pipe,[Text.UTF8Encoding]::new($false,$true),$false,4096,$true)
 $writer=[IO.StreamWriter]::new($pipe,[Text.UTF8Encoding]::new($false),4096,$true);$writer.AutoFlush=$true
 $writer.WriteLine('{"type":"connected"}')
 while($pipe.IsConnected){
  $line=[AcsPipeNative]::Line($reader,20000);if($null -eq $line){break}
  $request=$line|ConvertFrom-Json
  if($request.type -ne 'query' -or $request.seq -isnot [long] -and $request.seq -isnot [int] -or $request.seq -lt 1){throw 'MCP_PIPE_FRAME'}
  Emit @{type='query';seq=$request.seq;name=$request.name;args=$request.args}
  $response=[AcsPipeNative]::Line([Console]::In,65536);if($null -eq $response){break}
  $writer.WriteLine($response)
 }
 Emit @{type='disconnected'}
} catch { Emit @{type='rejected';code='MCP_PEER_OR_TRANSPORT_REJECTED'}; exit 2 } finally { if($pipe){$pipe.Dispose()} }
