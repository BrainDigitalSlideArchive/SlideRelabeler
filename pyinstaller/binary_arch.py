"""Filter PyInstaller binary TOCs for a conda-only macOS freeze.

The sliderelabeler conda env (see environment-macos.yml / CI) is the sole native
library stack for darwin freezes.

On Apple Silicon, Analysis may also discover Intel Homebrew paths under
/usr/local — those are dropped (or replaced only from CONDA_PREFIX). Homebrew
/opt/homebrew is never used as a packaging source.
"""
from __future__ import annotations

import os
import platform
import shutil
import subprocess
from typing import Iterable, List, Optional, Sequence, Union

BinaryEntry = Union[tuple, Sequence[str]]


def build_arch() -> str:
    machine = platform.machine().lower()
    if machine in ("arm64", "aarch64"):
        return "arm64"
    if machine in ("x86_64", "amd64"):
        return "x86_64"
    return machine


def is_never_bundle_basename(path: str) -> bool:
    """True for basenames that must not enter the freeze TOC."""
    base = os.path.basename(path or "")
    # pyvips optional binary module is often linked to host Homebrew; force cffi.
    if base.startswith("_libvips") and (".so" in base or base.endswith(".pyd")):
        return True
    return False


def is_openslide_bin_host_path(path: str) -> bool:
    """True if path is pip openslide-bin's bundled dylib (system-iconv ABI on macOS)."""
    if not path:
        return False
    norm = path.replace("\\", "/").lower()
    return "/openslide_bin/" in norm or norm.rstrip("/").endswith("/openslide_bin")


def _file_report(path: str) -> str:
    try:
        return subprocess.check_output(["file", "-b", path], text=True, stderr=subprocess.DEVNULL).strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


def binary_compatible_with_arch(path: str, arch: str) -> bool:
    """True if path should be kept for a freeze targeting ``arch``."""
    if not path or not os.path.isfile(path):
        return True

    lower = path.lower()
    base = os.path.basename(lower)
    if not (lower.endswith((".dylib", ".so", ".dll")) or ".so." in base):
        return True

    real = os.path.realpath(path)
    if not os.path.isfile(real):
        return True

    report = _file_report(real)
    if not report:
        return True

    if "universal binary" in report:
        return arch in report

    if arch == "arm64":
        if "x86_64" in report and "arm64" not in report:
            return False
        return "arm64" in report or "arm64e" in report
    if arch == "x86_64":
        if "arm64" in report and "x86_64" not in report:
            return False
        return "x86_64" in report

    return True


def is_foreign_host_prefix(path: str) -> bool:
    """True if path is under Homebrew prefixes that must not enter the freeze."""
    if not path:
        return False
    real = os.path.realpath(path)
    return real.startswith("/usr/local/") or real.startswith("/opt/homebrew/")


def replacement_search_roots() -> List[str]:
    """Only the active conda env — matches GitHub Actions packaging."""
    roots: List[str] = []
    conda = os.environ.get("CONDA_PREFIX")
    if conda:
        roots.append(os.path.join(conda, "lib"))
        # Windows-style conda layout is unused on darwin but harmless if present.
        win_bin = os.path.join(conda, "Library", "bin")
        if os.path.isdir(win_bin):
            roots.append(win_bin)
    return roots


def conda_binary_entries(
    basenames: Iterable[str],
    *,
    dest: str = ".",
) -> List[tuple]:
    """Return Analysis binary tuples ``(src, dest)`` for basenames under CONDA_PREFIX.

    Missing files are skipped (with a log line). Used to seed the freeze with
    conda-forge natives (e.g. libvips) so PyInstaller can follow their deps.
    """
    entries: List[tuple] = []
    roots = replacement_search_roots()
    if not roots:
        print("[binary_arch] conda_binary_entries: CONDA_PREFIX not set; skipping")
        return entries
    for basename in basenames:
        if not basename or is_never_bundle_basename(basename):
            continue
        found = None
        for root in roots:
            candidate = os.path.join(root, basename)
            if os.path.isfile(candidate):
                found = candidate
                break
        if found:
            print(f"[binary_arch] conda seed: {found}")
            entries.append((found, dest))
        else:
            print(f"[binary_arch] conda seed missing: {basename} (roots={roots})")
    return entries


