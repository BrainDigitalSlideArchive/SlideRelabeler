#!/usr/bin/env bash
# Clone pinned libCZI (if needed), apply patches, and pip-install the
# SlideRelabeler CZI attachment writer.
# Reinstalls when the installed package version is older than pyproject.toml.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIBCZI_DIR="$ROOT/native/czi_rw/third_party/libczi"
PATCH_DIR="$ROOT/native/czi_rw/patches"
LIBCZI_PIN="61f74ff097d6d0fbe6e36f204ff59d92e299d7cd"
REQUIRED_VERSION="0.1.2"

PYTHON="${PYTHON:-}"
if [[ -z "$PYTHON" ]]; then
  if [[ -n "${CONDA_PREFIX:-}" && -x "${CONDA_PREFIX}/bin/python" ]]; then
    PYTHON="${CONDA_PREFIX}/bin/python"
  elif [[ -n "${CONDA_PREFIX:-}" && -x "${CONDA_PREFIX}/python.exe" ]]; then
    PYTHON="${CONDA_PREFIX}/python.exe"
  else
    PYTHON="python"
  fi
fi

version_ge() {
  # Return 0 if $1 >= $2 (dotted numeric versions).
  "$PYTHON" -c "import sys; from packaging.version import Version; sys.exit(0 if Version(sys.argv[1]) >= Version(sys.argv[2]) else 1)" "$1" "$2" 2>/dev/null \
    || "$PYTHON" -c "
import sys
a=[int(x) for x in sys.argv[1].split('.')]
b=[int(x) for x in sys.argv[2].split('.')]
sys.exit(0 if a>=b else 1)
" "$1" "$2"
}

INSTALLED_VERSION="$("$PYTHON" -c "from importlib.metadata import version; print(version('sliderelabeler-czi-rw'))" 2>/dev/null || true)"
if [[ -n "$INSTALLED_VERSION" ]] && version_ge "$INSTALLED_VERSION" "$REQUIRED_VERSION"; then
  if "$PYTHON" -c "from sliderelabeler_czi_rw import replace_or_add_attachment, replace_or_add_attachments" 2>/dev/null; then
    echo "sliderelabeler_czi_rw $INSTALLED_VERSION already installed"
    exit 0
  fi
fi

if ! command -v cmake &>/dev/null; then
  echo "ERROR: cmake is required to build native/czi_rw." >&2
  echo "Install cmake (conda-forge package 'cmake' is listed in environment-*.yml) and retry." >&2
  exit 1
fi

# Prefer a C++ compiler from PATH (conda cxx-compiler puts one there when activated).
if ! command -v c++ &>/dev/null && ! command -v g++ &>/dev/null && ! command -v clang++ &>/dev/null; then
  echo "ERROR: A C++17 compiler is required to build native/czi_rw." >&2
  echo "Install conda-forge 'cxx-compiler' (listed in environment-*.yml) or a system toolchain and retry." >&2
  exit 1
fi

if ! command -v git &>/dev/null; then
  echo "ERROR: git is required to clone ZEISS/libczi into native/czi_rw/third_party/libczi." >&2
  exit 1
fi

ensure_pinned_libczi() {
  mkdir -p "$(dirname "$LIBCZI_DIR")"
  if [[ ! -f "$LIBCZI_DIR/CMakeLists.txt" ]]; then
    git clone https://github.com/ZEISS/libczi.git "$LIBCZI_DIR"
  fi
  (
    cd "$LIBCZI_DIR"
    current="$(git rev-parse HEAD 2>/dev/null || true)"
    if [[ "$current" != "$LIBCZI_PIN" ]]; then
      git fetch --depth 1 origin "$LIBCZI_PIN"
      git checkout --force "$LIBCZI_PIN"
    fi
  )
}

apply_libczi_patches() {
  local writer="$LIBCZI_DIR/Src/libCZI/CziWriter.cpp"
  local reader_writer="$LIBCZI_DIR/Src/libCZI/CziReaderWriter.cpp"
  if [[ ! -f "$writer" || ! -f "$reader_writer" ]]; then
    echo "ERROR: missing libczi sources after clone." >&2
    exit 1
  fi
  if [[ ! -d "$PATCH_DIR" ]]; then
    echo "ERROR: missing patch directory $PATCH_DIR" >&2
    exit 1
  fi

  local patch
  for patch in "$PATCH_DIR"/000*.patch; do
    [[ -f "$patch" ]] || continue
    local base
    base="$(basename "$patch")"

    # Already applied (reverse check succeeds).
    if (cd "$LIBCZI_DIR" && git apply --reverse --check "$patch" 2>/dev/null); then
      echo "Patch already applied: $base"
      continue
    fi

    # Content-based skip when upstream landed an equivalent fix.
    if [[ "$base" == *attdir-zero-pad* ]]; then
      if grep -q 'WriteZeroes(info.writeFunc, attchmDirPos + totalBytesWritten' "$writer"; then
        echo "libCZI ATTDIR zero-pad already fixed (upstream); skipping $base"
        continue
      fi
    fi
    if [[ "$base" == *advance-next-segment* ]]; then
      # ReplaceAttachmentAddNewAtEnd must return true (mirrors ReplaceSubBlockAddNewAtEnd).
      if awk '
        /ReplaceAttachmentAddNewAtEnd/ {infn=1}
        infn && /return make_tuple\(true, sizeOfSbBlk, entry\);/ {found=1; exit}
        infn && /^std::tuple.*ReplaceAttachmentInplace/ {exit}
        END {exit found?0:1}
      ' "$reader_writer"; then
        echo "libCZI ReplaceAttachment next-segment advance already fixed (upstream); skipping $base"
        continue
      fi
    fi

    if (cd "$LIBCZI_DIR" && git apply --check "$patch" 2>/dev/null); then
      (cd "$LIBCZI_DIR" && git apply "$patch")
      echo "Applied patch: $base"
      continue
    fi

    echo "ERROR: patch obsolete or conflicts with pinned libczi ($LIBCZI_PIN): $base" >&2
    echo "Update or remove native/czi_rw/patches/$base and re-pin if needed." >&2
    exit 1
  done
}

ensure_pinned_libczi
apply_libczi_patches

"$PYTHON" -m pip install -U pybind11 scikit-build-core
"$PYTHON" -m pip install --force-reinstall --no-deps "$ROOT/native/czi_rw"
"$PYTHON" -c "from sliderelabeler_czi_rw import replace_or_add_attachment, replace_or_add_attachments; print('sliderelabeler_czi_rw OK')"
