# Configuration UI migration — agent freeze rules

Companion to [config-ui-reference.md](./config-ui-reference.md) and [config-ui-v2-style-spec.md](./config-ui-v2-style-spec.md).

## Status: Phase 3 complete (cutover)

- **One** Configuration dialog: kit UI under `config-v2/` via modal type `config`.
- Deep links (`openConfigSettings` in `ConfigV2Nav`) open kit Configuration and scroll `.config-v2__body`.
- v1 section tree and orphans deleted; shared keep widgets remain in `src/components/config/`.
- Reference + style-spec remain regression oracles.
- **Copy review:** [config-copy-review.md](./config-copy-review.md) — numbered inventory of user-facing strings with source jump links.

## Historical freeze rules (Phases 0–2)

1. Dual gears (`config` = v1, `configV2` = preview) were used during progressive migration; removed at cutover.
2. Do not revive deleted v1 section components or Modal.scss mega dumps for those sections.
3. Prefer kit primitives; amend style-spec before inventing section-local CSS.
4. Shared Redux behavior is unchanged; visual rhythm is the harmonized kit.
5. Orphans (assembled-name / LabelCompositionPanel trees) deleted at cutover — do not revive.

## Migration order (Phase 2 — done)

Overview → Audit → Output name → Output delivery → Data loading → Slide label → Advanced.

## Cutover (Phase 3 — done)

Single gear → kit Configuration; retarget deep links; delete v1 sections + orphans + obsolete Modal config CSS.
