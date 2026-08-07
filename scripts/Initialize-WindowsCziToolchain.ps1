# Prepare conda tools + MSVC for building native/czi_rw on Windows.
# Dot-source from setup-czi-rw.ps1 on the rebuild path only.
# Usage: . ...\Initialize-WindowsCziToolchain.ps1; Initialize-WindowsCziToolchain

function Initialize-WindowsCziToolchain {
    if ($env:CONDA_PREFIX) {
        $pathParts = @()
        $libraryBin = Join-Path $env:CONDA_PREFIX "Library\bin"
        $scriptsDir = Join-Path $env:CONDA_PREFIX "Scripts"
        if (Test-Path $libraryBin) { $pathParts += $libraryBin }
        if (Test-Path $scriptsDir) { $pathParts += $scriptsDir }
        if ($pathParts.Count -gt 0) {
            $env:PATH = ($pathParts + $env:PATH) -join [IO.Path]::PathSeparator
        }
    }

    if (-not (Get-Command cl -ErrorAction SilentlyContinue)) {
        $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
        if (-not (Test-Path $vswhere)) {
            Write-Error @"
A C++ compiler (cl.exe) was not found, and Visual Studio Installer (vswhere) is missing.

Install Visual Studio Build Tools (or full Visual Studio) with the "Desktop development with C++" workload (MSVC + Windows SDK):
  https://visualstudio.microsoft.com/visual-cpp-build-tools/

Then re-run this script (a normal PowerShell window is fine).
"@
        }

        $vsPath = & $vswhere -latest -products * `
            -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
            -property installationPath 2>$null
        if (-not $vsPath) {
            Write-Error @"
A C++ compiler (cl.exe) was not found, and no Visual Studio installation with MSVC C++ tools was detected.

Install Visual Studio Build Tools (or full Visual Studio) with the "Desktop development with C++" workload (MSVC + Windows SDK):
  https://visualstudio.microsoft.com/visual-cpp-build-tools/

Then re-run this script (a normal PowerShell window is fine).
"@
        }

        $devShell = Join-Path $vsPath "Common7\Tools\Microsoft.VisualStudio.DevShell.dll"
        if (-not (Test-Path $devShell)) {
            Write-Error @"
Found Visual Studio at '$vsPath' but Microsoft.VisualStudio.DevShell.dll is missing.

Repair or reinstall Visual Studio Build Tools with the "Desktop development with C++" workload, then re-run.
"@
        }

        Write-Host "[czi-rw] Loading MSVC environment from: $vsPath"
        Import-Module $devShell
        Enter-VsDevShell -VsInstallPath $vsPath -SkipAutomaticLocation -DevCmdArguments '-arch=x64 -host_arch=x64' | Out-Null
    }

    if (-not (Get-Command cl -ErrorAction SilentlyContinue)) {
        Write-Error @"
MSVC (cl.exe) is still not on PATH after loading the Visual Studio developer environment.

Install or repair Visual Studio Build Tools with the "Desktop development with C++" workload (MSVC + Windows SDK):
  https://visualstudio.microsoft.com/visual-cpp-build-tools/

Then re-run this script.
"@
    }

    Remove-Item Env:CMAKE_GENERATOR_PLATFORM -ErrorAction SilentlyContinue
    Remove-Item Env:CMAKE_GENERATOR_TOOLSET -ErrorAction SilentlyContinue
    if ($env:CMAKE_ARGS) {
        $cleaned = ($env:CMAKE_ARGS -split '\s+' | Where-Object {
            $_ -and $_ -notmatch '^-A$' -and $_ -ne 'x64' -and $_ -ne 'Win32' `
                -and $_ -notmatch 'CMAKE_GENERATOR_PLATFORM' -and $_ -notmatch 'CMAKE_GENERATOR_TOOLSET'
        }) -join ' '
        if ($cleaned) {
            $env:CMAKE_ARGS = $cleaned
        } else {
            Remove-Item Env:CMAKE_ARGS -ErrorAction SilentlyContinue
        }
    }
    $env:CMAKE_GENERATOR = "Ninja"

    if (-not (Get-Command ninja -ErrorAction SilentlyContinue)) {
        Write-Error @"
ninja was not found on PATH. It is provided by the sliderelabeler conda environment (environment-windows.yml).

Update the env and retry:
  conda env update -f environment-windows.yml
"@
    }
}