def find_arch_compatible_replacement(src: str, arch: str) -> Optional[str]:
    """Find the same basename under CONDA_PREFIX that matches ``arch``."""
    basename = os.path.basename(src)
    if not basename or is_never_bundle_basename(basename):
        return None
    for root in replacement_search_roots():
        candidate = os.path.join(root, basename)
        if os.path.isfile(candidate) and binary_compatible_with_arch(candidate, arch):
            return candidate
    return None


def filter_binaries(
    binaries: Iterable[BinaryEntry],
    arch: str | None = None,
    *,
    drop_foreign_hosts: bool = True,
    replace_from_conda: bool = True,
) -> List[BinaryEntry]:
    """Keep arch-compatible binaries; drop Homebrew hosts; replace only from conda."""
    want = arch or build_arch()
    kept: List[BinaryEntry] = []
    dropped = 0
    replaced = 0
    for entry in binaries:
        if not entry or len(entry) < 2:
            kept.append(entry)
            continue
        dest_name = entry[0]
        src = entry[1]
        typecode = entry[2] if len(entry) > 2 else "BINARY"

        if is_never_bundle_basename(src) or is_never_bundle_basename(str(dest_name)):
            print(f"[binary_arch] drop (never-bundle): {src}")
            dropped += 1
            continue

        if is_openslide_bin_host_path(str(src)) or is_openslide_bin_host_path(str(dest_name)):
            if replace_from_conda:
                alt = find_arch_compatible_replacement(src, want)
                if alt:
                    print(f"[binary_arch] replace (openslide_bin -> conda): {src} -> {alt}")
                    kept.append((dest_name, alt, typecode))
                    replaced += 1
                    continue
            print(f"[binary_arch] drop (openslide_bin): {src}")
            dropped += 1
            continue

        if drop_foreign_hosts and is_foreign_host_prefix(src):
            if replace_from_conda:
                alt = find_arch_compatible_replacement(src, want)
                if alt:
                    print(f"[binary_arch] replace (host -> conda): {src} -> {alt}")
                    kept.append((dest_name, alt, typecode))
                    replaced += 1
                    continue
            print(f"[binary_arch] drop (foreign host): {src}")
            dropped += 1
            continue

        if not binary_compatible_with_arch(src, want):
            if replace_from_conda:
                alt = find_arch_compatible_replacement(src, want)
                if alt:
                    print(f"[binary_arch] replace (arch mismatch -> conda): {src} -> {alt}")
                    kept.append((dest_name, alt, typecode))
                    replaced += 1
                    continue
            print(f"[binary_arch] drop (arch mismatch want={want}): {src}")
            dropped += 1
            continue
        kept.append(entry)
    print(f"[binary_arch] kept={len(kept)} dropped={dropped} replaced={replaced} arch={want}")
    return kept


def assert_no_foreign_host_binaries(binaries: Iterable[BinaryEntry], *, context: str = "") -> None:
    """Fail the freeze if any TOC source still points at Homebrew prefixes."""
    bad: List[str] = []
    for entry in binaries:
        if not entry or len(entry) < 2:
            continue
        src = entry[1]
        if is_foreign_host_prefix(src):
            bad.append(str(src))
    if bad:
        sample = "\n  ".join(bad[:20])
        more = f"\n  ... and {len(bad) - 20} more" if len(bad) > 20 else ""
        raise RuntimeError(
            f"Freeze hygiene failed{(' (' + context + ')') if context else ''}: "
            f"{len(bad)} binary source(s) under /usr/local or /opt/homebrew. "
            f"Build only from the sliderelabeler conda env (see environment-macos.yml). "
            f"Examples:\n  {sample}{more}"
        )
    print(
        f"[binary_arch] freeze hygiene OK{(' (' + context + ')') if context else ''}: "
        f"no Homebrew host binaries"
    )


