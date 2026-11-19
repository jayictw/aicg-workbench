$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.UTF8Encoding]::new($false, $true)
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
public static class AcsPipeNative {
 [DllImport("shell32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr CommandLineToArgvW(string line,out int count);
 [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr h);
 public static string[] Args(string line) { int count; var h=CommandLineToArgvW(line,out count);if(h==IntPtr.Zero)throw new InvalidDataException("MCP_PEER_IDENTITY");try{var a=new string[count];for(int i=0;i<count;i++)a[i]=Marshal.PtrToStringUni(Marshal.ReadIntPtr(h,i*IntPtr.Size));return a;}finally{LocalFree(h);} }
 public static void WatchParent(int id) { var p=System.Diagnostics.Process.GetProcessById(id); System.Threading.Tasks.Task.Run(()=> {try {p.WaitForExit();}finally {Environment.Exit(0);}}); }
 [DllImport("kernel32.dll", SetLastError=true)] public static extern bool GetNamedPipeClientProcessId(SafePipeHandle h, out uint id);
 [DllImport("kernel32.dll", SetLastError=true)] public static extern bool GetNamedPipeServerProcessId(SafePipeHandle h, out uint id);
 public static string Line(TextReader reader, int max) {
   var b=new System.Text.StringBuilder(); int x;
   while((x=reader.Read())!=-1) { if(x==10) return b.ToString(); if(x==13)continue; if(b.Length>=max)throw new InvalidDataException("MCP_FRAME_LIMIT"); b.Append((char)x); }
   return b.Length==0?null:b.ToString();
 }
}
'@
function Emit($Value) { [Console]::Out.WriteLine(($Value | ConvertTo-Json -Depth 60 -Compress)); [Console]::Out.Flush() }
function Proc([int]$ProcessId) { $v=Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId"; if(!$v){throw 'MCP_PEER_IDENTITY'}; return $v }
function SamePath($A,$B) { return [string]::Equals([IO.Path]::GetFullPath($A),[IO.Path]::GetFullPath($B),[StringComparison]::OrdinalIgnoreCase) }
function Marker($Cmd,$Value) { return $Cmd -and $Cmd.IndexOf($Value,[StringComparison]::OrdinalIgnoreCase) -ge 0 }
function FixedScript($Cmd,$Script,[string[]]$Tail=@()) {
 $a=[AcsPipeNative]::Args($Cmd)
 if($a.Count -ne 6+$Tail.Count -or $a[1] -ne '-NoLogo' -or $a[2] -ne '-NoProfile' -or $a[3] -ne '-NonInteractive' -or $a[4] -ne '-File' -or !(SamePath $a[5] $Script)){return $false}
 for($i=0;$i -lt $Tail.Count;$i++){if($a[6+$i] -cne $Tail[$i]){return $false}}
 return $true
}
