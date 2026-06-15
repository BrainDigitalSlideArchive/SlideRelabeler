#!/usr/bin/env bash
# Dev mode with Mac metadata preview patchLibtiff guard enabled.
# Usage: ./scripts/dev-mac-metadata.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export SLIDERELABELER_PATCH_LIBTIFF=1

echo "[dev-mac-metadata] SLIDERELABELER_PATCH_LIBTIFF=1 (patchLibtiff + _getJpegTables patches)" >&2
echo "[dev-mac-metadata] Open a slide and test metadata preview; see debug/mac-metadata-sigbus/README.md" >&2

exec "$ROOT/scripts/dev.sh" "$@"
