// helpers/config_v2_migration.js — migrate persisted config to v2 or reset safely.

import default_state from '../reducers/config/default_state.js';
import { DEFAULT_ASSEMBLY, DEFAULT_ROUTING } from './assembly_routing.js';
import { migrateFilenameConfig } from './output_filename.js';

const CONFIG_VERSION = 2;

function mapFieldsOrder(fields) {
  if (!Array.isArray(fields)) return DEFAULT_ASSEMBLY.fieldsOrder;
  return fields.map((f) => (f === 'Accession' ? 'specimenId' : f));
}

/**
 * @param {object} loadedConfig
 * @param {object} [loadedEsm]
 * @returns {{ config: object, wasReset: boolean }}
 */
export function migrateConfigV2(loadedConfig, loadedEsm) {
  const base = loadedConfig && typeof loadedConfig === 'object' ? { ...loadedConfig } : {};
  const version = base.configVersion ?? 0;

  if (version >= CONFIG_VERSION && base.assembly && base.routing) {
    const migratedFilename = migrateFilenameConfig(base);
    const csv = base.csv || {};
    return {
      config: {
        ...default_state,
        ...base,
        configVersion: CONFIG_VERSION,
        assembly: { ...DEFAULT_ASSEMBLY, ...base.assembly },
        routing: { ...DEFAULT_ROUTING, ...base.routing },
        filename: migratedFilename,
        csv: {
          ...default_state.csv,
          ...csv,
          file_rename_column: migratedFilename.column || csv.file_rename_column || '',
        },
      },
      wasReset: false,
    };
  }

  const esmMap = loadedEsm?.mappingConfig ?? {};
  const naming = base.naming ?? {};

  const assembly = {
    ...DEFAULT_ASSEMBLY,
    specimenId: {
      source:
        naming.accessionMode === 'manual'
          ? 'fixed'
          : naming.accessionMode === 'auto'
            ? 'generated'
            : 'from_metadata',
      fixedValue: naming.accessionToken ?? esmMap.accessionToken ?? '',
      column: naming.tokenIdColumn ?? '',
    },
    fieldsOrder: mapFieldsOrder(esmMap.fieldsOrder ?? naming.fieldsOrder),
    duplicateStrategy: esmMap.duplicateStrategy ?? naming.duplicateStrategy ?? 'suffix-index',
    separator: '_',
    columnName: 'AssembledName',
  };

  const useUuid = base.filename?.use_uuid !== false;
  const migratedFilename = migrateFilenameConfig({
    ...base,
    filename: { ...(base.filename || {}), use_uuid: useUuid },
  });
  const routing = {
    ...DEFAULT_ROUTING,
    outputFilename: { enabled: migratedFilename.source === 'computed' },
    labelText: {
      enabled: true,
      column: 'AssembledName',
    },
    dsaItemName: { enabled: Boolean(base.dsa_upload?.rename_item_after_upload) },
    exportCsv: { enabled: true, columnHeader: 'AssembledName' },
  };

  const label = { ...(base.label || default_state.label) };
  if (label.text_column_field?.value === 'rename') {
    label.text_column_field = { value: 'AssembledName', label: 'Assembled name' };
  }

  return {
    config: {
      ...default_state,
      ...base,
      configVersion: CONFIG_VERSION,
      assembly,
      routing,
      label,
      filename: migratedFilename,
      csv: {
        ...default_state.csv,
        ...(base.csv || {}),
        file_rename_column: migratedFilename.column || base.csv?.file_rename_column || '',
      },
      naming: {
        ...default_state.naming,
        ...(base.naming || {}),
      },
    },
    wasReset: version < CONFIG_VERSION,
  };
}

export { CONFIG_VERSION };
