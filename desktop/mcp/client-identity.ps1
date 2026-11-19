# Shared by the authenticated pipe and cold-launch attestation. No clientInfo trust.
function ReadMcpClientRegistry([string]$File) {
 if(!$File-or ![IO.Path]::IsPathFullyQualified($File)-or $File.StartsWith('\\')){throw 'MCP_CLIENT_POLICY'}
 for($p0=$File;$p0;$p0=[IO.Path]::GetDirectoryName($p0)) {if(Test-Path -LiteralPath $p0){if((Get-Item -LiteralPath $p0 -Force).Attributes-band [IO.FileAttributes]::ReparsePoint){throw 'MCP_CLIENT_PATH'}}}
 if(!(Test-Path -LiteralPath $File)){throw 'MCP_CLIENT_NOT_REGISTERED'}
 $st=Get-Item -LiteralPath $File -Force;if($st.PSIsContainer-or $st.Length-lt 1-or $st.Length-gt 1MB){throw 'MCP_CLIENT_POLICY'}
 $bytes=[IO.File]::ReadAllBytes($File);$r=[Text.Encoding]::UTF8.GetString($bytes).TrimStart([char]0xFEFF)|ConvertFrom-Json
 if($r.version-ne 1-or $r.revision-lt 0-or $null-eq $r.clients){throw 'MCP_CLIENT_POLICY'}
 return $r
}
function RegisteredMcpClient($Agent,$Frontend,[string]$File) {
 if([int]$Agent.ProcessId-le 0-or [int]$Frontend.ProcessId-le 0-or [int]$Frontend.ParentProcessId-ne [int]$Agent.ProcessId-or [int]$Agent.SessionId-le 0-or [int]$Agent.SessionId-ne [int]$Frontend.SessionId){throw 'MCP_CLIENT_IDENTITY'}
 $r=ReadMcpClientRegistry $File;$registeredMatches=@();$clientArgv=[AcsPipeNative]::Args($Agent.CommandLine)
 $now=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
 foreach($entry in @($r.clients)) {
  if($entry.revoked-or ($null-ne $entry.expiresAt-and $now-ge [long]$entry.expiresAt)){continue}
  if(!(SamePath $Agent.ExecutablePath $entry.executable)-or $entry.sha256-cnotmatch '^[a-f0-9]{64}$'){continue}
  if((Get-FileHash -LiteralPath $Agent.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant()-cne $entry.sha256){continue}
  if($clientArgv.Count-lt 1-or !(SamePath $clientArgv[0] $entry.executable)){continue}
  $hostName=[IO.Path]::GetFileName($entry.executable).ToLowerInvariant()
  if($entry.runtime-ceq 'native') {
   if($null-ne $entry.entry-or $hostName-cin @('node.exe','python.exe','pythonw.exe','pwsh.exe','powershell.exe','cmd.exe','wscript.exe','cscript.exe','rundll32.exe','mshta.exe','dotnet.exe','java.exe','deno.exe','bun.exe')){continue}
  } else {
   if(!$entry.entry-or $entry.entry.sha256-cnotmatch '^[a-f0-9]{64}$'){continue}
   $names=@{node=@('node.exe');python=@('python.exe','pythonw.exe');powershell=@('pwsh.exe','powershell.exe');dotnet=@('dotnet.exe')}
   if(!$names.ContainsKey([string]$entry.runtime)-or $hostName-cnotin $names[$entry.runtime]){continue}
   $prefix=@(if($entry.runtime-ceq 'powershell'){'-NoLogo';'-NoProfile';'-NonInteractive';'-File';$entry.entry.path}else{$entry.entry.path})
   if($clientArgv.Count-lt $prefix.Count+1){continue};$ok=$true
   for($i=0;$i-lt $prefix.Count;$i++){if($i-eq $prefix.Count-1){if(!(SamePath $clientArgv[$i+1] $prefix[$i])){$ok=$false}}elseif($clientArgv[$i+1]-ine $prefix[$i]){$ok=$false}}
   if(!$ok){continue}
   for($q=$entry.entry.path;$q;$q=[IO.Path]::GetDirectoryName($q)){if((Get-Item -LiteralPath $q -Force).Attributes-band [IO.FileAttributes]::ReparsePoint){$ok=$false;break}}
   if(!$ok-or (Get-FileHash -LiteralPath $entry.entry.path -Algorithm SHA256).Hash.ToLowerInvariant()-cne $entry.entry.sha256){continue}
  }
  $registeredMatches+=@($entry)
 }
 if($registeredMatches.Count-ne 1){throw 'MCP_CLIENT_NOT_REGISTERED'}
 return $registeredMatches[0]
}
