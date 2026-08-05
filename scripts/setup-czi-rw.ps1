# Clone pinned libCZI (if needed), apply patches, and pip-install the
# SlideRelabeler CZI attachment writer.
# Reinstalls when the installed package version is older than required.
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LibCziDir = Join-Path $Root "native\czi_rw\third_party\libczi"
$PatchDir = Join-Path $Root "native\czi_rw\patches"
$LibCziPin = "61f74ff097d6d0fbe6e36f204ff59d92e299d7cd"
$RequiredVersion = "0.1.2"

$Python = $env:PYTHON
if (-not $Python) {
    if ($env:CONDA_PREFIX) {
        $candidate = Join-Path $env:CONDA_PREFIX "python.exe"
        if (Test-Path $candidate) {
            $Python = $candidate
        } else {
            $candidate = Join-Path $env:CONDA_PREFIX "bin\python.exe"
            if (Test-Path $candidate) { $Python = $candidate }
        }
    }
}
if (-not $Python) { $Python = "python" }

function Test-VersionGe([string]$Installed, [string]$Required) {
    $code = @"
import sys
a = [int(x) for x in sys.argv[1].split('.')]
b = [int(x) for x in sys.argv[2].split('.')]
sys.exit(0 if a >= b else 1)
"@
    & $Python -c $code $Installed $Required
    return ($LASTEXITCODE -eq 0)
}

$installedVersion = $null
try {
    $installedVersion = & $Python -c "from importlib.metadata import version; print(version('sliderelabeler-czi-rw'))" 2>$null
} catch {
    $installedVersion = $null
}

if ($installedVersion -and (Test-VersionGe $installedVersion $RequiredVersion)) {
    & $Python -c "from sliderelabeler_czi_rw import replace_or_add_attachment, replace_or_add_attachments" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "sliderelabeler_czi_rw $installedVersion already installed"
        exit 0
    }
}

if (-not (Get-Command cmake -ErrorAction SilentlyContinue)) {
    Write-Error "cmake is required to build native/czi_rw. Install conda-forge package 'cmake' (listed in environment-windows.yml) and retry."
}

$hasCompiler = (
    (Get-Command cl -ErrorAction SilentlyContinue) -or
    (Get-Command clang++ -ErrorAction SilentlyContinue) -or
    (Get-Command g++ -ErrorAction SilentlyContinue) -or
    (Get-Command c++ -ErrorAction SilentlyContinue)
)
if (-not $hasCompiler) {
    Write-Error "A C++17 compiler is required to build native/czi_rw. Install conda-forge 'cxx-compiler' (listed in environment-windows.yml) or Visual Studio Build Tools and retry."
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git is required to clone ZEISS/libczi into native/czi_rw/third_party/libczi."
}

function Ensure-PinnedLibCzi {
    $parent = Split-Path -Parent $LibCziDir
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
    }
    $cmakeLists = Join-Path $LibCziDir "CMakeLists.txt"
    if (-not (Test-Path $cmakeLists)) {
        git clone https://github.com/ZEISS/libczi.git $LibCziDir
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to clone ZEISS/libczi" }
    }
    Push-Location $LibCziDir
    try {
        $current = (git rev-parse HEAD 2>$null)
        if ($current -ne $LibCziPin) {
            git fetch --depth 1 origin $LibCziPin
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to fetch libczi pin $LibCziPin" }
            git checkout --force $LibCziPin
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to checkout libczi pin $LibCziPin" }
        }
    } finally {
        Pop-Location
    }
}

function Test-ReplaceAttachmentNextSegmentFixed([string]$ReaderWriterPath) {
    $lines = Get-Content $ReaderWriterPath
    $inFn = $false
    foreach ($line in $lines) {
        if ($line -match 'ReplaceAttachmentAddNewAtEnd') { $inFn = $true }
        if ($inFn -and $line -match 'return make_tuple\(true, sizeOfSbBlk, entry\);') { return $true }
        if ($inFn -and $line -match 'ReplaceAttachmentInplace') { return $false }
    }
    return $false
}

function Apply-LibCziPatches {
    $writer = Join-Path $LibCziDir "Src\libCZI\CziWriter.cpp"
    $readerWriter = Join-Path $LibCziDir "Src\libCZI\CziReaderWriter.cpp"
    if (-not (Test-Path $writer) -or -not (Test-Path $readerWriter)) {
        Write-Error "missing libczi sources after clone."
    }
    if (-not (Test-Path $PatchDir)) {
        Write-Error "missing patch directory $PatchDir"
    }

    $patches = Get-ChildItem -Path $PatchDir -Filter "000*.patch" | Sort-Object Name
    foreach ($patchItem in $patches) {
        $patch = $patchItem.FullName
        $base = $patchItem.Name

        Push-Location $LibCziDir
        try {
            git apply --reverse --check $patch 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Patch already applied: $base"
                continue
            }
        } finally {
            Pop-Location
        }

        if ($base -like "*attdir-zero-pad*") {
            $content = Get-Content -Raw $writer
            if ($content -match 'WriteZeroes\(info\.writeFunc, attchmDirPos \+ totalBytesWritten') {
                Write-Host "libCZI ATTDIR zero-pad already fixed (upstream); skipping $base"
                continue
            }
        }
        if ($base -like "*advance-next-segment*") {
            if (Test-ReplaceAttachmentNextSegmentFixed $readerWriter) {
                Write-Host "libCZI ReplaceAttachment next-segment advance already fixed (upstream); skipping $base"
                continue
            }
        }

        Push-Location $LibCziDir
        try {
            git apply --check $patch 2>$null
            if ($LASTEXITCODE -eq 0) {
                git apply $patch
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Failed to apply patch $base"
                }
                Write-Host "Applied patch: $base"
                continue
            }
        } finally {
            Pop-Location
        }

        Write-Error "patch obsolete or conflicts with pinned libczi ($LibCziPin): $base. Update or remove native/czi_rw/patches/$base and re-pin if needed."
    }
}

Ensure-PinnedLibCzi
Apply-LibCziPatches

& $Python -m pip install -U pybind11 scikit-build-core
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$nativePath = Join-Path $Root "native\czi_rw"
& $Python -m pip install --force-reinstall --no-deps $nativePath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Python -c "from sliderelabeler_czi_rw import replace_or_add_attachment, replace_or_add_attachments; print('sliderelabeler_czi_rw OK')"
exit $LASTEXITCODE
