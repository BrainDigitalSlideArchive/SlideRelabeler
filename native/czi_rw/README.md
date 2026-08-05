# Native CZI attachment writer (libCZI ReplaceAttachment)

Normally you do **not** need to build this by hand. It is ensured automatically by:

- [`scripts/with-conda.sh`](../../scripts/with-conda.sh) / [`scripts/with-conda.ps1`](../../scripts/with-conda.ps1) (used by `npm run dev` / `package` / `make`)
- [`build_macos.sh`](../../build_macos.sh) / [`build_windows.ps1`](../../build_windows.ps1)

Those call [`scripts/setup-czi-rw.sh`](../../scripts/setup-czi-rw.sh) or [`scripts/setup-czi-rw.ps1`](../../scripts/setup-czi-rw.ps1), which pin `third_party/libczi` to a known commit, apply patches from [`patches/`](patches/) (detect-or-skip / fail-loud if upstream already fixed or conflicts), and reinstall when the package version bumps.

Manual build (from repo root, with the `sliderelabeler` conda env active):

```bash
bash scripts/setup-czi-rw.sh
# Windows:  .\scripts\setup-czi-rw.ps1
```

Requires **cmake** ≥ 3.15 and a C++17 compiler (`cmake` and `cxx-compiler` are listed in `environment-*.yml`). The wheel exports:

- `sliderelabeler_czi_rw.replace_or_add_attachment(path, name, content_file_type, data)`
- `sliderelabeler_czi_rw.replace_or_add_attachments(path, items)` — batch replace in one open/close
- `sliderelabeler_czi_rw.list_attachment_names(path)`

Python helpers that encode PIL → nested CZI and call this module live in
`src/python/DeidTools/czi_attachment_write.py`.
