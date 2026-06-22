import test from 'node:test';
import assert from 'node:assert/strict';

import { migrateAuditLogFromStore } from './audit_log_migration.js';
import { DEFAULT_AUDIT_LOG_SETTINGS } from '../reducers/auditLog/default_state.js';

test('migrateAuditLogFromStore restores saved audit log state', () => {
  const migrated = migrateAuditLogFromStore({
    entries: [{ id: '1' }],
    settings: { enabled: false, maxEntries: 100 },
  }, null);

  assert.equal(migrated.entries[0].sequence, 0);
  assert.equal(migrated.nextSequence, 1);
  assert.equal(migrated.settings.enabled, false);
  assert.equal(migrated.settings.maxEntries, 100);
});

test('migrateAuditLogFromStore maps legacy save_csv false to disabled recording', () => {
  const migrated = migrateAuditLogFromStore(null, { csv: { save_csv: false } });
  assert.equal(migrated.settings.enabled, false);
  assert.equal(migrated.settings.maxEntries, DEFAULT_AUDIT_LOG_SETTINGS.maxEntries);
});

test('migrateAuditLogFromStore defaults enabled when legacy save_csv is true', () => {
  const migrated = migrateAuditLogFromStore(null, { csv: { save_csv: true } });
  assert.equal(migrated.settings.enabled, true);
});
