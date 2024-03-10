# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_entry_point
import imagecodecs

datas = []
hiddenimports = []

d, h = collect_entry_point("large_image.source")
datas += d
hiddenimports += h


d, h = collect_entry_point("large_image.cache")
datas += d
hiddenimports += h

hiddenimports = hiddenimports + ["imagecodecs." + x for x in imagecodecs._extensions()] # + ["imagecodecs._shared"]


import pkgutil
import rasterio

# list all rasterio submodules, to include them in the package
for package in pkgutil.iter_modules(rasterio.__path__, prefix="rasterio."):
    hiddenimports.append(package.name)

a = Analysis(
    ['../src/python/engine.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='engine',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='engine',
)
