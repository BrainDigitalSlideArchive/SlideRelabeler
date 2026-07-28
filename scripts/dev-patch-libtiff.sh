#!/usr/bin/env bash
# Dev mode with libtiff/tiff_reader guard forced on (SLIDERELABELER_PATCH_LIBTIFF=1).
# On macOS arm64, engine.py auto-enables the patch when unset; use this to force on
# (e.g. Linux aarch64 experiments) or when testing explicit override behavior.
# Usage: ./scripts/dev-patch-libtiff.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export SLIDERELABELER_PATCH_LIBTIFF=1

echo "[dev-patch-libtiff] SLIDERELABELER_PATCH_LIBTIFF=1 (patchLibtiff + _getJpegTables + _getJpegFrameSize)" >&2
echo "[dev-patch-libtiff] See debug/mac-arm64-pylibtiff-sigbus/README.md for background" >&2

exec "$ROOT/scripts/dev.sh" "$@"
