import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeStoreJson,
  decodeStoreBuffer,
  _resetPlaintextFallbackLogForTests,
} from './safe_store_codec.js';

function mockSafeStorage({ available, encryptThrows = false, decryptThrows = false } = {}) {
  return {
    isEncryptionAvailable: () => available,
    encryptString: (s) => {
      if (encryptThrows) throw new Error('Encryption is not available.');
      return Buffer.from(`ENC:${s}`, 'utf8');
    },
    decryptString: (buf) => {
      if (decryptThrows) throw new Error('decrypt failed');
      const text = Buffer.from(buf).toString('utf8');
      if (!text.startsWith('ENC:')) throw new Error('not encrypted');
      return text.slice(4);
    },
  };
}

test('encode/decode round-trip with encryption available', () => {
  _resetPlaintextFallbackLogForTests();
  const ss = mockSafeStorage({ available: true });
  const payload = { files: { count: 1 }, config: { a: true } };
  const encoded = encodeStoreJson(payload, ss);
  assert.ok(Buffer.isBuffer(encoded));
  assert.match(encoded.toString('utf8'), /^ENC:/);
  assert.deepEqual(decodeStoreBuffer(encoded, ss), payload);
});

test('encode/decode plaintext when encryption unavailable', () => {
  _resetPlaintextFallbackLogForTests();
  const ss = mockSafeStorage({ available: false });
  const payload = { files: { count: 2 } };
  const encoded = encodeStoreJson(payload, ss);
  assert.equal(encoded.toString('utf8'), JSON.stringify(payload));
  assert.deepEqual(decodeStoreBuffer(encoded, ss), payload);
});

test('decode falls back to plaintext when decrypt fails', () => {
  _resetPlaintextFallbackLogForTests();
  const ss = mockSafeStorage({ available: true, decryptThrows: true });
  const payload = { x: 1 };
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  assert.deepEqual(decodeStoreBuffer(plaintext, ss), payload);
});
