#!/usr/bin/env bash
# Deprecated thin wrapper — prefer: node scripts/run-with-conda.mjs npm start
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT/scripts/with-conda.sh" npm start "$@"
