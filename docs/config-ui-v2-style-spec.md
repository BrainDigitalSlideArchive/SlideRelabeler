# Configuration UI — style system specification

Kit for the live Configuration dialog under `src/components/config-v2/`. Compose this kit; do not invent CSS per section.

**Inputs:** [config-ui-reference.md](./config-ui-reference.md) (behavior), Modal shell chrome for `__content--config`.

**Related:** [config-ui-reference.md](./config-ui-reference.md).

---

## 1. Goals and non-goals

### Goals
- One light-config visual language for the entire dialog (all sticky-nav sections + Delivery/CSV/eSM/label subtrees).
- Named primitives with fixed ownership under `src/components/config-v2/`.
- Kill class theft and misnamed BEM (`config-filename-style`, `dsa-url-*` for Globus, `data-loading-section__*` stolen by delivery).
- End InputText compact width wars via explicit field size variants.
- Modal.scss remains **shell chrome** — not a dumping ground for section layouts or control skins (shared controls are light-by-default).
- **Harmonize similar components:** when v1 shows near-duplicate patterns with small spacing, size, or alignment differences, treat those as accidental bolt-on drift unless the reference doc marks them as intentional. v2 uses **one** recipe per primitive, not a preserved quirk per host.

### Non-goals
- Redesigning dark brand modal chrome outside the white config panel.
- Restyling DeliveryPanel runtime UI (note parallel patterns only).
- A second color palette (purple themes, etc.). Reuse `$config-*` via semantic aliases.
- Pixel-matching unfinished v1 Advanced.
- **Pixel-faithful reproduction of every v1 spacing/size/alignment quirk** across otherwise identical controls (e.g. audit vs DSA vs API chip rows, path chips, compact input widths).

---

## 2. Design tokens

Import from [`src/styles/colors.scss`](../src/styles/colors.scss). Define aliases in `config-v2/styles/_tokens.scss` so sections never mix `$on-surface*` and `$config-*` ad hoc.

| Semantic (cfg-*) | Source | Role |
|------------------|--------|------|
| `cfg-bg` | `$config-panel-bg` | Panel / chip option background |
| `cfg-surface` | `$config-panel-surface` | Nested surfaces, section panels |
| `cfg-ink` | `$config-text-primary` | Titles, emphasis |
| `cfg-ink-muted` | `$config-text-secondary` | Body, chip labels |
| `cfg-ink-faint` | `$config-text-tertiary` | Notes, chevrons |
| `cfg-border` | `$config-border` | Borders, dividers, detail rail |
| `cfg-accent` | `$darker-blue` (preferred over `$config-accent` which equals secondary) | Active chips, focus, links |
| `cfg-warn` | `$surface-warning-text` | Warnings |
| `cfg-ok` | `#2d8a54` (formalize) | Valid status |
| `cfg-callout-bg` / `cfg-callout-border` | `$config-callout-*` | Callouts |

### Type / spacing scale (chosen system — informed by v1, not dictated by it)

v1 used overlapping values for the same roles (e.g. row labels ~0.78–0.86rem, section gaps ~0.5–0.75rem) because sections were styled independently. **Do not preserve those ranges as dual standards.** Pick **one** token per role below; amend this spec to change the scale — do not invent ad-hoc sizes in section files.

| Role | Token intent | Starting point (provisional) |
|------|--------------|------------------------------|
| Section title (H2) | `$cfg-font-section` | 1.5em / bold |
| Category title | `$cfg-font-category` | 0.95rem / semibold |
| Setting header | `$cfg-font-setting` | 0.86rem |
| Row label / chip label | `$cfg-font-row-label` / `$cfg-font-chip` | **0.78rem** (single value; was 0.78–0.86 in v1) |
| Helper / warn | `$cfg-font-helper` / `$cfg-font-warn` | 0.8rem |
| Detail caption | `$cfg-font-detail` | 0.72rem |
| Section vertical gap | `$cfg-space-lg` | **0.75rem** (prefer over mixing 0.5 and 0.75) |
| Row gap | `$cfg-space-md` | 0.5rem |
| Chip gap | `$cfg-space-sm` | 0.35rem |
| Detail rail | mixin `cfg-detail-rail` | 2px `cfg-border` + 0.65rem padding-left |

