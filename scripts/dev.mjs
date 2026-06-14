#!/usr/bin/env node
/**
 * Cross-platform dev launcher: runs scripts/dev.sh (Unix) or scripts/dev.ps1 (Windows).
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const args = process.argv.slice(2);

function run(command, commandArgs, options = {}) {
  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    cwd: root,
    ...options,
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

if (process.platform === 'win32') {
  run(
    'powershell',
    ['-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'dev.ps1'), ...args],
    { shell: true },
  );
} else {
  run('bash', [path.join(__dirname, 'dev.sh'), ...args]);
}
