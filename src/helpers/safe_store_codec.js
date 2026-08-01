// helpers/safe_store_codec.js — encode/decode deid.tmp with safeStorage when available.

let loggedPlaintextFallback = false;

function encryptionAvailable(safeStorage) {
  try {
    return typeof safeStorage?.isEncryptionAvailable === 'function'
      && safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

/**
 * @param {object} obj
 * @param {{ encryptString: Function, isEncryptionAvailable?: Function }} safeStorage
 * @returns {Buffer}
 */
export function encodeStoreJson(obj, safeStorage) {
  const json = JSON.stringify(obj ?? {});
  if (encryptionAvailable(safeStorage)) {
    return safeStorage.encryptString(json);
  }
  if (!loggedPlaintextFallback) {
    loggedPlaintextFallback = true;
    console.warn(
      '[safe_store] safeStorage encryption unavailable; persisting deid.tmp as plaintext JSON',
    );
  }
  return Buffer.from(json, 'utf8');
}

/**
 * @param {Buffer|Uint8Array|string} buf
 * @param {{ decryptString: Function, isEncryptionAvailable?: Function }} safeStorage
 * @returns {object}
 */
export function decodeStoreBuffer(buf, safeStorage) {
  if (buf == null) {
    throw new Error('decodeStoreBuffer: empty buffer');
  }

  const asBuffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);

  if (encryptionAvailable(safeStorage)) {
    try {
      const decrypted = safeStorage.decryptString(asBuffer);
      return JSON.parse(decrypted);
    } catch {
      // May be plaintext written while encryption was unavailable.
    }
  }

  const text = asBuffer.toString('utf8');
  return JSON.parse(text);
}

/** @internal test helper */
export function _resetPlaintextFallbackLogForTests() {
  loggedPlaintextFallback = false;
}