“Lock” means: sections consume these tokens only. Changing the scale is a **spec amendment**, not a section-local tweak.

### Field sizes (InputText contract)

| Size | Intent | Width (single choice) |
|------|--------|------------------------|
| `xs` | Small numbers (queue, retention) | **5rem** (v1 fought 4.5 vs 5.5 — do not keep both) |
| `sm` | Short codes | 8rem |
| `md` | Default single-line | 16rem |
| `fill` | Pattern / URL / full column | `width: 100%` |

**Ban:** parent `!important` overrides of `InputText--compact` 5em/6em. Kit `ConfigField` requests size via a wrapper under `.config-v2` (`cfg-field--xs|sm|md|fill`) — **not** an `InputText` `size` prop (avoids changing v1 compact behavior).

---

## 3. Primitive catalog

Implement as React components under `config-v2/primitives/` with SCSS under `config-v2/styles/_primitives/`.

| Primitive | Replaces (v1) | Responsibility |
|-----------|---------------|----------------|
| **ConfigShell** | `.config-panel` + sticky nav + body | Scroll root; nav; optional preview badge |
| **ConfigSection** | `.__config-control-section` + title/desc/help | Top-level sticky section (`id` required) |
| **ConfigSectionPanel** | `.config-section-panel` | Bordered light surface wrapping body |
| **ConfigDivider** | `data-loading-section__divider` | Horizontal rule inside panel |
| **ConfigCategory** | `output-delivery-section__category-*` | Mid-level title + desc (Save locally / Upload) |
| **ConfigSubsection** | `data-loading-section__subsection*` + location cards | H3 block; optional left accent rail variant |
| **ConfigSettingHeader** | `__setting-header` / quiet | H4 + muted desc; later headers in a stack (`.cfg-setting-header ~ .cfg-setting-header`) get top gap `$cfg-space-lg` |
| **ConfigChoiceChips** | `config-filename-style--compact` | Segmented radio chips (N options) |
| **ConfigLabeledRow** | audit / dsa-after-upload / api rows | `label \| controls` grid; label optically aligned with chips |
| **ConfigDetailPanel** | `dsa-after-upload__detail`, filename detail | Dependent UI under controls column; left rail |
| **ConfigField** | ad-hoc InputText | Size `xs\|sm\|md\|fill`; light-by-default InputText |
| **ConfigPathChip** | `__path` / empty | Mono path display; fill width in StatusField control; empty = helper look (no field chrome) |
| **ConfigStatusField** | `dsa-url-field` (neutral name) | Label + status + fill control + action; `compact` for short empty + adjacent action |
| **ConfigBooleanRow** | `__quiet-row` + compact Checkbox | Compact checkbox + kit row-label typography + optional help |
| **ConfigTextButton** | `__text-btn` | Link-style action |
| **ConfigWarnText** / **ConfigHelperText** | `__warn`, helpers | Status copy |
| **ConfigCallout** | overview / test-it-out callouts | Accent-left or tinted callout |
| **ConfigTestPreview** | `.config-test-it-out` | Load/reset + preview host |
| **ConfigFeatureBlock** | `.label-feature-block` | Two-column card: leading checkbox rail; title + hint and detail body share the content column; body stays visible when inactive (dimmed); optional incomplete/issue |
| **ConfigCollapsible** | advanced / assembled toggles | Expand header + body; optional subtitle + `panelId` |
| **ConfigInfoCard** | overview cards | Title + description + slot (example / illustration) |
| **ConfigMonoExample** | overview `/code` examples | Mono example line + optional caption |

### Composed recipes (document in §5; not new CSS concepts)

When multiple v1 hosts map to one primitive or recipe, they share **one** padding, gap, and alignment — do not reintroduce per-host micro-differences.

