# Configuration UI reference (v1 — frozen oracle)

This document describes the **live Configuration dialog** as of the config-v2 migration baseline. Treat it as the **behavioral and structural** oracle for parity checks (controls, actions, IDs, states, side effects). Visual micro-spacing and per-host size quirks are **descriptive of v1**, not a requirement to reproduce in v2, unless a section’s “v2 target” column marks a difference as intentional. Do not “improve” v1 to match v2; update this doc if product behavior intentionally changes.

Related: [config-ui-migration.md](./config-ui-migration.md) (freeze rules), [config-ui-v2-style-spec.md](./config-ui-v2-style-spec.md) (Phase 0.5 style system).

---

## 1. Shell and navigation

### Entry
- **App gear** → `TOGGLE_MODAL` `{ type: 'config' }` ([`App.jsx`](../src/containers/App/App.jsx)).
- **Deep link** → `openConfigSettings(dispatch, sectionId)` ([`ConfigStickyNav.jsx`](../src/components/config/ConfigStickyNav.jsx)): opens config modal, then scrolls `.config-panel__body` to `#sectionId`.

### Shell component
[`ModalConfig.jsx`](../src/containers/Modal/ModalConfig.jsx)
- Header title: **Configuration**.
- Layout: `.config-panel` → sticky nav + `.config-panel__body` (scroll root).
- Global disable: `files.processing || files.disable_changes` (most controls).
- Owns naming **preview sandbox**: `previewRowMode` (`example` | `file`), `previewRow`; catalogs via `getPatternPlaceholderCatalog`; pattern validation via `selectPatternValidationFromState`.
- `triggerRecompute()` → `RECOMPUTE_ALL_NAMING` + refresh local preview defaults.

### Sticky nav (order)

| Label | DOM `id` |
|-------|----------|
| Overview | `config-overview` |
| Output name | `config-output-filename` |
| Slide label | `config-slide-label` |
| Data loading | `config-data-loading` |
| Output delivery | `config-output-delivery` |
| Audit logging | `config-audit-logging` |
| Advanced | `config-advanced` |

### Deep-link / subsection IDs (not in sticky nav)

| ID | Host |
|----|------|
| `config-overview-glossary` | Overview glossary |
| `config-file-picker` | File picker info |
| `config-csv-import` | CSV import |
| `config-api-integrations` | API Integrations |
| `config-esm-api` | eSM profiles |
| `config-save-locally` | Save locally category |
| `config-default-local-output` | Default save folder |
| `config-upload` | Upload category |
| `config-dsa-upload` | DSA block |
| `config-globus-upload` | Globus block |
| `config-staging-directory` | Temp folder for uploads |
| `config-upload-queue` | Upload queue |

### Deep-link callers

| Caller | Target |
|--------|--------|
| `DsaDeliveryControls` / `DsaUrlChangeControl` | `config-dsa-upload` |
| `GlobusDeliveryControls` / `GlobusEndpointChangeControl` | `config-globus-upload` |
| `ModalGlobusEndpointPicker` (after durable close) | scroll `config-globus-upload` |
| `ModalESlideManager` | `config-api-integrations` |

**Comparison UX (Phase 1+):** two header gears — existing → v1 `config`; distinct color → v2 `configV2`. Deep links stay on **v1** until cutover.

---

## 2. Per-section inventory

### 2.1 Overview — `config-overview`

**Components:** `ConfigOverviewSection.jsx`, `OverviewLabelIllustration.jsx`, `overview_examples.js`

**Purpose:** Explain three independent names (disk / label / optional DSA item).

**Controls:** Glossary expand/collapse only (local state). Callout when no files loaded.

**Redux:** none (read-only).

**v1 observed / v2 target:** Keep educational hierarchy and glossary. Harmonize card/callout spacing via Section/Callout primitives (do not preserve overview-only micro-quirks).

---

### 2.2 Output name — `config-output-filename`

**Components:** `OutputFilenameSection.jsx`, `PlaceholderChips`, `ConfigTestItOutSection`, `ConfigPreviewRowEditor`

**Intro:** How to define Output name when the column is empty on load.

| Control | Redux |
|---------|--------|
| Radios: UUID / Keep original / Custom pattern | `SET_FILENAME_CONFIG` → `filename.source` |
| Pattern field + chips (pattern mode) | `SET_FILENAME_CONFIG` → `filename.pattern` |
| Test it out: load first row / reset example | Local preview in ModalConfig |
| Preview grid edits | Local `previewRow` only |

**Side effects:** each source/pattern change → `RECOMPUTE_ALL_NAMING`.

**States:** detail panel per mode; `recomputeNotice` for protected rows; pattern validation alerts; rename override callout on preview.

