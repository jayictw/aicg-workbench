param([Parameter(Mandatory=$true)][string]$Root,[Parameter(Mandatory=$true)][string]$ExpectedDigest,[Parameter(Mandatory=$true)][string]$OwnerBase64)
$ErrorActionPreference='Stop';$mutex=$null;$held=$false
function BytesDigest([byte[]]$Bytes){$sha=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}}
function Digest([string]$Text){return BytesDigest ([Text.Encoding]::UTF8.GetBytes($Text))}
try{
 $full=[IO.Path]::GetFullPath($Root);$lock=[IO.Path]::GetFullPath((Join-Path $full 'video-worker.lock'));$history=[IO.Path]::GetFullPath((Join-Path $full 'video-crash-history'))
 if(!$lock.StartsWith($full+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -or !$history.StartsWith($full+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'VIDEO_LOCK_PATH'}
 $name='Local\AICGVideoRecovery-'+(Digest $full.ToLowerInvariant());$mutex=[Threading.Mutex]::new($false,$name)
 try{$held=$mutex.WaitOne(10000)}catch [Threading.AbandonedMutexException]{$held=$true}
 if(!$held){throw 'VIDEO_RECOVERY_BUSY'}
 $info=Get-Item -LiteralPath $lock -Force;if($info.PSIsContainer -or $info.Length -gt 8192 -or ($info.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'VIDEO_LOCK_INVALID'}
 $bytes=[IO.File]::ReadAllBytes($lock);$digest=(BytesDigest $bytes);if($digest -cne $ExpectedDigest){throw 'VIDEO_LOCK_CHANGED'}
 $old=[Text.Encoding]::UTF8.GetString($bytes)|ConvertFrom-Json;if($old.version -ne 2 -or $old.root -cne $full){throw 'VIDEO_LOCK_INVALID'}
 $alive=$null;try{$alive=Get-Process -Id ([int]$old.pid) -ErrorAction Stop}catch{if($_.FullyQualifiedErrorId -notlike 'NoProcessFoundForGivenId*'){throw 'VIDEO_LOCK_OWNER_UNKNOWN'}}
 if($alive -and $alive.StartTime.ToUniversalTime().Ticks -eq ([DateTimeOffset]$old.startedAt).UtcDateTime.Ticks){throw 'VIDEO_LOCK_OWNER_ACTIVE'}
 $ownerBytes=[Convert]::FromBase64String($OwnerBase64);$owner=[Text.Encoding]::UTF8.GetString($ownerBytes)|ConvertFrom-Json
 if($owner.version -ne 2 -or $owner.root -cne $full){throw 'VIDEO_LOCK_INVALID'}
 $current=Get-Process -Id ([int]$owner.pid) -ErrorAction Stop;if($current.StartTime.ToUniversalTime().Ticks -ne ([DateTimeOffset]$owner.startedAt).UtcDateTime.Ticks){throw 'VIDEO_PROCESS_IDENTITY'}
 [IO.Directory]::CreateDirectory($history)|Out-Null;$archive=[IO.Path]::GetFullPath((Join-Path $history ([Guid]::NewGuid().ToString()+'.json')));if(!$archive.StartsWith($history+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'VIDEO_LOCK_PATH'}
 # Under the OS mutex, move only this exact checked lock; never enumerate/delete paths.
 [IO.File]::Move($lock,$archive)
 $stream=[IO.File]::Open($lock,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
 try{$stream.Write($ownerBytes,0,$ownerBytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
 @{ok=$true;digest=(BytesDigest $ownerBytes)}|ConvertTo-Json -Compress
}catch{$code=if($_.Exception.Message -match '^VIDEO_[A-Z_]+$'){$_.Exception.Message}else{'VIDEO_LOCK_RECOVERY_FAILED'};@{ok=$false;code=$code}|ConvertTo-Json -Compress;exit 2}finally{if($held){$mutex.ReleaseMutex()};if($mutex){$mutex.Dispose()}}
