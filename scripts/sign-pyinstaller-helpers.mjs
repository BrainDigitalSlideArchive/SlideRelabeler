#!/usr/bin/env node
/**
 * Deep-sign PyInstaller COLLECT trees (engine.app / globus_cli.app) for notarization.
 *
 * These are not real macOS .app bundles (binary at top level). Forge/osx-sign often
 * leaves them with invalid/ad-hoc signatures inside SlideRelabeler.app/Contents/Resources.
 * Notarize then fails with "The signature of the binary is invalid."
 *
 * Run after PyInstaller, before Electron packager signs the outer app.
 * Requires Developer ID in the keychain (CI: apple-actions/import-codesign-certs).
 *
 * Env:
 *   APPLE_IDENTITY — optional; defaults to first "Developer ID Application" identity
 *   SKIP_SIGN_PYINSTALLER_HELPERS=1 — no-op
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const entitlements = path.join(root, 'build', 'entitlements.mac.plist');

const HELPERS = [
  path.join(root, 'dist', 'engine.app'),
  path.join(root, 'dist', 'globus_cli.app'),
];

function resolveIdentity() {
  const fromEnv = (process.env.APPLE_IDENTITY || '').trim();
  if (fromEnv) {
    return fromEnv;
  }
  const out = execSync('security find-identity -p codesigning -v', {
    encoding: 'utf8',
  });
  const match = out.match(/\d+\)\s+[A-F0-9]+\s+"(Developer ID Application:[^"]+)"/);
  if (!match) {
    throw new Error(
      'No Developer ID Application identity found. Import the .p12 into the keychain ' +
        'or set APPLE_IDENTITY.',
    );
  }
  return match[1];
}

function isMachO(filePath) {
  try {
    const info = execFileSync('file', ['-b', filePath], { encoding: 'utf8' });
    return /\bMach-O\b/.test(info);
  } catch {
    return false;
  }
}

function collectMachOs(dir) {
  const found = [];
  const walk = (current) => {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isSymbolicLink()) {
        continue;
      }
      if (ent.isDirectory()) {
        walk(full);
        continue;
      }
      if (ent.isFile() && isMachO(full)) {
        found.push(full);
      }
    }
  };
  walk(dir);
  // Deepest paths first so nested dylibs are signed before parents that may reference them.
  found.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length || b.length - a.length);
  return found;
}

function codesignFile(filePath, identity) {
  execFileSync(
    'codesign',
    [
      '--force',
      '--options',
      'runtime',
      '--timestamp',
      '--sign',
      identity,
      '--entitlements',
      entitlements,
      filePath,
    ],
    { stdio: 'inherit' },
  );
}

function signHelperTree(helperRoot, identity) {
  if (!fs.existsSync(helperRoot)) {
    throw new Error(`Missing PyInstaller helper tree: ${helperRoot}`);
  }
  const machOs = collectMachOs(helperRoot);
  if (machOs.length === 0) {
    throw new Error(`No Mach-O binaries found under ${helperRoot}`);
  }
  console.log(`** Signing ${machOs.length} Mach-O file(s) in ${path.basename(helperRoot)} **`);
  for (const filePath of machOs) {
    console.log(`  codesign ${path.relative(helperRoot, filePath)}`);
    codesignFile(filePath, identity);
  }
}

function main() {
  if (process.env.SKIP_SIGN_PYINSTALLER_HELPERS === '1') {
    console.log('** Skipping PyInstaller helper signing (SKIP_SIGN_PYINSTALLER_HELPERS=1) **');
    return;
  }
  if (process.platform !== 'darwin') {
    console.log('** Skipping PyInstaller helper signing (not macOS) **');
    return;
  }
  if (!fs.existsSync(entitlements)) {
    throw new Error(`Missing entitlements file: ${entitlements}`);
  }

  const identity = resolveIdentity();
  console.log(`** PyInstaller helper identity: ${identity} **`);

  for (const helper of HELPERS) {
    signHelperTree(helper, identity);
  }

  console.log('** PyInstaller helper signing complete **');
}

main();
