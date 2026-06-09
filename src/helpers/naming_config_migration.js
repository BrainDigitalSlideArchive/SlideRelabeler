// helpers/naming_config_migration.js

const DEFAULT_NAMING = {
  accessionMode: 'original',
  accessionToken: '',
  tokenIdColumn: '',
  duplicateStrategy: 'suffix-index',
  fieldsOrder: ['Accession', 'BlockId', 'StainId', 'SlideNum'],
};

const DEFAULT_LABEL_TEXT_ASSEMBLY = {
  mode: 'legacy',
  template: '',
  fieldsOrder: [],
  separator: '_',
};

const DEFAULT_QR_ASSEMBLY = {
  mode: 'legacy',
  template: '',
  fieldsOrder: [],
  separator: '',
};

const DEFAULT_DSA_UPLOAD = {
  rename_item_after_upload: false,
  set_item_metadata: false,
  item_name_assembly: {
    mode: 'same_as_label',
    template: '',
    fieldsOrder: [],
    separator: '_',
  },
};

/**
 * Merge persisted config with new naming/assembly keys. Does not inject site-specific templates.
 * @param {object} loadedConfig
 * @param {object} [loadedEsm]
 */
export function migrateNamingConfig(loadedConfig, loadedEsm) {
  const config = loadedConfig && typeof loadedConfig === 'object' ? { ...loadedConfig } : {};

  if (!config.naming || typeof config.naming !== 'object') {
    config.naming = { ...DEFAULT_NAMING };
  } else {
    config.naming = { ...DEFAULT_NAMING, ...config.naming };
  }

  const esmMapping = loadedEsm?.mappingConfig;
  if (esmMapping && typeof esmMapping === 'object') {
    if (!loadedConfig?.naming) {
      config.naming = {
        ...config.naming,
        accessionMode: esmMapping.accessionMode ?? config.naming.accessionMode,
        accessionToken: esmMapping.accessionToken ?? config.naming.accessionToken,
        duplicateStrategy: esmMapping.duplicateStrategy ?? config.naming.duplicateStrategy,
        fieldsOrder: Array.isArray(esmMapping.fieldsOrder)
          ? esmMapping.fieldsOrder
          : config.naming.fieldsOrder,
      };
    }
  }

  if (!config.label || typeof config.label !== 'object') {
    config.label = {};
  }
  if (!config.label.label_text_assembly) {
    config.label.label_text_assembly = { ...DEFAULT_LABEL_TEXT_ASSEMBLY };
  } else {
    config.label.label_text_assembly = {
      ...DEFAULT_LABEL_TEXT_ASSEMBLY,
      ...config.label.label_text_assembly,
    };
  }
  if (!config.label.qr_assembly) {
    config.label.qr_assembly = { ...DEFAULT_QR_ASSEMBLY };
  } else {
    config.label.qr_assembly = { ...DEFAULT_QR_ASSEMBLY, ...config.label.qr_assembly };
  }

  if (!config.dsa_upload || typeof config.dsa_upload !== 'object') {
    config.dsa_upload = { ...DEFAULT_DSA_UPLOAD };
  } else {
    config.dsa_upload = {
      ...DEFAULT_DSA_UPLOAD,
      ...config.dsa_upload,
      item_name_assembly: {
        ...DEFAULT_DSA_UPLOAD.item_name_assembly,
        ...(config.dsa_upload.item_name_assembly || {}),
      },
    };
  }

  return config;
}

export {
  DEFAULT_NAMING,
  DEFAULT_LABEL_TEXT_ASSEMBLY,
  DEFAULT_QR_ASSEMBLY,
  DEFAULT_DSA_UPLOAD,
};
