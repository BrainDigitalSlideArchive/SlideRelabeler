"""Resolve output file extensions for de-identified WSI files.

Default: normalize to a format-canonical extension.
Optional: preserve the source extension exactly (including case).
"""

from __future__ import annotations

from typing import Optional

# Canonical extensions when normalize is on (leading dot).
CANONICAL_OUTPUT_EXTENSIONS = {
    'aperio': '.svs',
    'hamamatsu': '.ndpi',
    'philips': '.tiff',
    'ometiff': '.ome.tif',
    'czi': '.czi',
}


def normalize_extension(ext: Optional[str]) -> str:
    """Return extension with a leading dot, or '' if empty."""
    if ext is None:
        return ''
    text = str(ext).strip()
    if not text:
        return ''
    if not text.startswith('.'):
        text = '.' + text
    return text


def resolve_output_extension(
    format_name: Optional[str],
    source_ext: Optional[str],
    preserve_source_extension: bool = False,
) -> str:
    """
    Choose the output file extension.

    :param format_name: Vendor format key (aperio, philips, …) or None.
    :param source_ext: Source path extension (e.g. ``.tif`` / ``.TIF``).
    :param preserve_source_extension: If True, keep ``source_ext`` exactly
        when non-empty; otherwise use the canonical extension for ``format_name``.
    :returns: Extension including a leading dot.
    """
    source = normalize_extension(source_ext)
    canonical = CANONICAL_OUTPUT_EXTENSIONS.get(format_name or '')
    if not canonical:
        canonical = source if source else '.tiff'

    if preserve_source_extension:
        if source:
            return source
        return canonical

    return canonical
