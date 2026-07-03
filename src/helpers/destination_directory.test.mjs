import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DESTINATION_SOURCE,
  markDestinationSource,
  resolveRowsAfterSetOutputDir,
  summarizeDestinationBySource,
} from './destination_directory.js';

const row = (dest, source) => ({
  __reserved: {
    destinationDirectory: dest,
    ...(source != null ? { destinationDirectorySource: source } : {}),
  },
});

describe('resolveRowsAfterSetOutputDir', () => {
  it('fill_empty updates only rows without a path and marks default source', () => {
    const rows = [row('/old/a', DESTINATION_SOURCE.USER), { __reserved: {} }];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'fill_empty');
    assert.equal(result[0].__reserved.destinationDirectory, '/old/a');
    assert.equal(result[0].__reserved.destinationDirectorySource, DESTINATION_SOURCE.USER);
    assert.equal(result[1].__reserved.destinationDirectory, '/new');
    assert.equal(result[1].__reserved.destinationDirectorySource, DESTINATION_SOURCE.DEFAULT);
  });

  it('update_default_sourced updates default rows and empty rows but not csv or user', () => {
    const rows = [
      row('/old/default', DESTINATION_SOURCE.DEFAULT),
      row('/csv/out', DESTINATION_SOURCE.CSV),
      row('/user/out', DESTINATION_SOURCE.USER),
      { __reserved: {} },
    ];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'update_default_sourced');
    assert.equal(result[0].__reserved.destinationDirectory, '/new');
    assert.equal(result[0].__reserved.destinationDirectorySource, DESTINATION_SOURCE.DEFAULT);
    assert.equal(result[1].__reserved.destinationDirectory, '/csv/out');
    assert.equal(result[2].__reserved.destinationDirectory, '/user/out');
    assert.equal(result[3].__reserved.destinationDirectory, '/new');
    assert.equal(result[3].__reserved.destinationDirectorySource, DESTINATION_SOURCE.DEFAULT);
  });

  it('default_only leaves rows unchanged', () => {
    const rows = [row('/old/a', DESTINATION_SOURCE.DEFAULT), { __reserved: {} }];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'default_only');
    assert.equal(result[0].__reserved.destinationDirectory, '/old/a');
    assert.equal(result[1].__reserved.destinationDirectory, undefined);
  });

  it('legacy all mode respects provenance like update_default_sourced', () => {
    const rows = [row('/csv/out', DESTINATION_SOURCE.CSV), row('/old', DESTINATION_SOURCE.DEFAULT)];
    const result = resolveRowsAfterSetOutputDir(rows, '/new', 'all');
    assert.equal(result[0].__reserved.destinationDirectory, '/csv/out');
    assert.equal(result[1].__reserved.destinationDirectory, '/new');
  });
});

describe('summarizeDestinationBySource', () => {
  it('counts rows by destination source', () => {
    const summary = summarizeDestinationBySource([
      row('/a', DESTINATION_SOURCE.DEFAULT),
      row('/b', DESTINATION_SOURCE.CSV),
      row('/c', DESTINATION_SOURCE.USER),
      { __reserved: {} },
    ]);
    assert.equal(summary.total, 4);
    assert.equal(summary.filled, 3);
    assert.equal(summary.empty, 1);
    assert.equal(summary.defaultSourced, 1);
    assert.equal(summary.csvSourced, 1);
    assert.equal(summary.userSourced, 1);
  });
});

describe('markDestinationSource', () => {
  it('sets destinationDirectorySource on reserved object', () => {
    const reserved = markDestinationSource({ destinationDirectory: '/out' }, DESTINATION_SOURCE.CSV);
    assert.equal(reserved.destinationDirectorySource, DESTINATION_SOURCE.CSV);
    assert.equal(reserved.destinationDirectory, '/out');
  });
});
