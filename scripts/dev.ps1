# Launch SlideRelabeler dev mode with the sliderelabeler conda Python.
$ErrorActionPreference = "Stop"

$EnvName = "sliderelabeler"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    $SetupScript = Join-Path $Root "setup_dependency_paths.ps1"
    if (Test-Path $SetupScript) {
        . $SetupScript
    }
}

if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    Write-Error "conda is not on PATH. Install Miniconda/Anaconda and create the env: conda env create -f environment-windows.yml"
}

$envList = conda env list 2>&1 | Out-String
if ($envList -notmatch "(?m)^$EnvName\s") {
    Write-Error "Conda environment '$EnvName' not found. Create it with: conda env create -f environment-windows.yml"
}

$prefix = $null
foreach ($line in ($envList -split "`n")) {
    if ($line -match "^\s*$EnvName\s+(\S+)") {
        $prefix = $Matches[1]
        break
    }
}
if (-not $prefix) {
    Write-Error "Could not resolve path for conda environment '$EnvName'"
}

$python = Join-Path $prefix "bin\python.exe"
if (-not (Test-Path $python)) {
    $python = Join-Path $prefix "python.exe"
}
if (-not (Test-Path $python)) {
    Write-Error "Python not found in conda environment '$EnvName' at $prefix"
}

try {
    & $python -c "import grpc; import large_image" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "import failed" }
} catch {
    Write-Error "Environment '$EnvName' is missing required packages (grpc, large_image). Run: conda env create -f environment-windows.yml"
}

$pyVersion = (& $python --version 2>&1 | Out-String).Trim()
Write-Host "[dev] Using conda env: $EnvName"
Write-Host "[dev] PYTHON=$python ($pyVersion)"

$env:PYTHON = $python
$env:CONDA_PREFIX = $prefix

npm start @args
