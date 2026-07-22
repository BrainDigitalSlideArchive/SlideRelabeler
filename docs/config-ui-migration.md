# Configuration UI migration — agent freeze rules

Companion to [config-ui-reference.md](./config-ui-reference.md) and [config-ui-v2-style-spec.md](./config-ui-v2-style-spec.md).

## Dual live dialogs (comparison period)

- **v1** (`config/` + Modal.scss): opened by existing header gear → modal type `config`. **Frozen reference.**
- **v2** (`config-v2/`): opened by second, distinctly colored (blue) gear → modal type `configV2`.
- Both edit the **same Redux config store** (intentional for parity).
- Deep links (`openConfigSettings`) open **v1** until cutover.
- **Phase 1 complete:** dual gears, `ModalConfigV2` + `ConfigV2App` shell, style-kit primitives, nav section stubs.

## Freeze rules

1. **Do not redesign v1** for visual polish, consistency, or “while we’re here.” Critical bugfixes only; prefer shared non-UI layers (actions/reducers/sagas/helpers) when the bug is behavioral.
2. **Do not change product IA** (section order, sticky/deep-link IDs, durable vs session split) without updating the reference doc first and getting human approval.
3. **v2 presentation only** rebuilds UI using the Phase 0.5 style kit. Same actions/selectors as v1.
4. **No bolted CSS in Phase 2:** if a layout pattern is missing, update the style spec and add a primitive; do not add one-off section classes as the permanent fix.
5. **No large new blocks** under Modal.scss `.__config-controls` for v2.
6. **Advanced:** v1 chrome stays unfinished; v2 Advanced is a kit redesign. Shared behavior includes hybrid reset (`RESTORE_DEFAULTS` in-session + `DELETE_STORE` hard exit).
7. **Shared primitives** (`InputText`, `Button`, etc.): changes that would alter v1 appearance need human approval; prefer v2-local variants or kit wrappers.
8. **Parity gate:** finish A/B (both gears) + checklist for a section before starting the next. Behavioral parity is strict; **visual** parity does **not** require matching v1 micro-spacing. Prefer kit harmonization when two hosts use the same pattern.
9. **Harmonize bolt-on drift in v2:** small spacing/size/alignment differences between similar v1 components are accidental unless the reference doc marks them intentional — use one recipe per primitive.
10. **Orphans:** do not revive assembled-name / LabelCompositionPanel trees; delete at cutover.

## Migration order (Phase 2)

Overview → Audit → Output name → Output delivery → Data loading → Slide label → **Advanced last**.

**Progress:** 2a–2g migrated (Overview, Audit, Output name, Output delivery, Data loading, Slide label, Advanced). Next: Phase 3 cutover.

## Cutover (Phase 3)

Single gear → v2; remove preview gear; retarget deep links; delete v1 sections + orphans + obsolete Modal config CSS.
