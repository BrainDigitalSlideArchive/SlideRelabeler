# Run a command with the sliderelabeler conda env on PATH.
# Usage: with-conda.ps1 <command> [args...]
$ErrorActionPreference = "Stop"

$EnvName = "sliderelabeler"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

. (Join-Path $Root "scripts\Invoke-Native.ps1")

if ($args.Count -lt 1) {
    Write-Error "with-conda.ps1 requires a command. Usage: with-conda.ps1 <command> [args...]"
}

if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    $SetupScript = Join-Path $Root "setup_dependency_paths.ps1"
    if (Test-Path $SetupScript) {
        . $SetupScript
    }
}

if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
    Write-Error "conda is not on PATH. Install Miniconda/Anaconda and create the env: conda env create -f environment-windows.yml"
}

# Resolve env prefix. Prefer JSON. Fall back to `conda env list` text, using the
# last field so an active-env "*" marker is never mistaken for the path.
function Get-CondaEnvPrefix([string]$Name) {
    $json = Invoke-NativeCapture -Script { conda env list --json }
    if ($json.ExitCode -eq 0 -and $json.Output) {
        try {
            $data = $json.Output | ConvertFrom-Json
            foreach ($p in @($data.envs)) {
                if (-not $p) { continue }
                $leaf = Split-Path -Leaf ([string]$p)
                if ($leaf -eq $Name) {
                    return [string]$p
                }
            }
        } catch {
            # fall through to text parse
        }
    }

    $text = Invoke-NativeCapture -Script { conda env list }
    foreach ($line in ($text.Output -split "`r?`n")) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
        $tokens = $trimmed -split "\s+"
        if ($tokens.Count -lt 2) { continue }
        if ($tokens[0] -ne $Name) { continue }
        $candidate = $tokens[-1]
        if ($candidate -eq "*") { continue }
        return $candidate
    }
    return $null
}

$prefix = Get-CondaEnvPrefix $EnvName
if (-not $prefix) {
    Write-Error "Conda environment '$EnvName' not found. Create it with: conda env create -f environment-windows.yml"
}

$python = Join-Path $prefix "python.exe"
if (-not (Test-Path $python)) {
    $python = Join-Path $prefix "bin\python.exe"
}
if (-not (Test-Path $python)) {
    Write-Error "Python not found in conda environment '$EnvName' at $prefix"
}

$grpcOk = Invoke-Native -Quiet -Script { & $python -c "import grpc; import large_image" }
if ($grpcOk -ne 0) {
    Write-Error "Environment '$EnvName' is missing required packages (grpc, large_image). Run: conda env create -f environment-windows.yml"
}

$pyVersion = (Invoke-NativeCapture -Script { & $python --version }).Output
Write-Host "[with-conda] Using conda env: $EnvName"
Write-Host "[with-conda] PYTHON=$python ($pyVersion)"

$env:PYTHON = $python
$env:CONDA_PREFIX = $prefix

$scriptsDir = Join-Path $prefix "Scripts"
$libraryBin = Join-Path $prefix "Library\bin"
$pathParts = @()
if (Test-Path $libraryBin) { $pathParts += $libraryBin }
if (Test-Path $scriptsDir) { $pathParts += $scriptsDir }
$pathParts += $prefix
$env:PATH = ($pathParts + $env:PATH) -join [IO.Path]::PathSeparator

# Probe for the native CZI helper (ImportError expected on a fresh env).
$cziProbeOk = (Invoke-Native -Quiet -Script {
    & $python -c "from sliderelabeler_czi_rw import replace_or_add_attachment"
}) -eq 0

if (-not $cziProbeOk) {
    Write-Host "[with-conda] Building CZI attachment writer (one-time)..."
    $setupPs1 = Join-Path $Root "scripts\setup-czi-rw.ps1"
    Invoke-Native -RequireSuccess -ErrorMessage "Failed to build CZI attachment writer (scripts/setup-czi-rw.ps1)" -Script {
        & $setupPs1
    } | Out-Null
}

$cmd = $args[0]
$cmdArgs = @()
if ($args.Count -gt 1) {
    $cmdArgs = $args[1..($args.Count - 1)]
}

$exitCode = Invoke-Native -Script { & $cmd @cmdArgs }
exit $exitCode
