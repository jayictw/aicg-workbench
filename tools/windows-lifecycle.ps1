[CmdletBinding(SupportsShouldProcess=$true)]
param(
 [ValidateSet('Install','Verify','Uninstall')][string]$Action='Install',
 [string]$PackageRoot=$PSScriptRoot,
 [string]$InstallRoot=(Join-Path $env:LOCALAPPDATA 'Programs\AICG Workbench MCP'),
 [string]$DataRoot=(Join-Path $env:LOCALAPPDATA 'AICG Workbench MCP'),
 [string]$CodexPath='',
 [string]$ApprovedClientSha256='',
 [string]$ApprovedClientVersion='',
 [string]$ImageEndpointId='',
 [string]$VideoEndpointId=''
)
$ErrorActionPreference='Stop'
# Use this PowerShell edition's built-in modules; no global environment change.
$env:PSModulePath=Join-Path $PSHOME 'Modules'
function Full([string]$P) {
 if(!$P -or ![IO.Path]::IsPathRooted($P) -or $P.StartsWith('\\')){throw 'LOCAL_ABSOLUTE_ROOT_REQUIRED'}
 $v=[IO.Path]::GetFullPath($P).TrimEnd('\')
 if($v -eq [IO.Path]::GetPathRoot($v).TrimEnd('\')){throw 'VOLUME_ROOT_FORBIDDEN'}
 return $v
}
function Inside([string]$A,[string]$B) { return $B.Equals($A,[StringComparison]::OrdinalIgnoreCase) -or $B.StartsWith($A+'\',[StringComparison]::OrdinalIgnoreCase) }
function Boundary([string]$P) {
 $v=Full $P
 for($p0=$v;$p0;$p0=Split-Path -Parent $p0){
  if(Test-Path -LiteralPath $p0){if((Get-Item -LiteralPath $p0 -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'REPARSE_ROOT_FORBIDDEN'}}
 }
 return $v
}
function Hash([string]$P){$stream=[IO.File]::OpenRead($P);$sha=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose();$stream.Dispose()}}
function ReadJson([string]$P){
 $s=Get-Item -LiteralPath $P -Force
 if($s.PSIsContainer -or ($s.Attributes -band [IO.FileAttributes]::ReparsePoint) -or $s.Length -gt 8MB){throw 'INVALID_METADATA'}
 return [IO.File]::ReadAllText($P).TrimStart([char]0xFEFF)|ConvertFrom-Json
}
# Public deployment policy is derived from the genuine source proof and pinned
# in both this installer and c6-protected-sources. It grants no file authority.
$PortableProtectionSha='993a046ba9bb6d1953864fca8c5b85be5138b2f2250ae2b38422c5334a97860e'
function PathCanonical([string]$P){
 $v=[IO.Path]::GetFullPath($P).TrimEnd([char[]]'\/').ToLowerInvariant()
 if($v.EndsWith(':')){$v+='\'}
 return $v
}
function PathHash([string]$P){$sha=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes((PathCanonical $P))))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}}
function HashProtected([string]$P,$Policy){
 for($q=(PathCanonical $P);$q;){
  if(@($Policy.rootHashes) -contains (PathHash $q)){return $true}
  $parent=[IO.Path]::GetDirectoryName($q);if(!$parent -or $parent -eq $q){break};$q=$parent
 }
 return @($Policy.ancestorHashes) -contains (PathHash $P)
}
function EndpointValue([string]$Value){if(!$Value){return $null};if($Value -cnotmatch '^ep-[A-Za-z0-9][A-Za-z0-9-]{0,124}$'){throw 'ENDPOINT_CONFIGURATION'};return $Value}
function WriteJson([string]$P,$V){[IO.File]::WriteAllText($P,($V|ConvertTo-Json -Depth 60),[Text.UTF8Encoding]::new($false))}
function Walk([string]$Root){
 foreach($item in Get-ChildItem -LiteralPath $Root -Force){
  if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'REPARSE_FILE_FORBIDDEN'}
  if($item.PSIsContainer){Walk $item.FullName}else{$item}
 }
}
function Managed([string]$Root){
 $v=ReadJson (Join-Path $Root '.aicg-install.json')
 if($v.version -ne 1 -or $v.product -ne 'AICG-P4-TEST' -or (Full $v.programRoot) -ine $Root){throw 'UNOWNED_INSTALL_ROOT'}
 return $v
}
function VerifyFiles([string]$Root,$Record){
 $checked=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
 function AssertDirectory([string]$Dir,$Cache){
  if($Cache.Contains($Dir)){return}
  $attributes=[IO.File]::GetAttributes($Dir)
  if(!($attributes -band [IO.FileAttributes]::Directory) -or ($attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'REPARSE_ROOT_FORBIDDEN'}
  $ancestor=[IO.Directory]::GetParent($Dir)
  if($null -ne $ancestor){AssertDirectory $ancestor.FullName $Cache}
  [void]$Cache.Add($Dir)
 }
 foreach($f in $Record.files.PSObject.Properties){
  $p=Full (Join-Path $Root $f.Name)
  if(!(Inside $Root $p) -or $p -eq $Root){throw ('INSTALL_INTEGRITY: '+$f.Name)}
  AssertDirectory ([IO.Path]::GetDirectoryName($p)) $checked
  $attributes=[IO.File]::GetAttributes($p)
  if(($attributes -band [IO.FileAttributes]::Directory) -or ($attributes -band [IO.FileAttributes]::ReparsePoint) -or (Hash $p) -ne $f.Value){throw ('INSTALL_INTEGRITY: '+$f.Name)}
 }
}
function AssertInactive([string]$Root){
 $buildFile=Join-Path $Root 'integration-build.json'
 if(Test-Path -LiteralPath $buildFile){
  $installedBuild=ReadJson $buildFile
  if($installedBuild.PSObject.Properties['externalDependencies']){
   $record=Managed $Root;$helper=Join-Path $Root 'tools/check-dependencies.ps1';$proof=$record.files.PSObject.Properties['tools/check-dependencies.ps1']
   if(!$proof-or (Hash (Boundary $helper))-cne $proof.Value){throw 'DEPENDENCY_GUARD_INTEGRITY'}
   $status=& $helper -ProgramRoot $Root -CheckInactive
   if(!(($status|ConvertFrom-Json).inactive)){throw 'INSTALLATION_HELPER_IDENTITY_UNKNOWN'}
   return
  }
 }
 foreach($p in Get-CimInstance Win32_Process){
  if($p.ExecutablePath -and (Inside $Root ([IO.Path]::GetFullPath($p.ExecutablePath)))){throw 'APPLICATION_RUNNING_CLOSE_NORMALLY'}
 }
}
$InstallRoot=Boundary $InstallRoot
$DataRoot=Boundary $DataRoot
if((Inside $InstallRoot $DataRoot) -or (Inside $DataRoot $InstallRoot)){throw 'PROGRAM_DATA_OVERLAP'}
if($Action -eq 'Verify'){
 $record=Managed $InstallRoot
 VerifyFiles $InstallRoot $record

 @{verified=$true;sourceFingerprint=$record.sourceFingerprint;programRoot=$InstallRoot;dataRoot=$record.dataRoot}|ConvertTo-Json -Compress
 return
}
if($Action -eq 'Uninstall'){
 $record=Managed $InstallRoot
 if((Full $record.dataRoot) -ine $DataRoot){throw 'DATA_ROOT_MISMATCH'}
 AssertInactive $InstallRoot
 foreach($f in Walk $InstallRoot){
  $rel=$f.FullName.Substring($InstallRoot.Length+1).Replace('\','/')
  if($rel -ne '.aicg-install.json' -and !$record.files.PSObject.Properties[$rel] -and !$rel.StartsWith('runtime/')){throw ('UNKNOWN_PROGRAM_FILE: '+$rel)}
 }
 if($PSCmdlet.ShouldProcess($InstallRoot,'Remove managed test program; retain data')){
  if((Boundary $InstallRoot) -ine (Full $record.programRoot) -or (Inside $InstallRoot $DataRoot)){throw 'UNINSTALL_BOUNDARY'}
  Remove-Item -LiteralPath $InstallRoot -Recurse -Force
  @{uninstalled=$true;dataRetained=$DataRoot}|ConvertTo-Json -Compress
 }
 return
}
$PackageRoot=Boundary $PackageRoot
if((Inside $InstallRoot $PackageRoot) -or (Inside $PackageRoot $InstallRoot)){throw 'PACKAGE_INSTALL_OVERLAP'}
$manifest=ReadJson (Join-Path $PackageRoot 'MANIFEST.json')
if($manifest.version -ne 1 -or $manifest.product -ne 'AICG-P4-TEST'){throw 'INVALID_PACKAGE'}
$executionMode=if($manifest.PSObject.Properties['executionMode']){$manifest.executionMode}else{'offline-test'}
if($executionMode -cnotin @('offline-test','user-native')){throw 'EXECUTION_PROFILE'}
if((Hash (Join-Path $PackageRoot 'payload.zip')) -ne $manifest.payloadSha256 -or (Hash $PSCommandPath) -ne $manifest.installerSha256){throw 'PACKAGE_INTEGRITY'}
# A different current Codex client is opt-in by an explicit exact identity tuple.
# This selects one direct parent executable; all OS peer/session/helper checks stay.
$explicitClient=($PSBoundParameters.ContainsKey('ApprovedClientSha256') -or $PSBoundParameters.ContainsKey('ApprovedClientVersion'))
if($explicitClient -and (!$CodexPath -or $ApprovedClientSha256 -cnotmatch '^[a-f0-9]{64}$' -or $ApprovedClientVersion -cnotmatch '^[0-9]+\.[0-9]+\.[0-9]+(?:[-+.][A-Za-z0-9._-]+)?$' -or $ApprovedClientVersion.Length -gt 80)){throw 'CODEX_SELECTION_IDENTITY_REQUIRED'}
if($CodexPath){$CodexPath=Boundary $CodexPath;if([IO.Path]::GetExtension($CodexPath) -ine '.exe'){throw 'CLIENT_SELECTION_EXECUTABLE'}}
$clientSha=if($explicitClient){$ApprovedClientSha256}else{$manifest.codex.sha256}
$clientVersion=if($explicitClient){$ApprovedClientVersion}else{$manifest.codex.version}
if($CodexPath -and (Hash $CodexPath) -cne $clientSha){throw 'CODEX_PIN_MISMATCH'}
$imageEndpoint=EndpointValue $ImageEndpointId
$videoEndpoint=EndpointValue $VideoEndpointId
if($manifest.protectionVersion -eq 3){
 $policyFile=Join-Path $PackageRoot 'PORTABLE-PROTECTION.json'
 if($manifest.protectionSha256 -cne $PortableProtectionSha -or (Hash $policyFile) -cne $PortableProtectionSha){throw 'PORTABLE_PROTECTION_INTEGRITY'}
 $policy=ReadJson $policyFile
 if((@($policy.PSObject.Properties.Name|Sort-Object)-join ',') -cne 'ancestorHashes,kind,rootHashes,version' -or $policy.version -ne 1 -or $policy.kind -cne 'path-sha256/1' -or !@($policy.rootHashes).Count -or !@($policy.ancestorHashes).Count){throw 'PORTABLE_PROTECTION_INTEGRITY'}
 foreach($h in @($policy.rootHashes)+@($policy.ancestorHashes)){if($h -cnotmatch '^[a-f0-9]{64}$'){throw 'PORTABLE_PROTECTION_INTEGRITY'}}
 foreach($dest in @($InstallRoot,$DataRoot)){if(HashProtected $dest $policy){throw 'PROTECTED_ROOT'}}
}else{
 if($ImageEndpointId -or $VideoEndpointId){throw 'ENDPOINT_CONFIGURATION_REQUIRES_PORTABLE_PACKAGE'}
 foreach($protected in @($manifest.protectedRoots)+@($manifest.protectedSources.canvas,$manifest.protectedSources.workbenchTechnical)){
  foreach($p in @($InstallRoot,$DataRoot)){
   $protected=Full $protected
   if((Inside $protected $p) -or (Inside $p $protected)){throw 'PROTECTED_ROOT'}
  }
 }
}
if(Test-Path -LiteralPath $InstallRoot){
 $record=Managed $InstallRoot
 if((Full $record.dataRoot) -ine $DataRoot -or $record.sourceFingerprint -ne $manifest.sourceFingerprint){throw 'EXISTING_INSTALL_UNINSTALL_FIRST'}
 VerifyFiles $InstallRoot $record
 $existingBuild=ReadJson (Join-Path $InstallRoot 'integration-build.json')
 $existingMode=if($existingBuild.deploymentProfile.version -eq 2){$existingBuild.deploymentProfile.executionMode}else{'offline-test'}
 if($existingMode -cne $executionMode){throw 'EXISTING_EXECUTION_PROFILE_UNINSTALL_FIRST'}
 if($CodexPath -or $explicitClient){$existingRuntime=ReadJson (Join-Path $InstallRoot 'desktop/mcp/external-runtime.json');if((Full $existingRuntime.codexCli) -ine $CodexPath -or $existingRuntime.codexSha256 -cne $clientSha -or $existingRuntime.codexVersion -cne $clientVersion){throw 'EXISTING_CLIENT_SELECTION_UNINSTALL_FIRST'}}
 if($PSBoundParameters.ContainsKey('ImageEndpointId') -or $PSBoundParameters.ContainsKey('VideoEndpointId')){
  $existing=ReadJson (Join-Path $InstallRoot 'integration-build.json')
  if(!$existing.endpointConfiguration -or ($PSBoundParameters.ContainsKey('ImageEndpointId') -and $existing.endpointConfiguration.imageEndpointId -cne $imageEndpoint) -or ($PSBoundParameters.ContainsKey('VideoEndpointId') -and $existing.endpointConfiguration.videoEndpointId -cne $videoEndpoint)){throw 'EXISTING_ENDPOINT_CONFIGURATION_UNINSTALL_FIRST'}
 }
 @{alreadyInstalled=$true;sourceFingerprint=$record.sourceFingerprint}|ConvertTo-Json -Compress
 return
}
$dataId=[guid]::NewGuid().ToString()
if(Test-Path -LiteralPath $DataRoot){
 $ownerFile=Join-Path $DataRoot '.aicg-deployment-data.json'
 if(!(Test-Path -LiteralPath $ownerFile)){throw 'UNOWNED_DATA_ROOT'}
 $owner=ReadJson $ownerFile
 if($owner.version -ne 1 -or $owner.product -ne 'AICG-P4-TEST' -or (Full $owner.programRoot) -ine $InstallRoot -or $owner.dataId -notmatch '^[a-f0-9-]{36}$'){throw 'UNOWNED_DATA_ROOT'}
 $dataId=$owner.dataId
}
$bundledCodex=$false
if($manifest.codex.PSObject.Properties['bundledRelativePath']){
 if($manifest.codex.bundledRelativePath -cne 'tools/codex/codex.exe' -or !$manifest.files.PSObject.Properties['tools/codex/codex.exe'] -or $manifest.files.PSObject.Properties['tools/codex/codex.exe'].Value -cne $manifest.codex.sha256){throw 'CODEX_BUNDLE_INVALID'}
 $bundledCodex=(!$CodexPath)
}
if($CodexPath){
 $CodexPath=Boundary $CodexPath
 if((Hash $CodexPath) -cne $clientSha){throw 'CODEX_PIN_MISMATCH'}
}
if(!$PSCmdlet.ShouldProcess($InstallRoot,('Install '+$executionMode+' application with independent data/profile'))){return}
$parent=Split-Path -Parent $InstallRoot
[void][IO.Directory]::CreateDirectory($parent)
$pending=$InstallRoot+'.installing-'+[guid]::NewGuid().ToString()
[void][IO.Directory]::CreateDirectory($pending)
try {
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $archive=[IO.Compression.ZipFile]::OpenRead((Join-Path $PackageRoot 'payload.zip'))
 try{
  $seen=@{};$total=[int64]0
  foreach($entry in $archive.Entries){
   $rel=$entry.FullName
   if(!$rel -or $rel.Contains('\') -or $rel.Contains(':') -or $rel.StartsWith('/') -or @($rel.Split('/')|Where-Object {$_ -eq '' -or $_ -eq '.' -or $_ -eq '..'}).Count -gt 0 -or (($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960){throw 'ZIP_PATH'}
   if($seen.ContainsKey($rel) -or !$manifest.files.PSObject.Properties[$rel] -or !$manifest.sizes.PSObject.Properties[$rel] -or $entry.Length -ne $manifest.sizes.PSObject.Properties[$rel].Value){throw 'ZIP_MANIFEST'}
   $seen[$rel]=$true;$total+=$entry.Length
  }
  if($seen.Count -ne @($manifest.files.PSObject.Properties).Count -or $total -ne $manifest.unpackedBytes){throw 'ZIP_MANIFEST'}
  foreach($entry in $archive.Entries){
   $dest=Full (Join-Path $pending $entry.FullName)
   if(!(Inside $pending $dest)){throw 'ZIP_PATH'}
   [void][IO.Directory]::CreateDirectory((Split-Path -Parent $dest))
   [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$dest,$false)
   if((Hash $dest) -ne $manifest.files.PSObject.Properties[$entry.FullName].Value){throw 'PAYLOAD_FILE_HASH'}
  }
 }finally{$archive.Dispose()}
 $buildFile=Join-Path $pending 'integration-build.json'
 $build=ReadJson $buildFile
 $build.PSObject.Properties.Remove('ownerTestIsolation')
 $build.codeRoot=$InstallRoot;$build.runtimeRoot=Join-Path $InstallRoot 'runtime'
 if($build.formalDataEnabled -cne $false -or $build.engineeringRealAPITestsApproved -cne $false){throw 'EXECUTION_PROFILE'}
 if($executionMode -ceq 'user-native'){
  if($build.offlineOnly -cne $false -or $build.supplierAPIEnabled -cne $true -or $build.distributionExecution.version -ne 1 -or $build.distributionExecution.mode -cne 'user-native' -or $build.distributionExecution.requiresNativeGenerationConfirmation -cne $true){throw 'EXECUTION_PROFILE'}
  $profile=@{version=2;dataRoot=$DataRoot;dataId=$dataId;executionMode='user-native'}
 }else{
  if($build.offlineOnly -cne $true -or $build.supplierAPIEnabled -cne $false){throw 'EXECUTION_PROFILE'}
  $profile=@{version=1;dataRoot=$DataRoot;dataId=$dataId}
 }
 $build|Add-Member -NotePropertyName deploymentProfile -NotePropertyValue $profile -Force
 WriteJson $buildFile $build
 $runtimeFile=Join-Path $pending 'desktop\mcp\external-runtime.json'
 $runtime=ReadJson $runtimeFile
 $runtime.codeRoot=$InstallRoot;$runtime.runtimeRoot=Join-Path $InstallRoot 'runtime'
 $external=($manifest.PSObject.Properties['dependencyProfile'] -and $manifest.dependencyProfile -ceq 'external')
 $runtime.node=if($external){''}else{Join-Path $InstallRoot 'tools\node\node.exe'}
 $runtime.powershell=if($external){''}else{Join-Path $InstallRoot 'tools\powershell\pwsh.exe'}
 if($bundledCodex){$CodexPath=Join-Path $InstallRoot 'tools\codex\codex.exe'}
 $runtime.codexCli=$CodexPath;$runtime.disabled=if($runtime.PSObject.Properties['nativeBridgeVersion'] -and $runtime.nativeBridgeVersion -eq 1){$false}else{(!$CodexPath -or $external)}
 $runtime.codexSha256=$clientSha;$runtime.codexVersion=$clientVersion
 $runtime.pinnedAt=[DateTimeOffset]::UtcNow.ToString('o')
 WriteJson $runtimeFile $runtime
 $pins=ReadJson (Join-Path $pending 'desktop\mcp\terminal-pins.json')
 if(!$external){$pins.nodeSha256=Hash (Join-Path $pending 'tools\node\node.exe')}
 if(!$external){$pins.powershellSha256=Hash (Join-Path $pending 'tools\powershell\pwsh.exe')}
 $pins.bridge=Join-Path $InstallRoot 'tools\connect-codex.cjs'
 $pins.nativeScript=Join-Path $InstallRoot 'tools\connect-native-codex.cjs'
 $pins.neutralScript=Join-Path $InstallRoot 'tools\connect-mcp.cjs'
 WriteJson (Join-Path $pending 'desktop\mcp\terminal-pins.json') $pins
 if($manifest.protectionVersion -eq 3){
  $installedPolicy=Join-Path $pending 'review\PORTABLE-PROTECTION.json'
  if((Hash $installedPolicy) -cne $PortableProtectionSha){throw 'PORTABLE_PROTECTION_INTEGRITY'}
  WriteJson (Join-Path $pending 'review\SOURCE-BEFORE.json') @{version=3;policy=(Join-Path $InstallRoot 'review\PORTABLE-PROTECTION.json');policySha256=$PortableProtectionSha;additionalProtectedRoots=@($InstallRoot)}
  $routesFile=Join-Path $pending 'shared\byteplus-route-contract.json'
  $routes=ReadJson $routesFile
  if($routes.contractVersion -ne 3 -or $routes.provider -cne 'byteplus-modelark' -or $routes.region -cne 'ap-southeast-1' -or @($routes.models).Count -ne 2){throw 'ENDPOINT_CONFIGURATION'}
  foreach($model in $routes.models){
   if($model.canonicalModelId -ceq 'dola-seedream-5-0-pro-260628'){$model.selectorValue=$imageEndpoint}
   elseif($model.canonicalModelId -ceq 'dreamina-seedance-2-5-260628'){$model.selectorValue=$videoEndpoint}
   else{throw 'ENDPOINT_CONFIGURATION'}
   $model.selectorProvenance=if($model.selectorValue){'INSTALLATION_USER_CONFIGURED_NOT_ACCOUNT_VERIFIED'}else{'INSTALLATION_UNCONFIGURED'}
  }
  WriteJson $routesFile $routes
  $imagesFile=Join-Path $pending 'shared\byteplus-image-models.json';$images=ReadJson $imagesFile
  foreach($model in $images.models){if($model.id -ceq 'dola-seedream-5-0-pro-260628'){$model.endpointRoute.id=$imageEndpoint;$model.endpointRoute.declaredProject=$null}}
  WriteJson $imagesFile $images
  $videoFile=Join-Path $pending 'shared\byteplus-video-route.json';$video=ReadJson $videoFile
  if($video.canonicalModel -cne 'dreamina-seedance-2-5-260628' -or $video.region -cne 'ap-southeast-1'){throw 'ENDPOINT_CONFIGURATION'}
  $video.endpointId=$videoEndpoint;$video.source=if($videoEndpoint){'INSTALLATION_USER_CONFIGURED_NOT_ACCOUNT_VERIFIED'}else{'INSTALLATION_UNCONFIGURED'};WriteJson $videoFile $video
  $build|Add-Member -NotePropertyName endpointConfiguration -NotePropertyValue @{version=1;imageEndpointId=$imageEndpoint;videoEndpointId=$videoEndpoint;accountVerified=$false} -Force
  WriteJson $buildFile $build
 }else{
  $origin=Join-Path $pending 'review\SOURCE-ORIGIN.json'
  if((Hash $origin) -ne $manifest.protectionSha256){throw 'SOURCE_ORIGIN'}
  WriteJson (Join-Path $pending 'review\SOURCE-BEFORE.json') @{version=2;sources=$manifest.protectedSources;sourceManifest=(Join-Path $InstallRoot 'review\SOURCE-ORIGIN.json');sourceManifestSha256=$manifest.protectionSha256;additionalProtectedRoots=@($manifest.protectedRoots)+@($InstallRoot)}
 }
 # The saved DTO decoder keeps its original bounded full-decode helper.
 # Only recipient-local tool/scratch paths are rebound; old live roots stay denied.
 $legacyFile=Join-Path $pending 'workbench-source\integration-build.json'
 if(Test-Path -LiteralPath $legacyFile){
  $legacy=ReadJson $legacyFile
  $legacy.codeRoot=Join-Path $InstallRoot 'workbench-source'
  $legacy.runtimeRoot=Join-Path $DataRoot 'legacy-compat'
  $legacy.source='ARCHIVE_COMPATIBILITY_ONLY'
  $legacy.formalWorkRoot=Join-Path $DataRoot 'legacy-disabled\work'
  $legacy.formalBackupRoot=Join-Path $DataRoot 'legacy-disabled\backups'
  $legacyPython=Join-Path $pending 'tools\python\python.exe'
  if(!$external -and (!$manifest.legacyMediaPythonSha256 -or (Hash $legacyPython) -cne $manifest.legacyMediaPythonSha256)){throw 'LEGACY_MEDIA_RUNTIME_INTEGRITY'}
  $legacy|Add-Member -NotePropertyName mediaValidationRuntime -NotePropertyValue @{python=$(if($external){''}else{Join-Path $InstallRoot 'tools\python\python.exe'})} -Force
  if($external){$legacy.mediaValidationRuntime|Add-Member -NotePropertyName external -NotePropertyValue $true -Force}
  WriteJson $legacyFile $legacy
 }
 if($external){Copy-Item -LiteralPath (Join-Path $pending 'tools\check-dependencies.ps1') -Destination (Join-Path $pending 'CHECK-DEPENDENCIES.ps1')}
 Copy-Item -LiteralPath $PSCommandPath -Destination (Join-Path $pending 'UNINSTALL.ps1')
 $startLines=@(
 'param()',
 '$ErrorActionPreference=''Stop''',
 '$installBuild=[IO.File]::ReadAllText((Join-Path $PSScriptRoot ''integration-build.json'')) | ConvertFrom-Json',
 '& (Join-Path $PSScriptRoot ''UNINSTALL.ps1'') -Action Verify -InstallRoot $PSScriptRoot -DataRoot $installBuild.deploymentProfile.dataRoot',
 '& (Join-Path $PSScriptRoot ''desktop\open-workbench.ps1'') -Base $PSScriptRoot'
 )
 [IO.File]::WriteAllText((Join-Path $pending 'START-AICG.ps1'),($startLines -join [Environment]::NewLine),[Text.UTF8Encoding]::new($true))
 [IO.File]::WriteAllText((Join-Path $pending 'START-AICG.cmd'),('@echo off'+[Environment]::NewLine+'powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-AICG.ps1"'+[Environment]::NewLine),[Text.Encoding]::ASCII)
 if($bundledCodex){[IO.File]::WriteAllText((Join-Path $pending 'START-CODEX-MCP.cmd'),('@echo off'+[Environment]::NewLine+'"%~dp0tools\powershell\pwsh.exe" -NoLogo -NoProfile -File "%~dp0tools\colleague-codex.ps1"'+[Environment]::NewLine),[Text.Encoding]::ASCII)}
 $dataLiteral=$DataRoot.Replace("'","''")
 $uninstallLines=@('param()','$ErrorActionPreference=''Stop''',('& (Join-Path $PSScriptRoot ''UNINSTALL.ps1'') -Action Uninstall -InstallRoot $PSScriptRoot -DataRoot '''+$dataLiteral+''''))
 [IO.File]::WriteAllText((Join-Path $pending 'REMOVE-AICG.ps1'),($uninstallLines -join [Environment]::NewLine),[Text.UTF8Encoding]::new($true))
 $files=[ordered]@{}
 foreach($f in Walk $pending){$files[$f.FullName.Substring($pending.Length+1).Replace('\','/')]=Hash $f.FullName}
 WriteJson (Join-Path $pending '.aicg-install.json') @{version=1;product='AICG-P4-TEST';sourceFingerprint=$manifest.sourceFingerprint;programRoot=$InstallRoot;dataRoot=$DataRoot;dataId=$dataId;payloadSha256=$manifest.payloadSha256;files=$files}
 if(!(Test-Path -LiteralPath $DataRoot)){
  [void][IO.Directory]::CreateDirectory($DataRoot)
  WriteJson (Join-Path $DataRoot '.aicg-deployment-data.json') @{version=1;product='AICG-P4-TEST';programRoot=$InstallRoot;dataId=$dataId}
 }
 if((Boundary $InstallRoot) -ine $InstallRoot -or (Test-Path -LiteralPath $InstallRoot)){throw 'INSTALL_TARGET_CHANGED'}
 Move-Item -LiteralPath $pending -Destination $InstallRoot
 @{installed=$true;programRoot=$InstallRoot;dataRoot=$DataRoot;sourceFingerprint=$manifest.sourceFingerprint;codexConfigured=([bool]$CodexPath)}|ConvertTo-Json -Compress
}finally{
 if(Test-Path -LiteralPath $pending){
  if((Boundary $pending) -ine $pending -or (Split-Path -Parent $pending) -ine $parent -or !$pending.StartsWith($InstallRoot+'.installing-',[StringComparison]::OrdinalIgnoreCase)){throw 'PENDING_CLEANUP_BOUNDARY'}
  [void]@(Walk $pending)
  Remove-Item -LiteralPath $pending -Recurse -Force
 }
}
