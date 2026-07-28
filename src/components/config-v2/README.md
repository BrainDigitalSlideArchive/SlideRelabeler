# Configuration UI (`config-v2`)

Kit-based Settings dialog (modal type `config`), opened from the header gear.

- Compose existing primitives under `primitives/` and styles under `styles/`; do not invent section-local CSS or spacing forks.
- Tokens live in `styles/_tokens.scss` and `styles/_typography.scss`.
- Deep links: `openConfigSettings(dispatch, sectionId)` scrolls `.config-v2__body` to that section id (e.g. `config-output-delivery`).
- Shared widgets still under `src/components/config/` (label schematic, PlaceholderChips, eSM profile editors, etc.) until moved into the kit.