---

### 2.3 Slide label — `config-slide-label`

**Components:** ModalConfig shell → `LabelGuidedSteps` → `LabelComposer` → feature blocks, defaults editors, icon row, schematic/rendered preview, test-it-out + preview grid.

| Control | Redux |
|---------|--------|
| Checkboxes: Label text / QR / Icon | `TOGGLE_ADD_LABEL_TEXT`, `TOGGLE_ADD_LABEL_QR`, `TOGGLE_ADD_ICON` |
| Text defaults radios + optional pattern/chips | `SET_LABEL_DEFAULTS` → `label.labelText` |
| QR defaults radios + optional pattern/chips | `SET_LABEL_DEFAULTS` → `label.qrContent` |
| Icon Load / Clear | `SELECT_ICON_FILE` / `CHANGE_ICON_FILE` |

**Side effects:** defaults → `RECOMPUTE_ALL_NAMING`; icon file picker saga.

**States:** feature active/inactive/incomplete; schematic vs rendered preview; test-it-out hints by enabled features.

---

### 2.4 Data loading — `config-data-loading`

**Components:** `DataLoadingSection` → File picker info, CSV import, API Integrations → eSM profiles.

#### File picker (`config-file-picker`)
Read-only copy only.

#### CSV (`config-csv-import`)
| Control | Redux |
|---------|--------|
| Export sample CSV template | `EXPORT_SAMPLE_CSV_TEMPLATE` |
| Alternate headers per reserved field | `SET_CSV_RESERVED_ALIASES` |

Reserved keys: `filePath`, `outputName`, `labelText`, `qrContent`.

#### API / eSM (`config-api-integrations`, `config-esm-api`)
| Control | Redux |
|---------|--------|
| eSM Enabled / Disabled | `SET_ESM_INTEGRATION_ENABLED` |
| Profile CRUD, fields, stain presets, mappings, duplicate strategy | `ESM_*` / `ESM_UPDATE_PROFILE` |

**Side effects:** no naming recompute from these controls.

---

### 2.5 Output delivery — `config-output-delivery`

**Components:** `OutputDeliverySection.jsx` (+ colocated SCSS), DSA/Globus field components.

#### Save locally
| Control | Redux (`uploadRouting`) |
|---------|-------------------------|
| Choose / Change / Clear folder | `CHOOSE_DEFAULT_LOCAL_OUTPUT_DIR`, `SET_DEFAULT_LOCAL_OUTPUT_DIR` |

#### DSA (`config-dsa-upload`)
| Control | Redux |
|---------|--------|
| Default server URL + Check | `SET_DSA_UPLOAD_CONFIG` `{ default_api_url }`; reachability via `electronAPI.dsaCheckServerUrl` |
| Item name radios + pattern/chips | `dsaAlias`, `rename_item_after_upload` → may `RECOMPUTE_ALL_NAMING` |
| Attach metadata radios + column chips | `itemMetadata.{mode,column}` |

#### Globus (`config-globus-upload`)
| Control | Redux |
|---------|--------|
| Source endpoint + Auto-detect | `SET_GLOBUS_UPLOAD_CONFIG` `{ source_endpoint }` |
| Default destination Choose/Change/Clear | durable endpoint picker modal |
| Disable SSL | `disable_ssl_verification` |
| Max transfers | `SET_MAX_GLOBUS_PARALLEL_UPLOADS` |

#### Staging (`config-staging-directory`) / Queue (`config-upload-queue`)
| Control | Redux |
|---------|--------|
| System temp / Custom + folder picker | `SET_STAGING_DIR_MODE`, `CHOOSE_STAGING_DIR` |
| Max files waiting | `SET_MAX_LOCAL_PENDING` |

**States:** DSA URL check status; Globus CLI missing; invalid UUID; queue vs Globus parallel warning.

---

### 2.6 Audit logging — `config-audit-logging`

**Component:** `AuditLoggingSection.jsx` (slice: `auditLog`)

| Control | Redux |
|---------|--------|
| Enabled / Disabled | `SET_AUDIT_LOG_SETTINGS` `{ enabled }` |
| Unlimited / Max entries + number | `maxEntries` (confirm if trim deletes) |
| View audit log… | `TOGGLE_MODAL` `{ type: 'auditLog' }` |

---

### 2.7 Advanced — `config-advanced`

**v1 component:** `config/ConfigAdvancedSection.jsx` (collapsed by default; unfinished chrome).
**v2 component:** `config-v2/sections/ConfigAdvancedSection.jsx` (always visible; kit redesign).

Both gears share the same actions. All controls honor `processing || disable_changes`.

