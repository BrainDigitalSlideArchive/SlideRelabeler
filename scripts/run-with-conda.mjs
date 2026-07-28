#!/usr/bin/env node
/**
 * Cross-platform launcher: runs a command with the sliderelabeler conda env
 * (scripts/with-conda.sh on Unix, scripts/with-conda.ps1 on Windows).
 *
 * Usage: node scripts/run-with-conda.mjs <command> [args...]
 * Example: node scripts/run-with-conda.mjs electron-forge package
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node scripts/run-with-conda.mjs <command> [args...]');
  process.exit(1);
}

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
    ['-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'with-conda.ps1'), ...args],
    { shell: true },
  );
} else {
  run('bash', [path.join(__dirname, 'with-conda.sh'), ...args]);
}
