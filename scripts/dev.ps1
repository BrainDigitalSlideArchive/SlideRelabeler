# Deprecated thin wrapper — prefer: node scripts/run-with-conda.mjs npm start
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
& (Join-Path $Root "scripts\with-conda.ps1") npm start @args
exit $LASTEXITCODE
