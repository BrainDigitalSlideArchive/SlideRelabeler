# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_entry_point, collect_all, copy_metadata
import sys, os, shutil

bins = []
datas = []
hiddenimports = []

# If in windows environment copy the libopenslide-1.dll to the python environment Library/bin directory
# This must be done in conda environment given reliance on binaries for several libraries within a windows environment
# Paths here relative to pyinstaller/engine.spec
if sys.platform == 'win32':
    large_image_path = os.path.join('C:\\', 'GitHub', 'SlideRelabeler', 'src', 'python', 'LargeImageTools')
    abs_bin_path = os.path.join(large_image_path, 'win-bin')
    abs_share_path = os.path.join(large_image_path, 'win-share')
    abs_include_path = os.path.join(large_image_path, 'win-include')

    source_path = os.path.join(abs_bin_path, 'libopenslide-1.dll')
    conda_copy_path = os.path.join(os.environ['CONDA_PREFIX'], 'Library', 'bin', 'libopenslide-1.dll')
    shutil.copy(source_path, conda_copy_path)
    print("Copied libopenslide-1.dll to conda python environment Library/bin directory {}".format(conda_copy_path))

    bins = [
        (os.path.join(abs_bin_path, 'libglib-2.0-0.dll'), '.'),
        (os.path.join(abs_bin_path, 'libgobject-2.0-0.dll'), '.'),
        (os.path.join(abs_bin_path, 'libopenslide-1.dll'), '.'),
        (os.path.join(abs_bin_path, 'libvips-42.dll'), '.'),
        (os.path.join(abs_bin_path, 'libvips-cpp-42.dll'), '.'),
        (os.path.join(abs_bin_path, 'vips.exe'), '.'),
        (os.path.join(abs_bin_path, 'vipsedit.exe'), '.'),
        (os.path.join(abs_bin_path, 'vipsheader.exe'), '.'),
        (os.path.join(abs_bin_path, 'vipsthumbnail.exe'), '.')
    ]
    datas += [
        # (os.path.join(abs_share_path, 'gdal'), 'gdal'),
        (os.path.join(abs_include_path, 'tiff.h'), 'include'),
    ]
else:
    bins = binaries

d, b, h = collect_all("openslide")
datas += d
bins += b
hiddenimports += h

a = Analysis(
    ['./test_openslide.py'],
    pathex=[],
    binaries=bins,
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
    name='test_openslide',
    debug=True,
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
    name='test_openslide',
)
