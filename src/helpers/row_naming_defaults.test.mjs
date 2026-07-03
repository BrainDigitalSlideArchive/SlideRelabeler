import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyRowNamingDefaults,
  expandQrPattern,
  initRowNamingSources,
  NAMING_SOURCE,
  resolveDefaultLabelText,
  resolveDefaultOutputName,
  resolveDefaultQrPayload,
} from './row_naming_defaults.js';

const baseRow = {
  __reserved: {
    uuid: 'uuid-123',
    source: { filename: 'slide001.svs' },
  },
};

describe('resolveDefaultOutputName', () => {
  it('uses original basename when filename source is original', () => {
    assert.equal(
      resolveDefaultOutputName(baseRow, { filename: { source: 'original' } }),
      'slide001',
    );
  });

  it('uses uuid when filename source is uuid', () => {
    assert.equal(
      resolveDefaultOutputName(baseRow, { filename: { source: 'uuid' } }),
      'uuid-123',
    );
  });
});

describe('resolveDefaultLabelText', () => {
  it('copies output name by default', () => {
    assert.equal(
      resolveDefaultLabelText('OUT-1', { label: { textDefault: 'output_name' } }),
      'OUT-1',
    );
  });

  it('returns empty when none', () => {
    assert.equal(
      resolveDefaultLabelText('OUT-1', { label: { textDefault: 'none' } }),
      '',
    );
  });
});

describe('resolveDefaultQrPayload', () => {
  it('uses output name by default', () => {
    assert.equal(
      resolveDefaultQrPayload({ outputName: 'OUT-1', labelText: 'LBL', uuid: 'u1' }, {}),
      'OUT-1',
    );
  });

  it('expands pattern tokens', () => {
    assert.equal(
      expandQrPattern('https://ex.org?id={uuid}&n={outputName}', {
        uuid: 'u1',
        outputName: 'OUT',
      }),
      'https://ex.org?id=u1&n=OUT',
    );
  });
});

describe('applyRowNamingDefaults', () => {
  it('populates all three fields for new file-dialog rows', () => {
    const row = initRowNamingSources({ ...baseRow, __reserved: { ...baseRow.__reserved } });
    const out = applyRowNamingDefaults(row, {
      filename: { source: 'uuid' },
      label: {
        labelText: { mode: 'output_name' },
        qrContent: { mode: 'uuid' },
        textDefault: 'output_name',
        qrDefault: 'uuid',
      },
    });
    assert.equal(out.__reserved.rename, 'uuid-123');
    assert.equal(out.__reserved.labelText, 'uuid-123');
    assert.equal(out.__reserved.qrPayload, 'uuid-123');
  });

  it('stores pattern-based rename as the full default output stem', () => {
    const row = initRowNamingSources({ ...baseRow, __reserved: { ...baseRow.__reserved } });
    const out = applyRowNamingDefaults(row, {
      filename: { source: 'pattern', pattern: 'deid_{uuid}' },
      label: { textDefault: 'output_name', qrDefault: 'output_name' },
    });
    assert.equal(out.__reserved.rename, 'deid_uuid-123');
    assert.equal(out.__reserved.labelText, 'deid_uuid-123');
  });

  it('does not overwrite csv-sourced rename', () => {
    const row = {
      __reserved: {
        rename: 'from-csv',
        renameSource: NAMING_SOURCE.CSV,
        labelTextSource: NAMING_SOURCE.DEFAULT,
        qrPayloadSource: NAMING_SOURCE.DEFAULT,
        uuid: 'uuid-123',
        source: { filename: 'x.svs' },
      },
    };
    const out = applyRowNamingDefaults(row, {
      filename: { source: 'uuid' },
      label: { textDefault: 'output_name', qrDefault: 'output_name' },
    });
    assert.equal(out.__reserved.rename, 'from-csv');
  });

  it('label pattern uses computed output name', () => {
    const row = initRowNamingSources({
      ...baseRow,
      __reserved: { ...baseRow.__reserved },
    });
    const out = applyRowNamingDefaults(row, {
      filename: { source: 'pattern', pattern: 'deid_{uuid}' },
      label: {
        labelText: { mode: 'pattern', pattern: '{outputName}' },
        qrContent: { mode: 'output_name' },
      },
    });
    assert.equal(out.__reserved.rename, 'deid_uuid-123');
    assert.equal(out.__reserved.labelText, 'deid_uuid-123');
  });

  it('skips legacy rows without source fields', () => {
    const row = {
      __reserved: {
        rename: 'legacy-name',
        uuid: 'uuid-123',
        source: { filename: 'x.svs' },
      },
    };
    const out = applyRowNamingDefaults(row, {
      filename: { source: 'uuid' },
      label: { textDefault: 'output_name', qrDefault: 'output_name' },
    });
    assert.equal(out.__reserved.rename, 'legacy-name');
    assert.equal(out.__reserved.labelText, undefined);
  });
});
