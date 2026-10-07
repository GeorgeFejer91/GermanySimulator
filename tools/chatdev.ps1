param(
    [switch]$ValidateOnly,
    [string]$Prompt = 'Review and improve the Bürgeramt level without changing the eight mission sequence.',
    [string]$Stage = ''
)
$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $PSScriptRoot
& python (Join-Path $PSScriptRoot 'validate-chatdev.py')
if ($LASTEXITCODE -ne 0 -or $ValidateOnly) { exit $LASTEXITCODE }
$chatdevRoot = if ($env:CHATDEV_HOME) { $env:CHATDEV_HOME } else { Join-Path (Split-Path -Parent $gameRoot) 'ChatDev' }
if (-not (Test-Path -LiteralPath $chatdevRoot)) { throw "Pinned ChatDev checkout missing: $chatdevRoot; set CHATDEV_HOME for worktrees" }
$env:CHATDEV_HOME = (Resolve-Path -LiteralPath $chatdevRoot).Path
if (-not $env:API_KEY) { $env:API_KEY = $env:OPENAI_API_KEY }
if (-not $env:API_KEY) { throw 'Set API_KEY or OPENAI_API_KEY in your local environment; do not put it in the repository.' }
if (-not $env:BASE_URL) { $env:BASE_URL = 'https://api.openai.com/v1' }
$python = Join-Path $chatdevRoot '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw "ChatDev Python runtime missing: $python. Install ChatDev v2.2.0 in that external checkout." }
$stageArgs = if ($Stage) { @('--stage', $Stage) } else { @() }
& $python (Join-Path $PSScriptRoot 'run-chatdev.py') $Prompt @stageArgs
exit $LASTEXITCODE
