param([string]$NativeScript,[string]$NodeExe,[string]$NodeHash,[string]$CodexExe,[string]$CodexHash,[string]$RegistryFile)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class AicgLocalIdentity {
 [DllImport("shell32.dll", SetLastError=true, CharSet=CharSet.Unicode)] static extern IntPtr CommandLineToArgvW(string s,out int n);
 [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr p);
 [DllImport("wtsapi32.dll", SetLastError=true)] static extern bool WTSQuerySessionInformation(IntPtr server,int id,int info,out IntPtr buffer,out int bytes);
 [DllImport("wtsapi32.dll")] static extern void WTSFreeMemory(IntPtr p);
 public static string[] Args(string s) {int n;var p=CommandLineToArgvW(s,out n);if(p==IntPtr.Zero)throw new Exception("argv");try{var a=new string[n];for(int i=0;i<n;i++)a[i]=Marshal.PtrToStringUni(Marshal.ReadIntPtr(p,i*IntPtr.Size));return a;}finally{LocalFree(p);}}
 public static bool Active(int id){IntPtr p;int bytes;if(!WTSQuerySessionInformation(IntPtr.Zero,id,8,out p,out bytes))return false;try{return bytes>=4&&Marshal.ReadInt32(p)==0;}finally{WTSFreeMemory(p);}}
}
'@
try {
 $self=Get-CimInstance Win32_Process -Filter "ProcessId=$PID"
 $native=Get-CimInstance Win32_Process -Filter "ProcessId=$($self.ParentProcessId)"
 $codex=Get-CimInstance Win32_Process -Filter "ProcessId=$($native.ParentProcessId)"
 if($RegistryFile){
  . "$PSScriptRoot/pipe-common.ps1"
  . "$PSScriptRoot/client-identity.ps1"
  if(!(SamePath $native.ExecutablePath $NodeExe)-or (Get-FileHash -LiteralPath $NodeExe -Algorithm SHA256).Hash.ToLowerInvariant()-cne $NodeHash){throw 'MCP_CLIENT_IDENTITY'}
  $nativeArgs=[AcsPipeNative]::Args($native.CommandLine)
  if($nativeArgs.Count-ne 2-or !(SamePath $nativeArgs[0] $NodeExe)-or !(SamePath $nativeArgs[1] $NativeScript)-or ![AicgLocalIdentity]::Active([int]$native.SessionId)){throw 'MCP_CLIENT_IDENTITY'}
  $registered=RegisteredMcpClient $codex $native $RegistryFile
  if(!$registered.allowLaunch){throw 'MCP_CLIENT_LAUNCH_DENIED'}
  Emit @{verified=$true;registrationId=$registered.id;registrationRevision=[long]$registered.revision;agentSha256=$registered.sha256;agentPid=[int]$codex.ProcessId;agentCreatedAtMs=([DateTimeOffset]$codex.CreationDate).ToUnixTimeMilliseconds()}
  exit 0
 }
 if([IO.Path]::GetFullPath($native.ExecutablePath) -ine [IO.Path]::GetFullPath($NodeExe) -or [IO.Path]::GetFullPath($codex.ExecutablePath) -ine [IO.Path]::GetFullPath($CodexExe)){throw 'identity'}
 if((Get-FileHash -LiteralPath $NodeExe -Algorithm SHA256).Hash.ToLowerInvariant() -cne $NodeHash -or (Get-FileHash -LiteralPath $CodexExe -Algorithm SHA256).Hash.ToLowerInvariant() -cne $CodexHash){throw 'binary'}
 if([int]$native.SessionId -le 0 -or [int]$native.SessionId -ne [int]$codex.SessionId -or ![AicgLocalIdentity]::Active([int]$native.SessionId)){throw 'interactive-session'}
 $argv=[AicgLocalIdentity]::Args($native.CommandLine)
 if($argv.Count -ne 2 -or [IO.Path]::GetFullPath($argv[0]) -ine [IO.Path]::GetFullPath($NodeExe) -or [IO.Path]::GetFullPath($argv[1]) -ine [IO.Path]::GetFullPath($NativeScript)){throw 'entry'}
 Write-Output 'VERIFIED_LOCAL_CODEX'
} catch {if($RegistryFile){Emit @{verified=$false;code=if($_.Exception.Message-match '^MCP_[A-Z_]+$'){$_.Exception.Message}else{'MCP_CLIENT_IDENTITY'}}};exit 2 }
