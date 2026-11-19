param([string]$Base,[string]$EngineeringProfile='')
$ErrorActionPreference='Stop'
try {
 $own=[IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
 if([IO.Path]::GetFullPath($Base) -cne $own){throw 'MCP_LAUNCH_PATH'}
 $exe=Join-Path $own 'tools\electron\electron.exe'
 $entry=Join-Path $own 'desktop\c6-main.cjs'
 if(!(Test-Path -LiteralPath $exe -PathType Leaf) -or !(Test-Path -LiteralPath $entry -PathType Leaf)){throw 'MCP_LAUNCH_PATH'}
 $arguments='"'+$entry+'"'
 if($EngineeringProfile){if($EngineeringProfile -cnotmatch '^[a-z0-9-]{1,60}$'){throw 'MCP_QA_PROFILE'};$arguments+=' --c6-qa='+$EngineeringProfile+' --c6-hidden'}
 # Obtain the existing desktop's automation object, rather than an in-process
 # Shell.Application dispatcher. This is the documented Explorer launch path.
 # No desktop item enumeration, window manipulation, RunAs, new service/task,
 # registration, job-breakaway flag or security-setting change.
 Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class AicgDesktopOwner {
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window,out uint pid);
}
'@
 $shell=New-Object -ComObject Shell.Application
 $windows=$shell.Windows();$location=0;$root=0;$desktopHwnd=0
 $desktop=$windows.FindWindowSW([ref]$location,[ref]$root,8,[ref]$desktopHwnd,1)
 if(!$desktop){throw 'MCP_DESKTOP_UNAVAILABLE'}
 [uint32]$desktopPid=0
 [void][AicgDesktopOwner]::GetWindowThreadProcessId([IntPtr]$desktopHwnd,[ref]$desktopPid)
 $desktopProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$desktopPid"
 $desktopSid=(Invoke-CimMethod -InputObject $desktopProcess -MethodName GetOwnerSid).Sid
 if([int]$desktopProcess.SessionId -ne [Diagnostics.Process]::GetCurrentProcess().SessionId -or $desktopSid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value -or [IO.Path]::GetFullPath($desktopProcess.ExecutablePath) -ine (Join-Path $env:WINDIR 'explorer.exe')){throw 'MCP_DESKTOP_IDENTITY'}
 $application=$desktop.Document.Application
 if(!$application){throw 'MCP_DESKTOP_UNAVAILABLE'}
 $application.ShellExecute($exe,$arguments,$own,'open',0)
 @{launchRequested=$true;method='existing-desktop-explorer-open';desktopPid=$desktopPid}|ConvertTo-Json -Compress
} catch { exit 2 }
finally { foreach($value in @($application,$desktop,$windows,$shell)){if($value){try{[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($value)}catch{}}} }
