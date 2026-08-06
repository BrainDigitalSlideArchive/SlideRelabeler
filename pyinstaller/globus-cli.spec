# -*- mode: python ; coding: utf-8 -*-
import sys
from PyInstaller.utils.hooks import collect_all

# Collect everything for globus-cli and its main dependency
datas_cli, binaries_cli, hiddenimports_cli = collect_all('globus_cli')
datas_sdk, binaries_sdk, hiddenimports_sdk = collect_all('globus_sdk')

a = Analysis(
    ['../src/python/globus_cli_wrapper.py'],
    pathex=[],
    binaries=binaries_cli + binaries_sdk,
    datas=datas_cli + datas_sdk,
    hiddenimports=hiddenimports_cli + hiddenimports_sdk
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='globus_cli',
    debug=True,
    bootloader_ignore_signals=False,
    strip=False,
    # UPX breaks Developer ID / notarization on macOS; keep enabled elsewhere.
    upx=(sys.platform != 'darwin'),
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

if sys.platform == 'darwin':
    coll = COLLECT(
                   exe,
                   a.binaries,
                   a.datas,
                   strip=False,
                   upx=False,
                   upx_exclude=[],
                   name='globus_cli.app',
               )

else:
    coll = COLLECT(
        exe,
        a.binaries,
        a.zipfiles,
        a.datas,
        strip=False,
        upx=True,
        upx_exclude=[],
        name='globus_cli',
    )
