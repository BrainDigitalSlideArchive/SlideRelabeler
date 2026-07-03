// helpers/csv_column_config.js — CSV reserved column aliases, header linking, and migration.

export const CSV_TEMPLATE_DEFAULT_HEADERS = {
  filePath: 'path',
  outputFolder: 'output_folder',
  outputName: 'output_name',
  label: 'label',
  qr: 'qr',
};

export const CSV_RESERVED_FIELD_KEYS = [
  'filePath',
  'outputName',
  'labelText',
  'qrContent',
];

export const CSV_RESERVED_FIELD_SPECS = [
  {
    key: 'filePath',
    role: 'File path',
    defaultHeader: CSV_TEMPLATE_DEFAULT_HEADERS.filePath,
    required: true,
    helper: 'Which CSV column contains the slide file path. Each row must include a path to load into the file table.',
  },
  {
    key: 'outputName',
    role: 'Output name',
    defaultHeader: CSV_TEMPLATE_DEFAULT_HEADERS.outputName,
    required: false,
    helper: 'When present in a row, overrides Output name defaults from Configuration for that slide.',
  },
  {
    key: 'labelText',
    role: 'Label text',
    defaultHeader: CSV_TEMPLATE_DEFAULT_HEADERS.label,
    required: false,
    helper: 'When present in a row, overrides Slide label text defaults for that slide.',
  },
  {
    key: 'qrContent',
    role: 'QR content',
    defaultHeader: CSV_TEMPLATE_DEFAULT_HEADERS.qr,
    required: false,
    helper: 'When present in a row, overrides Slide label QR content defaults for that slide.',
  },
];

const LEGACY_KEY_MAP = {
  filePath: 'file_path_column',
  outputName: 'file_rename_column',
};

export const DEFAULT_CSV_RESERVED_COLUMNS = {
  filePath: { aliases: [] },
  outputName: { aliases: [] },
  labelText: { aliases: [] },
  qrContent: { aliases: [] },
};

function trimAliases(aliases) {
  if (!Array.isArray(aliases)) return [];
  return aliases
    .map((a) => (a != null ? String(a).trim() : ''))
    .filter(Boolean);
}

function getSpec(fieldKey) {
  return CSV_RESERVED_FIELD_SPECS.find((s) => s.key === fieldKey);
}

/** User-defined alternate header names only (excludes default). */
export function stripDefaultFromAlternates(alternates, defaultHeader) {
  const def = defaultHeader != null ? String(defaultHeader).trim() : '';
  return trimAliases(alternates).filter((a) => a !== def);
}

function normalizeAlternatesForField(rawAliases, defaultHeader, legacyValue, { injectLegacy = false } = {}) {
  const def = defaultHeader != null ? String(defaultHeader).trim() : '';
  let alternates = stripDefaultFromAlternates(rawAliases, def);

  if (injectLegacy) {
    const trimmedLegacy = legacyValue != null ? String(legacyValue).trim() : '';
    if (trimmedLegacy && trimmedLegacy !== def && !alternates.includes(trimmedLegacy)) {
      alternates = [trimmedLegacy, ...alternates];
    }
  }

  return alternates;
}

function legacyColumnForField(reservedColumns, fieldKey) {
  const spec = getSpec(fieldKey);
  const alternates = trimAliases(reservedColumns?.[fieldKey]?.aliases);
  if (alternates.length > 0) return alternates[0];
  return spec?.defaultHeader ?? '';
}

/** Normalize legacy single-string config into reservedColumns shape. */
export function normalizeCsvConfig(csvConfig = {}) {
  const base = { ...csvConfig };
  const hadReservedColumns = base.reservedColumns && typeof base.reservedColumns === 'object';
  let reservedColumns = hadReservedColumns ? { ...base.reservedColumns } : {};

  for (const key of CSV_RESERVED_FIELD_KEYS) {
    const spec = getSpec(key);
    const legacyKey = LEGACY_KEY_MAP[key];
    const legacyValue = legacyKey ? csvConfig[legacyKey] : '';
    const existing = reservedColumns[key];
    reservedColumns[key] = {
      aliases: normalizeAlternatesForField(
        existing?.aliases ?? [],
        spec?.defaultHeader,
        legacyValue,
        { injectLegacy: !hadReservedColumns },
      ),
    };
  }

  return {
    ...base,
    reservedColumns,
    file_path_column: legacyColumnForField(reservedColumns, 'filePath'),
    file_rename_column: legacyColumnForField(reservedColumns, 'outputName'),
  };
}

export function getCsvFieldAliases(csvConfig, fieldKey) {
  const normalized = normalizeCsvConfig(csvConfig);
  return trimAliases(normalized.reservedColumns?.[fieldKey]?.aliases);
}

export function formatCsvHeaderMatchList({ defaultHeader = '', alternates = [] } = {}) {
  const def = defaultHeader != null ? String(defaultHeader).trim() : '';
  const names = [];
  if (def) names.push(def);
  for (const alt of trimAliases(alternates)) {
    if (alt !== def && !names.includes(alt)) names.push(alt);
  }
  return names;
}

/**
 * Default header first, then alternates in list order.
 * Returns { header, header_idx } or null.
 */
export function resolveCsvHeaderLink(headers, options) {
  const list = Array.isArray(headers) ? headers : [];
  const opts = Array.isArray(options)
    ? { alternates: options, defaultHeader: '' }
    : (options ?? {});
  const names = formatCsvHeaderMatchList(opts);

  for (const alias of names) {
    const idx = list.indexOf(alias);
    if (idx !== -1) {
      return { header: list[idx], header_idx: idx };
    }
  }
  return null;
}

export function getCsvLinkActionForField(fieldKey) {
  const map = {
    filePath: 'LINK_HEADER_TO_PATH_COLUMN',
    outputName: 'LINK_HEADER_TO_RENAME_COLUMN',
    labelText: 'LINK_HEADER_TO_LABEL_COLUMN',
    qrContent: 'LINK_HEADER_TO_QR_COLUMN',
  };
  return map[fieldKey] ?? null;
}

export function getCsvSelectModalActionForField(fieldKey) {
  const map = {
    filePath: 'ALLOW_SELECT_CSV_PATH_COLUMN',
    outputName: 'ALLOW_SELECT_CSV_RENAME_COLUMN',
    labelText: 'ALLOW_SELECT_CSV_LABEL_COLUMN',
    qrContent: 'ALLOW_SELECT_CSV_QR_COLUMN',
  };
  return map[fieldKey] ?? null;
}

export function getCsvPlainEnglishName(fieldKey) {
  const spec = getSpec(fieldKey);
  return spec?.role?.toLowerCase() ?? fieldKey;
}

export function alternatesFromLegacyPickerValue(value, defaultHeader) {
  const trimmed = value != null ? String(value).trim() : '';
  const def = defaultHeader != null ? String(defaultHeader).trim() : '';
  if (!trimmed || trimmed === def) return [];
  return [trimmed];
}

/** Legacy column string for file_path_column / file_rename_column sync. */
export function syncCsvLegacyColumnValue(fieldKey, aliases) {
  const spec = getSpec(fieldKey);
  const list = trimAliases(aliases);
  if (list.length > 0) return list[0];
  return spec?.defaultHeader ?? '';
}
