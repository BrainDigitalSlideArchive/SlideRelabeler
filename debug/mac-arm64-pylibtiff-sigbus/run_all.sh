#!/usr/bin/env bash
# Run all Apple Silicon pylibtiff/large_image repro steps; continue after crashes.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ -n "${PYTHON:-}" && -x "${PYTHON}" ]]; then
  PY="$PYTHON"
elif command -v conda &>/dev/null; then
  CONDA_PREFIX="$(conda env list | awk '$1 == "sliderelabeler" { print $NF; exit }')"
  if [[ -n "$CONDA_PREFIX" && -x "$CONDA_PREFIX/bin/python" ]]; then
    PY="$CONDA_PREFIX/bin/python"
  fi
fi
PY="${PY:-python3}"

if [[ ! -f "$ROOT/config.local.env" ]]; then
  echo "ERROR: Copy config.example.env to config.local.env and set SVS_PATH" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$ROOT/config.local.env"

mkdir -p "$ROOT/results"
LOG="$ROOT/results/$(date +%Y-%m-%d_%H%M%S).log"
echo "log=$LOG"
echo "python=$PY ($("$PY" --version 2>&1))"
echo "SVS_PATH=$SVS_PATH"
echo "---"

SCRIPTS=(
  00_report_env.py
  00b_argtypes_probe.py
  01_tifftools_read.py
  02_pylibtiff_open.py
  03_tiff_file_tile_source.py
  04_order_tifftools_then_pylibtiff.py
  05_order_pylibtiff_then_tifftools.py
  06_large_image_open.py
  07_deidtools_minimal.py
  08_deidtools_redact_only.py
  09_after_openslide.py
  10_patchlibtiff_guard.py
)

decode_exit() {
  local code=$1
  if [[ "$code" -eq 0 ]]; then echo OK; return; fi
  if [[ "$code" -eq 138 ]]; then echo "SIGBUS (128+10)"; return; fi
  if [[ "$code" -eq 139 ]]; then echo "SIGSEGV (128+11)"; return; fi
  echo "$code"
}

printf "%-40s %s\n" "SCRIPT" "EXIT" | tee "$LOG"
printf "%-40s %s\n" "------" "----" | tee -a "$LOG"

for script in "${SCRIPTS[@]}"; do
  echo "=== $script ===" | tee -a "$LOG"
  "$PY" "$ROOT/$script" 2>&1 | tee -a "$LOG"
  code=${PIPESTATUS[0]}
  label=$(decode_exit "$code")
  printf "%-40s %s\n" "$script" "$label" | tee -a "$LOG"
  echo | tee -a "$LOG"
done

echo "Full log: $LOG"
