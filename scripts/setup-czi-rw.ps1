# Clone pinned libCZI (if needed), apply patches, and pip-install the
# SlideRelabeler CZI attachment writer.
# Reinstalls when the installed package version is older than required.
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LibCziDir = Join-Path $Root "native\czi_rw\third_party\libczi"
$PatchDir = Join-Path $Root "native\czi_rw\patches"
$LibCziPin = "61f74ff097d6d0fbe6e36f204ff59d92e299d7cd"
$RequiredVersion = "0.1.2"

. (Join-Path $Root "scripts\Invoke-Native.ps1")

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
    $exit = Invoke-Native -Quiet -Script { & $Python -c $code $Installed $Required }
    return ($exit -eq 0)
}

$versionProbe = Invoke-NativeCapture -Script {
    & $Python -c "from importlib.metadata import version; print(version('sliderelabeler-czi-rw'))"
}
$installedVersion = $null
if ($versionProbe.ExitCode -eq 0 -and $versionProbe.Output) {
    $installedVersion = $versionProbe.Output
}

if ($installedVersion -and (Test-VersionGe $installedVersion $RequiredVersion)) {
    $importOk = Invoke-Native -Quiet -Script {
        & $Python -c "from sliderelabeler_czi_rw import replace_or_add_attachment, replace_or_add_attachments"
    }
    if ($importOk -eq 0) {
        Write-Host "sliderelabeler_czi_rw $installedVersion already installed"
        exit 0
    }
}

. (Join-Path $Root "scripts\Initialize-WindowsCziToolchain.ps1")
Initialize-WindowsCziToolchain

if (-not (Get-Command cmake -ErrorAction SilentlyContinue)) {
    Write-Error @"
cmake is required to build native/czi_rw. It is listed in environment-windows.yml.

Update the env and retry:
  conda env update -f environment-windows.yml
"@
}

if (-not (Get-Command cl -ErrorAction SilentlyContinue)) {
    Write-Error @"
MSVC (cl.exe) is required to build native/czi_rw.

Install Visual Studio Build Tools (or full Visual Studio) with the "Desktop development with C++" workload (MSVC + Windows SDK):
  https://visualstudio.microsoft.com/visual-cpp-build-tools/

Then re-run this script (a normal PowerShell window is fine).
"@
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git is required to clone ZEISS/libczi into native/czi_rw/third_party/libczi. Install Git for Windows: https://git-scm.com/download/win"
}

function Ensure-PinnedLibCzi {
    $parent = Split-Path -Parent $LibCziDir
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
    }
    $cmakeLists = Join-Path $LibCziDir "CMakeLists.txt"
    if (-not (Test-Path $cmakeLists)) {
        Invoke-Native -RequireSuccess -ErrorMessage "Failed to clone ZEISS/libczi" -Script {
            git clone https://github.com/ZEISS/libczi.git $LibCziDir
        } | Out-Null
    }
    Push-Location $LibCziDir
    try {
        $head = Invoke-NativeCapture -Script { git rev-parse HEAD }
        $current = $head.Output
        if ($current -ne $LibCziPin) {
            Invoke-Native -RequireSuccess -ErrorMessage "Failed to fetch libczi pin $LibCziPin" -Script {
                git fetch --depth 1 origin $LibCziPin
            } | Out-Null
            Invoke-Native -RequireSuccess -ErrorMessage "Failed to checkout libczi pin $LibCziPin" -Script {
                git checkout --force $LibCziPin
            } | Out-Null
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
            # Expected to fail when the patch is not yet applied.
            $already = Invoke-Native -Quiet -Script { git apply --reverse --check $patch }
            if ($already -eq 0) {
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
            $canApply = Invoke-Native -Quiet -Script { git apply --check $patch }
            if ($canApply -eq 0) {
                Invoke-Native -RequireSuccess -ErrorMessage "Failed to apply patch $base" -Script {
                    git apply $patch
                } | Out-Null
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

Invoke-Native -RequireSuccess -ErrorMessage "pip install pybind11/scikit-build-core failed" -Script {
    & $Python -m pip install -U pybind11 scikit-build-core
} | Out-Null

$nativePath = Join-Path $Root "native\czi_rw"
Invoke-Native -RequireSuccess -ErrorMessage "pip install native/czi_rw failed" -Script {
    & $Python -m pip install --force-reinstall --no-deps $nativePath
} | Out-Null

Invoke-Native -RequireSuccess -ErrorMessage "sliderelabeler_czi_rw import check failed" -Script {
    & $Python -c "from sliderelabeler_czi_rw import replace_or_add_attachment, replace_or_add_attachments; print('sliderelabeler_czi_rw OK')"
} | Out-Null

exit 0
