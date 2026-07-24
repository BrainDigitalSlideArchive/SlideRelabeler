# Configuration dialog — copy review inventory

Purpose: numbered inventory of **all user-facing Configuration dialog copy** for editorial review, with jump links to source.

## How to give feedback

Reply with item numbers and replacement text, for example:

```text
#12: new text here
#g4b: drop Girder from the DSA definition
```

Mark **Needs update?** as `[x]` when you agree the row should change (or leave suggestions in **Suggested text**).

## Source links

Each **Source** cell is a markdown link `[path:line](../path#Lline)` using a GitHub-style relative path from the repo root. In Cursor / VS Code you can often Cmd-click `path:line` targets in these links.

## Scope notes

- Ordered to match sticky nav (plus modal chrome).
- Skips: duplicate aria that matches a visible label; CSS; comments; placeholder chip **token values** as separate rows (unless they have helper prose); dynamic AG Grid user column names.
- Includes `window.confirm` strings and visible button labels.
- Dynamic / templated strings are shown with `{placeholders}` where the exact runtime text varies.

## Table of contents

- [Modal chrome + nav](#modal-chrome--nav)
- [Overview](#overview)
- [Overview glossary (`g*`)](#overview-glossary-g)
- [Output name](#output-name)
- [Slide label](#slide-label)
- [Data loading](#data-loading)
- [Output delivery](#output-delivery)
- [Audit logging](#audit-logging)
- [Advanced](#advanced)

---

## Modal chrome + nav

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 1 | `nav` | Configuration | [`src/containers/Modal/ModalConfig.jsx:10`](../src/containers/Modal/ModalConfig.jsx#L10) | [ ] | — |
| 2 | `nav` | Configuration sections | [`src/components/config-v2/ConfigV2Nav.jsx:48`](../src/components/config-v2/ConfigV2Nav.jsx#L48) | [ ] | — |
| 3 | `nav` | Overview | [`src/components/config-v2/ConfigV2Nav.jsx:10`](../src/components/config-v2/ConfigV2Nav.jsx#L10) | [ ] | — |
| 4 | `nav` | Output name | [`src/components/config-v2/ConfigV2Nav.jsx:11`](../src/components/config-v2/ConfigV2Nav.jsx#L11) | [ ] | — |
| 5 | `nav` | Slide label | [`src/components/config-v2/ConfigV2Nav.jsx:12`](../src/components/config-v2/ConfigV2Nav.jsx#L12) | [ ] | — |
| 6 | `nav` | Data loading | [`src/components/config-v2/ConfigV2Nav.jsx:13`](../src/components/config-v2/ConfigV2Nav.jsx#L13) | [ ] | — |
| 7 | `nav` | Output delivery | [`src/components/config-v2/ConfigV2Nav.jsx:14`](../src/components/config-v2/ConfigV2Nav.jsx#L14) | [ ] | — |
| 8 | `nav` | Audit logging | [`src/components/config-v2/ConfigV2Nav.jsx:15`](../src/components/config-v2/ConfigV2Nav.jsx#L15) | [ ] | — |
| 9 | `nav` | Advanced | [`src/components/config-v2/ConfigV2Nav.jsx:16`](../src/components/config-v2/ConfigV2Nav.jsx#L16) | [ ] | — |

## Overview

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 10 | `section_title` | How WSI deidentification works | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:102`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L102) | [ ] | — |
| 11 | `section_description` | SlideRelabeler creates a copy of the WSI that contains a new label image, which can include text, an image, and a QR code. Internal metadata is automatically redacted. Usually, the macro image (the overview image of the whole slide) is also redacted, as this image can contain a portion of the slide label which may have protected health information. The options below let you customize how the label looks, how to name the file, what data to include in the QR code, and more. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:105`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L105) | [ ] | — |
| 12 | `callout` | The configuration page uses basic example file information by default. If you load a real WSI file on the main page of the app, the data from the first row can be used instead. This can be useful for testing and understanding the app's behavior. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:115`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L115) | [ ] | — |
| 13 | `category_title` | Renaming the file | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:123`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L123) | [ ] | — |
| 14 | `category_description` | You can choose how to name the de-identified image. Often, a random UUID is used for privacy, but you can also build a custom name by using data loaded into the app, or even keep the original name. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:124`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L124) | [ ] | — |
| 15 | `other` | acde070d-8c4c-4f0d-9d8a-162843c10333.tiff | [`src/components/config/overview_examples.js:3`](../src/components/config/overview_examples.js#L3) | [ ] | — |
| 16 | `category_title` | Creating the new label | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:130`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L130) | [ ] | — |
| 17 | `category_description` | Text, an image/icon, and/or a QR code can all be drawn onto the slide's new label. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:131`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L131) | [ ] | — |
| 18 | `label` | Image | [`src/components/config/OverviewLabelIllustration.jsx:18`](../src/components/config/OverviewLabelIllustration.jsx#L18) | [ ] | — |
| 19 | `label` | QR | [`src/components/config/OverviewLabelIllustration.jsx:22`](../src/components/config/OverviewLabelIllustration.jsx#L22) | [ ] | — |
| 20 | `helper` | Example layout: readable text, logo, and QR code | [`src/components/config/OverviewLabelIllustration.jsx:27`](../src/components/config/OverviewLabelIllustration.jsx#L27) | [ ] | — |
| 21 | `other` | CASE42_B12_HE_1 | [`src/components/config/overview_examples.js:5`](../src/components/config/overview_examples.js#L5) | [ ] | — |
| 22 | `category_title` | Uploading to a server | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:137`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L137) | [ ] | — |
| 23 | `category_description` | You can configure the app to upload the de-identified image to a server after it is created, for example to a Digital Slide Archive (DSA) server or by using Globus to send the file to a remote location. Depending on the target, you can define additional options like how to name the file on the server, or what extra data to send along with the file. By doing this, you can run the application locally without needing storage space for all of the de-identified images. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:140`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L140) | [ ] | — |
| 24 | — | *(removed — Globus alias callout)* | — | [ ] | — |
| 25 | — | *(removed — Example DSA item name caption)* | — | [ ] | — |
| 26 | — | *(removed — DSA example value; `OVERVIEW_DSA_UPLOAD_ALIAS` deleted)* | — | [ ] | — |
| 27 | `subsection_title` | Glossary of terms used below | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:151`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L151) | [ ] | — |
| 28 | `hint` | Open the glossary | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:155`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L155) | [ ] | — |
| 29 | `hint` | Close the glossary | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:154`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L154) | [ ] | — |
| 30 | `helper` | Definitions for terms you will see in Configuration and on the main app window. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:162`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L162) | [ ] | — |
| 31–36 | — | *(superseded by glossary rows **g0–g16** below)* | — | [ ] | — |

### Overview glossary (`g*`)

Source of truth: `OVERVIEW_GLOSSARY` in [`ConfigOverviewSection.jsx`](../src/components/config-v2/sections/ConfigOverviewSection.jsx). Term/definition pairs are listed alphabetically in the UI.

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| g0 | `label` | API Integration | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:15`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L15) | [ ] | — |
| g0b | `helper` | A way to connect the application to an external system, either for loading data or as a place to upload deidentified files. Current integrations include eSlide Manager, the Digital Slide Archive, and Globus. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:17`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L17) | [ ] | — |
| g1 | `label` | CSV import | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:21`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L21) | [ ] | — |
| g1b | `helper` | Loading slides from a spreadsheet file. Column headers can supply the file path, output name, label text, QR content, and other fields. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:22`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L22) | [ ] | — |
| g2 | `label` | De-identification | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:26`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L26) | [ ] | — |
| g2b | `helper` | Creating a copy of a slide with identifying details removed or replaced—new label artwork, redacted internal metadata, and usually a redacted macro (overview) image. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:27`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L27) | [ ] | — |
| g3 | `label` | Delivery panel | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:31`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L31) | [ ] | — |
| g3b | `helper` | The area on the main app window where you turn on saving locally and/or uploading, and where you sign in and choose folders for DSA or Globus. Configuration sets defaults; the Delivery panel controls the current session. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:32`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L32) | [ ] | — |
| g4 | `label` | Digital Slide Archive (DSA) | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:36`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L36) | [ ] | — |
| g4b | `helper` | An online slide archive. Uploaded files become items in a folder you choose. You can set how items are named and whether to attach extra data from the file list. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:37`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L37) | [ ] | — |
| g5 | `label` | eSlideManager (eSM) | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:41`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L41) | [ ] | — |
| g5b | `helper` | An external system that can search and load slides into the file list. Connection profiles and import naming rules are configured under Data loading. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:42`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L42) | [ ] | — |
| g6 | `label` | File list | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:46`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L46) | [ ] | — |
| g6b | `helper` | The table of slides in the main window. Each row is one slide file, with columns such as Output name, Label, and QR. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:47`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L47) | [ ] | — |
| g7 | `label` | Globus | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:51`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L51) | [ ] | — |
| g7b | `helper` | A service for sending files to a remote storage collection. Globus uploads use the output filename; there is no separate archive item name. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:52`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L52) | [ ] | — |
| g8 | `label` | Label text | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:56`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L56) | [ ] | — |
| g8b | `helper` | Human-readable text printed on the new slide label image. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:57`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L57) | [ ] | — |
| g9 | `label` | Macro image | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:61`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L61) | [ ] | — |
| g9b | `helper` | The overview photo of the whole slide embedded in many WSI files. It can show part of the original label (and thus patient details), so SlideRelabeler usually removes or replaces it. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:62`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L62) | [ ] | — |
| g10 | `label` | Metadata | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:66`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L66) | [ ] | — |
| g10b | `helper` | Extra information stored inside or alongside a slide file. Internal slide metadata is redacted during de-identification. You can configure how the application handles metadata fields that are loaded into the table for each file, either from a CSV import or an API integration. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:67`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L67) | [ ] | — |
| g11 | `label` | Output name | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:71`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L71) | [ ] | — |
| g11b | `helper` | The filename used for the de-identified file on disk (and for Globus uploads). It can be a random UUID, the original name, a custom pattern, or a value from CSV/eSM. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:72`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L72) | [ ] | — |
| g12 | `label` | Pattern | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:76`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L76) | [ ] | — |
| g12b | `helper` | A naming template that mixes fixed text with placeholders (see Placeholder), such as deid_{uuid} or {blockId}_{stainId}. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:77`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L77) | [ ] | — |
| g13 | `label` | Placeholder | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:81`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L81) | [ ] | — |
| g13b | `helper` | A name in curly braces inside a pattern that is replaced with a real value for each slide—for example {uuid}, {outputName}, or a file-list column like {blockId}. Some placeholders are always available; others appear after you load slides (or come from CSV import / an API integration). | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:82`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L82) | [ ] | — |
| g14 | `label` | QR content | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:87`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L87) | [ ] | — |
| g14b | `helper` | The exact text or URL encoded in the label QR code—often the output name, UUID, label text, or a custom pattern. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:88`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L88) | [ ] | — |
| g15 | `label` | UUID | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:92`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L92) | [ ] | — |
| g15b | `helper` | A universally unique identifier: a random value assigned to each file. You can use it as the output filename when you want a name that does not describe the specimen. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:93`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L93) | [ ] | — |
| g16 | `label` | Whole-slide image (WSI) | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:97`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L97) | [ ] | — |
| g16b | `helper` | A large digital microscopy file (for example .svs, .ndpi, .tif, or .tiff) that SlideRelabeler loads, de-identifies, and optionally uploads. | [`src/components/config-v2/sections/ConfigOverviewSection.jsx:98`](../src/components/config-v2/sections/ConfigOverviewSection.jsx#L98) | [ ] | — |

## Output name

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 37 | `section_title` | Output name | [`src/components/config-v2/sections/OutputFilenameSection.jsx:134`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L134) | [ ] | — |
| 38 | `section_description` | When the Output name column is empty for a loaded slide, how should it be filled in? | [`src/components/config-v2/sections/OutputFilenameSection.jsx:135`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L135) | [ ] | — |
| 39 | `tooltip_help` | When a slide is loaded and an output name is not provided, you can choose to use a random unique ID (UUID), keep the original filename, or build a custom pattern using column values. If an output name is provided, for example from a CSV import or loading from an API, that value will be used instead. | [`src/components/config-v2/sections/OutputFilenameSection.jsx:22`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L22) | [ ] | — |
| 40 | `tooltip_help` | Output name defaults help | [`src/components/config-v2/sections/OutputFilenameSection.jsx:139`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L139) | [ ] | — |
| 41 | `label` | Use a UUID (recommended for sharing) | [`src/components/config-v2/sections/OutputFilenameSection.jsx:32`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L32) | [ ] | — |
| 42 | `helper` | Assigns a random unique ID (UUID) as the Output name for each file. | [`src/components/config-v2/sections/OutputFilenameSection.jsx:33`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L33) | [ ] | — |
| 43 | `setting_description` | A UUID is a randomly generated unique identifier. Using one as the output name helps de-identify slides for sharing, since it carries no patient or specimen details. Each slide gets its own UUID when loaded, which you can use in various places if desired. | [`src/components/config-v2/sections/OutputFilenameSection.jsx:34`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L34) | [ ] | — |
| 44 | `label` | Keep original filename | [`src/components/config-v2/sections/OutputFilenameSection.jsx:38`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L38) | [ ] | — |
| 45 | `helper` | Use the source file's name unchanged. | [`src/components/config-v2/sections/OutputFilenameSection.jsx:39`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L39) | [ ] | — |
| 46 | `setting_description` | Keeps the source file's name. Use this when the file is already named appropriately for sharing. To add a prefix or suffix (e.g. deid-), use Custom pattern instead. | [`src/components/config-v2/sections/OutputFilenameSection.jsx:61`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L61) | [ ] | — |
| 47 | `label` | Custom pattern | [`src/components/config-v2/sections/OutputFilenameSection.jsx:43`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L43) | [ ] | — |
| 48 | `helper` | Build the output name from placeholders and column values (e.g. deid_{uuid}). | [`src/components/config-v2/sections/OutputFilenameSection.jsx:44`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L44) | [ ] | — |
| 49 | `label` | Pattern | [`src/components/config-v2/sections/OutputFilenameSection.jsx:172`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L172) | [ ] | — |
| 50 | `hint` | {blockId}_{uuid} | [`src/components/config-v2/sections/OutputFilenameSection.jsx:178`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L178) | [ ] | — |
| 51 | `callout` | Rows already filled from a CSV import, API integration, or a manual edit will not change when you update these defaults. | [`src/components/config-v2/preview/ConfigPreviewSandbox.jsx:103`](../src/components/config-v2/preview/ConfigPreviewSandbox.jsx#L103) | [ ] | — |
| 52 | `status` | {N} row(s) missing column value(s) required by pattern. | [`src/helpers/pattern_engine.js:370`](../src/helpers/pattern_engine.js#L370) | [ ] | — |
| 53 | `status` | Output name pattern uses placeholders that are not available when the output name is computed: {…}. | [`src/helpers/pattern_engine.js:308`](../src/helpers/pattern_engine.js#L308) | [ ] | — |
| 54 | `label` | Output name (pattern validation field label) | [`src/helpers/pattern_validation.js:14`](../src/helpers/pattern_validation.js#L14) | [ ] | — |
| 55 | `label` | Label text (pattern validation field label) | [`src/helpers/pattern_validation.js:15`](../src/helpers/pattern_validation.js#L15) | [ ] | — |
| 56 | `label` | QR content (pattern validation field label) | [`src/helpers/pattern_validation.js:16`](../src/helpers/pattern_validation.js#L16) | [ ] | — |
| 57 | `label` | Digital Slide Archive item name (pattern validation field label) | [`src/helpers/pattern_validation.js:17`](../src/helpers/pattern_validation.js#L17) | [ ] | — |
| 58 | `subsection_title` | Test it out | [`src/components/config-v2/primitives/ConfigTestPreview.jsx:9`](../src/components/config-v2/primitives/ConfigTestPreview.jsx#L9) | [ ] | — |
| 59 | `hint` | The highlighted Output name column shows what this file would be renamed to based on your selected option above. | [`src/components/config-v2/sections/OutputFilenameSection.jsx:199`](../src/components/config-v2/sections/OutputFilenameSection.jsx#L199) | [ ] | — |
| 60 | `button` | Load from first row | [`src/components/config-v2/primitives/ConfigTestPreview.jsx:35`](../src/components/config-v2/primitives/ConfigTestPreview.jsx#L35) | [ ] | — |
| 61 | `button` | Reset to example | [`src/components/config-v2/primitives/ConfigTestPreview.jsx:46`](../src/components/config-v2/primitives/ConfigTestPreview.jsx#L46) | [ ] | — |
| 62 | `callout` | Manually edited values override the option selected above. | [`src/components/config/PreviewRenameOverrideCallout.jsx:55`](../src/components/config/PreviewRenameOverrideCallout.jsx#L55) | [ ] | — |
| 63 | `button` | Clear | [`src/components/config/PreviewRenameOverrideCallout.jsx:62`](../src/components/config/PreviewRenameOverrideCallout.jsx#L62) | [ ] | — |
| 64 | `label` | Current columns / Default columns (depends on whether slides are loaded) | [`src/components/config/ComputedFieldEditor.jsx:12`](../src/components/config/ComputedFieldEditor.jsx#L12) | [ ] | — |
| 65 | `tooltip_help` | Loaded: columns from file list… / Empty: columns that are always available… (see `getFileListPlaceholderCopy`) | [`src/components/config/ComputedFieldEditor.jsx:11`](../src/components/config/ComputedFieldEditor.jsx#L11) | [ ] | — |
| 66 | `tooltip_help` | Current columns help | [`src/components/config/ComputedFieldEditor.jsx:18`](../src/components/config/ComputedFieldEditor.jsx#L18) | [ ] | — |
| 67 | `helper` | Preview: {previewValue} | [`src/components/config/ComputedFieldEditor.jsx:98`](../src/components/config/ComputedFieldEditor.jsx#L98) | [ ] | — |
| 68 | `label` | Path | [`src/helpers/file_table_columns.js:40`](../src/helpers/file_table_columns.js#L40) | [ ] | — |
| 69 | `tooltip_help` | Path to original file | [`src/helpers/file_table_columns.js:41`](../src/helpers/file_table_columns.js#L41) | [ ] | — |
| 70 | `label` | Original file | [`src/helpers/file_table_columns.js:49`](../src/helpers/file_table_columns.js#L49) | [ ] | — |
| 71 | `tooltip_help` | Original file name. Click to open in viewer. | [`src/helpers/file_table_columns.js:50`](../src/helpers/file_table_columns.js#L50) | [ ] | — |
| 72 | `label` | Size | [`src/helpers/file_table_columns.js:59`](../src/helpers/file_table_columns.js#L59) | [ ] | — |
| 73 | `tooltip_help` | File size | [`src/helpers/file_table_columns.js:60`](../src/helpers/file_table_columns.js#L60) | [ ] | — |
| 74 | `label` | Images | [`src/helpers/file_table_columns.js:69`](../src/helpers/file_table_columns.js#L69) | [ ] | — |
| 75 | `tooltip_help` | Associated images | [`src/helpers/file_table_columns.js:70`](../src/helpers/file_table_columns.js#L70) | [ ] | — |
| 76 | `label` | Copy To | [`src/helpers/file_table_columns.js:78`](../src/helpers/file_table_columns.js#L78) | [ ] | — |
| 77 | `tooltip_help` | Copy to destination directory | [`src/helpers/file_table_columns.js:79`](../src/helpers/file_table_columns.js#L79) | [ ] | — |
| 78 | `label` | Output name | [`src/helpers/file_table_columns.js:86`](../src/helpers/file_table_columns.js#L86) | [ ] | — |
| 79 | `tooltip_help` | Output file name | [`src/helpers/file_table_columns.js:87`](../src/helpers/file_table_columns.js#L87) | [ ] | — |
| 80 | `label` | Label | [`src/helpers/file_table_columns.js:93`](../src/helpers/file_table_columns.js#L93) | [ ] | — |
| 81 | `tooltip_help` | Label text | [`src/helpers/file_table_columns.js:94`](../src/helpers/file_table_columns.js#L94) | [ ] | — |
| 82 | `label` | QR | [`src/helpers/file_table_columns.js:100`](../src/helpers/file_table_columns.js#L100) | [ ] | — |
| 83 | `tooltip_help` | QR code content | [`src/helpers/file_table_columns.js:101`](../src/helpers/file_table_columns.js#L101) | [ ] | — |
| 84 | `label` | Progress | [`src/helpers/file_table_columns.js:110`](../src/helpers/file_table_columns.js#L110) | [ ] | — |
| 85 | `tooltip_help` | Processing progress | [`src/helpers/file_table_columns.js:111`](../src/helpers/file_table_columns.js#L111) | [ ] | — |

## Slide label

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 86 | `section_title` | Slide label | [`src/components/config-v2/sections/SlideLabelSection.jsx:127`](../src/components/config-v2/sections/SlideLabelSection.jsx#L127) | [ ] | — |
| 87 | `section_description` | What is printed on each slide label, and how empty Label/QR cells are filled. | [`src/components/config-v2/sections/SlideLabelSection.jsx:128`](../src/components/config-v2/sections/SlideLabelSection.jsx#L128) | [x] | What appears on each slide's new label, and how empty Label text and QR content cells are filled. |
| 88 | `tooltip_help` | Choose what appears on the printed slide label: text, a QR code, and/or an icon. For text and QR, set how empty cells are filled by default. Use Test it out to preview on the sample row or the first loaded file. | [`src/components/config-v2/sections/SlideLabelSection.jsx:18`](../src/components/config-v2/sections/SlideLabelSection.jsx#L18) | [ ] | — |
| 89 | `tooltip_help` | Slide label help | [`src/components/config-v2/sections/SlideLabelSection.jsx:130`](../src/components/config-v2/sections/SlideLabelSection.jsx#L130) | [ ] | — |
| 90 | `hint` | Edit cells below to update the rendered preview. Changes stay here. | [`src/components/config-v2/sections/SlideLabelSection.jsx:30`](../src/components/config-v2/sections/SlideLabelSection.jsx#L30) | [ ] | — |
| 91 | `hint` | The highlighted Label and QR columns show values used in the rendered preview. Edit cells to try different content. | [`src/components/config-v2/sections/SlideLabelSection.jsx:36`](../src/components/config-v2/sections/SlideLabelSection.jsx#L36) | [ ] | — |
| 92 | `hint` | The highlighted {Label\|QR} column shows values used in the rendered preview. Edit cells to try different content. | [`src/components/config-v2/sections/SlideLabelSection.jsx:44`](../src/components/config-v2/sections/SlideLabelSection.jsx#L44) | [ ] | — |
| 93 | `setting_header` | Label Text | [`src/components/config-v2/sections/slide-label/LabelComposer.jsx:13`](../src/components/config-v2/sections/slide-label/LabelComposer.jsx#L13) | [ ] | — |
| 94 | `hint` | Printed at the top of the label. | [`src/components/config-v2/sections/slide-label/LabelComposer.jsx:14`](../src/components/config-v2/sections/slide-label/LabelComposer.jsx#L14) | [ ] | — |
| 95 | `setting_header` | QR Encoding | [`src/components/config-v2/sections/slide-label/LabelComposer.jsx:18`](../src/components/config-v2/sections/slide-label/LabelComposer.jsx#L18) | [x] | QR code |
| 96 | `hint` | Encode a QR code on the label. | [`src/components/config-v2/sections/slide-label/LabelComposer.jsx:19`](../src/components/config-v2/sections/slide-label/LabelComposer.jsx#L19) | [x] | Include a QR code on the label. |
| 97 | `setting_header` | Image/Icon | [`src/components/config-v2/sections/slide-label/LabelComposer.jsx:23`](../src/components/config-v2/sections/slide-label/LabelComposer.jsx#L23) | [ ] | — |
| 98 | `hint` | Display an image (logo) on the label. | [`src/components/config-v2/sections/slide-label/LabelComposer.jsx:24`](../src/components/config-v2/sections/slide-label/LabelComposer.jsx#L24) | [ ] | — |
| 99 | `label` | Use Output name | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:12`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L12) | [ ] | — |
| 100 | `helper` | When Label is empty, fill from each row's Output name. | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:13`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L13) | [ ] | — |
| 101 | `label` | Leave blank | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:17`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L17) | [ ] | — |
| 102 | `helper` | When Label is empty, leave it blank. Enter text in the table when needed. | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:18`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L18) | [ ] | — |
| 103 | `label` | Custom pattern | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:22`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L22) | [ ] | — |
| 104 | `helper` | Build label text from placeholders and column values. | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:23`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L23) | [ ] | — |
| 105 | `hint` | {outputName} | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:24`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L24) | [ ] | — |
| 106 | `helper` | Pattern | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:118`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L118) | [ ] | — |
| 107 | `label` | Use Output name | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:31`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L31) | [ ] | — |
| 108 | `helper` | When QR is empty, encode each row's Output name. | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:32`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L32) | [ ] | — |
| 109 | `label` | Use Label | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:36`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L36) | [ ] | — |
| 110 | `helper` | When QR is empty, encode each row's Label value. | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:37`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L37) | [ ] | — |
| 111 | `label` | Use UUID | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:41`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L41) | [x] | Use a random unique ID (UUID) |
| 112 | `helper` | When QR is empty, encode the file UUID. | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:42`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L42) | [x] | When QR is empty, encode the file's random unique ID (UUID). |
| 113 | `label` | Custom pattern | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:46`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L46) | [ ] | — |
| 114 | `helper` | Build QR content from placeholders and column values. | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:47`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L47) | [ ] | — |
| 115 | `hint` | https://example.org?id={uuid} | [`src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx:48`](../src/components/config-v2/sections/slide-label/LabelDefaultsEditor.jsx#L48) | [ ] | — |
| 116 | `button` | Load… | [`src/components/config-v2/sections/slide-label/LabelImageFileRow.jsx:36`](../src/components/config-v2/sections/slide-label/LabelImageFileRow.jsx#L36) | [ ] | — |
| 117 | `tooltip_help` | Missing image file | [`src/components/config-v2/sections/slide-label/LabelImageFileRow.jsx:43`](../src/components/config-v2/sections/slide-label/LabelImageFileRow.jsx#L43) | [ ] | — |
| 118 | `tooltip_help` | Although Image is selected, an actual image file still needs to be provided. Otherwise, no image will be rendered onto the label. | [`src/helpers/label_composition_issues.js:5`](../src/helpers/label_composition_issues.js#L5) | [ ] | — |
| 119 | `status` | No image selected. | [`src/helpers/label_composition_issues.js:3`](../src/helpers/label_composition_issues.js#L3) | [ ] | — |
| 120 | `button` | Clear | [`src/components/config-v2/sections/slide-label/LabelImageFileRow.jsx:65`](../src/components/config-v2/sections/slide-label/LabelImageFileRow.jsx#L65) | [ ] | — |
| 121 | `status` | Not set | [`src/helpers/label_composition_summaries.js:42`](../src/helpers/label_composition_summaries.js#L42) | [ ] | — |
| 122 | `status` | QR is enabled but the custom pattern is empty. Labels will omit the QR code until you enter a pattern. | [`src/helpers/label_composition_issues.js:32`](../src/helpers/label_composition_issues.js#L32) | [ ] | — |
| 123 | `status` | QR is enabled but the preview row has no QR content. Labels will omit the QR code for rows without content. | [`src/helpers/label_composition_issues.js:37`](../src/helpers/label_composition_issues.js#L37) | [ ] | — |
| 124 | `status` | Text is enabled but the preview row has no label text. Labels will omit text for rows without content. | [`src/helpers/label_composition_issues.js:49`](../src/helpers/label_composition_issues.js#L49) | [ ] | — |
| 125 | `subsection_title` | Label schematic | [`src/components/config/LabelSchematicPanel.jsx:28`](../src/components/config/LabelSchematicPanel.jsx#L28) | [ ] | — |
| 126 | `tooltip_help` | Label schematic help | [`src/components/config/LabelSchematicPanel.jsx:29`](../src/components/config/LabelSchematicPanel.jsx#L29) | [ ] | — |
| 127 | `tooltip_help` | Shows enabled label elements and template placeholders from your selected options. Edit cells in Test it out below to preview on a specific row. | [`src/components/config/LabelSchematicPanel.jsx:7`](../src/components/config/LabelSchematicPanel.jsx#L7) | [ ] | — |
| 128 | `label` | Sample text | [`src/components/config/LabelCompositionMockup.jsx:30`](../src/components/config/LabelCompositionMockup.jsx#L30) | [ ] | — |
| 129 | `label` | Text | [`src/components/config/LabelCompositionMockup.jsx:30`](../src/components/config/LabelCompositionMockup.jsx#L30) | [ ] | — |
| 130 | `label` | (empty) | [`src/components/config/LabelCompositionMockup.jsx:35`](../src/components/config/LabelCompositionMockup.jsx#L35) | [ ] | — |
| 131 | `label` | Image | [`src/components/config/LabelCompositionMockup.jsx:36`](../src/components/config/LabelCompositionMockup.jsx#L36) | [ ] | — |
| 132 | `label` | No image selected | [`src/components/config/LabelCompositionMockup.jsx:92`](../src/components/config/LabelCompositionMockup.jsx#L92) | [ ] | — |
| 133 | `label` | QR | [`src/components/config/LabelCompositionMockup.jsx:119`](../src/components/config/LabelCompositionMockup.jsx#L119) | [ ] | — |
| 134 | `label` | (blank) | [`src/helpers/label_config_preview.js:159`](../src/helpers/label_config_preview.js#L159) | [ ] | — |
| 135 | `subsection_title` | Rendered preview | [`src/components/config/LabelRenderedPreviewPanel.jsx:23`](../src/components/config/LabelRenderedPreviewPanel.jsx#L23) | [ ] | — |
| 136 | `tooltip_help` | Rendered label preview help | [`src/components/config/LabelRenderedPreviewPanel.jsx:24`](../src/components/config/LabelRenderedPreviewPanel.jsx#L24) | [ ] | — |
| 137 | `tooltip_help` | The editable values in the "Test it out" grid below are reflected in this live preview. | [`src/components/config/LabelRenderedPreviewPanel.jsx:5`](../src/components/config/LabelRenderedPreviewPanel.jsx#L5) | [ ] | — |
| 138 | `status` | Generating preview… | [`src/components/config/LabelThumbnailPreview.jsx:74`](../src/components/config/LabelThumbnailPreview.jsx#L74) | [ ] | — |
| 139 | `other` | Rendered label preview | [`src/components/config/LabelThumbnailPreview.jsx:70`](../src/components/config/LabelThumbnailPreview.jsx#L70) | [ ] | — |
| 140 | `status` | (+N more) | [`src/components/config/LabelRenderedPreviewPanel.jsx:38`](../src/components/config/LabelRenderedPreviewPanel.jsx#L38) | [ ] | — |
| 141 | `subsection_title` | Test it out | [`src/components/config-v2/primitives/ConfigTestPreview.jsx:9`](../src/components/config-v2/primitives/ConfigTestPreview.jsx#L9) | [ ] | — |
| 142 | `callout` | Rows already filled from a CSV import, API integration, or a manual edit will not change when you update these defaults. | [`src/components/config-v2/preview/ConfigPreviewSandbox.jsx:103`](../src/components/config-v2/preview/ConfigPreviewSandbox.jsx#L103) | [ ] | — |

## Data loading

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 143 | `section_title` | Data loading | [`src/components/config-v2/sections/DataLoadingSection.jsx:32`](../src/components/config-v2/sections/DataLoadingSection.jsx#L32) | [ ] | —  |
| 144 | `section_description` | How slides are added to the file list before processing. | [`src/components/config-v2/sections/DataLoadingSection.jsx:33`](../src/components/config-v2/sections/DataLoadingSection.jsx#L33) | [ ] | — |
| 145 | `tooltip_help` | SlideRelabeler can load slides via the file picker, a CSV spreadsheet, or an API integration (e.g. eSlideManager). Each of these loading options is detailed below. | [`src/components/config-v2/sections/DataLoadingSection.jsx:13`](../src/components/config-v2/sections/DataLoadingSection.jsx#L13) | [ ] | — |
| 146 | `tooltip_help` | Data loading help | [`src/components/config-v2/sections/DataLoadingSection.jsx:35`](../src/components/config-v2/sections/DataLoadingSection.jsx#L35) | [ ] | —  |
| 147 | `subsection_title` | File picker | [`src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx:14`](../src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx#L14) | [ ] | —  |
| 148 | `helper` | Use Add File/Files (multi-select) or Add Folder (includes subfolders) to load whole-slide images into the file list. Internal slide metadata is fetched automatically after rows are added. | [`src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx:17`](../src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx#L17) | [ ] | — |
| 149 | `helper` | Supported formats: .svs, .ndpi, .tif, .tiff | [`src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx:22`](../src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx#L22) | [ ] | — |
| 150 | `other` | .svs, .ndpi, .tif, .tiff | [`src/helpers/wsi_extensions.js:3`](../src/helpers/wsi_extensions.js#L3) | [ ] | — |
| 151 | `helper` | Output name, label text, and QR content columns always start out empty for rows loaded this way. The app uses the configured settings above to define the Output name and Slide label values for each row. | [`src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx:25`](../src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx#L25) | [ ] | — |
| 152 | `helper` | Loading the same file path twice is skipped. | [`src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx:30`](../src/components/config-v2/sections/data-loading/FilePickerInfoSection.jsx#L30) | [ ] | — |
| 153 | `subsection_title` | CSV import | [`src/components/config-v2/sections/data-loading/CsvImportSection.jsx:67`](../src/components/config-v2/sections/data-loading/CsvImportSection.jsx#L67) | [ ] | —  |
| 154 | `tooltip_help` | CSV import column mapping help | [`src/components/config-v2/sections/data-loading/CsvImportSection.jsx:69`](../src/components/config-v2/sections/data-loading/CsvImportSection.jsx#L69) | [ ] | —  |
| 155 | `tooltip_help` | On import, SlideRelabeler matches your configured column names to special CSV fields. Mapped values override Output name and Slide label defaults when a row includes data. If a required column is missing, import pauses so you can pick the correct column. Any other CSV headers become file list columns for use in patterns. | [`src/components/config-v2/sections/data-loading/CsvImportSection.jsx:17`](../src/components/config-v2/sections/data-loading/CsvImportSection.jsx#L17) | [ ] | — |
| 156 | `helper` | SlideRelabeler can use data loaded from a CSV file to populate the file list. … If you have existing data in a CSV file that uses different header names (and you don't want to change those headers), you can map them to the appropriate columns below instead. | [`src/components/config-v2/sections/data-loading/CsvImportSection.jsx:76`](../src/components/config-v2/sections/data-loading/CsvImportSection.jsx#L76) | [ ] | — |
| 157 | `button` | template CSV file | [`src/components/config-v2/sections/data-loading/CsvImportSection.jsx:81`](../src/components/config-v2/sections/data-loading/CsvImportSection.jsx#L81) | [ ] | —  |
| 158 | `button` | Define alternative column headers | [`src/components/config-v2/sections/data-loading/CsvImportSection.jsx:95`](../src/components/config-v2/sections/data-loading/CsvImportSection.jsx#L95) | [ ] | —  |
| 159 | `setting_header` | File path (required) | [`src/helpers/csv_column_config.js:21`](../src/helpers/csv_column_config.js#L21) | [ ] | —  |
| 160 | `setting_description` | Which CSV column contains the slide file path. Each row must include a path to load into the file list. | [`src/helpers/csv_column_config.js:24`](../src/helpers/csv_column_config.js#L24) | [ ] | — |
| 161 | `setting_header` | Output name | [`src/helpers/csv_column_config.js:28`](../src/helpers/csv_column_config.js#L28) | [ ] | —  |
| 162 | `setting_description` | When present in a row, overrides Output name defaults from Configuration for that slide. | [`src/helpers/csv_column_config.js:31`](../src/helpers/csv_column_config.js#L31) | [ ] | —  |
| 163 | `setting_header` | Label text | [`src/helpers/csv_column_config.js:35`](../src/helpers/csv_column_config.js#L35) | [ ] | —  |
| 164 | `setting_description` | When present in a row, overrides Slide label text defaults for that slide. | [`src/helpers/csv_column_config.js:38`](../src/helpers/csv_column_config.js#L38) | [ ] | —  |
| 165 | `setting_header` | QR content | [`src/helpers/csv_column_config.js:42`](../src/helpers/csv_column_config.js#L42) | [ ] | —  |
| 166 | `setting_description` | When present in a row, overrides Slide label QR content defaults for that slide. | [`src/helpers/csv_column_config.js:45`](../src/helpers/csv_column_config.js#L45) | [ ] | —  |
| 167 | `label` | Default header name | [`src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx:112`](../src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx#L112) | [ ] | —  |
| 168 | `label` | Alternate header name | [`src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx:131`](../src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx#L131) | [ ] | —  |
| 169 | `hint` | Alternate header name | [`src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx:137`](../src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx#L137) | [ ] | —  |
| 170 | `button` | + Add alternate header name | [`src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx:182`](../src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx#L182) | [ ] | —  |
| 171 | `badge` | (required) | [`src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx:103`](../src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx#L103) | [ ] | —  |
| 172 | `tooltip_help` | Default header name cannot be removed | [`src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx:119`](../src/components/config-v2/sections/data-loading/CsvReservedFieldCard.jsx#L119) | [ ] | —  |
| 173 | `category_title` | API Integrations | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:44`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L44) | [ ] | —  |
| 174 | `category_description` | External software/systems can load slides into the file list. Enable only the ones you use. | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:51`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L51) | [ ] | — |
| 175 | `tooltip_help` | API integrations help | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:46`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L46) | [ ] | —  |
| 176 | `tooltip_help` | Connect SlideRelabeler to external systems that load slides into the file list. Enable each integration individually to configure its connection and import rules. | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:14`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L14) | [ ] | — |
| 177 | `subsection_title` | eSlideManager | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:56`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L56) | [ ] | —  |
| 178 | `subsection_description` | Saved connection profiles for eSlideManager. Open eSlideManager from the toolbar to log in, pick a profile, and load slides—or clone a profile to save a search preset variant. | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:21`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L21) | [ ] | —  |
| 179 | `label` | Status: | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:60`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L60) | [ ] | —  |
| 180 | `label` | Enabled | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:27`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L27) | [ ] | —  |
| 181 | `label` | Disabled | [`src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx:28`](../src/components/config-v2/sections/data-loading/ApiIntegrationsSection.jsx#L28) | [ ] | —  |
| 182 | `subsection_title` | Profiles | [`src/components/config/EsmDataLoadingSection.jsx:57`](../src/components/config/EsmDataLoadingSection.jsx#L57) | [ ] | —  |
| 183 | `button` | Add profile | [`src/components/config/EsmDataLoadingSection.jsx:81`](../src/components/config/EsmDataLoadingSection.jsx#L81) | [ ] | —  |
| 184 | `confirm` | Delete this profile? | [`src/components/config/EsmDataLoadingSection.jsx:31`](../src/components/config/EsmDataLoadingSection.jsx#L31) | [ ] | —  |
| 185 | `other` | New profile | [`src/components/config/EsmDataLoadingSection.jsx:18`](../src/components/config/EsmDataLoadingSection.jsx#L18) | [ ] | —  |
| 186 | `label` | Unnamed | [`src/components/config/EsmProfileCard.jsx:21`](../src/components/config/EsmProfileCard.jsx#L21) | [ ] | —  |
| 187 | `hint` | Profile name | [`src/components/config/EsmProfileCard.jsx:76`](../src/components/config/EsmProfileCard.jsx#L76) | [ ] | —  |
| 188 | `tooltip_help` | Clone profile | [`src/components/config/EsmProfileCard.jsx:89`](../src/components/config/EsmProfileCard.jsx#L89) | [ ] | —  |
| 189 | `tooltip_help` | Delete profile | [`src/components/config/EsmProfileCard.jsx:99`](../src/components/config/EsmProfileCard.jsx#L99) | [ ] | —  |
| 190 | `tooltip_help` | At least one profile is required | [`src/components/config/EsmProfileCard.jsx:99`](../src/components/config/EsmProfileCard.jsx#L99) | [ ] | —  |
| 191 | `label` | Description | [`src/components/config/EsmProfileEditor.jsx:46`](../src/components/config/EsmProfileEditor.jsx#L46) | [ ] | —  |
| 192 | `label` | eSlideManager server URL | [`src/components/config/EsmProfileEditor.jsx:52`](../src/components/config/EsmProfileEditor.jsx#L52) | [ ] | — |
| 193 | `label` | Proxy URL (optional) | [`src/components/config/EsmProfileEditor.jsx:59`](../src/components/config/EsmProfileEditor.jsx#L59) | [ ] | —  |
| 194 | `subsection_title` | Field cleanup | [`src/components/config/EsmProfileEditor.jsx:68`](../src/components/config/EsmProfileEditor.jsx#L68) | [ ] | —  |
| 195 | `badge` | {N} cleanup rule(s) | [`src/components/config/EsmProfileEditor.jsx:70`](../src/components/config/EsmProfileEditor.jsx#L70) | [ ] | —  |
| 196 | `helper` | Optional find/replace on block and stain text before matching and naming. Search filters, stain presets, and import name patterns all use the cleaned values. | [`src/components/config/EsmProfileEditor.jsx:75`](../src/components/config/EsmProfileEditor.jsx#L75) | [ ] | —  |
| 197 | `subsection_title` | Stain filtering presets | [`src/components/config/EsmProfileEditor.jsx:88`](../src/components/config/EsmProfileEditor.jsx#L88) | [ ] | —  |
| 198 | `badge` | {N} preset(s) | [`src/components/config/EsmProfileEditor.jsx:91`](../src/components/config/EsmProfileEditor.jsx#L91) | [ ] | —  |
| 199 | `helper` | Quick picks for the stain filter when you search eSlideManager. Matching uses stain text after the cleanup rules above — enter the spelling those rules produce (or type a custom stain when searching). | [`src/components/config/EsmProfileEditor.jsx:97`](../src/components/config/EsmProfileEditor.jsx#L97) | [ ] | — |
| 200 | `subsection_title` | Names when importing slides | [`src/components/config/EsmProfileEditor.jsx:111`](../src/components/config/EsmProfileEditor.jsx#L111) | [ ] | —  |
| 201 | `badge` | Using app defaults | [`src/helpers/esm_profile_helpers.js:340`](../src/helpers/esm_profile_helpers.js#L340) | [ ] | —  |
| 202 | `subsection_title` | Duplicate output names | [`src/components/config/EsmProfileEditor.jsx:121`](../src/components/config/EsmProfileEditor.jsx#L121) | [ ] | —  |
| 203 | `hint` | If two slides would get the same file name, add -2, -3, … or skip the duplicate. | [`src/components/config/EsmProfileEditor.jsx:123`](../src/components/config/EsmProfileEditor.jsx#L123) | [ ] | —  |
| 204 | `label` | Add -2, -3, … | [`src/components/config/EsmProfileEditor.jsx:133`](../src/components/config/EsmProfileEditor.jsx#L133) | [ ] | —  |
| 205 | `label` | Skip duplicates | [`src/components/config/EsmProfileEditor.jsx:133`](../src/components/config/EsmProfileEditor.jsx#L133) | [ ] | —  |
| 206 | `helper` | Choose how each slide's Output name and Label text are filled when you add it from eSlideManager. Leave off to use the app-wide settings in Configuration. | [`src/components/config/EsmProfileColumnMappings.jsx:59`](../src/components/config/EsmProfileColumnMappings.jsx#L59) | [ ] | — |
| 207 | `label` | Output file name | [`src/components/config/EsmProfileColumnMappings.jsx:71`](../src/components/config/EsmProfileColumnMappings.jsx#L71) | [ ] | —  |
| 208 | `hint` | {deid}_{blockId}_{stainId} | [`src/components/config/EsmProfileColumnMappings.jsx:80`](../src/components/config/EsmProfileColumnMappings.jsx#L80) | [ ] | —  |
| 209 | `label` | Slide fields | [`src/components/config/EsmProfileColumnMappings.jsx:86`](../src/components/config/EsmProfileColumnMappings.jsx#L86) | [ ] | —  |
| 210 | `tooltip_help` | Click a chip to insert eSlideManager slide fields or search-row values into the pattern. De-identification text comes from the De-identification column in Search criteria. A random unique ID (UUID) is assigned when slides are added to the file list — the Results preview shows {uuid} literally until then. | [`src/components/config/EsmProfileColumnMappings.jsx:7`](../src/components/config/EsmProfileColumnMappings.jsx#L7) | [ ] | — |
| 211 | `label` | Label text | [`src/components/config/EsmProfileColumnMappings.jsx:105`](../src/components/config/EsmProfileColumnMappings.jsx#L105) | [ ] | —  |
| 212 | `hint` | {blockId} {stainId} | [`src/components/config/EsmProfileColumnMappings.jsx:114`](../src/components/config/EsmProfileColumnMappings.jsx#L114) | [ ] | —  |
| 213 | `label` | Custom column | [`src/components/config/EsmProfileColumnMappings.jsx:140`](../src/components/config/EsmProfileColumnMappings.jsx#L140) | [ ] | —  |
| 214 | `label` | Column name | [`src/components/config/EsmProfileColumnMappings.jsx:144`](../src/components/config/EsmProfileColumnMappings.jsx#L144) | [ ] | —  |
| 215 | `button` | Remove | [`src/components/config/EsmProfileColumnMappings.jsx:176`](../src/components/config/EsmProfileColumnMappings.jsx#L176) | [ ] | —  |
| 216 | `button` | Add column mapping | [`src/components/config/EsmProfileColumnMappings.jsx:188`](../src/components/config/EsmProfileColumnMappings.jsx#L188) | [ ] | —  |
| 217 | `tooltip_help` | Inserts {deid} — the de-identification code from the matching search row (a value you assign so slides can be tracked without using patient identifiers). | [`src/helpers/esm_profile_helpers.js:271`](../src/helpers/esm_profile_helpers.js#L271) | [ ] | — |
| 218 | `tooltip_help` | Assigned when slides are added to the file list. Preview shows {uuid} literally until then. | [`src/helpers/esm_profile_helpers.js:277`](../src/helpers/esm_profile_helpers.js#L277) | [ ] | —  |
| 219 | `label` | Enabled | [`src/components/esm/ESMTransformRulesEditor.jsx:115`](../src/components/esm/ESMTransformRulesEditor.jsx#L115) | [ ] | —  |
| 220 | `hint` | Find | [`src/components/esm/ESMTransformRulesEditor.jsx:128`](../src/components/esm/ESMTransformRulesEditor.jsx#L128) | [ ] | —  |
| 221 | `hint` | Replace | [`src/components/esm/ESMTransformRulesEditor.jsx:142`](../src/components/esm/ESMTransformRulesEditor.jsx#L142) | [ ] | —  |
| 222 | `button` | Add step | [`src/components/esm/ESMTransformRulesEditor.jsx:188`](../src/components/esm/ESMTransformRulesEditor.jsx#L188) | [ ] | —  |
| 223 | `other` | New rule | [`src/components/esm/ESMTransformRulesEditor.jsx:35`](../src/components/esm/ESMTransformRulesEditor.jsx#L35) | [ ] | —  |
| 224 | `label` | (unnamed rule) | [`src/components/esm/ESMTransformRulesEditor.jsx:196`](../src/components/esm/ESMTransformRulesEditor.jsx#L196) | [ ] | —  |
| 225 | `badge` | (disabled) | [`src/components/esm/ESMTransformRulesEditor.jsx:229`](../src/components/esm/ESMTransformRulesEditor.jsx#L229) | [ ] | —  |
| 226 | `hint` | Rule name | [`src/components/esm/ESMTransformRulesEditor.jsx:238`](../src/components/esm/ESMTransformRulesEditor.jsx#L238) | [ ] | —  |
| 227 | `button` | Add rule | [`src/components/esm/ESMTransformRulesEditor.jsx:268`](../src/components/esm/ESMTransformRulesEditor.jsx#L268) | [ ] | —  |
| 228 | `subsection_title` | Test cleanup | [`src/components/esm/ESMTransformRulesEditor.jsx:274`](../src/components/esm/ESMTransformRulesEditor.jsx#L274) | [ ] | —  |
| 229 | `label` | Try | [`src/components/esm/ESMTransformRulesEditor.jsx:276`](../src/components/esm/ESMTransformRulesEditor.jsx#L276) | [ ] | —  |
| 230 | `hint` | Sample text | [`src/components/esm/ESMTransformRulesEditor.jsx:280`](../src/components/esm/ESMTransformRulesEditor.jsx#L280) | [ ] | —  |
| 231 | `hint` | Result | [`src/components/esm/ESMTransformRulesEditor.jsx:290`](../src/components/esm/ESMTransformRulesEditor.jsx#L290) | [ ] | —  |
| 232 | `status` | No steps | [`src/helpers/esm_transform_rules.js:152`](../src/helpers/esm_transform_rules.js#L152) | [ ] | —  |
| 233 | `label` | Stain to match | [`src/components/config/EsmStainPresetsEditor.jsx:62`](../src/components/config/EsmStainPresetsEditor.jsx#L62) | [ ] | —  |
| 234 | `hint` | H&E | [`src/components/config/EsmStainPresetsEditor.jsx:64`](../src/components/config/EsmStainPresetsEditor.jsx#L64) | [ ] | —  |
| 235 | `label` | Name in menu | [`src/components/config/EsmStainPresetsEditor.jsx:70`](../src/components/config/EsmStainPresetsEditor.jsx#L70) | [ ] | —  |
| 236 | `button` | Add stain shortcut | [`src/components/config/EsmStainPresetsEditor.jsx:146`](../src/components/config/EsmStainPresetsEditor.jsx#L146) | [ ] | —  |
| 237 | `label` | (unnamed) | [`src/components/config/EsmStainPresetsEditor.jsx:82`](../src/components/config/EsmStainPresetsEditor.jsx#L82) | [ ] | —  |
| 238 | `label` | (empty) | [`src/components/config/EsmStainPresetsEditor.jsx:9`](../src/components/config/EsmStainPresetsEditor.jsx#L9) | [ ] | —  |
| 239 | `subsection_title` | Pre-fill stain on new search rows | [`src/components/config/EsmStainPresetsEditor.jsx:152`](../src/components/config/EsmStainPresetsEditor.jsx#L152) | [ ] | —  |
| 240 | `hint` | Applies when you add a new search row. | [`src/components/config/EsmStainPresetsEditor.jsx:153`](../src/components/config/EsmStainPresetsEditor.jsx#L153) | [ ] | —  |
| 241 | `label` | All stains | [`src/components/config/EsmStainPresetsEditor.jsx:163`](../src/components/config/EsmStainPresetsEditor.jsx#L163) | [ ] | —  |

## Output delivery

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 242 | `section_title` | Output delivery | [`src/components/config-v2/sections/OutputDeliverySection.jsx:100`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L100) | [ ] | —  |
| 243 | `section_description` | Where finished slides are saved or uploaded. Turn on Save locally and/or Upload on the Delivery panel (on the main window, above the file list). | [`src/components/config-v2/sections/OutputDeliverySection.jsx:101`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L101) | [ ] | — |
| 244 | `tooltip_help` | Configure defaults for saving finished slides on this computer and for uploading them. Enable Save locally and/or Upload on the Delivery panel (on the main window, above the file list). | [`src/components/config-v2/sections/OutputDeliverySection.jsx:37`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L37) | [ ] | — |
| 245 | `tooltip_help` | Output delivery help | [`src/components/config-v2/sections/OutputDeliverySection.jsx:103`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L103) | [ ] | —  |
| 246 | `category_title` | Save locally | [`src/components/config-v2/sections/OutputDeliverySection.jsx:108`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L108) | [ ] | —  |
| 247 | `category_description` | Defaults for keeping a copy on this computer. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:109`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L109) | [ ] | —  |
| 248 | `subsection_title` | Default save folder | [`src/components/config-v2/sections/OutputDeliverySection.jsx:114`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L114) | [ ] | —  |
| 249 | `subsection_description` | Used when Save locally is on and a row does not already have a folder. | [`src/selectors/saveLocallyPanelCopy.js:1`](../src/selectors/saveLocallyPanelCopy.js#L1) | [ ] | —  |
| 250 | `tooltip_help` | Default save folder help | [`src/components/config-v2/sections/OutputDeliverySection.jsx:119`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L119) | [ ] | —  |
| 251 | `tooltip_help` | When set, this folder seeds the Save locally default at startup and after clearing the file list. CSV-defined or manually set Copy To paths always take precedence. You can still pick a different folder on the main page for the current session. | [`src/selectors/saveLocallyPanelCopy.js:7`](../src/selectors/saveLocallyPanelCopy.js#L7) | [ ] | — |
| 252 | `helper` | No default folder configured. | [`src/selectors/saveLocallyPanelCopy.js:4`](../src/selectors/saveLocallyPanelCopy.js#L4) | [ ] | —  |
| 253 | `button` | Change folder… | [`src/components/config-v2/sections/OutputDeliverySection.jsx:131`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L131) | [ ] | —  |
| 254 | `button` | Clear | [`src/components/config-v2/sections/OutputDeliverySection.jsx:144`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L144) | [ ] | —  |
| 255 | `button` | Choose folder… | [`src/components/config-v2/sections/OutputDeliverySection.jsx:154`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L154) | [ ] | —  |
| 256 | `category_title` | Upload | [`src/components/config-v2/sections/OutputDeliverySection.jsx:170`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L170) | [ ] | —  |
| 257 | `category_description` | Configure SlideRelabeler to send finished slides to an online archive. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:171`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L171) | [ ] | — |
| 258 | `subsection_title` | Digital Slide Archive (DSA) | [`src/components/config-v2/sections/OutputDeliverySection.jsx:176`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L176) | [ ] | —  |
| 259 | `subsection_description` | Each uploaded file becomes a DSA item. You can keep the item name the same as the file, or set a different name and attach table data. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:179`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L179) | [ ] | —  |
| 260 | `label` | Default server address | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:121`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L121) | [ ] | —  |
| 261 | `tooltip_help` | Default server API URL help | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:122`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L122) | [ ] | —  |
| 262 | `tooltip_help` | Default Digital Slide Archive (DSA) server address for this configuration. It usually ends with /api/v1. Sign-in uses this URL on the Delivery panel unless you choose a temporary URL there. | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:14`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L14) | [ ] | — |
| 263 | `hint` | https://example-dsa.org/api/v1 | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:143`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L143) | [ ] | —  |
| 264 | `button` | Check | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:132`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L132) | [ ] | —  |
| 265 | `status` | Checking… | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:57`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L57) | [ ] | —  |
| 266 | `status` | DSA server reachable | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:69`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L69) | [ ] | —  |
| 267 | `status` | DSA server reachable (API {version}) | [`src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx:69`](../src/components/config-v2/sections/delivery/DsaDefaultUrlField.jsx#L69) | [ ] | —  |
| 268 | `status` | Not a valid Digital Slide Archive (DSA) API URL | [`src/helpers/dsa_url.js:4`](../src/helpers/dsa_url.js#L4) | [ ] | — |
| 269 | `label` | Item name: | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:103`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L103) | [ ] | —  |
| 270 | `label` | Same as file (default) | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:15`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L15) | [ ] | —  |
| 271 | `helper` | Keep the DSA item name matching the uploaded file (from Output name). | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:16`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L16) | [ ] | — |
| 272 | `label` | Label text | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:20`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L20) | [ ] | —  |
| 273 | `helper` | Use each row's Label text as the DSA item display name. | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:21`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L21) | [ ] | —  |
| 274 | `label` | Column or custom pattern | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:25`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L25) | [ ] | —  |
| 275 | `helper` | Build the item name from placeholders and column values. | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:26`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L26) | [ ] | —  |
| 276 | `helper` | Values from one or more columns can be used by including the column name within curly brackets | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:117`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L117) | [ ] | —  |
| 277 | `hint` | {labelText} | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:27`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L27) | [ ] | —  |
| 278 | `label` | Columns | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:133`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L133) | [ ] | —  |
| 279 | `tooltip_help` | Click a column to insert it into the pattern. | [`src/components/config-v2/sections/delivery/DsaAliasEditor.jsx:134`](../src/components/config-v2/sections/delivery/DsaAliasEditor.jsx#L134) | [ ] | —  |
| 280 | `label` | Attach metadata: | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:93`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L93) | [ ] | —  |
| 281 | `label` | None (default) | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:15`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L15) | [ ] | —  |
| 282 | `helper` | Do not attach file list metadata to the DSA item. | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:16`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L16) | [ ] | — |
| 283 | `label` | Data columns | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:20`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L20) | [ ] | —  |
| 284 | `helper` | All simple file list columns (text/number); excludes original path and filename. Does not include Label or Output name unless those appear as columns. | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:22`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L22) | [ ] | — |
| 285 | `label` | Data + original name | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:26`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L26) | [ ] | —  |
| 286 | `helper` | Same as Data columns, plus the original file name (without folder path) as originalFileName. | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:28`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L28) | [ ] | — |
| 287 | `label` | Single column… | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:32`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L32) | [ ] | —  |
| 288 | `helper` | Attach one column as a string, or parse JSON object/array from the cell. | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:34`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L34) | [ ] | —  |
| 289 | `helper` | Choose a column. Nothing is attached until a column is selected. | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:113`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L113) | [ ] | —  |
| 290 | `helper` | Selected column: {name} | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:111`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L111) | [ ] | —  |
| 291 | `tooltip_help` | Click a column to attach its cell value (plain text or JSON). | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:120`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L120) | [ ] | —  |
| 292 | `helper` | Load files to list available columns. | [`src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx:125`](../src/components/config-v2/sections/delivery/DsaItemMetadataEditor.jsx#L125) | [ ] | —  |
| 293 | `subsection_title` | Globus | [`src/components/config-v2/sections/OutputDeliverySection.jsx:198`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L198) | [ ] | —  |
| 294 | `subsection_description` | Set this computer's Globus endpoint and the default place to send files. When you upload, use the Delivery panel (above the file list) to sign in and choose folders. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:201`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L201) | [ ] | — |
| 295 | `label` | This computer's Globus endpoint ID | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:94`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L94) | [ ] | —  |
| 296 | `tooltip_help` | Local Globus endpoint help | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:95`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L95) | [ ] | —  |
| 297 | `tooltip_help` | The Globus Connect Personal endpoint ID for this computer (a UUID, not a display name). De-identified files are read from here during upload. Use Auto-detect to look it up with Globus tools for the current user. | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:29`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L29) | [ ] | — |
| 298 | `button` | Auto-detect local ID | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:103`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L103) | [ ] | —  |
| 299 | `button` | Detecting… | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:103`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L103) | [ ] | —  |
| 300 | `hint` | e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:116`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L116) | [ ] | —  |
| 301 | `status` | Globus tools are not available. Install them using the Globus CLI installation guide (https://docs.globus.org/cli/), or use a packaged SlideRelabeler build that includes them. | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:61`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L61) | [ ] | — |
| 302 | `status` | No endpoint ID was returned. | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:78`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L78) | [ ] | —  |
| 303 | `status` | Enter a valid Globus endpoint ID (UUID). | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:124`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L124) | [ ] | — |
| 304 | `status` | Could not read the local endpoint ID. | [`src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx:24`](../src/components/config-v2/sections/delivery/GlobusSourceEndpointField.jsx#L24) | [ ] | —  |
| 305 | `label` | Default destination endpoint | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:79`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L79) | [ ] | —  |
| 306 | `tooltip_help` | Default Globus destination help | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:80`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L80) | [ ] | —  |
| 307 | `tooltip_help` | Default remote Globus collection used when Upload via Globus is enabled on the Delivery panel. That panel can override the endpoint for this session without changing this default. | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:16`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L16) | [ ] | — |
| 308 | `button` | Choose default… | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:89`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L89) | [ ] | —  |
| 309 | `button` | Change default… | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:89`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L89) | [ ] | —  |
| 310 | `button` | Clear | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:95`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L95) | [ ] | —  |
| 311 | `helper` | No default endpoint configured. | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:104`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L104) | [ ] | —  |
| 312 | `status` | Globus tools are not available. Install them using the Globus CLI installation guide (https://docs.globus.org/cli/). Endpoint search is disabled until they are installed. | [`src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx:109`](../src/components/config-v2/sections/delivery/GlobusDefaultEndpointField.jsx#L109) | [ ] | — |
| 313 | `label` | Disable SSL verification | [`src/components/config-v2/sections/delivery/GlobusSslField.jsx:26`](../src/components/config-v2/sections/delivery/GlobusSslField.jsx#L26) | [ ] | —  |
| 314 | `tooltip_help` | When to use: Some corporate firewalls perform SSL/TLS inspection, which can break certificate verification. Disabling verification is a workaround that reduces security. Prefer installing your organization's CA on this machine when possible. | [`src/components/config-v2/sections/delivery/GlobusSslField.jsx:9`](../src/components/config-v2/sections/delivery/GlobusSslField.jsx#L9) | [ ] | —  |
| 315 | `label` | Max transfers at once: | [`src/components/config-v2/sections/OutputDeliverySection.jsx:215`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L215) | [ ] | —  |
| 316 | `status` | Globus allows more simultaneous transfers than files allowed waiting to upload. Lower Max transfers at once or raise Max files waiting to upload. | [`src/selectors/uploadRouting.js:3`](../src/selectors/uploadRouting.js#L3) | [ ] | —  |
| 317 | `subsection_title` | Upload details | [`src/components/config-v2/sections/OutputDeliverySection.jsx:240`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L240) | [ ] | — |
| 318 | `subsection_description` | Usually leave as default. Temporary storage and upload pace used when sending files. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:241`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L241) | [ ] | — |
| 319 | `setting_header` | Temporary folder for uploads | [`src/components/config-v2/sections/OutputDeliverySection.jsx:246`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L246) | [ ] | —  |
| 320 | `setting_description` | Used when uploading without keeping a local copy. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:249`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L249) | [ ] | —  |
| 321 | `tooltip_help` | Temporary folder for uploads help | [`src/components/config-v2/sections/OutputDeliverySection.jsx:251`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L251) | [ ] | —  |
| 322 | `tooltip_help` | If Upload is on and Save locally is off, finished files land here briefly before they are sent. The default uses your system temporary folder. Choose a custom path if you need a specific scratch disk. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:45`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L45) | [ ] | —  |
| 323 | `label` | System temporary folder (recommended) | [`src/components/config-v2/sections/OutputDeliverySection.jsx:53`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L53) | [ ] | —  |
| 324 | `label` | Custom folder | [`src/components/config-v2/sections/OutputDeliverySection.jsx:57`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L57) | [ ] | —  |
| 325 | `helper` | No folder selected. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:272`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L272) | [ ] | —  |
| 326 | `setting_header` | Upload queue | [`src/components/config-v2/sections/OutputDeliverySection.jsx:289`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L289) | [ ] | —  |
| 327 | `setting_description` | Limits how many finished files can wait before upload. | [`src/components/config-v2/sections/OutputDeliverySection.jsx:290`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L290) | [ ] | —  |
| 328 | `label` | Max files waiting to upload: | [`src/components/config-v2/sections/OutputDeliverySection.jsx:297`](../src/components/config-v2/sections/OutputDeliverySection.jsx#L297) | [ ] | —  |

## Audit logging

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 329 | `section_title` | Audit logging | [`src/components/config-v2/sections/AuditLoggingSection.jsx:131`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L131) | [ ] | — |
| 330 | `section_description` | Processing events are recorded in an in-app audit history until you clear them. | [`src/components/config-v2/sections/AuditLoggingSection.jsx:132`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L132) | [ ] | — |
| 331 | `tooltip_help` | SlideRelabeler keeps an internal audit history of processing events—similar to browser history. Entries are stored in the app until you clear them; clearing the file table does not remove audit history. When a retention limit is set, the oldest entries are removed automatically as new ones are recorded. Use View audit log to browse, filter, and export entries to CSV when you need an external record. Export chooses the file name and location. | [`src/components/config-v2/sections/AuditLoggingSection.jsx:23`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L23) | [x] | SlideRelabeler keeps an internal audit history of processing events—similar to browser history. Entries are stored in the app until you clear them; clearing the file list does not remove audit history. When a retention limit is set, the oldest entries are removed automatically as new ones are recorded. Use View audit log to browse, filter, and export entries to CSV when you need an external record. Export chooses the file name and location. |
| 332 | `tooltip_help` | Audit logging help | [`src/components/config-v2/sections/AuditLoggingSection.jsx:134`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L134) | [ ] | — |
| 333 | `label` | Audit logging: | [`src/components/config-v2/sections/AuditLoggingSection.jsx:138`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L138) | [ ] | — |
| 334 | `label` | Enabled | [`src/components/config-v2/sections/AuditLoggingSection.jsx:33`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L33) | [ ] | — |
| 335 | `label` | Disabled | [`src/components/config-v2/sections/AuditLoggingSection.jsx:34`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L34) | [ ] | — |
| 336 | `label` | Max log entries: | [`src/components/config-v2/sections/AuditLoggingSection.jsx:155`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L155) | [ ] | — |
| 337 | `label` | Unlimited | [`src/components/config-v2/sections/AuditLoggingSection.jsx:38`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L38) | [ ] | — |
| 338 | `label` | Max entries | [`src/components/config-v2/sections/AuditLoggingSection.jsx:39`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L39) | [ ] | — |
| 339 | `helper` | Current record count: {N} | [`src/components/config-v2/sections/AuditLoggingSection.jsx:126`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L126) | [ ] | — |
| 340 | `button` | View audit log… | [`src/components/config-v2/sections/AuditLoggingSection.jsx:187`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L187) | [ ] | — |
| 341 | `confirm` | Setting the limit to {N} will remove the oldest {M} entry/entries, leaving {R} in history. Continue? | [`src/components/config-v2/sections/AuditLoggingSection.jsx:50`](../src/components/config-v2/sections/AuditLoggingSection.jsx#L50) | [ ] | — |

## Advanced

| # | Kind | Current text | Source | Needs update? | Suggested text |
| --- | --- | --- | --- | --- | --- |
| 342 | `section_title` | Advanced | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:44`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L44) | [ ] | — |
| 343 | `section_description` | Less common options for output files, troubleshooting, and resetting the app. | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:45`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L45) | [ ] | — |
| 344 | `setting_header` | Macro image (overview) | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:49`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L49) | [ ] | — |
| 345 | `setting_description` | By default the large overview photo inside the slide file is removed because it can show patient details. Turn this on only if that image is safe to keep in saved files. | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:50`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L50) | [x] | By default the macro image (overview photo) inside the slide file is removed because it can show patient details. Turn this on only if that image is safe to keep in saved files. |
| 346 | `label` | Keep the macro image (overview) | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:53`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L53) | [ ] | — |
| 347 | `setting_header` | Unchanged file copy | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:60`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L60) | [ ] | — |
| 348 | `setting_description` | Puts an unchanged copy of each source file in the output folder instead of rewriting the file. Use only when you need the original file contents preserved. | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:61`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L61) | [ ] | — |
| 349 | `label` | Copy files without changing them | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:64`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L64) | [ ] | — |
| 350 | `setting_header` | Troubleshooting | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:71`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L71) | [ ] | — |
| 351 | `setting_description` | Adds a toolbar button for diagnostic messages. Leave this off for normal use. | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:72`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L72) | [ ] | — |
| 352 | `label` | Show troubleshooting tools | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:75`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L75) | [ ] | — |
| 353 | `setting_header` | Reset | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:82`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L82) | [ ] | — |
| 354 | `setting_description` | Restore defaults keeps the app open. Clear all saved data closes SlideRelabeler — open the app again to start fresh. | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:83`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L83) | [ ] | — |
| 355 | `button` | Restore defaults | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:88`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L88) | [ ] | — |
| 356 | `button` | Clear all saved data | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:94`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L94) | [ ] | — |
| 357 | `confirm` | Restore default settings and clear the file list? The app will stay open. | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:13`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L13) | [ ] | — |
| 358 | `confirm` | Clear all saved app data and close SlideRelabeler? You will need to open the app again. | [`src/components/config-v2/sections/ConfigAdvancedSection.jsx:15`](../src/components/config-v2/sections/ConfigAdvancedSection.jsx#L15) | [ ] | — |

---

## Feedback workflow

1. Review by section (TOC above), or scan rows marked **Needs update?** `[x]`.
2. Reply with `#N: new text` for each change (one number per line is fine).
3. Optional: batch related numbers (`#12–#15: …`) when the rewrite is shared.
4. After agreement, implement copy in the linked source files and clear or update this inventory.

Suggested text from #37 onward aligned to Overview glossary (g0–g16) on 2026-07-24.

**Priority apply order** (section order; all `[x]` from #37+):

- **Output name:** _(none remaining)_
- **Slide label:** #87, #95, #96, #111, #112
- **Data loading:** _(none remaining)_
- **Output delivery:** _(none remaining)_
- **Audit logging:** #331
- **Advanced:** #345

_Inventory generated for Configuration (config-v2). Total rows: **358**._
