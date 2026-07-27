# Configuration UI reference (behavioral oracle)

Describes **Configuration** controls, actions, section IDs, states, and side effects. Visual presentation is owned by the kit ([config-ui-v2-style-spec.md](./config-ui-v2-style-spec.md)); this doc is the behavioral oracle. Update it when product behavior intentionally changes.

**Status:** Kit Configuration (`config-v2/`) is the only Configuration dialog. Do not revive v1 section UIs. User-facing vocabulary for terms in Overview is owned by `OVERVIEW_GLOSSARY` in `ConfigOverviewSection.jsx`.

Related: [config-ui-v2-style-spec.md](./config-ui-v2-style-spec.md).

---

## 1. Shell and navigation

### Entry
- **App gear** → `TOGGLE_MODAL` `{ type: 'config' }` ([`App.jsx`](../src/containers/App/App.jsx)).
- **Deep link** → `openConfigSettings(dispatch, sectionId)` ([`ConfigV2Nav.jsx`](../src/components/config-v2/ConfigV2Nav.jsx)): opens config modal, then scrolls `.config-v2__body` to `#sectionId`.

### Shell component
[`ModalConfig.jsx`](../src/containers/Modal/ModalConfig.jsx) → [`ConfigV2App`](../src/components/config-v2/ConfigV2App.jsx)
- Header title: **Configuration**.
- Layout: `.config-v2` → sticky nav + `.config-v2__body` (scroll root).
- Global disable: `files.processing || files.disable_changes` (most controls).
- Naming **preview sandbox**: `ConfigPreviewSandboxProvider` (`previewRowMode` `example` | `file`, catalogs, pattern validation).

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
| Profiles | `config-profiles` |

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
| Status Enabled / Disabled (opt-in; default off; body hidden when disabled) | `SET_DSA_UPLOAD_CONFIG` `{ integrationEnabled }` (`=== true` only) |
| Default server URL + Check | `SET_DSA_UPLOAD_CONFIG` `{ default_api_url }`; reachability via `electronAPI.dsaCheckServerUrl` |
| Item name radios + pattern/chips | `dsaAlias`, `rename_item_after_upload` → may `RECOMPUTE_ALL_NAMING` |
| Attach metadata radios + visible helper; Single column = free-text column name + optional chips when file list has columns (configurable with no files loaded) | `itemMetadata.{mode,column}` |

#### Globus (`config-globus-upload`)
| Control | Redux |
|---------|--------|
| Status Enabled / Disabled (opt-in; default off; body hidden when disabled) | `SET_GLOBUS_UPLOAD_CONFIG` `{ integrationEnabled }` (`=== true` only) |
| Source endpoint + Auto-detect | `SET_GLOBUS_UPLOAD_CONFIG` `{ source_endpoint }` |
| Default destination Choose/Change/Clear | durable endpoint picker modal |
| Disable SSL | `disable_ssl_verification` |
| Max transfers | `SET_MAX_GLOBUS_PARALLEL_UPLOADS` |
| Upload batch size (empty = whole run then one CLI `--batch` transfer; `1` = per-file ASAP) | `SET_GLOBUS_UPLOAD_CONFIG` `{ max_upload_batch_size }` (`null` \| `≥ 1`, default `1`) |

Delivery panel (main window): Via pills list only configured methods. If neither DSA nor Globus is configured, Upload toggle is checked and disabled; show empty-state copy (“No upload methods are configured…”) + **Open upload settings** → `openConfigSettings(..., 'config-upload')`.

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

**Component:** `config-v2/sections/ConfigAdvancedSection.jsx` (always visible). All controls honor `processing || disable_changes`.

| Control | Redux |
|---------|--------|
| Keep the overview image | `TOGGLE_SAVE_MACRO` → `wsi.save_macro_image` |
| Copy files without changing them | `TOGGLE_ENABLE_COPY_MODE` → `copy.enable_copy_mode` |
| Show troubleshooting tools | `TOGGLE_ENABLE_DEBUG` → `debug.enable_debug` |
| Restore defaults | `RESTORE_DEFAULTS` → `RESET_STORE` + rewrite persisted defaults (app stays open). Profile library kept; active profile cleared. |
| Hard reset | `DELETE_STORE` → `RESET_STORE` + delete `deid.tmp` **and** `config-profiles.json` + exit. Confirm names profile wipe and nudges Export from Profiles first when library non-empty. |

