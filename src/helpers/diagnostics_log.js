/**
 * Main-process diagnostics log under userData/logs/diagnostics.log.
 * Append-only with soft ~2 MiB rotate (keep trailing bytes).
 */
import { app, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import { join } from 'path';

export const DIAGNOSTICS_LOG_FILENAME = 'diagnostics.log';
export const DIAGNOSTICS_LOG_MAX_BYTES = 2 * 1024 * 1024;
export const DIAGNOSTICS_LOG_UPDATED_CHANNEL = 'diagnostics-log-updated';

export function getDiagnosticsLogPath() {
  return join(app.getPath('userData'), 'logs', DIAGNOSTICS_LOG_FILENAME);
}

async function ensureLogDir() {
  const logDir = join(app.getPath('userData'), 'logs');
  await fs.mkdir(logDir, { recursive: true });
  return logDir;
}

function notifyDiagnosticsUpdated(text) {
  const payload = { text: typeof text === 'string' ? text : '' };
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      try {
        win.webContents.send(DIAGNOSTICS_LOG_UPDATED_CHANNEL, payload);
      } catch {
        /* ignore closed windows */
      }
    }
  }
}

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
async function writeRotated(text) {
  const path = getDiagnosticsLogPath();
  let next = text ?? '';
  if (Buffer.byteLength(next, 'utf8') > DIAGNOSTICS_LOG_MAX_BYTES) {
    const buf = Buffer.from(next, 'utf8');
    next = buf.subarray(buf.length - DIAGNOSTICS_LOG_MAX_BYTES).toString('utf8');
    const nl = next.indexOf('\n');
    if (nl > 0 && nl < next.length - 1) {
      next = next.slice(nl + 1);
    }
  }
  await fs.writeFile(path, next, 'utf8');
  return next;
}

/**
 * @returns {Promise<string>}
 */
export async function readDiagnosticsLog() {
  await ensureLogDir();
  const path = getDiagnosticsLogPath();
  try {
    return await fs.readFile(path, 'utf8');
  } catch (err) {
    if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) {
      return '';
    }
    throw err;
  }
}

/**
 * @param {string|string[]} lines
 * @returns {Promise<{ text: string }>}
 */
export async function appendDiagnosticsLines(lines) {
  await ensureLogDir();
  const list = Array.isArray(lines) ? lines : [lines];
  const stamp = new Date().toISOString();
  const chunk = list
    .map((line) => {
      const raw = typeof line === 'string' ? line : JSON.stringify(line);
      const body = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      return body
        .split('\n')
        .map((part) => `[${stamp}] ${part}`)
        .join('\n');
    })
    .filter((s) => s.length > 0)
    .join('\n');

  if (!chunk) {
    const text = await readDiagnosticsLog();
    return { text };
  }

  let existing = '';
  try {
    existing = await readDiagnosticsLog();
  } catch {
    existing = '';
  }
  const sep = existing && !existing.endsWith('\n') ? '\n' : '';
  const text = await writeRotated(`${existing}${sep}${chunk}\n`);
  notifyDiagnosticsUpdated(text);
  return { text };
}

/**
 * @returns {Promise<{ text: string }>}
 */
export async function clearDiagnosticsLog() {
  await ensureLogDir();
  const path = getDiagnosticsLogPath();
  try {
    await fs.writeFile(path, '', 'utf8');
  } catch (err) {
    if (err && err.code !== 'ENOENT') throw err;
  }
  notifyDiagnosticsUpdated('');
  return { text: '' };
}
