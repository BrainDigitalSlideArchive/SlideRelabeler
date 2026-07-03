import test from 'node:test';
import assert from 'node:assert/strict';
import { REMOVE_ROW_HEADER_CLASS, filterRemoveColumnForPreview } from './file_table_columns.js';

test('preview mode column filter omits remove-row column', () => {
  const cols = [
    { headerClass: REMOVE_ROW_HEADER_CLASS, field: '__remove' },
    { field: '__reserved.source.filename' },
  ];
  const filtered = filterRemoveColumnForPreview(cols);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].field, '__reserved.source.filename');
});
