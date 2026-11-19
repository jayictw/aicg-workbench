[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$ProgramRoot,[string]$OutputFile='')
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
function FullLocal([string]$p){if(!$p -or ![IO.Path]::IsPathRooted($p) -or $p.StartsWith('\\')){throw 'DIAG_PATH'};$p=[IO.Path]::GetFullPath($p);for($q=$p;;$q=[IO.Path]::GetDirectoryName($q)){if([IO.File]::Exists($q) -or [IO.Directory]::Exists($q)){if(([IO.File]::GetAttributes($q)-band[IO.FileAttributes]::ReparsePoint)-ne 0){throw 'DIAG_LINK'}};$parent=[IO.Path]::GetDirectoryName($q);if(!$parent -or $parent -eq $q){break}};return $p}
function Same([string]$a,[string]$b){if(!$a -or !$b -or ![IO.Path]::IsPathRooted($a) -or ![IO.Path]::IsPathRooted($b)){return $false};return [IO.Path]::GetFullPath($a) -ieq [IO.Path]::GetFullPath($b)}
function Json([string]$p){$p=FullLocal $p;$i=Get-Item -LiteralPath $p;if($i.PSIsContainer -or $i.Length -gt 4MB){throw 'DIAG_METADATA'};return [IO.File]::ReadAllText($p)|ConvertFrom-Json}
$hashCache=@{}
function HashFile([string]$p){try{if(!$p){return $null};$p=FullLocal $p;if(!$hashCache.ContainsKey($p)){$stream=[IO.File]::OpenRead($p);$hasher=[Security.Cryptography.SHA256]::Create();try{$hashCache[$p]=-join($hasher.ComputeHash($stream)|ForEach-Object {$_.ToString('x2')})}finally{$stream.Dispose();$hasher.Dispose()}};return $hashCache[$p]}catch{return $null}}
function HashText([string]$s){if(!$s){return $null};$h=[Security.Cryptography.SHA256]::Create();try{return -join($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s.ToLowerInvariant()))|ForEach-Object {$_.ToString('x2')})}finally{$h.Dispose()}}
function VersionText($s){if($s -is [string] -and $s -cmatch '^[0-9][A-Za-z0-9.+_-]{0,79}$'){return $s};return $null}
function BoundedText($s){if($null-eq$s){return $null};$v=([string]$s)-replace '[^\x20-\x7e]','?';return $v.Substring(0,[Math]::Min(80,$v.Length))}
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public static class AicgDiagnosticArgs{[DllImport("shell32.dll",CharSet=CharSet.Unicode)]static extern IntPtr CommandLineToArgvW(string s,out int n);[DllImport("kernel32.dll")]static extern IntPtr LocalFree(IntPtr p);public static string[] Parse(string s){int n;var p=CommandLineToArgvW(s,out n);if(p==IntPtr.Zero)return new string[0];try{var a=new string[n];for(int i=0;i<n;i++)a[i]=Marshal.PtrToStringUni(Marshal.ReadIntPtr(p,i*IntPtr.Size));return a;}finally{LocalFree(p);}}}'
function Proc([int]$processId){try{return Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction Stop}catch{return $null}}
function Observation($p,$runtime,$pins){
 if(!$p){return $null};$created=$null;try{$created=([DateTimeOffset]$p.CreationDate).ToUnixTimeMilliseconds()}catch{}
 $version=$null;try{$version=[Diagnostics.FileVersionInfo]::GetVersionInfo($p.ExecutablePath)}catch{}
 $digest=HashFile $p.ExecutablePath;$argv=@();try{$argv=[AicgDiagnosticArgs]::Parse([string]$p.CommandLine)}catch{}
 return [ordered]@{pid=[int]$p.ProcessId;parentPid=[int]$p.ParentProcessId;createdAtMs=$created;sessionId=[int]$p.SessionId;executableName=BoundedText $p.Name;executableSha256=$digest;executablePathSha256=HashText $p.ExecutablePath;fileVersion=VersionText $version.FileVersion;productVersion=VersionText $version.ProductVersion;matchesConfiguredNodePath=(Same $p.ExecutablePath $runtime.node);matchesConfiguredNodeHash=([bool]$digest -and $digest -ceq $pins.nodeSha256);matchesConfiguredCodexPath=(Same $p.ExecutablePath $runtime.codexCli);matchesConfiguredCodexHash=([bool]$digest -and $digest -ceq $runtime.codexSha256);appServerArgumentObserved=(@($argv|Where-Object {$_ -ceq 'app-server'}).Count -gt 0)}
}
try{
 $ProgramRoot=FullLocal $ProgramRoot;$install=Json (Join-Path $ProgramRoot '.aicg-install.json')
 if($install.version-ne 1 -or $install.product-cne 'AICG-P4-TEST' -or !(Same $install.programRoot $ProgramRoot)){throw 'DIAG_INSTALLATION'}
 $runtime=Json (Join-Path $ProgramRoot 'desktop/mcp/external-runtime.json');$pins=Json (Join-Path $ProgramRoot 'desktop/mcp/terminal-pins.json');$entry=Join-Path $ProgramRoot 'tools/connect-native-codex.cjs';$entryHash=HashFile $entry
 $entryProof=$install.files.PSObject.Properties['tools/connect-native-codex.cjs'];$frontends=@();$cimAvailable=$true
 try{$nodes=@(Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='electron.exe'" -ErrorAction Stop)}catch{$nodes=@();$cimAvailable=$false}
 foreach($n in $nodes){
  $argv=@();try{$argv=[AicgDiagnosticArgs]::Parse([string]$n.CommandLine)}catch{continue}
  if($argv.Count-lt 2 -or !(Same $argv[0] $n.ExecutablePath) -or !(Same $argv[1] $entry)){continue}
  $chain=@();$at=$n;$seen=@{}
  for($i=0;$i-lt 6 -and $at;$i++){if($seen.ContainsKey([int]$at.ProcessId)){break};$seen[[int]$at.ProcessId]=$true;$chain+=,(Observation $at $runtime $pins);$at=Proc ([int]$at.ParentProcessId)}
  $frontends+=,[ordered]@{entryArgumentCount=$argv.Count;entryMatchesConfiguredScript=(Same $pins.nativeScript $entry);chain=$chain;note='OS observations of a matching stdio entry, not a verified/authorized client grant'}
 }
 $history=@();$data=FullLocal $install.dataRoot
 $active=$data;$coverage=[ordered]@{activeCopy='home';activeCanvas='no-public-marker';boundedTailBytes=262144}
  $copyMarker=Join-Path $data 'active-copy.json'
  if([IO.File]::Exists($copyMarker)){
   try{if((Get-Item -LiteralPath (FullLocal $copyMarker)).Length-gt 1024){throw 'DIAG_COPY_MARKER'};$copy=Json $copyMarker;if($copy.version-ne 1 -or @($copy.PSObject.Properties.Name|Where-Object {$_ -notin @('version','copyId')}).Count -or $copy.copyId-cnotmatch '^copy-[a-f0-9-]{36}$'){throw 'DIAG_COPY_MARKER'};$active=FullLocal (Join-Path $data ('restored/'+$copy.copyId));if(![IO.Directory]::Exists($active)){throw 'DIAG_COPY_MARKER'};$coverage.activeCopy='resolved'}catch{$active=$null;$coverage.activeCopy='unknown-invalid-or-unavailable'}
  }
  $locations=@((Join-Path $data 'codex-app-evidence/external/events.jsonl'),(Join-Path $data 'codex-evidence/external/events.jsonl'))
  if($active){
   $locations+=Join-Path $active 'codex-app-evidence/external/events.jsonl'
   $canvasMarker=Join-Path $ProgramRoot 'runtime/snapshot-active.json'
   if([IO.File]::Exists($canvasMarker)){
    try{if((Get-Item -LiteralPath (FullLocal $canvasMarker)).Length-gt 4096){throw 'DIAG_CANVAS_MARKER'};$marker=Json $canvasMarker;if($marker.version-notin @(1,2) -or $marker.projectId-cnotmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,159}$'){throw 'DIAG_CANVAS_MARKER'};$locations+=FullLocal (Join-Path $active ('runtime/'+$marker.projectId+'/codex-evidence/external/events.jsonl'));$coverage.activeCanvas='resolved'}catch{$coverage.activeCanvas='unknown-invalid-or-unavailable'}
   }
  }
  $locations=@($locations|Select-Object -Unique)
 foreach($file in $locations){
  if(![IO.File]::Exists($file)){continue}
  try{
   [void](FullLocal $file);$stream=[IO.File]::Open($file,[IO.FileMode]::Open,[IO.FileAccess]::Read,([IO.FileShare]::ReadWrite-bor[IO.FileShare]::Delete))
   try{$start=[Math]::Max(0,$stream.Length-262144);[void]$stream.Seek($start,[IO.SeekOrigin]::Begin);$reader=[IO.StreamReader]::new($stream,[Text.Encoding]::UTF8);$lines=$reader.ReadToEnd()-split "`n";if($start-gt 0 -and $lines.Count-gt 1){$lines=$lines[1..($lines.Count-1)]}}finally{$stream.Dispose()}
   foreach($line in $lines){try{$row=$line|ConvertFrom-Json}catch{continue};if($row.type-cne 'identity-or-transport-rejected' -or $row.code-cnotmatch '^MCP_[A-Z0-9_]{1,64}$'){continue};$stage=if($row.stage-cmatch '^[a-z-]{1,40}$'){$row.stage}else{'unknown'};$at=if($row.at-is[int]-or$row.at-is[long]){$row.at}else{$null};$history+=,[ordered]@{at=$at;code=$row.code;stage=$stage}}
  }catch{continue}
 }
 $nativeBridge=($runtime.PSObject.Properties['nativeBridgeVersion'] -and $runtime.nativeBridgeVersion -eq 1);$nativePins=if($nativeBridge){Json (Join-Path $ProgramRoot 'desktop/mcp/native-bridge-pins.json')}else{$null};$bridgeHash=HashFile (Join-Path $ProgramRoot 'tools/AICG-MCP.exe');
 $result=[ordered]@{diagnosticVersion=2;transport=if($nativeBridge){'application-owned-stdio'}else{'legacy-script-stdio'};externalNodeOrPS7Required=(!$nativeBridge);ownBridgeIntegrity=if($nativeBridge){[bool]$bridgeHash -and $bridgeHash -ceq $nativePins.files.'tools/AICG-MCP.exe'}else{$null};observationOnly=$true;grantChanged=$false;configurationChanged=$false;installationRootSha256=(HashText $ProgramRoot);sourceFingerprint=if($install.sourceFingerprint-cmatch '^[a-f0-9]{64}$'){$install.sourceFingerprint}else{$null};configuredCodexVersion=(VersionText $runtime.codexVersion);configuredCodexSha256=if($runtime.codexSha256-cmatch '^[a-f0-9]{64}$'){$runtime.codexSha256}else{$null};entryIntegrity=@{matchesManifest=([bool]$entryHash-and[bool]$entryProof-and$entryHash-ceq$entryProof.Value);matchesTerminalPin=([bool]$entryHash-and$entryHash-ceq$pins.nativeScriptSha256)};cimAvailable=$cimAvailable;logCoverage=$coverage;frontends=@($frontends);recentRejections=@($history|Select-Object -Last 16);limitations=@('No raw command line, usernames, absolute process paths, secrets or global MCP/account files are included.','No matching frontend is not proof of a wrong entry; it may be stopped, use another configured path, or be unavailable to CIM.','Only last bounded rejection observations are reported; they do not prove which operation is current.','Different path and different hash are separate facts; no safety policy is changed by this report.')}
 if(!$OutputFile){$dir=Join-Path $ProgramRoot 'runtime/diagnostics';[void](FullLocal $dir);[void][IO.Directory]::CreateDirectory($dir);$OutputFile=Join-Path $dir ('connection-diagnostics-'+[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfff')+'.json')}
 $OutputFile=FullLocal $OutputFile;$parent=[IO.Path]::GetDirectoryName($OutputFile);if(![IO.Directory]::Exists($parent)){throw 'DIAG_OUTPUT_PARENT'}
 $bytes=[Text.UTF8Encoding]::new($false).GetBytes(($result|ConvertTo-Json -Depth 12));$out=[IO.File]::Open($OutputFile,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);try{$out.Write($bytes,0,$bytes.Length);$out.Flush($true)}finally{$out.Dispose()}
 [Console]::WriteLine([Text.Encoding]::UTF8.GetString($bytes))
}catch{[Console]::Error.WriteLine('CONNECTION_DIAGNOSTIC_FAILED');exit 2}