- **Audit row:** LabeledRow + ChoiceChips [+ inline ConfigField xs]
- **DSA/Globus after-upload:** LabeledRow + ChoiceChips + DetailPanel (pattern/metadata)
- **Destination location:** Location `ConfigSubsection` → N× `ConfigStatusField` (label + optional help; body = fill control + action). Set: PathChip or Field fills the control column. Unset: helper/empty text in control (no field chrome) + Choose in action; use StatusField `compact` so the action sits next to short empty copy instead of floating at the card edge.
- **Integration location:** Same location card chrome as destination locations (DSA/Globus). Per API: title + description → LabeledRow + ChoiceChips (enable) → when Enabled, show that integration’s body; when Disabled, collapse body (header + chips only). Each integration owns its own enable flag.
- **Location secondary / quiet rows:** Under a location card, after StatusFields: prefer the same `ConfigLabeledRow` grid as Status (shared label column) for SSL / numeric options so controls share one vertical edge. Helper text for a field lives in the controls column under that field. Optional `ConfigDivider` between endpoint StatusFields and the options stack. Avoid ad-hoc `.cfg-inline-field` stacks when multiple one-line controls would misalign.
- **Stacked settings:** Subsection/Category → SettingHeader → controls → SettingHeader…; later SettingHeaders use kit top gap (`$cfg-space-lg` via sibling rule), not section-local margin.
- **Filename/label sources:** Section + ChoiceChips + DetailPanel + TestPreview
- **CSV / eSM density:** SectionPanel + Subsection + domain cards using Field/LabeledRow; eSM profiles live inside an Integration location card
---

## 4. Anti-patterns (forbidden)

1. Adding section layout rules to Modal.scss `.__config-controls`.
2. Reusing domain BEM as utilities (`config-filename-style`, `dsa-url-*`, `data-loading-section__*` across features).
3. Copy-pasting chip markup instead of `ConfigChoiceChips`.
4. Inventing a new spacing/width class in a section file without updating this spec.
5. Mixing `$on-surface` and `$config-text-*` in the same v2 panel without going through `cfg-*`.
6. `!important` width on inputs without a kit `fill`/`xs` variant.
7. Nesting v2 primitives under `.Modal .__modal .__content …` specificity chains — v2 SCSS should target `.config-v2` root.
8. **Preserving per-section micro-differences** for the same primitive (chip padding, row gaps, label alignment, path-chip padding, compact field widths) “because v1 looked slightly different there.” Harmonize via the kit; if a difference is truly intentional product UX, document it in the reference doc’s v2-target column first.

---

## 5. Per-section composition map

Use this when migrating so structure is predetermined.

| Section | Composition |
|---------|-------------|
| **Overview** | ConfigSection → tinted Callout? → `cfg-info-card-grid` of ConfigInfoCard (+ MonoExample / illustration / nested accent Callout) → ConfigCollapsible glossary (`config-overview-glossary`). |
| **Audit** | ConfigSection → SectionPanel → LabeledRow×2 (enable chips; retention chips + Field xs + helper count in `__cluster`) → panel actions (View audit log Button). |
| **Output name** | ConfigSection → Panel → Callout? / validation → ChoiceChips → DetailPanel (mode copy or pattern Field fill + PlaceholderChips) → ConfigTestPreview (+ shared `ConfigPreviewSandbox`). |
| **Output delivery** | ConfigSection → Category×2 (Save locally; Upload). Locations: default save folder; DSA; Globus (Status LabeledRow → StatusField×N → Divider → LabeledRow options: SSL checkbox, max transfers xs, batch size xs + helper). Under Upload: **Upload internals** Subsection → SettingHeader + ChoiceChips (staging) → SettingHeader + Field xs (queue) [+ warn]. |
| **Data loading** | ConfigSection → Subsection (file picker) → Subsection CSV (field cards) → **Category** API Integrations → per-integration **location** card (eSlideManager: Status chips → enabled body with profile editors). Deep links: `config-file-picker`, `config-csv-import`, `config-api-integrations` (category), `config-esm-api` (eSM location). Future APIs = additional location cards with their own enable flags. eSM editors under transitional `_esm-host.scss`. |
| **Slide label** | ConfigSection → FeatureBlock×3 (defaults = ChoiceChips + DetailPanel; icon = Load/Clear) → schematic/rendered preview (host styles) → ConfigTestPreview + shared `ConfigPreviewSandbox`. Deep link: `config-slide-label`. |
| **Advanced** | ConfigSection → SectionPanel → SettingHeader + BooleanRow ×3 (overview image; unchanged copy; troubleshooting) → SettingHeader + `cfg-panel-actions` (Restore defaults / Hard reset). Deep link: `config-advanced`. |

