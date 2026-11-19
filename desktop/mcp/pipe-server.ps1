. "$PSScriptRoot/pipe-common.ps1"
$pipe=$null
$stage='policy'
try {
 $policy=[AcsPipeNative]::Line([Console]::In,12000) | ConvertFrom-Json
 if($policy.pipeName -notmatch '^aicg-c3-[a-f0-9-]{36}$'){throw 'MCP_PIPE_POLICY'}
 $stage='parent-process'
 $self=Proc $PID
 if([int]$self.ParentProcessId -ne [int]$policy.mainPid){throw 'MCP_PIPE_POLICY'}
 $parent=Proc $self.ParentProcessId
 $stage='host-executable'
 if(!(SamePath $parent.ExecutablePath $policy.mainExe)){throw 'MCP_HOST_EXECUTABLE_MISMATCH'}
 $stage='host-entry'
 if(!(Marker $parent.CommandLine $policy.mainMarker)){throw 'MCP_HOST_ENTRY_MISMATCH'}
 if($policy.hostInstance){if([int]$parent.ProcessId -ne [int]$policy.hostInstance.pid -or ([DateTimeOffset]$parent.CreationDate).ToUnixTimeMilliseconds() -ne $policy.hostInstance.createdAtMs -or (Get-FileHash -LiteralPath $parent.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.hostInstance.exeSha256){throw 'MCP_HOST_IDENTITY'}}
 [AcsPipeNative]::WatchParent([int]$policy.mainPid)
 $stage='pipe-create'
 $options=[IO.Pipes.PipeOptions]::CurrentUserOnly -bor [IO.Pipes.PipeOptions]::FirstPipeInstance
 $pipe=[IO.Pipes.NamedPipeServerStream]::new($policy.pipeName,[IO.Pipes.PipeDirection]::InOut,1,[IO.Pipes.PipeTransmissionMode]::Byte,$options,65536,65536)
 Emit @{type='ready';serverPid=$PID}
 $pipe.WaitForConnection()
 $stage='peer-pid'
 [uint32]$peerId=0
 if(![AcsPipeNative]::GetNamedPipeClientProcessId($pipe.SafePipeHandle,[ref]$peerId) -or $peerId -eq 0){throw 'MCP_PEER_IDENTITY'}
 $stage='peer-script'
 $peer=Proc $peerId
 if(!(SamePath $peer.ExecutablePath $policy.powershell) -or !(FixedScript $peer.CommandLine $policy.clientScript @('-InvitationId',$policy.invitationId))){throw 'MCP_PEER_IDENTITY'}
 $stage='adapter'
 $adapter=Proc $peer.ParentProcessId
 $a=[AcsPipeNative]::Args($adapter.CommandLine)
 if(!(SamePath $adapter.ExecutablePath $policy.node) -or $a.Count -ne 3 -or !(SamePath $a[1] $policy.adapterScript) -or $a[2] -cne $policy.invitationId){throw 'MCP_PEER_IDENTITY'}
 $stage='client-binary'
 $client=Proc $adapter.ParentProcessId
 if(!(SamePath $client.ExecutablePath $policy.clientExe) -or (Get-FileHash -LiteralPath $client.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $policy.clientSha256){throw 'MCP_PEER_IDENTITY'}
 $registeredClient=$null;$nativeStdio=$false
 if($policy.clientMode -eq 'registered-stdio'){
  $stage='registered-native-entry';$c=[AcsPipeNative]::Args($client.CommandLine)
  $nativeMatch=@($policy.nativeScripts | Where-Object {$c.Count -eq 2 -and (SamePath $c[1] $_.path) -and (Get-FileHash -LiteralPath $_.path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $_.sha256})
  if($nativeMatch.Count-ne 1){throw 'MCP_PEER_IDENTITY'}
  if((Get-FileHash -LiteralPath "$PSScriptRoot/client-identity.ps1" -Algorithm SHA256).Hash.ToLowerInvariant()-cne $policy.clientIdentitySha256){throw 'MCP_CLIENT_HELPER_CHANGED'}
  . "$PSScriptRoot/client-identity.ps1"
  $stage='registered-agent';$agent=Proc $client.ParentProcessId
  $registeredClient=RegisteredMcpClient $agent $client $policy.registryFile
  $codex=$agent;$nativeStdio=$true;$newOpenIntent=$true
 } elseif($policy.clientMode -eq 'codex-command-bridge'){
  $stage='bridge-instance'
  $c=[AcsPipeNative]::Args($client.CommandLine)
  if([int]$client.ProcessId -ne [int]$policy.clientPid -or ([DateTimeOffset]$client.CreationDate).ToUnixTimeMilliseconds() -ne $policy.bridgeCreatedAtMs -or $c.Count -ne 2 -or !(SamePath $c[1] $policy.bridgeScript) -or (Get-FileHash -LiteralPath $policy.bridgeScript -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.bridgeScriptSha256){throw 'MCP_PEER_IDENTITY'}
  $shell=Proc $client.ParentProcessId;$codex=Proc $shell.ParentProcessId
  if(([DateTimeOffset]$shell.CreationDate).ToUnixTimeMilliseconds() -ne $policy.shellCreatedAtMs -or ([DateTimeOffset]$codex.CreationDate).ToUnixTimeMilliseconds() -ne $policy.codexCreatedAtMs -or [int]$shell.ProcessId -ne [int]$policy.shellPid -or !(SamePath $shell.ExecutablePath $policy.powershell) -or [int]$codex.ProcessId -ne [int]$policy.codexPid -or !(SamePath $codex.ExecutablePath $policy.codexExe) -or (Get-FileHash -LiteralPath $codex.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.codexSha256){throw 'MCP_PEER_IDENTITY'}
 } elseif($policy.clientMode -eq 'codex-terminal-bridge'){
  $c=[AcsPipeNative]::Args($client.CommandLine)
  $nativeStdio=$false
  if($policy.nativeScript -and $c.Count -eq 2 -and (SamePath $c[1] $policy.nativeScript)){
    $stage='real-codex-native-stdio'
    if((Get-FileHash -LiteralPath $policy.nativeScript -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.nativeScriptSha256){throw 'MCP_PEER_IDENTITY'}
    $codex=Proc $client.ParentProcessId
    if(!(SamePath $codex.ExecutablePath $policy.codexExe) -or (Get-FileHash -LiteralPath $codex.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.codexSha256){throw 'MCP_PEER_IDENTITY'}
    $nativeStdio=$true
  } else {
    $stage='real-codex-terminal'
    if(($c.Count -ne 2 -and !($c.Count -eq 3 -and $c[2] -ceq '--open-intent')) -or !(SamePath $c[1] $policy.bridgeScript) -or (Get-FileHash -LiteralPath $policy.bridgeScript -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.bridgeScriptSha256){throw 'MCP_PEER_IDENTITY'}
    $shell=Proc $client.ParentProcessId;$codex=Proc $shell.ParentProcessId
    if(!(SamePath $shell.ExecutablePath $policy.powershell) -or (Get-FileHash -LiteralPath $shell.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.powershellSha256 -or !(SamePath $codex.ExecutablePath $policy.codexExe) -or (Get-FileHash -LiteralPath $codex.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $policy.codexSha256){throw 'MCP_PEER_IDENTITY'}
  }
  $newOpenIntent=$nativeStdio -or ($c.Count -eq 3 -and $c[2] -ceq '--open-intent')
 } elseif($policy.clientMode){throw 'MCP_PEER_IDENTITY'}
 if($policy.expectedFrontend){
  $stage='expected-native-frontend'
  if(!$nativeStdio -or [int]$client.ProcessId -ne [int]$policy.expectedFrontend.pid -or ([DateTimeOffset]$client.CreationDate).ToUnixTimeMilliseconds() -ne $policy.expectedFrontend.createdAtMs){throw 'MCP_EXPECTED_FRONTEND'}
 }
 if($policy.resumeCodexPid){
  $stage='resume-same-codex'
  if($policy.clientMode -notin @('codex-terminal-bridge','registered-stdio') -or (([int]$codex.ProcessId -ne [int]$policy.resumeCodexPid -or ([DateTimeOffset]$codex.CreationDate).ToUnixTimeMilliseconds() -ne $policy.resumeCodexCreatedAtMs) -and !$newOpenIntent)){throw 'MCP_RECOVERY_IDENTITY'}
 }
if($policy.requiresOpenIntent -and !($policy.clientMode -in @('codex-terminal-bridge','registered-stdio') -and $newOpenIntent)){throw 'MCP_FRESH_OPEN_REQUIRED'}
 if($policy.clientMode -in @('codex-terminal-bridge','registered-stdio')){[AcsPipeNative]::WatchIdentity([int]$codex.ProcessId,([DateTimeOffset]$codex.CreationDate).ToUnixTimeMilliseconds())}
 if($policy.testMode -and !(Marker $client.CommandLine $policy.testMarker)){throw 'MCP_PEER_IDENTITY'}
Emit @{type='peer';newOpenIntent=($policy.clientMode -in @('codex-terminal-bridge','registered-stdio') -and $newOpenIntent);clientTransport=if($nativeStdio){'native-stdio'}else{'terminal-bridge'};adapterPid=[int]$adapter.ProcessId;clientPid=[int]$client.ProcessId;clientCreatedAtMs=([DateTimeOffset]$client.CreationDate).ToUnixTimeMilliseconds();clientSha256=$policy.clientSha256;testMode=[bool]$policy.testMode;registrationId=if($registeredClient){$registeredClient.id}else{$null};registrationRevision=if($registeredClient){[long]$registeredClient.revision}else{0};agentPid=if($registeredClient){[int]$agent.ProcessId}else{0};agentCreatedAtMs=if($registeredClient){([DateTimeOffset]$agent.CreationDate).ToUnixTimeMilliseconds()}else{0};agentSha256=if($registeredClient){$registeredClient.sha256}else{$null};codexPid=if($policy.clientMode -in @('codex-terminal-bridge','registered-stdio')){[int]$codex.ProcessId}else{0};codexCreatedAtMs=if($policy.clientMode -in @('codex-terminal-bridge','registered-stdio')){([DateTimeOffset]$codex.CreationDate).ToUnixTimeMilliseconds()}else{0}}
 $ack=[AcsPipeNative]::Line([Console]::In,1000)|ConvertFrom-Json
 if($ack.type -ne 'accept'){throw 'MCP_PEER_IDENTITY'}
 $reader=[IO.StreamReader]::new($pipe,[Text.UTF8Encoding]::new($false,$true),$false,4096,$true)
 $writer=[IO.StreamWriter]::new($pipe,[Text.UTF8Encoding]::new($false),4096,$true);$writer.AutoFlush=$true
 $writer.WriteLine('{"type":"connected"}')
 while($pipe.IsConnected){
  $line=[AcsPipeNative]::Line($reader,20000);if($null -eq $line){break}
  $request=$line|ConvertFrom-Json
  if($request.type -ne 'query' -or $request.seq -isnot [long] -and $request.seq -isnot [int] -or $request.seq -lt 1){throw 'MCP_PIPE_FRAME'}
  if($policy.clientMode -in @('codex-terminal-bridge','registered-stdio') -and ![AcsPipeNative]::PeerAlive()){Emit @{type='peer-exited'};break}
  Emit @{type='query';seq=$request.seq;name=$request.name;args=$request.args}
  $response=[AcsPipeNative]::Line([Console]::In,65536);if($null -eq $response){break}
  $writer.WriteLine($response)
 }
 Emit @{type='disconnected'}
} catch { $code=if($_.Exception.Message -match '^MCP_[A-Z_]{1,60}$'){$_.Exception.Message}else{'MCP_TRANSPORT_FAILED'};Emit @{type='rejected';code=$code;stage=$stage}; exit 2 } finally { if($pipe){$pipe.Dispose()} }
