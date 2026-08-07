# Shared helpers for Windows build scripts (dot-source from with-conda.ps1 / setup-czi-rw.ps1).
#
# Under $ErrorActionPreference = "Stop", pwsh can turn native-exe stderr into a
# terminating NativeCommandError even when the caller only wanted to inspect
# $LASTEXITCODE (e.g. expected-fail probes like `git apply --check`).
# These helpers run natives with Continue and return/branch on exit codes.

if ($PSVersionTable.PSVersion.Major -ge 7) {
    # PS 7.3+: do not treat non-zero native exits as ErrorActionPreference failures.
    $PSNativeCommandUseErrorActionPreference = $false
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script,

        [switch]$RequireSuccess,

        [string]$ErrorMessage = "Command failed",

        # Suppress stdout/stderr (probes / expected failures).
        [switch]$Quiet
    )

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $code = 0
    try {
        if ($Quiet) {
            # Capture then discard so $LASTEXITCODE stays the native exe's code
            # (piping to Out-Null can clobber it on some pwsh versions).
            $null = & $Script 2>&1
        } else {
            & $Script
        }
        if ($null -ne $LASTEXITCODE) {
            $code = [int]$LASTEXITCODE
        }
    } catch {
        $code = 1
        if (-not $Quiet) {
            Write-Host $_.Exception.Message
        }
    } finally {
        $ErrorActionPreference = $prev
    }

    if ($RequireSuccess -and $code -ne 0) {
        Write-Error ("{0} (exit {1})" -f $ErrorMessage, $code)
    }
    return $code
}

function Invoke-NativeCapture {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = ""
    $code = 0
    try {
        $raw = & $Script 2>&1
        if ($null -ne $LASTEXITCODE) {
            $code = [int]$LASTEXITCODE
        }
        if ($null -ne $raw) {
            $output = ($raw | Out-String).Trim()
        }
    } catch {
        $code = 1
        if ($_.Exception.Message) {
            $output = $_.Exception.Message
        }
    } finally {
        $ErrorActionPreference = $prev
    }

    return [pscustomobject]@{
        ExitCode = $code
        Output   = $output
    }
}
