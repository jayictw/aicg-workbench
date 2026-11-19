param([Parameter(Mandatory=$true)][string]$Root,[Parameter(Mandatory=$true)][string]$ExpectedDigest,[Parameter(Mandatory=$true)][string]$OwnerBase64)
$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false);$mutex=$null;$held=$false;$archive=$null
function Digest([byte[]]$Bytes){$sha=[Security.Cryptography.SHA256]::Create();try{return [BitConverter]::ToString($sha.ComputeHash($Bytes)).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}}
function Fields($Record){return (($Record.Keys|Sort-Object)-join ',')}
function ValidPid($Value){return ($Value -is [long] -or $Value -is [int]) -and $Value -gt 0 -and $Value -le [int]::MaxValue}
function ValidV2($Record,[string]$Full){return (Fields $Record) -ceq 'exe,instance,pid,root,startedAt,version' -and $Record.version -eq 2 -and $Record.root -ceq $Full -and (ValidPid $Record.pid) -and $Record.startedAt -is [string] -and $Record.startedAt -cmatch '^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{7}Z$' -and $Record.exe -is [string] -and $Record.exe.Length -gt 0 -and $Record.exe.Length -le 4096 -and $Record.instance -cmatch '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$'}
function ProcessOrDead([int]$Id){try{return Get-Process -Id $Id -ErrorAction Stop}catch{if($_.FullyQualifiedErrorId -like 'NoProcessFoundForGivenId*'){return $null};throw 'C5_SESSION_OWNER_UNKNOWN'}}
try{
 $full=[IO.Path]::GetFullPath($Root);$lock=Join-Path $full 'c5-session.lock';$history=Join-Path $full 'c5-session-history'
 if($ExpectedDigest -cnotmatch '^[a-f0-9]{64}$'){throw 'C5_SESSION_LOCK_CHANGED'}
 $name='Local\AICGC5SessionRecovery-'+(Digest ([Text.Encoding]::UTF8.GetBytes($full.ToLowerInvariant())));$mutex=[Threading.Mutex]::new($false,$name)
 try{$held=$mutex.WaitOne(10000)}catch [Threading.AbandonedMutexException]{$held=$true};if(!$held){throw 'C5_SESSION_RECOVERY_BUSY'}
 $info=Get-Item -LiteralPath $lock -Force;if($info.PSIsContainer -or $info.Length -lt 1 -or $info.Length -gt 8192 -or ($info.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'C5_SESSION_LOCK_INVALID'}
 # Check the actual NTFS link count, not a path label or the previous Node observation.
 Add-Type -TypeDefinition @'
using System; using System.IO; using System.Runtime.InteropServices; using Microsoft.Win32.SafeHandles;
public static class AicgC5LockFile {
 [StructLayout(LayoutKind.Sequential)] struct Info { public uint Attr; public System.Runtime.InteropServices.ComTypes.FILETIME Created,Accessed,Written; public uint Volume,SizeHi,SizeLo,Links,IndexHi,IndexLo; }
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetFileInformationByHandle(SafeFileHandle h,out Info info);
 public static uint Links(string path) { using(var f=new FileStream(path,FileMode.Open,FileAccess.Read,FileShare.Read)){Info i;if(!GetFileInformationByHandle(f.SafeFileHandle,out i))throw new IOException("C5_SESSION_LOCK_INVALID");return i.Links;} }
}
'@
 if([AicgC5LockFile]::Links($lock) -ne 1){throw 'C5_SESSION_LOCK_INVALID'}
 $bytes=[IO.File]::ReadAllBytes($lock);if((Digest $bytes) -cne $ExpectedDigest){throw 'C5_SESSION_LOCK_CHANGED'}
 Add-Type -AssemblyName System.Web.Extensions
 $json=[System.Web.Script.Serialization.JavaScriptSerializer]::new();$utf8=[Text.UTF8Encoding]::new($false,$true)
 $old=$json.DeserializeObject($utf8.GetString($bytes))
 $legacy=(Fields $old) -ceq 'pid' -and (ValidPid $old.pid);if(!$legacy -and !(ValidV2 $old $full)){throw 'C5_SESSION_LOCK_INVALID'}
 $alive=ProcessOrDead ([int]$old.pid)
 if($alive -and ($legacy -or $alive.StartTime.ToUniversalTime().Ticks -eq ([DateTimeOffset]$old.startedAt).UtcDateTime.Ticks)){throw 'C5_SESSION_OWNER_ACTIVE'}
 $ownerBytes=[Convert]::FromBase64String($OwnerBase64);$owner=$json.DeserializeObject($utf8.GetString($ownerBytes))
 if(!(ValidV2 $owner $full)){throw 'C5_SESSION_LOCK_INVALID'}
 $current=ProcessOrDead ([int]$owner.pid);if(!$current -or $current.StartTime.ToUniversalTime().Ticks -ne ([DateTimeOffset]$owner.startedAt).UtcDateTime.Ticks -or ![string]::Equals($current.Path,$owner.exe,[StringComparison]::OrdinalIgnoreCase)){throw 'C5_SESSION_PROCESS_IDENTITY'}
 if([IO.Directory]::Exists($history) -and ((Get-Item -LiteralPath $history -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'C5_SESSION_LOCK_PATH'}
 [IO.Directory]::CreateDirectory($history)|Out-Null;$archive=Join-Path $history ([Guid]::NewGuid().ToString()+'.json')
 # Recheck the exact bytes immediately before archiving; cooperating recovery shares this mutex.
 if((Digest ([IO.File]::ReadAllBytes($lock))) -cne $ExpectedDigest){throw 'C5_SESSION_LOCK_CHANGED'}
 [IO.File]::Move($lock,$archive)
 $stream=[IO.File]::Open($lock,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
 try{$stream.Write($ownerBytes,0,$ownerBytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
 @{ok=$true;digest=(Digest $ownerBytes);archivedOriginal=$true}|ConvertTo-Json -Compress
}catch{$code=if($_.Exception.Message -match '^C5_SESSION_[A-Z_]+$'){$_.Exception.Message}else{'C5_SESSION_RECOVERY_FAILED'};@{ok=$false;code=$code;archivedOriginal=($archive -and [IO.File]::Exists($archive))}|ConvertTo-Json -Compress;exit 2}finally{if($held){$mutex.ReleaseMutex()};if($mutex){$mutex.Dispose()}}