| Control | Redux |
|---------|--------|
| Keep the overview image | `TOGGLE_SAVE_MACRO` → `wsi.save_macro_image` |
| Copy files without changing them | `TOGGLE_ENABLE_COPY_MODE` → `copy.enable_copy_mode` |
| Show troubleshooting tools | `TOGGLE_ENABLE_DEBUG` → `debug.enable_debug` |
| Restore defaults | `RESTORE_DEFAULTS` → `RESET_STORE` + rewrite persisted defaults (app stays open) |
| Hard reset | `DELETE_STORE` → `RESET_STORE` + delete persisted store + exit app |

**Parity for v2:** behavioral (same actions/effects). Layout is a deliberate redesign (stacked SettingHeaders + BooleanRows + dual reset).

---

## 3. Shared interaction patterns

### Choice chips (`config-filename-style--compact`)
Used as segmented radios for: Output name source, Label/QR defaults, DSA item name & metadata, staging mode, Audit enable/retention, eSM integration enable.

### Pattern + `PlaceholderChips`
Hosts: Output name, Label text/QR defaults, DSA item name pattern, eSM column mappings. DSA metadata chips select a column (not always `{token}` insert).

### Test it out / preview
`ConfigTestItOutSection` + `ConfigPreviewRowEditor` on Output name and Slide label. Overview illustration is static. DSA URL / Globus detect are status, not naming preview.

### Light-surface controls
Config panel uses onLight Button/InputText/Checkbox skins (Modal `__content--config` + InputText onLight). Compact InputText defaults to ~5–6em width (override wars in delivery/audit).

---

## 4. Styling: preserve vs v2 target

| Preserve | v2 may / should change |
|----------|------------------------|
| Section order and sticky/deep-link IDs | Spacing rhythm and label alignment via a **single** kit scale |
| Durable vs session split (config vs Delivery) | Class names / CSS ownership |
| Control semantics and Redux effects | Chip/field primitives instead of copy-paste |
| Help meaning | Advanced **layout** (redesign expected) |
| Intentional product differences (document if any) | **Accidental** micro-drift between similar components |

**Harmonization:** v1 incrementally acquired slightly different paddings, gaps, and compact field widths for the same patterns (e.g. audit vs DSA vs API labeled rows; path chips; InputText compact overrides at ~4.5 vs ~5.5rem). v2 should **collapse** those onto one recipe per primitive unless this doc explicitly calls out an intentional difference.

### Do not reproduce in v2
- Mega `.__config-controls` dump in Modal.scss
- Misnamed `config-filename-style` as universal chips
- Globus fields using `dsa-url-*` BEM
- Output delivery stealing `data-loading-section__*` without a shared layout primitive
- Parent `!important` wars against `InputText--compact`
- Orphan assembled-name / LabelCompositionPanel CSS kept “just in case”
- Per-section spacing/size forks for otherwise identical controls

---

## 5. Orphans (unmounted — delete at cutover)

`AssembledNameSection`, `AssemblyBuildControls`, `LabelCompositionPanel` (+ controls/items), `LabelContentBuilder`, `SpecimenIdStep`, `LabelConfigPreview`, `LabelReviewPanel`, `CsvColumnMappingField`, `DeIdTokenCard`, unused default `ComputedFieldEditor` (keep file for `PlaceholderChips` export).

Still live: `LabelCompositionMockup`, `LabelThumbnailPreview`, `SlideLabelDecorations`, `PreviewRenameOverrideCallout`.

---

## 6. Parity checklist template (per migrated section)

Copy for each Phase 2 section:

- [ ] Open v1 gear and v2 gear; same section IDs present where applicable
- [ ] Every control from this doc’s inventory exists and dispatches the same action/field
- [ ] Key states exercised (empty files, pattern expanded, CLI missing, disabled while processing, …)
- [ ] Side effects observed (recompute, sync, nested modal)
- [ ] Deep links still land on v1 (until cutover)
- [ ] Visual differences vs v1 are kit harmonization and/or documented v2 targets — not new one-off CSS
- [ ] No new one-off CSS outside style-spec primitives (see style spec change control)
- [ ] Advanced only: behavioral parity; layout may differ by design

---

## 7. Durable Redux fields (UI-edited)

- `filename.{source,pattern}`
- `label.{add_text,add_qr,add_icon,icon_file,labelText,qrContent,…}`
- `csv.reservedColumns.*.aliases`
- `dsa_upload.{default_api_url,rename_item_after_upload,dsaAlias,itemMetadata}`
- `globus_upload.{source_endpoint,default_target_endpoint_*,disable_ssl_verification}`
- `wsi.save_macro_image`, `copy.enable_copy_mode`, `debug.enable_debug`
- Plus slices: `uploadRouting.*`, `auditLog.settings`, `esm.*`
