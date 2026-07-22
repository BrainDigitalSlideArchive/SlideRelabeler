# config-v2

Progressive Configuration UI rebuild. See:

- [`docs/config-ui-reference.md`](../../../docs/config-ui-reference.md) — v1 behavioral oracle
- [`docs/config-ui-migration.md`](../../../docs/config-ui-migration.md) — freeze rules
- [`docs/config-ui-v2-style-spec.md`](../../../docs/config-ui-v2-style-spec.md) — style system

## Layout

```
config-v2/
  ConfigV2App.jsx
  ConfigV2Nav.jsx
  preview/                     # ConfigPreviewSandboxProvider (dialog-scoped test-it-out row)
  primitives/
  sections/                    # Phase 2 migrations
  styles/
```

Open via the blue settings gear (modal type `configV2`). Deep links still open v1 until cutover.

**Phase progress:** 2a–2f live (Overview through Slide label + shared preview sandbox). Remaining: Advanced placeholder.
