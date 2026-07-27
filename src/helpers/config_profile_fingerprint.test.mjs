import test from 'node:test';
import assert from 'node:assert/strict';

/** Inline stable stringify to avoid pulling persisted_store via snapshot helper in node:test. */
function fingerprintPayload(payload) {
  return JSON.stringify(sortKeysDeep(payload ?? {}));
}

function sortKeysDeep(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const out = {};
  for (const key of Object.keys(value).sort()) {
    out[key] = sortKeysDeep(value[key]);
  }
  return out;
}

test('fingerprintPayload is stable across key order', () => {
  const a = fingerprintPayload({ x: 1, y: { b: 2, a: 1 } });
  const b = fingerprintPayload({ y: { a: 1, b: 2 }, x: 1 });
  assert.equal(a, b);
});
