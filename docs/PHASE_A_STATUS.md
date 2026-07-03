# Phase A — Column-first naming (file dialog)

Status: **implemented** (ready for initial testing). Use this doc to track what is done vs what Phase B/C still need.

## Goal

Three grid columns are the source of truth: **Output name**, **Label text**, **QR content**. For files loaded via the file dialog, config defaults populate those columns. Provenance is tracked so CSV/eSM/user overrides are not clobbered on recompute.

## Implemented in Phase A

### Core data layer

| Item | Location | Notes |
|------|----------|--------|
| Row naming defaults helper | `src/helpers/row_naming_defaults.js` | `resolveDefaultOutputName`, `resolveDefaultLabelText`, `resolveDefaultQrPayload`, `applyRowNamingDefaults`, `initRowNamingSources` |
| Provenance sources | `__reserved.renameSource`, `labelTextSource`, `qrPayloadSource` | Values: `default`, `csv`, `esm`, `user` |
| Unit tests | `src/helpers/row_naming_defaults.test.mjs` | Default population + csv protection + legacy skip |

### File load + recompute

| Item | Location | Notes |
|------|----------|--------|
| File dialog add | `src/sagas/files/add_file.js` | `initRowNamingSources` + `applyRowNamingDefaults` (replaces `applyTemplatesToRowWithStore`) |
| Config recompute | `src/sagas/files/recompute_row_naming.js` | Uses `applyRowNamingDefaults` (only updates `source === 'default'`) |
| Output basename resolution | `src/helpers/output_filename.js` | Prefers stored `__reserved.rename` |
| Python output path | `src/python/DeidTools/DeidTools.py` | `_resolve_output_basename` prefers `__reserved.rename` |
| Grid display | `src/helpers/ag_grid_helpers.jsx` | Shows stored rename; user edits set `renameSource: user` |

### Config UI (file-dialog defaults)

| Item | Location | Notes |
|------|----------|--------|
| Output name section | `src/components/config/OutputFilenameSection.jsx` | **Original** or **UUID** only; renamed from “Output filename” |
| Label text default | `src/components/config/LabelDefaultsEditor.jsx` | Same as output name \| No text |
| QR default | `src/components/config/LabelDefaultsEditor.jsx` | Output name \| Label text \| UUID \| URL pattern |
| Label composer | `LabelComposer.jsx`, `LabelComposerDetail.jsx`, `LabelGuidedSteps.jsx` | Simplified; no assembly/routing/specimen row |
| Config actions | `SET_LABEL_DEFAULTS` in `src/actions/config.js` + reducer | `label.textDefault`, `qrDefault`, `qrPattern` |
| Default config | `src/reducers/config/default_state.js` | `textDefault: 'output_name'`, `qrDefault: 'output_name'` |
| Recompute notice | `ModalConfig.jsx` | Warns when protected rows exist |
| Preview helpers | `label_config_preview.js`, `label_composition_summaries.js` | Read row columns / defaults |

### Removed / hidden from UI (Phase A)

| Item | Notes |
|------|--------|
| **Assembled name** grid column | Removed from grid; blocked via `file_table_columns.js` |
| **De-ID token** grid column | Removed from `default_state.js` reserved columns |
| **Assembled name** config section | Removed from `ModalConfig.jsx` + sticky nav |
| Label assembly pills (One field / Assembled name / Combine / Pattern) | Replaced by `LabelDefaultsEditor` |
| Output filename modes column / computed | Hidden until Phase B/C |

## Config shape (Phase A)

```javascript
config.filename.source   // 'original' | 'uuid'  (UI limited to these in Phase A)
config.label.textDefault // 'output_name' | 'none'
config.label.qrDefault   // 'output_name' | 'label_text' | 'uuid' | 'pattern'
config.label.qrPattern   // string, used when qrDefault === 'pattern'
```

Legacy fields (`routing`, `assembly`, `label_text_assembly`, etc.) remain in state for backward compatibility but are not used by the file-dialog path.

## Phase A QA checklist

- [ ] Load file via dialog → Output name, Label text, QR content columns populated
- [ ] Switch output default Original ↔ UUID → default-sourced rows update on recompute
- [ ] Label default “Same as output name” → Label text matches Output name
- [ ] Label default “No text” → Label text empty
- [ ] QR defaults (output name / label text / uuid / pattern) resolve correctly
- [ ] Edit Output name in grid → value kept after config change (user source)
- [ ] Recompute notice appears when protected rows exist

---

## Not done — Phase B (CSV)

- [ ] CSV column mappings for label text + QR content (in addition to output name)
- [ ] `setup_csv_row.js` copy non-empty cells → `__reserved.*` with `*Source: 'csv'`
- [ ] `link_headers_to_reserved.js` new reserved column links
- [ ] Re-enable output name from CSV column into `__reserved.rename` (not just flat row field)
- [ ] Config UI: three optional CSV column pickers + copy updates
- [ ] Remove reliance on `filename.source === 'column'` as runtime resolver (populate at import)

## Not done — Phase C (eSM)

- [ ] eSM apply writes `__reserved.rename` (+ optional label text) with `*Source: 'esm'`
- [ ] Reframe eSM UI as output name mapping (not “Assembled name”)
- [ ] Stop using `applyAssemblyAndRouting` on eSM path OR set sources explicitly

## Not done — Phase D (cleanup / migration)

- [ ] `config_v3_migration.js` from v2 routing/assembly configs
- [ ] Delete `AssembledNameSection.jsx`, unused `LabelContentBuilder` assembly modes
- [ ] Remove dead `config.routing` / `config.assembly` from label path entirely
- [ ] Update `label_config_preview.test.mjs` legacy cases already replaced; audit remaining assembly tests
- [ ] DSA upload title → use `__reserved.rename` consistently

## Files touched (Phase A)

- `src/helpers/file_table_columns.js` (new — hides AssembledName + deidToken from grid)
- `src/helpers/row_naming_defaults.test.mjs` (new)
- `src/components/config/LabelDefaultsEditor.jsx` (new)
- `docs/PHASE_A_STATUS.md` (this file)
- `src/sagas/files/add_file.js`
- `src/sagas/files/recompute_row_naming.js`
- `src/helpers/output_filename.js`
- `src/helpers/label_config_preview.js`
- `src/helpers/label_composition_summaries.js`
- `src/helpers/ag_grid_helpers.jsx`
- `src/reducers/config/default_state.js`
- `src/reducers/config/index.js`
- `src/actions/config.js`
- `src/reducers/files/default_state.js`
- `src/components/config/OutputFilenameSection.jsx`
- `src/components/config/LabelComposer*.jsx`, `LabelGuidedSteps.jsx`
- `src/containers/Modal/ModalConfig.jsx`
- `src/components/config/ConfigStickyNav.jsx`
- `src/containers/Modal/Modal.scss`
- `src/python/DeidTools/DeidTools.py`
- Test updates: `label_config_preview.test.mjs`, `label_composition_summaries.test.mjs`

## Known limitations after Phase A

1. **CSV import** still uses legacy row building; output name CSV column does not populate `__reserved.rename` with `csv` source.
2. **eSM import** still calls `applyAssemblyAndRouting`; may not set provenance sources.
3. **Legacy rows** without `*Source` fields are not updated on recompute (intentional preservation).
4. **`resolveOutputBasename`** still supports `column` / `computed` modes in code for old configs, but UI hides them.
