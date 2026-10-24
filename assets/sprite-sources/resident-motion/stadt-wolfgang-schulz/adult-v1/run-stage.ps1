param([Parameter(Mandatory=$true)][string]$Stage,[Parameter(Mandatory=$true)][string]$Script,[string[]]$StageArgs=@())
$ErrorActionPreference='Stop'
$env:OMP_NUM_THREADS='1';$env:OPENBLAS_NUM_THREADS='1';$env:MKL_NUM_THREADS='1'
$python='C:/Users/cogpsy-vrlab/AppData/Local/Programs/Python/Python312/python.exe'
$root=(Get-Location).Path
$out=Join-Path $root 'output/street-redesign/wolfgang-end-to-end/resources'
New-Item -ItemType Directory -Path $out -Force | Out-Null
$before=[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)
if($before -lt 1024){throw "HOLD free memory $before MiB below1GiB"}
$scriptPath=(Resolve-Path -LiteralPath $Script).Path
$arguments=@('-B',('"'+$scriptPath+'"')) + $StageArgs
$child=Start-Process -FilePath $python -ArgumentList $arguments -WindowStyle Hidden -WorkingDirectory $root -RedirectStandardOutput "$out/$Stage.stdout.txt" -RedirectStandardError "$out/$Stage.stderr.txt" -PassThru
$child.PriorityClass='BelowNormal'
$observedPriority=[int]$child.PriorityClass;$startedUtc=$child.StartTime.ToUniversalTime().ToString('o');$minimumFree=$before
$maxWorking=0
while(-not $child.WaitForExit(1000)){$child.Refresh();$maxWorking=[math]::Max($maxWorking,$child.PeakWorkingSet64);$minimumFree=[math]::Min($minimumFree,[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024))}
$child.Refresh();$after=[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)
$receipt=[ordered]@{stage=$Stage;startedUtc=$startedUtc;finishedUtc=[DateTime]::UtcNow.ToString('o');minimumFreeMiB=$minimumFree;pid=$child.Id;python=$python;arguments=$arguments;priorityClassObserved=$observedPriority;threads=@{OMP=1;OPENBLAS=1;MKL=1};freeMiBBefore=$before;freeMiBAfter=$after;peakWorkingMiB=[math]::Round([math]::Max($maxWorking,$child.PeakWorkingSet64)/1MB,2);exitCode=$child.ExitCode}
$receipt|ConvertTo-Json -Depth 4|Set-Content -LiteralPath "$out/$Stage.json" -Encoding utf8
Get-Content -LiteralPath "$out/$Stage.stdout.txt"
Get-Content -LiteralPath "$out/$Stage.stderr.txt"
$receipt|ConvertTo-Json -Compress -Depth 4
if($child.ExitCode -ne 0){exit $child.ExitCode}