Deep-link IDs from the reference doc must remain on the corresponding Subsection/Location roots.

---

## 6. File ownership

```
src/components/config-v2/
  styles/
    index.scss                 # public entry
    _tokens.scss
    _typography.scss
    _mixins.scss
    _primitives/
      _shell.scss
      _section.scss
      _choice-chips.scss
      _labeled-row.scss
      _detail-panel.scss
      _field.scss
      _path-chip.scss
      _status-field.scss
      _feedback.scss
      _actions.scss
      _preview.scss
      _feature-block.scss
      _collapsible.scss
      _info-card.scss
  primitives/                  # style-kit JSX
  ConfigV2App.jsx
  sections/                    # Phase 2 (Overview = 2a)
```

**Section SCSS:** only for true one-offs listed in an amendment to this spec. Default = compose primitives.

**Change control:** missing pattern → amend this doc → add primitive SCSS/JSX → then use in section. Do not ship a one-off class as the permanent fix.

---

## 7. Control skinning policy

Shared form controls (**InputText**, **Button**, **Checkbox**, **HelpIconPopover**) default to **light** config/picker chrome. Do not re-skin them under `.config-v2` or Modal config hosts.

- **Default / omit / `onLight` (legacy alias):** light panel chrome.
- **`onDark`:** opt-in dark-modal field/icon chrome only where a blue modal surface still needs it.
- **Button `--filled`:** primary CTA escape hatch on light surfaces (e.g. Globus login).
- **Dropdown:** remains dark-by-default (CSV column pickers on dark modal chrome). Add a light variant only when a light surface needs Dropdown.
- Prefer kit TextButton for tertiary actions.
- Floating help popovers stay dark (`$black` / `$beige`) for contrast on both surfaces.
- Avoid beige legacy note/infobox styles inside v2.

---

## 8. Extraction / implementation order (Phase 1)

1. Tokens + typography + `.config-v2` root  
2. ConfigShell + ConfigSection + SectionPanel + Divider  
3. ConfigChoiceChips + ConfigLabeledRow + ConfigDetailPanel  
4. ConfigField sizes + PathChip + StatusField + BooleanRow + TextButton + Warn/Helper  
5. Callout + TestPreview + FeatureBlock + Collapsible  
6. Stub nav placeholders for all sections  

Phase 2 then fills sections in migration order without expanding the primitive set unless the spec is updated.

---

## 9. Relationship to v1 pain

| v1 problem | v2 answer |
|------------|-----------|
| `config-filename-style` everywhere | `ConfigChoiceChips` |
| Dual audit/dsa/api row grids | `ConfigLabeledRow` |
| Delivery steals data-loading classes | `ConfigDivider` / `ConfigSubsection` |
| Globus uses `dsa-url-*` | `ConfigStatusField` |
| Compact InputText 5em + !important | `ConfigField` sizes |
| Styles trapped in Modal.scss | `config-v2/styles` under `.config-v2` |
| Dual `$config-*` / `$on-surface*` | `cfg-*` aliases only inside v2 |
| Near-duplicate UIs with slightly different padding/gaps/widths | One primitive + one spacing/size recipe (harmonize bolt-on drift) |
