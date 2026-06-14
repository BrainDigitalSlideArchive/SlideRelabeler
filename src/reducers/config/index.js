import { createReducer}  from "@reduxjs/toolkit";
import {produce} from 'immer';
import default_state from './default_state';

import * as config_actions from '../../actions/config';
import * as app_actions from '../../actions/app';
import * as files_actions from '../../actions/files';
import { migrateNamingConfig } from '../../helpers/naming_config_migration.js';
import { normalizeFilenameConfig } from '../../helpers/output_filename.js';

function syncFilenameLegacyFields(draft) {
  const normalized = normalizeFilenameConfig(draft.filename);
  draft.filename.source = normalized.source;
  draft.filename.use_uuid = normalized.use_uuid;
  draft.filename.style = normalized.style;
}

// Helper function to deep merge config with defaults
function mergeConfigWithDefaults(loadedConfig, defaults) {
  const merged = { ...defaults };
  
  for (const key in loadedConfig) {
    if (loadedConfig.hasOwnProperty(key)) {
      if (typeof loadedConfig[key] === 'object' && loadedConfig[key] !== null && !Array.isArray(loadedConfig[key])) {
        // Recursively merge nested objects
        merged[key] = mergeConfigWithDefaults(loadedConfig[key], defaults[key] || {});
      } else {
        // Use loaded value if it exists
        merged[key] = loadedConfig[key];
      }
    }
  }
  
  return merged;
}

