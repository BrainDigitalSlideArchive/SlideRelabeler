"""CZI metadata scrub helpers for Zeiss .czi de-identification.

Aggressively sanitizes PHI-bearing XML leaves while preserving mechanical
structure (Scaling, Dimensions, Instrument, channel geometry). Uses local-name
XPath so namespaces do not matter.

Approach: scrub existing metadata XML in place and commit via pylibCZIrw
``edit_czi`` / ``set_xml``. Neither pylibCZIrw nor libCZI can regenerate a
fresh “acquisition-only” metadata tree on an existing slide; create-time
``write_metadata`` only synthesizes minimal geometry from newly written
pixels.

Format reference: the ZISRAW (CZI) File Format specification (Carl Zeiss /
ZEN era PDF) describes the Metadata segment as UTF-8 XML under
``ImageDocument`` (Information, Layers, DisplaySetting, Scaling,
CustomAttributes, …). XML is largely optional for decode — dimensions and
pixel types live in binary SubBlock / SubBlockDirectory segments — so
dropping PHI containers such as AutoSave does not break reopen.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

from lxml import etree as lxmlElementTree

# Legacy redactList keys → XPath (still honored when present in redactList).
CZI_REDACT_FIELD_XPATHS: Dict[str, str] = {
    'czi;Document.Title': (
        './/*[local-name()="Document"]/*[local-name()="Title"]'
    ),
    'czi;Document.Name': (
        './/*[local-name()="Document"]/*[local-name()="Name"]'
    ),
    'czi;Document.UserName': (
        './/*[local-name()="Document"]/*[local-name()="UserName"]'
    ),
    'czi;Document.Description': (
        './/*[local-name()="Document"]/*[local-name()="Description"]'
    ),
    'czi;Document.Comment': (
        './/*[local-name()="Document"]/*[local-name()="Comment"]'
    ),
    'czi;Document.Keywords': (
        './/*[local-name()="Document"]/*[local-name()="Keywords"]'
    ),
    'czi;Barcode.Content': (
        './/*[local-name()="Barcodes"]/*[local-name()="Barcode"]'
        '/*[local-name()="Content"]'
    ),
}

# Subtrees removed entirely when found (local-name match).
CZI_PHI_CONTAINER_LOCAL_NAMES: Set[str] = {
    'CustomAttributes',
    'CustomAttributesList',
    'Patient',
    'Patients',
    'Specimen',
    'Specimens',
    'Experimenter',
    'Experimenters',
    'User',
    'Users',
    'Annotation',
    'Annotations',
    'Layers',
    'Layer',
    'AppInfo',  # may contain user/machine paths; mechanical reopen does not need it
    'AutoSave',  # paths / ImageName / StorageFolder; ZEN session bookkeeping
}

# Local-names under Document that are rewritten or cleared.
CZI_DOCUMENT_TITLE_NAMES = {'Title', 'Name'}
CZI_DOCUMENT_CLEAR_NAMES = {'UserName', 'Description', 'Comment', 'Keywords'}

# Timestamp leaves year-coarsened (Aperio/Hamamatsu-style), not blanked.
CZI_YEAR_COARSEN_LOCAL_NAMES = {
    'AcquisitionDateAndTime',
    'CreationDate',
    'CreationDateTime',
}

# Mechanical containers never removed as wholes.
CZI_KEEP_CONTAINER_LOCAL_NAMES: Set[str] = {
    'Scaling',
    'Dimensions',
    'Image',
    'Instrument',
    'Instruments',
    'Channels',
    'Channel',
    'DisplaySetting',
    'DisplaySettings',
    'Information',
    'Metadata',
    'ImageDocument',
    'PixelType',
    'SizeX',
    'SizeY',
    'SizeZ',
    'SizeC',
    'SizeT',
    'SizeS',
    'SizeM',
    'SizeB',
    'SizeH',
    'SizeI',
    'SizeV',
}

_ISO_TZ_TAIL = re.compile(r'(Z|[+-]\d{2}:?\d{2})$', re.IGNORECASE)


def _local_name(el) -> str:
    tag = el.tag if isinstance(el.tag, str) else ''
    if '}' in tag:
        return tag.rsplit('}', 1)[-1]
    return tag


def _element_text(el) -> str:
    if el is None:
        return ''
    text = el.text
    return '' if text is None else str(text)


def _set_element_text(el, value: Optional[str]) -> None:
    if value is None:
        el.text = ''
    else:
        el.text = str(value)


def _path_key(parts: List[str]) -> str:
    return 'czi;' + '.'.join(parts)


def _record_change(
    prior: Dict[str, str],
    after: Dict[str, str],
    key: str,
    old: str,
    new: str,
) -> None:
    if old == new:
        return
    # Keep first prior if key already recorded (multi-hit barcodes get indexed keys).
    prior.setdefault(key, old)
    after[key] = new


def _year_coarsen_iso_datetime(value: str) -> Optional[str]:
    """
    Return ``{year}-01-01T00:00:00Z`` if ``value`` parses as a datetime.

    Strips a trailing Z / offset before parsing (same idea as czifile).
    Returns None if the value cannot be parsed.
    """
    raw = (value or '').strip()
    if not raw:
        return None
    candidate = _ISO_TZ_TAIL.sub('', raw).strip()
    # fromisoformat accepts "YYYY-MM-DDTHH:MM:SS[.fff]" and space separator.
    for attempt in (candidate, candidate.replace(' ', 'T', 1)):
        try:
            dt = datetime.fromisoformat(attempt)
            return f'{dt.year:04d}-01-01T00:00:00Z'
        except ValueError:
            continue
    # Compact YYYYMMDD[HHMMSS] fallbacks sometimes seen in instrument dumps.
    digits = re.sub(r'\D', '', candidate)
    if len(digits) >= 4 and digits[:4].isdigit():
        year = int(digits[:4])
        if 1 <= year <= 9999:
            return f'{year:04d}-01-01T00:00:00Z'
    return None


def collect_czi_field_values(root) -> Dict[str, str]:
    """Return first-match text for each known CZI redact field key."""
    out: Dict[str, str] = {}
    for key, xpath in CZI_REDACT_FIELD_XPATHS.items():
        nodes = root.xpath(xpath)
        if not nodes:
            continue
        if key == 'czi;Barcode.Content' and len(nodes) > 1:
            out[key] = ' | '.join(_element_text(n) for n in nodes)
        else:
            out[key] = _element_text(nodes[0])
    return out


def apply_czi_redact_list_to_xml(
    xml_string: str,
    redact_metadata: Dict[str, Any],
) -> Tuple[str, Dict[str, str], Dict[str, str]]:
    """
    Apply redactList['metadata'] entries to CZI XML (legacy narrow scrub).

    Prefer :func:`sanitize_czi_metadata_xml` for Process / Compare.
    """
    root = lxmlElementTree.fromstring(
        xml_string.encode('utf-8') if isinstance(xml_string, str) else xml_string
    )
    prior = collect_czi_field_values(root)

    for key, entry in (redact_metadata or {}).items():
        xpath = CZI_REDACT_FIELD_XPATHS.get(key)
        if not xpath or not isinstance(entry, dict) or 'value' not in entry:
            continue
        nodes = root.xpath(xpath)
        if not nodes:
            continue
        new_value = entry.get('value')
        for node in nodes:
            _set_element_text(node, new_value)

    after = collect_czi_field_values(root)
    scrubbed = lxmlElementTree.tostring(
        root, encoding='unicode', xml_declaration=False
    )
    return scrubbed, prior, after


def _collect_text_leaves(el, parts: List[str], out: Dict[str, str]) -> None:
    """Collect text-bearing leaves under el into out keyed by path."""
    name = _local_name(el)
    path = parts + ([name] if name else [])
    children = list(el)
    text = _element_text(el).strip()
    if text and not children:
        key = _path_key(path)
        # Disambiguate duplicates.
        if key in out:
            i = 1
            while f'{key}[{i}]' in out:
                i += 1
            key = f'{key}[{i}]'
        out[key] = _element_text(el)
    for child in children:
        _collect_text_leaves(child, path, out)


def _remove_phi_containers(root, prior: Dict[str, str], after: Dict[str, str]) -> None:
    """Remove PHI-ish containers; record each removed leaf as cleared."""
    to_remove = []
    for el in root.iter():
        if el is root:
            continue
        if _local_name(el) in CZI_PHI_CONTAINER_LOCAL_NAMES:
            to_remove.append(el)

    for el in to_remove:
        parent = el.getparent()
        if parent is None:
            continue
        # Path prefix for reporting.
        chain = []
        cur = el
        while cur is not None and cur is not root:
            n = _local_name(cur)
            if n:
                chain.append(n)
            cur = cur.getparent()
        chain.reverse()
        leaves: Dict[str, str] = {}
        _collect_text_leaves(el, chain[:-1] if chain else [], leaves)
        for key, old in leaves.items():
            _record_change(prior, after, key, old, '')
        parent.remove(el)


def _sanitize_document_and_barcodes(
    root,
    title: str,
    prior: Dict[str, str],
    after: Dict[str, str],
) -> None:
    title_str = '' if title is None else str(title)

    for doc in root.xpath('.//*[local-name()="Document"]'):
        for child in list(doc):
            ln = _local_name(child)
            if ln in CZI_DOCUMENT_TITLE_NAMES:
                old = _element_text(child)
                _set_element_text(child, title_str)
                _record_change(prior, after, f'czi;Document.{ln}', old, title_str)
            elif ln in CZI_DOCUMENT_CLEAR_NAMES:
                old = _element_text(child)
                _set_element_text(child, '')
                _record_change(prior, after, f'czi;Document.{ln}', old, '')

    barcode_nodes = root.xpath(
        './/*[local-name()="Barcode"]/*[local-name()="Content"]'
        ' | .//*[local-name()="Barcodes"]/*[local-name()="Barcode"]'
        '/*[local-name()="Content"]'
    )
    for i, node in enumerate(barcode_nodes):
        old = _element_text(node)
        _set_element_text(node, title_str)
        key = 'czi;Barcode.Content' if i == 0 else f'czi;Barcode.Content[{i}]'
        _record_change(prior, after, key, old, title_str)


def _clear_remaining_userish_leaves(
    root,
    prior: Dict[str, str],
    after: Dict[str, str],
) -> None:
    """
    Clear leftover user-facing text leaves that are not under mechanical keep
    containers' critical numeric/type children.

    Clears Comment/Description/UserName/Keywords anywhere still present, and
    Filename / FileName style leaves.
    """
    clear_names = {
        'UserName', 'Description', 'Comment', 'Keywords',
        'Filename', 'FileName', 'OriginalFilename', 'OriginalFileName',
        'Creator', 'Author', 'Operator',
    }
    for el in root.iter():
        ln = _local_name(el)
        if ln not in clear_names:
            continue
        # Skip Document children already handled.
        parent = el.getparent()
        if parent is not None and _local_name(parent) == 'Document':
            continue
        if list(el):
            continue
        old = _element_text(el)
        if not old:
            continue
        _set_element_text(el, '')
        _record_change(prior, after, f'czi;{ln}', old, '')


def _coarsen_timestamp_leaves(
    root,
    prior: Dict[str, str],
    after: Dict[str, str],
) -> None:
    """
    Year-coarsen known acquisition/creation timestamp leaves.

    Does not blanket-clear every Date* under Instrument/Scaling.
    """
    for el in root.iter():
        ln = _local_name(el)
        if ln not in CZI_YEAR_COARSEN_LOCAL_NAMES:
            continue
        if list(el):
            continue
        old = _element_text(el)
        if not old.strip():
            continue
        coarsened = _year_coarsen_iso_datetime(old)
        new = coarsened if coarsened is not None else ''
        _set_element_text(el, new)
        _record_change(prior, after, f'czi;{ln}', old, new)


def sanitize_czi_metadata_xml(
    xml_string: str,
    title: str,
    redact_metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[str, Dict[str, str], Dict[str, str]]:
    """
    Aggressively sanitize CZI metadata XML.

    Keeps mechanical structure (Scaling, Dimensions, Instrument, channels).
    Rewrites Document Title/Name to ``title``, clears user fields and barcodes,
    removes PHI-ish containers (including AutoSave), year-coarsens acquisition
    and document creation timestamps.

    :returns: (scrubbed_xml, prior_map, after_map) for every changed leaf.
    """
    root = lxmlElementTree.fromstring(
        xml_string.encode('utf-8') if isinstance(xml_string, str) else xml_string
    )
    prior: Dict[str, str] = {}
    after: Dict[str, str] = {}

    # Optional title override from redactList (same semantics as legacy).
    effective_title = title
    if redact_metadata:
        for key in ('czi;Document.Title', 'czi;Document.Name'):
            entry = redact_metadata.get(key)
            if isinstance(entry, dict) and entry.get('value') is not None:
                effective_title = entry.get('value')
                break

    _sanitize_document_and_barcodes(root, effective_title, prior, after)
    _remove_phi_containers(root, prior, after)
    _clear_remaining_userish_leaves(root, prior, after)
    _coarsen_timestamp_leaves(root, prior, after)

    # Apply any remaining explicit redactList keys not already covered.
    if redact_metadata:
        for key, entry in redact_metadata.items():
            xpath = CZI_REDACT_FIELD_XPATHS.get(key)
            if not xpath or not isinstance(entry, dict) or 'value' not in entry:
                continue
            nodes = root.xpath(xpath)
            if not nodes:
                continue
            new_value = entry.get('value')
            new_str = '' if new_value is None else str(new_value)
            for i, node in enumerate(nodes):
                old = _element_text(node)
                if old == new_str:
                    continue
                _set_element_text(node, new_value)
                map_key = key if i == 0 else f'{key}[{i}]'
                _record_change(prior, after, map_key, old, new_str)

    scrubbed = lxmlElementTree.tostring(
        root, encoding='unicode', xml_declaration=False
    )
    return scrubbed, prior, after


def flatten_czi_fields_to_fake_ifds(
    prior_values: Dict[str, str],
    after_values: Dict[str, str],
) -> Tuple[List[dict], List[dict]]:
    """
    Build synthetic single-IFD structures for the metadata Compare grid.

    Tag dicts include ``name`` (Zeiss field key) so the UI can label rows without
    TIFF tag tables.
    """
    keys = sorted(set(prior_values) | set(after_values))
    prior_tags: Dict[int, dict] = {}
    after_tags: Dict[int, dict] = {}
    for i, key in enumerate(keys):
        prior_tags[i] = {
            'datatype': 2,
            'data': prior_values.get(key, ''),
            'name': key,
        }
        after_tags[i] = {
            'datatype': 2,
            'data': after_values.get(key, ''),
            'name': key,
        }
    return [{'tags': prior_tags}], [{'tags': after_tags}]


def pretty_print_czi_xml(xml_string: str) -> str:
    """Return consistently indented CZI XML for metadata preview."""
    root = lxmlElementTree.fromstring(
        xml_string.encode('utf-8') if isinstance(xml_string, str) else xml_string
    )
    return lxmlElementTree.tostring(
        root, encoding='unicode', pretty_print=True, xml_declaration=False
    )


def read_czi_metadata_xml(path: str) -> str:
    """Read raw metadata XML from a CZI via pylibCZIrw."""
    try:
        from pylibCZIrw import czi as pyczi
    except ImportError as exc:
        raise RuntimeError(
            'pylibCZIrw is required for CZI metadata de-identification'
        ) from exc

    with pyczi.open_czi(path) as czidoc:
        raw = czidoc.raw_metadata
    if raw is None:
        raise RuntimeError(f'No metadata XML found in CZI: {path}')
    return raw if isinstance(raw, str) else raw.decode('utf-8', errors='replace')


def write_czi_metadata_xml(path: str, scrubbed_xml: str) -> None:
    """In-place commit of scrubbed metadata XML on an existing CZI file."""
    try:
        from pylibCZIrw.czi import edit_czi
    except ImportError as exc:
        raise RuntimeError(
            'pylibCZIrw is required for CZI metadata de-identification'
        ) from exc

    with edit_czi(path) as editor:
        builder = editor.create_metadata_builder()
        builder.set_xml(scrubbed_xml)
        if not builder.can_commit():
            raise RuntimeError(f'CZI metadata builder cannot commit: {path}')
        builder.commit()
