import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LABEL_ICON_UNREADABLE_MESSAGE,
  attachLabelIconBytes,
  configForLabelPreview,
  getLabelIconPath,
  needsLabelIconFile,
  resolveLabelIconForBatch,
  MAX_PREVIEW_ICON_BYTES_BASE64,
} from './label_icon_batch.js';

describe('needsLabelIconFile', () => {
  it('is true only when icon is on and a path is set', () => {
    assert.equal(needsLabelIconFile({ label: { add_icon: true, icon_file: { source: { path: '/a.png' } } } }), true);
    assert.equal(needsLabelIconFile({ label: { add_icon: true, icon_file: null } }), false);
    assert.equal(needsLabelIconFile({ label: { add_icon: false, icon_file: { source: { path: '/a.png' } } } }), false);
    assert.equal(needsLabelIconFile({}), false);
  });
});

describe('getLabelIconPath', () => {
  it('returns trimmed path or empty', () => {
    assert.equal(getLabelIconPath({ label: { icon_file: { source: { path: ' /x.png ' } } } }), '/x.png');
    assert.equal(getLabelIconPath({ label: { icon_file: null } }), '');
  });
});

describe('resolveLabelIconForBatch', () => {
  const withIcon = {
    label: { add_icon: true, icon_file: { source: { path: '/Desktop/logo.png' } } },
  };

  it('skips when no icon file is required', () => {
    assert.deepEqual(
      resolveLabelIconForBatch({ label: { add_icon: false } }, null),
      { ok: true, bytesBase64: null },
    );
  });

  it('returns buffered bytes when read succeeds', () => {
    const result = resolveLabelIconForBatch(withIcon, { ok: true, base64: 'abc123' });
    assert.equal(result.ok, true);
    assert.equal(result.bytesBase64, 'abc123');
  });

  it('fails closed with user message when required icon cannot be read', () => {
    const result = resolveLabelIconForBatch(withIcon, { ok: false, reason: 'unreadable' });
    assert.equal(result.ok, false);
    assert.equal(result.message, LABEL_ICON_UNREADABLE_MESSAGE);
  });
});

describe('attachLabelIconBytes', () => {
  it('clones config with bytes_base64 under icon source', () => {
    const config = {
      label: { add_icon: true, icon_file: { source: { path: '/a.png' } } },
    };
    const next = attachLabelIconBytes(config, 'Zm9v');
    assert.equal(next.label.icon_file.source.bytes_base64, 'Zm9v');
    assert.equal(config.label.icon_file.source.bytes_base64, undefined);
    assert.equal(next.label.icon_file.source.path, '/a.png');
  });

  it('returns config unchanged when bytes or icon are missing', () => {
    const config = { label: { add_icon: true, icon_file: { source: { path: '/a.png' } } } };
    assert.equal(attachLabelIconBytes(config, null), config);
    const noIcon = { label: { add_icon: true } };
    assert.equal(attachLabelIconBytes(noIcon, 'abc'), noIcon);
  });
});

describe('configForLabelPreview', () => {
  const config = {
    label: { add_icon: true, icon_file: { source: { path: '/a.png' } } },
  };

  it('attaches bytes when under the preview size cap', () => {
    const next = configForLabelPreview(config, 'Zm9v');
    assert.equal(next.label.icon_file.source.bytes_base64, 'Zm9v');
  });

  it('skips attach when base64 exceeds preview URL cap', () => {
    const huge = 'x'.repeat(MAX_PREVIEW_ICON_BYTES_BASE64 + 1);
    assert.equal(configForLabelPreview(config, huge), config);
  });
});
