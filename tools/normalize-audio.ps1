param(
    [switch]$Apply,
    [string]$WorkingDirectory = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$assetsRoot = Join-Path $repoRoot "assets"
$loudnessTolerance = 0.3
$durationToleranceSeconds = 0.1

function Invoke-NativeCapture {
    param([string]$FileName, [string[]]$Arguments)
    $start = [System.Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $FileName
    $start.UseShellExecute = $false
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    foreach ($argument in $Arguments) { [void]$start.ArgumentList.Add($argument) }
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $start
    [void]$process.Start()
    $stdout = $process.StandardOutput.ReadToEndAsync()
    $stderr = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $result = [pscustomobject]@{
        ExitCode = $process.ExitCode
        StdOut = $stdout.Result
        StdErr = $stderr.Result
    }
    $process.Dispose()
    return $result
}

foreach ($command in "ffmpeg", "ffprobe") {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "$command must be installed and available on PATH."
    }
}

function Get-AudioRole {
    param([string]$RelativePath)
    $path = $RelativePath.Replace("\", "/")
    if ($path.StartsWith("assets/voices/") -or
        $path.StartsWith("assets/audio/trains/") -or
        $path -eq "assets/merkel-wir-schaffen-das.mp3") {
        return [pscustomobject]@{ Name = "foreground"; Integrated = -18.0; TruePeak = -1.5 }
    }
    if ($path -eq "assets/intro-song.mp3" -or $path.StartsWith("assets/audio/music/")) {
        return [pscustomobject]@{ Name = "music"; Integrated = -20.0; TruePeak = -1.5 }
    }
    if ($path.StartsWith("assets/audio/police/") -or
        $path -eq "assets/fax-machine-paper-feed.mp3") {
        return [pscustomobject]@{ Name = "effect"; Integrated = -20.0; TruePeak = -2.0 }
    }
    throw "No normalization role is defined for $RelativePath."
}

function Get-Probe {
    param([string]$Path)
    $result = Invoke-NativeCapture "ffprobe" @(
        "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=channels,channel_layout,sample_rate,bit_rate:format=duration",
        "-of", "json", $Path
    )
    if ($result.ExitCode -ne 0) { throw "ffprobe could not decode $Path`n$($result.StdErr)" }
    $probe = $result.StdOut | ConvertFrom-Json
    if (-not $probe.streams -or -not $probe.format.duration) { throw "No decodable audio stream found in $Path." }
    return [pscustomobject]@{
        Channels = [int]$probe.streams[0].channels
        ChannelLayout = [string]$probe.streams[0].channel_layout
        SampleRate = [int]$probe.streams[0].sample_rate
        BitRate = [int]$probe.streams[0].bit_rate
        Duration = [double]$probe.format.duration
    }
}

function Measure-Loudness {
    param([string]$Path, [double]$Integrated, [double]$TruePeak)
    $filter = "loudnorm=I=$Integrated`:TP=$TruePeak`:LRA=11:print_format=json"
    $result = Invoke-NativeCapture "ffmpeg" @(
        "-hide_banner", "-nostats", "-i", $Path, "-af", $filter, "-f", "null", "NUL"
    )
    if ($result.ExitCode -ne 0) { throw "ffmpeg could not analyze $Path`n$($result.StdErr)" }
    $match = [regex]::Match($result.StdErr, '(?s)\{\s*"input_i".*?\}')
    if (-not $match.Success) { throw "FFmpeg returned no loudness measurement for $Path." }
    return $match.Value | ConvertFrom-Json
}

function Test-Measurement {
    param($Measurement, $Role)
    $integrated = [double]$Measurement.input_i
    $truePeak = [double]$Measurement.input_tp
    return [pscustomobject]@{
        Integrated = $integrated
        TruePeak = $truePeak
        Pass = ([math]::Abs($integrated - $Role.Integrated) -le $loudnessTolerance -and $truePeak -le $Role.TruePeak)
    }
}

function Write-NormalizedFile {
    param([System.IO.FileInfo]$File, $Role, $Probe)
    $workRoot = if ($WorkingDirectory) { [System.IO.Path]::GetFullPath($WorkingDirectory) } else { $File.DirectoryName }
    if (-not (Test-Path -LiteralPath $workRoot -PathType Container)) { [void](New-Item -ItemType Directory -Path $workRoot) }
    $temporary = Join-Path $workRoot ("{0}-{1}.normalize-{2}.mp3" -f $File.Directory.Name, $File.BaseName, $PID)
    $backup = "$temporary.original"
    if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
    if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Force }
    $bitRate = if ($Probe.BitRate -gt 0) { $Probe.BitRate } else { 128000 }
    # Leave a small encode margin so the decoded MP3 lands inside the strict
    # delivery tolerance after lossy-encoding drift.
    $encodeIntegrated = $Role.Integrated + 0.25
    $encodeTruePeak = $Role.TruePeak - 0.2
    $postGain = 0.0
    $limit = [math]::Pow(10, ($Role.TruePeak - 0.4) / 20).ToString("0.000000", [Globalization.CultureInfo]::InvariantCulture)
    try {
        $check = $null
        for ($attempt = 1; $attempt -le 6; $attempt++) {
            if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
            $normalizationMeasurement = Measure-Loudness $File.FullName $encodeIntegrated $encodeTruePeak
            $gainText = $postGain.ToString("0.000", [Globalization.CultureInfo]::InvariantCulture)
            $filter = "loudnorm=I=$encodeIntegrated`:TP=$encodeTruePeak`:LRA=11:measured_I=$($normalizationMeasurement.input_i)`:measured_TP=$($normalizationMeasurement.input_tp)`:measured_LRA=$($normalizationMeasurement.input_lra)`:measured_thresh=$($normalizationMeasurement.input_thresh)`:offset=$($normalizationMeasurement.target_offset)`:linear=true:print_format=summary,volume=${gainText}dB,alimiter=limit=$limit`:attack=5`:release=50`:level=false"
            $arguments = @(
                "-hide_banner", "-loglevel", "error", "-y", "-i", $File.FullName,
                "-map_metadata", "-1", "-af", $filter, "-ar", [string]$Probe.SampleRate,
                "-ac", [string]$Probe.Channels, "-b:a", [string]$bitRate, $temporary
            )
            $result = Invoke-NativeCapture "ffmpeg" $arguments
            if ($result.ExitCode -ne 0) { throw "FFmpeg normalization failed for $($File.FullName)`n$($result.StdErr)" }
            $normalizedMeasurement = Measure-Loudness $temporary $Role.Integrated $Role.TruePeak
            $check = Test-Measurement $normalizedMeasurement $Role
            if ($check.Pass) { break }
            $postGain += $Role.Integrated - $check.Integrated
        }
        if (-not $check.Pass) {
            throw "Normalized output missed its target for $($File.FullName): $($check.Integrated) LUFS, $($check.TruePeak) dBTP."
        }
        $normalizedProbe = Get-Probe $temporary
        if ($normalizedProbe.Channels -ne $Probe.Channels -or
            $normalizedProbe.SampleRate -ne $Probe.SampleRate -or
            ($Probe.ChannelLayout -and $normalizedProbe.ChannelLayout -ne $Probe.ChannelLayout)) {
            throw "Normalization changed the channel layout or sample rate for $($File.FullName)."
        }
        if ([math]::Abs($normalizedProbe.Duration - $Probe.Duration) -gt $durationToleranceSeconds) {
            throw "Normalization changed the duration materially for $($File.FullName)."
        }
        if ($workRoot -eq $File.DirectoryName) {
            Move-Item -LiteralPath $temporary -Destination $File.FullName -Force
        }
        else {
            Move-Item -LiteralPath $File.FullName -Destination $backup
            try { Move-Item -LiteralPath $temporary -Destination $File.FullName }
            catch {
                if (-not (Test-Path -LiteralPath $File.FullName) -and (Test-Path -LiteralPath $backup)) {
                    Move-Item -LiteralPath $backup -Destination $File.FullName
                }
                throw
            }
            Remove-Item -LiteralPath $backup -Force
        }
        return $check
    }
    finally {
        if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
        if ((Test-Path -LiteralPath $backup) -and (Test-Path -LiteralPath $File.FullName)) { Remove-Item -LiteralPath $backup -Force }
    }
}

$files = Get-ChildItem -LiteralPath $assetsRoot -Recurse -File -Filter "*.mp3" | Sort-Object FullName
$failed = $false
$changed = 0
foreach ($file in $files) {
    $relative = [System.IO.Path]::GetRelativePath($repoRoot, $file.FullName)
    $role = Get-AudioRole $relative
    $probe = Get-Probe $file.FullName
    $measurement = Measure-Loudness $file.FullName $role.Integrated $role.TruePeak
    $check = Test-Measurement $measurement $role
    if ($Apply -and -not $check.Pass) {
        $check = Write-NormalizedFile $file $role $probe
        $changed++
    }
    $status = if ($check.Pass) { "PASS" } else { "FAIL" }
    "{0,-4} {1,-10} {2,6:N2} LUFS  {3,6:N2} dBTP  {4}" -f $status, $role.Name, $check.Integrated, $check.TruePeak, $relative
    if (-not $check.Pass) { $failed = $true }
}

if ($failed) {
    Write-Error "One or more audio assets are outside the required loudness or true-peak limits. Run with -Apply to rewrite them."
    exit 1
}

if ($Apply) { "Checked $($files.Count) audio assets; normalized $changed." } else { "Checked $($files.Count) audio assets." }