const config_reducer  = createReducer(default_state, (builder) => {
  builder
    .addCase(config_actions.UPDATE_CONFIG, (state, action) => {
      const merged = mergeConfigWithDefaults(action.payload, default_state);
      return migrateNamingConfig(merged);
    })
    .addCase(config_actions.CHANGE_PREFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.prefix = action.payload;
      })
    })
    .addCase(config_actions.CHANGE_SUFFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.suffix = action.payload;
      })
    })
    .addCase(config_actions.CHANGE_FILE_PATH_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.file_path_column = action.payload;
      })
    })
    .addCase(config_actions.CHANGE_FILE_RENAME_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.file_rename_column = action.payload;
        draft.filename.column = action.payload;
        if (action.payload) {
          draft.filename.source = 'column';
          syncFilenameLegacyFields(draft);
        }
      })
    })
    .addCase(config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, (state, action) => {
      return produce(state, draft => {
        draft.csv.file_destination_directory_column = action.payload;
      })
    })
    .addCase(config_actions.TOGGLE_UUID, (state) => {
      return produce(state, draft => {
        draft.filename.source = draft.filename.source === 'uuid' ? 'computed' : 'uuid';
        syncFilenameLegacyFields(draft);
      })
    })
    .addCase(config_actions.TOGGLE_PREFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.use_prefix = !state.filename.use_prefix;
      })
    })
    .addCase(config_actions.TOGGLE_SUFFIX, (state, action) => {
      return produce(state, draft => {
        draft.filename.use_suffix = !state.filename.use_suffix;
      })
    })
    .addCase(config_actions.TOGGLE_NON_RANDOM, (state) => {
      return produce(state, draft => {
        draft.filename.source = draft.filename.source === 'uuid' ? 'computed' : 'uuid';
        syncFilenameLegacyFields(draft);
      })
    })
    .addCase(config_actions.TOGGLE_SAVE_CSV, (state, action) => {
      return produce(state, draft => {
        draft.csv.save_csv = !state.csv.save_csv;
      })
    })
    .addCase(config_actions.CHANGE_QR_MODE, (state, action) => {
      return produce(state, draft => {
        draft.label.qr_mode = action.payload;
      })
    })
    .addCase(config_actions.TOGGLE_ADD_ICON, (state, action) => {
      return produce(state, draft => {
        draft.label.add_icon = !state.label.add_icon;
      })
    })
    .addCase(config_actions.CHANGE_ICON_FILE, (state, action) => {
      return produce(state, draft => {
        draft.label.icon_file = action.payload;
      })
    })
    .addCase(config_actions.TOGGLE_SAVE_MACRO, (state, action) => {
      return produce(state, draft => {
        draft.wsi.save_macro_image = !state.wsi.save_macro_image;
      })
    })
    .addCase(config_actions.TOGGLE_ADD_LABEL_QR, (state, action) => {
      return produce(state, draft => {
        draft.label.add_qr = !state.label.add_qr;
      })
    })
    .addCase(config_actions.TOGGLE_ADD_LABEL_TEXT, (state, action) => {
      return produce(state, draft => {
        draft.label.add_text = !state.label.add_text;
      })
    })
    .addCase(config_actions.CHANGE_QR_COLUMN_FIELD, (state, action) => {
      return produce(state, draft => {
        draft.label.qr_column_field = action.payload
      })
    })
    .addCase(config_actions.CHANGE_TEXT_COLUMN_FIELD, (state, action) => {
      return produce(state, draft => {
        draft.label.text_column_field = action.payload
      })
    })
    .addCase(config_actions.CHANGE_QR_COLUMN_FIELDS, (state, action) => {
      return produce(state, draft => {
        let filtered = state.label.qr_column_fields.filter(column_field => column_field.value !== action.payload.value);
        if (filtered.length !== state.label.qr_column_fields.length) {
          draft.label.qr_column_fields = filtered;
        } else {
          draft.label.qr_column_fields = [...state.label.qr_column_fields, action.payload]
        }
      })
    })
    .addCase(config_actions.TOGGLE_ENABLE_DEBUG, (state, action) => {
      return produce(state, draft => {
        draft.debug.enable_debug = !state.debug.enable_debug;
      })
    })
    .addCase(config_actions.TURN_ON_RENAME_MODE, (state) => {
      return produce(state, draft => {
        draft.filename.source = 'computed';
        syncFilenameLegacyFields(draft);
        draft.routing.outputFilename.enabled = true;
      })
    })
    .addCase(config_actions.SET_FILENAME_CONFIG, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        Object.assign(draft.filename, p);
        syncFilenameLegacyFields(draft);
        if (p.column !== undefined) {
          draft.csv.file_rename_column = p.column;
        } else if (draft.filename.source === 'column' && draft.filename.column) {
          draft.csv.file_rename_column = draft.filename.column;
        }
        if (draft.filename.source === 'computed') {
          draft.routing.outputFilename.enabled = true;
        }
      })
    })
    .addCase(app_actions.RESET_STORE, (state, action) => {
      return default_state;
    })
    .addCase(config_actions.TOGGLE_ENABLE_COPY_MODE, (state, action) => {
      return produce(state, draft => {
        draft.copy.enable_copy_mode = !state.copy.enable_copy_mode;
      })
    })
    .addCase(config_actions.SET_NAMING_CONFIG, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        Object.assign(draft.naming, p);
        if (p.accessionMode !== undefined) {
          draft.assembly.specimenId.source =
            p.accessionMode === 'manual' ? 'fixed' : p.accessionMode === 'auto' ? 'generated' : 'from_metadata';
        }
        if (p.accessionToken !== undefined) draft.assembly.specimenId.fixedValue = p.accessionToken;
        if (p.tokenIdColumn !== undefined) draft.assembly.specimenId.column = p.tokenIdColumn;
        if (Array.isArray(p.fieldsOrder)) {
          draft.assembly.fieldsOrder = p.fieldsOrder.map((f) => (f === 'Accession' ? 'specimenId' : f));
        }
        if (p.duplicateStrategy !== undefined) draft.assembly.duplicateStrategy = p.duplicateStrategy;
      })
    })
    .addCase(config_actions.SET_LABEL_TEXT_ASSEMBLY, (state, action) => {
      return produce(state, draft => {
        Object.assign(draft.label.label_text_assembly, action.payload || {});
      })
    })
    .addCase(config_actions.SET_QR_ASSEMBLY, (state, action) => {
      return produce(state, draft => {
        Object.assign(draft.label.qr_assembly, action.payload || {});
      })
    })
    .addCase(config_actions.SET_DSA_UPLOAD_CONFIG, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        if (p.item_name_assembly) {
          Object.assign(draft.dsa_upload.item_name_assembly, p.item_name_assembly);
          const { item_name_assembly, ...rest } = p;
          Object.assign(draft.dsa_upload, rest);
        } else {
          Object.assign(draft.dsa_upload, p);
        }
        if (p.rename_item_after_upload !== undefined) {
          draft.routing.dsaItemName.enabled = Boolean(p.rename_item_after_upload);
        }
      })
    })
    .addCase(config_actions.SET_ASSEMBLY_CONFIG, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        if (p.specimenId) {
          Object.assign(draft.assembly.specimenId, p.specimenId);
          const { specimenId, ...rest } = p;
          Object.assign(draft.assembly, rest);
        } else {
          Object.assign(draft.assembly, p);
        }
        if (p.specimenId || p.fieldsOrder || p.duplicateStrategy) {
          const spec = draft.assembly.specimenId;
          draft.naming.accessionMode =
            spec.source === 'fixed' ? 'manual' : spec.source === 'generated' ? 'auto' : 'original';
          draft.naming.accessionToken = spec.fixedValue ?? draft.naming.accessionToken;
          draft.naming.tokenIdColumn = spec.column ?? draft.naming.tokenIdColumn;
          if (Array.isArray(p.fieldsOrder)) {
            draft.naming.fieldsOrder = p.fieldsOrder.map((f) => (f === 'specimenId' ? 'Accession' : f));
          }
          if (p.duplicateStrategy) draft.naming.duplicateStrategy = p.duplicateStrategy;
        }
      })
    })
    .addCase(config_actions.SET_ROUTING_CONFIG, (state, action) => {
      return produce(state, draft => {
        const p = action.payload || {};
        Object.keys(p).forEach((key) => {
          if (draft.routing[key] && typeof p[key] === 'object') {
            Object.assign(draft.routing[key], p[key]);
          } else {
            draft.routing[key] = p[key];
          }
        });
        if (p.outputFilename?.enabled !== undefined && p.outputFilename.enabled) {
          draft.filename.source = 'computed';
          syncFilenameLegacyFields(draft);
        }
        if (p.dsaItemName?.enabled !== undefined) {
          draft.dsa_upload.rename_item_after_upload = Boolean(p.dsaItemName.enabled);
        }
      })
    })
    .addCase(config_actions.USE_ASSEMBLED_NAME_FOR_LABEL, (state) => {
      return produce(state, draft => {
        const col = draft.assembly.columnName || 'AssembledName';
        draft.routing.labelText.enabled = true;
        draft.routing.labelText.column = col;
        draft.label.text_column_field = { value: col, label: 'Assembled name' };
        draft.label.label_text_assembly.mode = 'legacy';
      })
    })
    // .addCase(files_actions.CLEAR_FILES, (state, aciton) => {
    //   return produce(state, draft => {
    //     draft.csv.file_path_column = default_state.csv.file_path_column;
    //     draft.csv.file_rename_column = default_state.csv.file_rename_column;
    //     draft.csv.file_destination_directory_column = default_state.csv.file_destination_directory_column;
    //   })
    // })
})

export default config_reducer;