#!/usr/bin/env bash
# Run a command with the sliderelabeler conda env on PATH (pyenv-safe).
# Usage: with-conda.sh <command> [args...]
set -euo pipefail

ENV_NAME="sliderelabeler"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ $# -lt 1 ]]; then
  echo "ERROR: with-conda.sh requires a command." >&2
  echo "Usage: with-conda.sh <command> [args...]" >&2
  exit 1
fi

if ! command -v conda &>/dev/null; then
  echo "ERROR: conda is not on PATH." >&2
  echo "Install Miniconda/Anaconda and ensure conda is available, then create the env:" >&2
  echo "  conda env create -f environment-macos.yml" >&2
  echo "See build_readme/macosx/README.md for details." >&2
  exit 1
fi

if ! conda env list | grep -qE "^${ENV_NAME}[[:space:]]"; then
  echo "ERROR: conda environment '${ENV_NAME}' not found." >&2
  echo "Create it with: conda env create -f environment-macos.yml" >&2
  exit 1
fi

CONDA_PREFIX="$(conda env list | awk -v env="$ENV_NAME" '$1 == env { print $NF; exit }')"
PYTHON="${CONDA_PREFIX}/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "ERROR: Python not found at ${PYTHON}" >&2
  exit 1
fi

if ! "$PYTHON" -c "import grpc; import large_image" 2>/dev/null; then
  echo "ERROR: '${ENV_NAME}' is missing required Python packages (grpc, large_image)." >&2
  echo "Recreate or update the env: conda env create -f environment-macos.yml" >&2
  echo "Or test manually: ${PYTHON} -c \"import grpc\"" >&2
  exit 1
fi

PY_VERSION="$("$PYTHON" --version 2>&1)"
echo "[with-conda] Using conda env: ${ENV_NAME}" >&2
echo "[with-conda] PYTHON=${PYTHON} (${PY_VERSION})" >&2

export PYTHON
export CONDA_PREFIX
export PATH="${CONDA_PREFIX}/bin:${PATH}"

exec "$@"
