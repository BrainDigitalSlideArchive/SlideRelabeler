import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LABEL_TEXT_NEWLINE_GLYPH,
  formatLabelTextCellDisplay,
  isMultilineLabelText,
  qrPayloadFromLabelText,
} from './label_text_display.js';

describe('formatLabelTextCellDisplay', () => {
  it('replaces newlines with return arrow and stays single-line', () => {
    const display = formatLabelTextCellDisplay('a\nb');
    assert.equal(display, `a${LABEL_TEXT_NEWLINE_GLYPH}b`);
    assert.ok(!display.includes('\n'));
  });

  it('normalizes CRLF', () => {
    assert.equal(
      formatLabelTextCellDisplay('a\r\nb\rc'),
      `a${LABEL_TEXT_NEWLINE_GLYPH}b${LABEL_TEXT_NEWLINE_GLYPH}c`,
    );
  });
});

describe('isMultilineLabelText', () => {
  it('detects LF and CR', () => {
    assert.equal(isMultilineLabelText('a\nb'), true);
    assert.equal(isMultilineLabelText('a\rb'), true);
    assert.equal(isMultilineLabelText('ab'), false);
  });
});

describe('qrPayloadFromLabelText', () => {
  it('copies single-line label text', () => {
    assert.equal(qrPayloadFromLabelText('LBL'), 'LBL');
  });

  it('omits multiline label text for Use Label QR', () => {
    assert.equal(qrPayloadFromLabelText('line1\nline2'), '');
  });
});
