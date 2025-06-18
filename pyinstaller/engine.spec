# -*- mode: python ; coding: utf-8 -*-

# todo: Add binaries for ffmpeg in the windows production environment.
# todo: Add help readmes based on build platform.

from PyInstaller.utils.hooks import collect_entry_point, collect_all, collect_data_files
from PyInstaller.utils.hooks import copy_metadata
import imagecodecs
import os, sys, subprocess, shutil

print("Current working directory: {}".format(os.getcwd()))

# Current version of application
version = '0.0.2'

deid_tools_path = './src/python/DeidTools'
# large_image_path_abs = os.path.abspath(large_image_path)
if sys.platform == 'win32':
    bin_path = os.path.join(deid_tools_path, 'win-bin')
    include_path = os.path.join(deid_tools_path, 'win-include')
    share_path = os.path.join(deid_tools_path, 'win-share')
elif sys.platform == 'darwin':
    bin_path = os.path.join(deid_tools_path, 'mac-bin')
    include_path = os.path.join(deid_tools_path, 'mac-include')
    share_path = os.path.join(deid_tools_path, 'mac-share')

abs_fonts_path = os.path.abspath(os.path.join(deid_tools_path, 'fonts'))
abs_bin_path = os.path.abspath(bin_path)
abs_include_path = os.path.abspath(include_path)
abs_share_path = os.path.abspath(share_path)

# If in windows environment copy the libopenslide-1.dll to the python environment Library/bin directory
# This must be done in conda environment given reliance on binaries for several libraries within a windows environment
if sys.platform == 'win32':
    source_path = os.path.join(abs_bin_path, 'libopenslide-1.dll')
    conda_copy_path = os.path.join(os.environ['CONDA_PREFIX'], 'Library', 'bin', 'libopenslide-1.dll')
    shutil.copy(source_path, conda_copy_path)
    print("Copied libopenslide-1.dll to conda python environment Library/bin directory {}".format(conda_copy_path))

datas = []
binaries = []
hiddenimports = []
runtime_hooks = []

d, h = collect_entry_point("large_image.source")
datas += d
hiddenimports += h

d, b, h = collect_all("deprecated")
datas += d
binaries += b
hiddenimports += h


d, h = collect_entry_point("large_image.cache")
datas += d
hiddenimports += h

import pkgutil
import rasterio

d, b, h = collect_all('openslide')
datas += d
binaries += b
hiddenimports += h

d, b, h = collect_all('large_image_source_openslide')
datas += d
binaries += b
hiddenimports += h

d, b, h = collect_all('large_image_source_gdal')
datas += d
binaries += b
hiddenimports += h

d, b, h = collect_all('libtiff')
datas += d
binaries += b
hiddenimports += h

d, b, h = collect_all('tifftools')
datas += d
binaries += b
hiddenimports += h

hiddenimports = hiddenimports + ["imagecodecs." + x for x in imagecodecs._extensions()] # + ["imagecodecs._shared"]

print("hidden imports...", hiddenimports)

# list all rasterio submodules, to include them in the package
for package in pkgutil.iter_modules(rasterio.__path__, prefix="rasterio."):
    hiddenimports.append(package.name)

# Paths here relative to pyinstaller/engine.spec
if sys.platform == 'win32':
    bin_path_spec = os.path.join('..', bin_path)
    share_path_spec = os.path.join('..', share_path)
    include_path_spec = os.path.join('..', include_path)
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
    ] + binaries
    datas += [
        (os.path.join(abs_share_path, 'gdal'), 'gdal'),
        (os.path.join(abs_include_path, 'tiff.h'), 'include'),
        (os.path.join('.', 'readme', 'README_windows.md'), 'README.md'),
    ]
elif sys.platform == 'darwin':
    bins = [
        (os.path.join(abs_bin_path, 'libopenslide.1.dylib'), '.'),
        (os.path.join(abs_bin_path, 'libtiff.dylib'), '.'),
    ] + binaries

    # runtime_hooks.append('./pyinstaller/runtime_hook.py')

else:
    bins = binaries

datas += [
        (abs_fonts_path, 'fonts'),
    ]

a = Analysis(
    ['../src/python/engine.py'],
    pathex=[],
    binaries=bins,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=runtime_hooks,
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

if sys.platform == 'darwin':
    coll = COLLECT(
                   exe,
                   a.binaries,
                   a.datas,
                   strip=False,
                   upx=True,
                   upx_exclude=[],
                   name='engine.app',
               )

else:
    coll = COLLECT(
        exe,
        a.binaries,
        a.datas,
        strip=False,
        upx=True,
        upx_exclude=[],
        name='engine',
    )
