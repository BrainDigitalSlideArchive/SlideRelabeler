#!/usr/bin/env node
/**
 * @deprecated Use scripts/run-with-conda.mjs directly.
 * Kept so existing `node scripts/dev.mjs` calls still work.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const args = process.argv.slice(2);

const child = spawn(
  process.execPath,
  [path.join(__dirname, 'run-with-conda.mjs'), 'npm', 'start', ...args],
  { stdio: 'inherit', cwd: root },
);
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
