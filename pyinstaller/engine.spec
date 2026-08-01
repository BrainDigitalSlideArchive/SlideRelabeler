# -*- mode: python ; coding: utf-8 -*-

# todo: Add binaries for ffmpeg in the windows production environment.
# todo: Add help readmes based on build platform.

from PyInstaller.utils.hooks import collect_entry_point, collect_all, collect_data_files, collect_submodules
from PyInstaller.utils.hooks import copy_metadata
import imagecodecs
import os, sys, subprocess, shutil
import grpc
import grpc_health

# Arch filter helpers live next to this spec.
_SPEC_DIR = globals().get("SPECPATH") or os.path.dirname(os.path.abspath(globals().get("SPEC", "pyinstaller/engine.spec")))
if _SPEC_DIR not in sys.path:
    sys.path.insert(0, _SPEC_DIR)
from binary_arch import (  # noqa: E402
    build_arch,
    filter_binaries,
    assert_no_foreign_host_binaries,
    conda_binary_entries,
    override_binaries_from_conda,
    install_conda_top_level_dylibs,
)

print("Current working directory: {}".format(os.getcwd()))
print("Freeze build arch: {}".format(build_arch()))
print("Spec dir: {}".format(_SPEC_DIR))

# Current version of application
version = '0.0.2'

deid_tools_path = './src/python/DeidTools'
# large_image_path_abs = os.path.abspath(large_image_path)
# Vendored DeidTools *-bin trees are used on Windows. On macOS, freeze natives
# come from the sliderelabeler conda env (environment-macos.yml). Linux relies on
# the env as well (pip openslide-bin / pyvips, etc.).
abs_fonts_path = os.path.abspath(os.path.join(deid_tools_path, 'fonts'))
abs_bin_path = abs_include_path = abs_share_path = None
bin_path = include_path = share_path = None

if sys.platform == 'win32':
    bin_path = os.path.join(deid_tools_path, 'win-bin')
    include_path = os.path.join(deid_tools_path, 'win-include')
    share_path = os.path.join(deid_tools_path, 'win-share')
    abs_bin_path = os.path.abspath(bin_path)
    abs_include_path = os.path.abspath(include_path)
    abs_share_path = os.path.abspath(share_path)
elif sys.platform == 'darwin':
    bin_path = os.path.join(deid_tools_path, 'mac-bin')
    include_path = os.path.join(deid_tools_path, 'mac-include')
    share_path = os.path.join(deid_tools_path, 'mac-share')
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
hiddenimports = ['frozen_dylib_prefer']
# Prefer bundled dylibs before engine.py imports (also called from engine.py).
runtime_hooks = [os.path.join(_SPEC_DIR, 'runtime_hook.py')]

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

# Ship .py sources so libtiff_guard can patch tiff_reader in frozen builds
# (PYZ-only bytecode has no readable origin path on disk).
datas += collect_data_files('large_image_source_tiff', include_py_files=True)
hiddenimports += collect_submodules('large_image_source_tiff')

d, b, h = collect_all('libtiff')
datas += d
binaries += b
hiddenimports += h

d, b, h = collect_all('tifftools')
datas += d
binaries += b
hiddenimports += h

# --- Force-collect gRPC core (grpcio) ---
d_grpc, b_grpc, h_grpc = collect_all("grpc")
datas += d_grpc
binaries += b_grpc
hiddenimports += h_grpc

# grpcio uses a compiled extension grpc._cython.cygrpc; force it explicitly too
hiddenimports += ["grpc._cython", "grpc._cython.cygrpc"]

# --- Force-collect grpc_health (grpcio-health-checking) ---
d_gh, b_gh, h_gh = collect_all("grpc_health")
datas += d_gh
binaries += b_gh
hiddenimports += h_gh

# (Optional but helpful) include distribution metadata
datas += copy_metadata("grpcio")
datas += copy_metadata("grpcio-health-checking")

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
    # Conda-forge natives only (matches environment-macos.yml / CI). Analysis
    # follows dylib deps. Do not seed DeidTools/mac-bin OpenSlide — it expects
    # system _iconv and breaks when conda libiconv is on DYLD_LIBRARY_PATH.
    bins = binaries + conda_binary_entries([
        'libopenslide.1.dylib',
        'libopenslide.dylib',
        'libtiff.6.dylib',
        'libtiff.dylib',
        'libvips.42.dylib',
        'libvips-cpp.42.dylib',
        'libglib-2.0.0.dylib',
        'libgobject-2.0.0.dylib',
        'libgio-2.0.0.dylib',
        'libgmodule-2.0.0.dylib',
        'libintl.8.dylib',
        'libiconv.2.dylib',
        'libgdk_pixbuf-2.0.0.dylib',
        'libcairo.2.dylib',
        'libpango-1.0.0.dylib',
        'libpangocairo-1.0.0.dylib',
        'libpangoft2-1.0.0.dylib',
        'libharfbuzz.0.dylib',
        'libfontconfig.1.dylib',
        'libfribidi.0.dylib',
        'libexif.12.dylib',
        'librsvg-2.2.dylib',
    ])
    bins = filter_binaries(bins)

else:
    bins = binaries

datas += [
        # Upstream DeidTools.add_text_to_image loads
        # dirname(__file__)/fonts/DejaVuSansMono.ttf — must sit under DeidTools/, not _MEIPASS/fonts.
        (abs_fonts_path, 'DeidTools/fonts'),
    ]

a = Analysis(
    ['../src/python/engine.py'],
    pathex=[],
    binaries=bins,
    datas=datas,
    hiddenimports=hiddenimports + [
        'grpc',
        'grpc._cython.cygrpc',
        'grpc_health.v1.health',
        'grpc_health.v1.health_pb2',
        'grpc_health.v1.health_pb2_grpc',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=runtime_hooks,
    # Force pyvips cffi path; host-built _libvips*.so often links Homebrew.
    # openslide_bin ships a system-iconv OpenSlide that clashes with conda libiconv.
    excludes=['_libvips', 'openslide_bin'],
    noarchive=False,
)


# Analysis discovers additional binaries; keep conda env only on darwin.
if sys.platform == 'darwin':
    a.binaries = filter_binaries(a.binaries)
    a.binaries = override_binaries_from_conda(a.binaries)
    assert_no_foreign_host_binaries(a.binaries, context='after Analysis')

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
    # COLLECT often rewrites top-level dylibs as SYMLINKs into PIL/.dylibs shims.
    _dist = globals().get("DISTPATH") or os.path.join(os.getcwd(), "dist")
    _internal = os.path.join(_dist, "engine.app", "_internal")
    install_conda_top_level_dylibs(_internal)

else:
    coll = COLLECT(
        exe,
        a.binaries,
        a.zipfiles,
        a.datas,
        strip=False,
        upx=True,
        upx_exclude=[],
        name='engine',
    )
