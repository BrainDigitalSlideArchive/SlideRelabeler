"""Shared helpers for mac-metadata-sigbus repro scripts."""
from __future__ import annotations

import os
import sys
from pathlib import Path

KIT_DIR = Path(__file__).resolve().parent
REPO_ROOT = KIT_DIR.parent.parent
PYTHON_SRC = REPO_ROOT / "src" / "python"


def load_svs_path() -> str:
    path = os.environ.get("SVS_PATH", "").strip()
    if not path:
        local_env = KIT_DIR / "config.local.env"
        if local_env.is_file():
            for line in local_env.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("SVS_PATH="):
                    path = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not path:
        raise SystemExit(
            "Set SVS_PATH in config.local.env (copy from config.example.env) or export SVS_PATH"
        )
    if not os.path.isfile(path):
        raise SystemExit(f"SVS_PATH not found: {path}")
    return path


def ensure_deidtools_path() -> None:
    src = str(PYTHON_SRC)
    if src not in sys.path:
        sys.path.insert(0, src)


def step_start(name: str) -> None:
    print(f"{name} START", flush=True)


def step_ok(name: str, **kwargs) -> None:
    parts = " ".join(f"{k}={v}" for k, v in kwargs.items())
    print(f"{name} OK" + (f" {parts}" if parts else ""), flush=True)


def decode_exit_code(code: int) -> str:
    if code == 0:
        return "OK"
    if code == 138:
        return "SIGBUS (128+10)"
    if code == 139:
        return "SIGSEGV (128+11)"
    if code < 0:
        return f"signal {-code}"
    return str(code)
