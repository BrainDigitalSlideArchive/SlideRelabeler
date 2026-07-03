import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getSaveLocallyNeedsLocationHint,
  getSaveLocallyPanelCopy,
  getSaveLocallyTooltipCopy,
  SAVE_LOCALLY_ALL_ROWS_OPTIONAL_HINT,
  SAVE_LOCALLY_NEW_FILES_COMPLETE_HINT,
  SAVE_LOCALLY_NEW_FILES_EMPTY_TABLE_HINT,
} from './saveLocallyPanelCopy.js';

describe('getSaveLocallyTooltipCopy', () => {
  it('describes onboarding and precedence', () => {
    const copy = getSaveLocallyTooltipCopy();
    assert.match(copy, /Pick a location to copy deidentified WSIs/i);
    assert.match(copy, /CSV file/i);
    assert.match(copy, /precedence/i);
  });
});

describe('getSaveLocallyNeedsLocationHint', () => {
  it('uses singular noun for one file', () => {
    assert.equal(
      getSaveLocallyNeedsLocationHint(1),
      '1 file needs an output location. Choose a folder here or set Copy To per row in the table.',
    );
  });

  it('uses plural noun for multiple files', () => {
    assert.match(getSaveLocallyNeedsLocationHint(3), /^3 files need an output location/);
  });
});

describe('getSaveLocallyPanelCopy', () => {
  it('C: returns off state when local is disabled', () => {
    const copy = getSaveLocallyPanelCopy({ total: 5, filled: 3, empty: 2 }, '/out', { localEnabled: false });
    assert.equal(copy.hint, null);
    assert.equal(copy.hintTone, null);
    assert.equal(copy.showChooseButton, false);
    assert.equal(copy.showPathRow, false);
    assert.equal(copy.offText, 'Off — enable to configure');
  });

  it('A1: empty table shows onboarding hint', () => {
    const copy = getSaveLocallyPanelCopy({ total: 0, filled: 0, empty: 0, perRowComplete: false }, null, { localEnabled: true });
    assert.equal(copy.showChooseButton, true);
    assert.equal(copy.hint, getSaveLocallyTooltipCopy());
    assert.equal(copy.hintTone, 'muted');
  });

  it('A2: incomplete rows show blocked needs-location hint', () => {
    const copy = getSaveLocallyPanelCopy({ total: 5, filled: 2, empty: 3, perRowComplete: false }, null, { localEnabled: true });
    assert.equal(copy.showChooseButton, true);
    assert.equal(copy.hint, getSaveLocallyNeedsLocationHint(3));
    assert.equal(copy.hintTone, 'blocked');
  });

  it('A3: all rows complete shows optional directory hint', () => {
    const copy = getSaveLocallyPanelCopy({ total: 2, filled: 2, empty: 0, perRowComplete: true }, null, { localEnabled: true });
    assert.equal(copy.hint, SAVE_LOCALLY_ALL_ROWS_OPTIONAL_HINT);
    assert.equal(copy.hintTone, 'muted');
  });

  it('B1: empty table with output dir shows new-files empty-table hint', () => {
    const copy = getSaveLocallyPanelCopy({ total: 0, filled: 0, empty: 0, perRowComplete: false }, '/out', { localEnabled: true });
    assert.equal(copy.showPathRow, true);
    assert.equal(copy.hint, SAVE_LOCALLY_NEW_FILES_EMPTY_TABLE_HINT);
    assert.equal(copy.hintTone, 'muted');
    assert.equal(copy.changeTooltip, 'Pick a different directory');
  });

  it('B2: incomplete rows with output dir show blocked needs-location hint', () => {
    const copy = getSaveLocallyPanelCopy({ total: 4, filled: 3, empty: 1, perRowComplete: false }, '/out', { localEnabled: true });
    assert.equal(copy.showPathRow, true);
    assert.equal(copy.hint, getSaveLocallyNeedsLocationHint(1));
    assert.equal(copy.hintTone, 'blocked');
  });

  it('B3: all rows complete shows new-files complete hint', () => {
    const copy = getSaveLocallyPanelCopy({ total: 2, filled: 2, empty: 0, perRowComplete: true }, '/out', { localEnabled: true });
    assert.equal(copy.hint, SAVE_LOCALLY_NEW_FILES_COMPLETE_HINT);
    assert.equal(copy.hintTone, 'muted');
    assert.match(copy.hint, /CSV or manually set locations take precedence/);
    assert.doesNotMatch(copy.hint, /Default folder/i);
  });

  it('showChooseButton and showPathRow are mutually exclusive when enabled', () => {
    const choose = getSaveLocallyPanelCopy(null, null, { localEnabled: true });
    const path = getSaveLocallyPanelCopy(null, '/out', { localEnabled: true });
    assert.equal(choose.showChooseButton, true);
    assert.equal(choose.showPathRow, false);
    assert.equal(path.showChooseButton, false);
    assert.equal(path.showPathRow, true);
  });
});
