[CmdletBinding(SupportsShouldProcess=$true)]
param([switch]$Configure,[switch]$Recover,[switch]$CheckInactive,[string]$ProgramRoot='',[string]$NodePath='',[string]$PowerShellPath='',[string]$FFmpegPath='',[string]$FFprobePath='',[string]$PythonPath='',[string]$CodexPath='')
$ErrorActionPreference='Stop'
if(!$ProgramRoot){$ProgramRoot=$PSScriptRoot}
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
function Full([string]$p){if(!$p -or ![IO.Path]::IsPathRooted($p) -or $p.StartsWith('\\')){throw 'DEPENDENCY_LOCAL_ABSOLUTE_PATH'};$v=[IO.Path]::GetFullPath($p).TrimEnd('\');for($q=$v;$q;$q=[IO.Path]::GetDirectoryName($q)){if([IO.File]::Exists($q)-or [IO.Directory]::Exists($q)){if([IO.File]::GetAttributes($q)-band [IO.FileAttributes]::ReparsePoint){throw 'DEPENDENCY_LINK'}}};return $v}
function ReadJson([string]$p){$i=Get-Item -LiteralPath (Full $p) -Force;if($i.PSIsContainer -or $i.Length -gt 8MB){throw 'DEPENDENCY_METADATA'};return [IO.File]::ReadAllText($p).TrimStart([char]0xFEFF)|ConvertFrom-Json}
function Hash([string]$p){$stream=[IO.File]::OpenRead((Full $p));$h=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($h.ComputeHash($stream))).Replace('-','').ToLowerInvariant()}finally{$stream.Dispose();$h.Dispose()}}
function WriteJson([string]$p,$v){[IO.File]::WriteAllText($p,($v|ConvertTo-Json -Depth 60),[Text.UTF8Encoding]::new($false))}
function Probe([string]$exe,[string[]]$arguments){
 $si=[Diagnostics.ProcessStartInfo]::new();$si.FileName=$exe;$si.UseShellExecute=$false;$si.CreateNoWindow=$true;$si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
 # All probe arguments below are fixed application strings, never user command text.
 $si.Arguments=($arguments -join ' ');$si.EnvironmentVariables['PSModulePath']=Join-Path (Split-Path -Parent $exe) 'Modules'
 $p=[Diagnostics.Process]::new();$p.StartInfo=$si;try{[void]$p.Start();$out=$p.StandardOutput.ReadToEndAsync();$err=$p.StandardError.ReadToEndAsync();if(!$p.WaitForExit(15000)){$p.Kill();throw 'DEPENDENCY_PROBE_TIMEOUT'};$text=$out.Result+"`n"+$err.Result;if($p.ExitCode-ne 0 -or $text.Length-gt 2MB){throw 'DEPENDENCY_PROBE_FAILED'};return $text.Trim()}finally{$p.Dispose()}
}
function ProgramFiles([string]$root,$record){
 $found=[Collections.Generic.List[string]]::new()
 function Visit([string]$dir){foreach($file in [IO.Directory]::EnumerateFileSystemEntries($dir)){$attributes=[IO.File]::GetAttributes($file);if($attributes-band [IO.FileAttributes]::ReparsePoint){throw 'DEPENDENCY_PROGRAM_LINK'};if($attributes-band [IO.FileAttributes]::Directory){Visit $file}else{$rel=$file.Substring($root.Length+1).Replace('\','/');if($rel-cne '.aicg-install.json'-and !$record.files.PSObject.Properties[$rel]-and !$rel.StartsWith('runtime/')){throw 'UNKNOWN_PROGRAM_FILE'};$found.Add($file)}}}
 Visit $root;return $found.ToArray()
}
function Inspect([string]$name,[string]$value){
 $exe=Full $value;$item=Get-Item -LiteralPath $exe -Force;$expected=@{node='node.exe';powershell='pwsh.exe';ffmpeg='ffmpeg.exe';ffprobe='ffprobe.exe';python='python.exe';codex='codex.exe'}
 if($item.PSIsContainer -or $item.Length-gt 512MB -or $item.Name-ine $expected[$name]){throw 'DEPENDENCY_EXECUTABLE'}
 $before=Hash $exe
 if($name-eq 'powershell'){$v=Probe $exe @('-NoLogo','-NoProfile','-NonInteractive','-Command','"$v=$PSVersionTable.PSVersion;if($v.Major-lt 7-or($v.Major-eq 7-and $v.Minor-lt 4)){exit 2};if(![Enum]::IsDefined([IO.Pipes.PipeOptions],''CurrentUserOnly'')-or ![Enum]::IsDefined([IO.Pipes.PipeOptions],''FirstPipeInstance'')){exit 3};Get-Command Get-CimInstance -ErrorAction Stop|Out-Null;Write-Output $v.ToString()"');$version=$v.Split("`n")[0].Trim()}
 elseif($name-eq 'node'){$v=Probe $exe @('--version');if($v-cnotmatch '^v(\d+)\.(\d+)\.(\d+)$'-or[int]$Matches[1]-lt 22){throw 'DEPENDENCY_NODE_VERSION'};$version=$v.TrimStart('v')}
 elseif($name-eq 'python'){$v=Probe $exe @('-I','-B','--version');if($v-cnotmatch '^Python (3)\.(\d+)\.(\d+)$'-or[int]$Matches[2]-lt 11){throw 'DEPENDENCY_PYTHON_VERSION'};$version=$v.Substring(7)}
 elseif($name-eq 'codex'){$v=Probe $exe @('--version');if($v-cnotmatch '^codex-cli (\d+\.\d+\.\d+(?:[-+.][A-Za-z0-9._-]+)?)$'){throw 'DEPENDENCY_CODEX_VERSION'};$version=$Matches[1]}
 else{$v=Probe $exe @('-version');if($v-cnotmatch ('(?s)^'+$name+' version (\d+[^\s]*)')-or[int](($Matches[1]-split '\.')[0])-lt 6){throw 'DEPENDENCY_FFMPEG_VERSION'};$version=$Matches[1];if($name-eq 'ffmpeg'){$enc=Probe $exe @('-hide_banner','-encoders');if($enc-notmatch '\blibx264\b'-or $enc-notmatch '\baac\b'){throw 'DEPENDENCY_FFMPEG_ENCODERS'};$dec=Probe $exe @('-hide_banner','-decoders');foreach($codec in @('h264','aac','png','mjpeg','webp','mp3','pcm_s16le')){if($dec-notmatch ('\b'+$codec+'\b')){throw 'DEPENDENCY_FFMPEG_DECODERS'}}}}
 if((Hash $exe)-cne $before){throw 'DEPENDENCY_CHANGED_DURING_CHECK'}
 return @{path=$exe;sha256=$before;version=$version}
}
if(!('AicgDependencyArgs'-as[type])){Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public static class AicgDependencyArgs{[DllImport("shell32.dll",CharSet=CharSet.Unicode)]static extern IntPtr CommandLineToArgvW(string s,out int n);[DllImport("kernel32.dll")]static extern IntPtr LocalFree(IntPtr p);public static string[] Parse(string s){int n;var p=CommandLineToArgvW(s,out n);if(p==IntPtr.Zero)return new string[0];try{var a=new string[n];for(int i=0;i<n;i++)a[i]=Marshal.PtrToStringUni(Marshal.ReadIntPtr(p,i*IntPtr.Size));return a;}finally{LocalFree(p);}}}'}
function Inactive([string]$root){
 $nodeEntries=@('tools/connect-native-codex.cjs','tools/connect-codex.cjs','tools/launch-workbench.cjs','desktop/mcp/external-adapter.cjs','desktop/mcp/stdio.cjs','desktop/mcp/control-stdio.cjs')|ForEach-Object {[IO.Path]::GetFullPath((Join-Path $root $_))}
 $psEntries=@('desktop/mcp/pipe-server.ps1','desktop/mcp/pipe-client.ps1','desktop/mcp/verify-native-parent.ps1','desktop/mcp/codex-open-attest.ps1','desktop/open-workbench.ps1','tools/colleague-codex.ps1','START-AICG.ps1','UNINSTALL.ps1','REMOVE-AICG.ps1','CHECK-DEPENDENCIES.ps1','tools/check-dependencies.ps1')|ForEach-Object {[IO.Path]::GetFullPath((Join-Path $root $_))}
 foreach($p in Get-CimInstance Win32_Process){
  if([int]$p.ProcessId-eq $PID){continue}
  if($p.ExecutablePath-and([string]$p.ExecutablePath).StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'APPLICATION_RUNNING_CLOSE_NORMALLY'}
  $processArgs=[AicgDependencyArgs]::Parse([string]$p.CommandLine);if( $processArgs.Count-lt 2-or !$p.ExecutablePath){continue}
  try{if([IO.Path]::GetFullPath( $processArgs[0])-ine [IO.Path]::GetFullPath($p.ExecutablePath)){continue};$name=[IO.Path]::GetFileName($p.ExecutablePath)
   if($name-ieq 'node.exe'-and $processArgs.Count-ge 2-and [IO.Path]::IsPathRooted( $processArgs[1])-and $nodeEntries-icontains [IO.Path]::GetFullPath( $processArgs[1])){throw 'INSTALLATION_HELPER_RUNNING_CLOSE_NORMALLY'}
   if($name-ieq 'pwsh.exe'-or $name-ieq 'powershell.exe'){for($i=1;$i-lt $processArgs.Count-1;$i++){if($processArgs[$i]-imatch '^-(c|command|commandwithargs|ec|encodedcommand)$'){break};if($processArgs[$i]-imatch '^-(f|fi|fil|file)$'){if([IO.Path]::IsPathRooted($processArgs[$i+1])-and $psEntries-icontains [IO.Path]::GetFullPath($processArgs[$i+1])){throw 'INSTALLATION_HELPER_RUNNING_CLOSE_NORMALLY'};break}}}
  }catch{if($_.Exception.Message-ceq 'INSTALLATION_HELPER_RUNNING_CLOSE_NORMALLY'){throw}}
 }
}
try{
 $ProgramRoot=Full $ProgramRoot
 if($Recover){
  if($Configure){throw 'DEPENDENCY_CHOOSE_ONE_ACTION'}
  $lockPath=$ProgramRoot+'.dependency-lock';if(!(Test-Path -LiteralPath $lockPath)-and (Test-Path -LiteralPath ($lockPath+'.recovering'))){$lockPath+='.recovering'};$li=Get-Item -LiteralPath (Full $lockPath);if($li.Length-gt 4096){throw 'DEPENDENCY_RECOVERY_LOCK'};$saved=ReadJson $lockPath
  if($saved.version-ne 1-or $saved.programRoot-cne $ProgramRoot-or $saved.pending-cnotmatch ('^'+[regex]::Escape($ProgramRoot)+'\.dependencies-[a-f0-9-]{36}$')-or $saved.rollback-cnotmatch ('^'+[regex]::Escape($ProgramRoot)+'\.dependency-rollback-[a-f0-9-]{36}$')){throw 'DEPENDENCY_RECOVERY_LOCK'}
  $active=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$saved.pid)
  if($active-and [Math]::Abs(([DateTimeOffset]$active.CreationDate).ToUnixTimeMilliseconds()-[long]$saved.createdAtMs)-lt 2000){throw 'DEPENDENCY_CONFIGURATION_STILL_RUNNING'}
  if(!(Test-Path -LiteralPath $ProgramRoot)){$old=ReadJson (Join-Path (Full $saved.rollback) '.aicg-install.json');if($old.programRoot-cne $ProgramRoot-or $old.dataRoot-cne $saved.dataRoot-or $old.sourceFingerprint-cne $saved.sourceFingerprint){throw 'DEPENDENCY_RECOVERY_IDENTITY'};Move-Item -LiteralPath $saved.rollback -Destination $ProgramRoot}
  Inactive $ProgramRoot
  $record=ReadJson (Join-Path $ProgramRoot '.aicg-install.json');if($record.programRoot-cne $ProgramRoot-or $record.dataRoot-cne $saved.dataRoot-or $record.sourceFingerprint-cne $saved.sourceFingerprint){throw 'DEPENDENCY_RECOVERY_IDENTITY'}
  # Keep the durable lock in place throughout read-only verification. C6 startup
  # rejects this marker; original VerifyFiles itself is not weakened or bypassed.
  $recoveryHandle=[IO.File]::Open($lockPath,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::Read)
  try{$v=& (Join-Path $ProgramRoot 'UNINSTALL.ps1') -Action Verify -InstallRoot $ProgramRoot -DataRoot $record.dataRoot;if(!(($v|ConvertFrom-Json).verified)){throw 'INSTALL_INTEGRITY'}}finally{$recoveryHandle.Dispose()}
  Remove-Item -LiteralPath $lockPath -Force
  @{recovered=$true;dataUnchanged=$true;retainedTransactionCopies=@($saved.pending,$saved.rollback)|Where-Object {Test-Path -LiteralPath $_}}|ConvertTo-Json -Depth 5;return
 }
 $record=ReadJson (Join-Path $ProgramRoot '.aicg-install.json');$build=ReadJson (Join-Path $ProgramRoot 'integration-build.json')
 if($record.product-cne 'AICG-P4-TEST'-or $record.version-ne 1-or (Full $record.programRoot)-ine $ProgramRoot-or $build.externalDependencies.version-ne 1){throw 'DEPENDENCY_MANAGED_INSTALL_REQUIRED'}
 if($CheckInactive){if($Configure-or $Recover){throw 'DEPENDENCY_CHOOSE_ONE_ACTION'};Inactive $ProgramRoot;@{inactive=$true;programRoot=$ProgramRoot}|ConvertTo-Json -Compress;return}
 $verify=& (Join-Path $ProgramRoot 'UNINSTALL.ps1') -Action Verify -InstallRoot $ProgramRoot -DataRoot $record.dataRoot
 if(!(($verify|ConvertFrom-Json).verified)){throw 'INSTALL_INTEGRITY'}
 $provided=@{node=$NodePath;powershell=$PowerShellPath;ffmpeg=$FFmpegPath;ffprobe=$FFprobePath;python=$PythonPath;codex=$CodexPath};$tools=@{};$results=@()
 foreach($name in @('node','powershell','ffmpeg','ffprobe','python','codex')){
  $old=$build.externalDependencies.tools.PSObject.Properties[$name];$value=if($provided[$name]){$provided[$name]}elseif($old){$old.Value.path}else{''}
  if(!$value){$results+=@{name=$name;status='missing';localWorkbenchBlocked=$false};continue}
  try{$entry=Inspect $name $value;if($entry.path.StartsWith($ProgramRoot+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'DEPENDENCY_MUST_BE_OUTSIDE_PROGRAM'};if(!$provided[$name]-and $entry.sha256-cne $old.Value.sha256){throw 'DEPENDENCY_CHANGED'};$tools[$name]=$entry;$results+=@{name=$name;status='compatible';version=$entry.version;sha256=$entry.sha256}}catch{$results+=@{name=$name;status='incompatible';code=$_.Exception.Message};if($Configure){throw}}
 }
 if($tools.ffmpeg-and $tools.ffprobe-and $tools.ffmpeg.version-cne $tools.ffprobe.version){throw 'DEPENDENCY_FFMPEG_PAIR_VERSION'}
 if($Configure){
  Inactive $ProgramRoot
  [void](ProgramFiles $ProgramRoot $record)
  $lock=$ProgramRoot+'.dependency-lock';if(Test-Path -LiteralPath $lock){throw 'DEPENDENCY_CONFIGURATION_LOCKED'}
  $handle=[IO.File]::Open($lock,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
  $pending=$ProgramRoot+'.dependencies-'+[guid]::NewGuid().ToString();$rollback=$ProgramRoot+'.dependency-rollback-'+[guid]::NewGuid().ToString();$committed=$false;$sourceMoved=$false;$originalRestored=$false
  $lockRecord=@{version=1;programRoot=$ProgramRoot;dataRoot=$record.dataRoot;sourceFingerprint=$record.sourceFingerprint;pid=$PID;createdAtMs=([DateTimeOffset][Diagnostics.Process]::GetCurrentProcess().StartTime).ToUnixTimeMilliseconds();pending=$pending;rollback=$rollback};$lockBytes=[Text.Encoding]::UTF8.GetBytes(($lockRecord|ConvertTo-Json -Compress));$handle.Write($lockBytes,0,$lockBytes.Length);$handle.Flush($true)
  try{
   Inactive $ProgramRoot
   if(!$PSCmdlet.ShouldProcess($ProgramRoot,'Bind explicitly selected external executable identities; retain application data')){return}
   [void][IO.Directory]::CreateDirectory($pending)
   $sourceHashes=@{}
   foreach($from in (ProgramFiles $ProgramRoot $record)){$rel=$from.Substring($ProgramRoot.Length+1).Replace('\','/');$sourceHashes[$rel]=Hash $from;if($rel-ceq '.aicg-install.json'){continue};$expected=$record.files.PSObject.Properties[$rel];if($expected-and $sourceHashes[$rel]-cne $expected.Value){throw 'INSTALL_SOURCE_CHANGED'};$dest=Join-Path $pending $rel;[void][IO.Directory]::CreateDirectory((Split-Path -Parent $dest));[IO.File]::Copy($from,$dest,$false);if((Hash $dest)-cne $sourceHashes[$rel]){throw 'INSTALL_SOURCE_CHANGED'}}
   $build.externalDependencies=@{version=1;tools=$tools};WriteJson (Join-Path $pending 'integration-build.json') $build
   $rt=ReadJson (Join-Path $pending 'desktop/mcp/external-runtime.json');$pins=ReadJson (Join-Path $pending 'desktop/mcp/terminal-pins.json')
   $rt.node=if($tools.node){$tools.node.path}else{''};$rt.powershell=if($tools.powershell){$tools.powershell.path}else{''};$rt.codexCli=if($tools.codex){$tools.codex.path}else{''};$rt.disabled=if($rt.PSObject.Properties['mcpClientRegistryVersion']-and $rt.mcpClientRegistryVersion-eq 1){(!$tools.node-or !$tools.powershell)}else{(!$tools.node-or !$tools.powershell-or !$tools.codex)}
   if($tools.codex){$rt.codexSha256=$tools.codex.sha256;$rt.codexVersion=$tools.codex.version}
   if($tools.node){$pins.nodeSha256=$tools.node.sha256};if($tools.powershell){$pins.powershellSha256=$tools.powershell.sha256};if($rt.PSObject.Properties['nativeBridgeVersion'] -and $rt.nativeBridgeVersion -eq 1){$rt.disabled=$false};$rt.pinnedAt=[DateTimeOffset]::UtcNow.ToString('o')
   WriteJson (Join-Path $pending 'desktop/mcp/external-runtime.json') $rt;WriteJson (Join-Path $pending 'desktop/mcp/terminal-pins.json') $pins
   $legacy=ReadJson (Join-Path $pending 'workbench-source/integration-build.json');$legacy.mediaValidationRuntime.python=if($tools.python){$tools.python.path}else{''};WriteJson (Join-Path $pending 'workbench-source/integration-build.json') $legacy
   foreach($f in $record.files.PSObject.Properties){$f.Value=Hash (Join-Path $pending $f.Name)};WriteJson (Join-Path $pending '.aicg-install.json') $record
   Inactive $ProgramRoot
   $finalFiles=@(ProgramFiles $ProgramRoot $record);if($finalFiles.Count-ne $sourceHashes.Count){throw 'INSTALL_SOURCE_CHANGED'};foreach($file in $finalFiles){$rel=$file.Substring($ProgramRoot.Length+1).Replace('\','/');if(!$sourceHashes.ContainsKey($rel)-or (Hash $file)-cne $sourceHashes[$rel]){throw 'INSTALL_SOURCE_CHANGED'}}
   Move-Item -LiteralPath $ProgramRoot -Destination $rollback;$sourceMoved=$true
   try{Move-Item -LiteralPath $pending -Destination $ProgramRoot;$committed=$true}catch{Move-Item -LiteralPath $rollback -Destination $ProgramRoot;$originalRestored=$true;throw}
   # Only the exact verified transaction backup may be removed. DataRoot is separate.
   if((Full $rollback)-ine $rollback-or !(Split-Path -Parent $rollback).Equals((Split-Path -Parent $ProgramRoot),[StringComparison]::OrdinalIgnoreCase)-or !$rollback.StartsWith($ProgramRoot+'.dependency-rollback-',[StringComparison]::OrdinalIgnoreCase)){throw 'DEPENDENCY_CLEANUP_BOUNDARY'}
   try{[void](ProgramFiles $rollback $record);Remove-Item -LiteralPath $rollback -Recurse -Force}catch{Write-Warning ('Committed configuration; prior program copy retained for safety: '+$rollback)}
  }finally{$handle.Dispose();if(($committed-or !$sourceMoved-or $originalRestored)-and (Test-Path -LiteralPath $lock)){Remove-Item -LiteralPath $lock -Force};if(!$committed-and(Test-Path -LiteralPath $pending)){Write-Warning ('Uncommitted verified program copy retained: '+$pending)}}
 }
 @{dependencyCheckVersion=1;configured=[bool]$Configure;localWorkbenchAvailable=$true;mcpReady=([bool]($build.PSObject.Properties['nativeBridgeVersion'] -and $build.nativeBridgeVersion -eq 1)-or ([bool]$tools.node-and[bool]$tools.powershell));codexReady=([bool]$tools.codex-and ([bool]($build.PSObject.Properties['nativeBridgeVersion'] -and $build.nativeBridgeVersion -eq 1)-or ([bool]$tools.node-and[bool]$tools.powershell)));tools=$results;automaticDownload=$false;globalConfigurationChanged=$false}|ConvertTo-Json -Depth 8
}catch{Write-Error ('DEPENDENCY_CHECK: '+$_.Exception.Message);exit 2}
