"""Platform detection for large_image tiff_reader / pylibtiff #189 guard."""
from __future__ import annotations

import os
import platform

_ARM64_MACHINES = frozenset({"arm64", "aarch64"})


def should_patch_libtiff(
    env: str | None = None,
    *,
    system: str | None = None,
    machine: str | None = None,
) -> bool:
  """
  Whether to install libtiff_guard before large_image_source_tiff.tiff_reader loads.

  SLIDERELABELER_PATCH_LIBTIFF:
    1 — force on
    0 — force off
    unset — auto: darwin + arm64 (confirmed SlideRelabeler crash platform)
  """
  flag = env if env is not None else os.environ.get("SLIDERELABELER_PATCH_LIBTIFF", "")
  flag = flag.strip()
  if flag == "1":
    return True
  if flag == "0":
    return False
  sys_name = system if system is not None else platform.system()
  mach = (machine if machine is not None else platform.machine()).lower()
  return sys_name == "Darwin" and mach in _ARM64_MACHINES


def patch_libtiff_mode(
    env: str | None = None,
    *,
    system: str | None = None,
    machine: str | None = None,
) -> str | None:
  """Return 'forced', 'auto', or None when patch is off."""
  if not should_patch_libtiff(env, system=system, machine=machine):
    return None
  flag = env if env is not None else os.environ.get("SLIDERELABELER_PATCH_LIBTIFF", "")
  flag = flag.strip()
  return "forced" if flag == "1" else "auto"