# Basenames Pillow (and similar) may ship as slim shims under nested .dylibs/
# that lack symbols conda/pango need (e.g. harfbuzz CoreText). Also force
# openslide/libtiff from CONDA_PREFIX so pip openslide-bin / mac-bin cannot win.
_CONDA_TOP_LEVEL_OVERRIDE_BASENAMES = (
    "libharfbuzz.0.dylib",
    "libharfbuzz.dylib",
    "libfreetype.6.dylib",
    "libpng16.16.dylib",
    "libjpeg.62.dylib",
    "libopenjp2.2.5.3.dylib",
    "libopenjp2.7.dylib",
    "libxcb.1.dylib",
    "liblzma.5.dylib",
    "libopenslide.1.dylib",
    "libopenslide.dylib",
    "libtiff.6.dylib",
    "libtiff.dylib",
)


def override_binaries_from_conda(
    binaries: Iterable[BinaryEntry],
    basenames: Sequence[str] | None = None,
) -> List[BinaryEntry]:
    """Force shared basenames to CONDA_PREFIX copies (top-level + nested shims)."""
    names = tuple(basenames) if basenames is not None else _CONDA_TOP_LEVEL_OVERRIDE_BASENAMES
    override_src = {}
    for basename in names:
        if is_never_bundle_basename(basename):
            continue
        for root in replacement_search_roots():
            candidate = os.path.join(root, basename)
            if os.path.isfile(candidate) and binary_compatible_with_arch(candidate, build_arch()):
                override_src[basename] = candidate
                break
    if not override_src:
        return list(binaries)

    kept: List[BinaryEntry] = []
    top_seen = set()
    for entry in binaries:
        if not entry or len(entry) < 2:
            kept.append(entry)
            continue
        dest_name = str(entry[0])
        src = entry[1]
        typecode = entry[2] if len(entry) > 2 else "BINARY"
        base = os.path.basename(dest_name) or os.path.basename(str(src))
        if base in override_src:
            new_src = override_src[base]
            print(f"[binary_arch] override -> conda: {dest_name} <- {new_src}")
            kept.append((dest_name, new_src, typecode))
            if "/" not in dest_name.replace("\\", "/").strip("./"):
                top_seen.add(base)
            continue
        kept.append(entry)
        if "/" not in dest_name.replace("\\", "/").strip("./"):
            top_seen.add(os.path.basename(dest_name))

    for base, src in override_src.items():
        if base not in top_seen:
            print(f"[binary_arch] append top-level conda: {base} <- {src}")
            kept.append((base, src, "BINARY"))
    return kept


def install_conda_top_level_dylibs(
    bundle_internal: str,
    basenames: Sequence[str] | None = None,
) -> None:
    """After COLLECT, replace top-level dylibs/symlinks with real CONDA_PREFIX copies.

    PyInstaller often turns top-level names into SYMLINKs into PIL/.dylibs shims.
    """
    if not bundle_internal or not os.path.isdir(bundle_internal):
        print(f"[binary_arch] skip install; missing {bundle_internal}")
        return
    names = tuple(basenames) if basenames is not None else _CONDA_TOP_LEVEL_OVERRIDE_BASENAMES
    # Also force the seeded vips/glib stack so nested shims cannot win.
    names = names + (
        "libvips.42.dylib",
        "libvips-cpp.42.dylib",
        "libglib-2.0.0.dylib",
        "libgobject-2.0.0.dylib",
        "libgio-2.0.0.dylib",
        "libgmodule-2.0.0.dylib",
        "libintl.8.dylib",
        "libiconv.2.dylib",
        "libgdk_pixbuf-2.0.0.dylib",
        "libcairo.2.dylib",
        "libpango-1.0.0.dylib",
        "libpangocairo-1.0.0.dylib",
        "libpangoft2-1.0.0.dylib",
        "libfontconfig.1.dylib",
        "libfribidi.0.dylib",
        "libopenslide.1.dylib",
        "libopenslide.dylib",
        "libtiff.6.dylib",
        "libtiff.dylib",
    )
    seen = set()
    for basename in names:
        if not basename or basename in seen or is_never_bundle_basename(basename):
            continue
        seen.add(basename)
        src = None
        for root in replacement_search_roots():
            candidate = os.path.join(root, basename)
            if os.path.isfile(candidate):
                src = candidate
                break
        if not src:
            continue
        target = os.path.join(bundle_internal, basename)
        try:
            if os.path.lexists(target):
                os.remove(target)
            shutil.copy2(src, target)
            print(f"[binary_arch] installed top-level {basename} <- {src}")
        except OSError as err:
            print(f"[binary_arch] failed installing {basename}: {err}")
