import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toCamelCaseIdentifier,
  extractPatternPlaceholders,
  evaluateFieldPattern,
  validatePatternForRows,
  buildColumnAliasMap,
  getPatternPlaceholderCatalog,
  validateOutputNamePatternBuiltins,
} from './pattern_engine.js';
import { NAMING_SOURCE } from './row_naming_defaults.js';

test('toCamelCaseIdentifier normalizes headers', () => {
  assert.equal(toCamelCaseIdentifier('Block ID'), 'blockId');
  assert.equal(toCamelCaseIdentifier('Accession Number'), 'accessionNumber');
});

test('extractPatternPlaceholders finds camelCase and field paths', () => {
  const result = extractPatternPlaceholders('{blockId}-{field:Block ID}-{uuid}');
  assert.deepEqual(result.camelTokens, ['blockId']);
  assert.deepEqual(result.fieldPaths, ['Block ID']);
});

test('evaluateFieldPattern resolves camelCase and built-ins', () => {
  const row = {
    BlockId: 'B12',
    __reserved: { uuid: 'u-1', rename: 'deid_OUT' },
  };
  const aliasMap = buildColumnAliasMap({ fileRows: [row], fileCols: [{ field: 'BlockId' }] });
  const out = evaluateFieldPattern(
    row,
    '{blockId}_{outputName}',
    { outputName: 'deid_OUT' },
    aliasMap,
  );
  assert.equal(out, 'B12_deid_OUT');
});

test('evaluateFieldPattern preserves unresolved tokens when requested', () => {
  const row = { __reserved: { uuid: '' } };
  const out = evaluateFieldPattern(
    row,
    '{blockId}_{uuid}',
    { uuid: '' },
    null,
    { preserveUnresolvedTokens: ['uuid'] },
  );
  assert.equal(out, '_{uuid}');
});

test('validatePatternForRows blocks only affected rows', () => {
  const rows = [
    { BlockId: 'B1', __reserved: { renameSource: NAMING_SOURCE.DEFAULT } },
    { __reserved: { renameSource: NAMING_SOURCE.DEFAULT } },
    { BlockId: 'B2', __reserved: { renameSource: NAMING_SOURCE.USER } },
  ];
  const result = validatePatternForRows('{blockId}', rows, {
    fileCols: [{ field: 'BlockId' }],
    rowFilter: (row) => row.__reserved?.renameSource === NAMING_SOURCE.DEFAULT,
  });
  assert.equal(result.blocking, true);
  assert.equal(result.failingRowCount, 1);
});

test('validatePatternForRows no block when pattern uses only built-ins', () => {
  const rows = [{ __reserved: { renameSource: NAMING_SOURCE.DEFAULT, uuid: 'u1' } }];
  const result = validatePatternForRows('{uuid}', rows, {
    rowFilter: () => true,
  });
  assert.equal(result.blocking, false);
});

test('getPatternPlaceholderCatalog filters builtins by field', () => {
  const output = getPatternPlaceholderCatalog({ field: 'outputName' });
  assert.deepEqual(output.map((c) => c.token), ['uuid', 'originalBasename']);

  const label = getPatternPlaceholderCatalog({ field: 'labelText' });
  assert.ok(label.some((c) => c.token === 'outputName'));
  assert.ok(!label.some((c) => c.token === 'qrContent'));
});

test('validateOutputNamePatternBuiltins warns on downstream placeholders', () => {
  const messages = validateOutputNamePatternBuiltins('{outputName}_{uuid}');
  assert.equal(messages.length, 1);
  assert.match(messages[0], /outputName/);
});

test('evaluateFieldPattern resolves removed deidToken to empty', () => {
  const row = { __reserved: { deidToken: 'OLD', uuid: 'u1' } };
  assert.equal(evaluateFieldPattern(row, 'x_{deidToken}', {}), 'x_');
});