---

### 2.8 Profiles — `config-profiles`

**Component:** `config-v2/sections/ConfigProfilesSection.jsx`. Not eSM connection profiles (Data loading). All controls honor `processing || disable_changes`.

Live settings continue to auto-save to `deid.tmp`. Profiles are named checkpoints in `{userData}/config-profiles.json`.

| Control | Behavior |
|---------|----------|
| Active strip | `Active: “Name”` / `Modified from “Name”` / `No profile selected` (fingerprint vs live snapshot) |
| Save as… | Prompt name → unique (case-insensitive), max 80 → new profile + set active |
| Save | Overwrite active profile payload when dirty (name unchanged) |
| Switch… | Confirm → apply selected profile payload to live settings (not file list) |
| Rename… | Unique name rules; id unchanged |
| Delete… | Confirm; clears active if deleted |
| Export current… | Single portable JSON; prompts for name if not cleanly on an active profile |
| Export selected… | 1 → single file; 2+ or none selected (all) → bundle |
| Import… | Single or bundle; collision suffixes `(imported)`; Apply offered for single only |

**Portable kinds:** `slideRelabeler.configProfile` / `slideRelabeler.configProfileBundle` (`schemaVersion: 1`). Snapshots omit passwords, auth tokens, file list, and audit entry history.

**Naming:** Library names unique case-insensitively; import never overwrites by name.

---

## 3. Shared interaction patterns

### Choice chips (`config-filename-style--compact`)
Used as segmented radios for: Output name source, Label/QR defaults, DSA item name & metadata, staging mode, Audit enable/retention, eSM integration enable.

### Pattern + `PlaceholderChips`
Hosts: Output name, Label text/QR defaults, DSA item name pattern, eSM column mappings. DSA metadata Single column uses a free-text field; optional chips set the column name (not `{token}` insert).

### Test it out / preview
`ConfigTestPreview` + `ConfigPreviewRowEditor` on Output name and Slide label (shared `ConfigPreviewSandbox`). Overview illustration is static. DSA URL / Globus detect are status, not naming preview.

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

## 5. Shared keep widgets (`src/components/config/`)

Still used by the kit (not section shells): `ComputedFieldEditor` (`PlaceholderChips`), `ConfigPreviewRowEditor`, `PreviewRenameOverrideCallout`, `LabelSchematicPanel` + mockup/thumbnail/decorations, `OverviewLabelIllustration` + `overview_examples`, `EsmDataLoadingSection` + profile editors, `SlideLabelLayout.scss`.

Deleted at cutover: v1 section trees and orphans (`AssembledNameSection`, `LabelCompositionPanel`, `LabelContentBuilder`, etc.).

---

## 6. Regression checklist (post-cutover)

- [ ] Settings gear opens kit Configuration only
- [ ] Deep links open kit dialog and scroll to the correct section
- [ ] Every control from this doc’s inventory exists and dispatches the same action/field
- [ ] Key states exercised (empty files, pattern expanded, CLI missing, disabled while processing, …)
- [ ] Side effects observed (recompute, sync, nested modal)
- [ ] No revived v1 section components or Modal.scss section dumps

---

## 7. Durable Redux fields (UI-edited)

- `filename.{source,pattern}`
- `label.{add_text,add_qr,add_icon,icon_file,labelText,qrContent,…}`
- `csv.reservedColumns.*.aliases`
- `dsa_upload.{integrationEnabled,default_api_url,rename_item_after_upload,dsaAlias,itemMetadata}`
- `globus_upload.{integrationEnabled,source_endpoint,default_target_endpoint_*,disable_ssl_verification,max_upload_batch_size}`
- `wsi.save_macro_image`, `copy.enable_copy_mode`, `debug.enable_debug`
- Plus slices: `uploadRouting.*`, `auditLog.settings`, `esm.*`
