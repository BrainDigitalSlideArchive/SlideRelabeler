import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

import { GLOBUS_ENDPOINT_UUID_RE } from '../helpers/globus_helpers';
import {
    GLOBUS_LS_FAILURE_KIND,
    formatGlobusLoginError,
    interpretGlobusCliFailure,
    interpretGlobusLsFailure,
} from '../helpers/globus_error_interpretation';

const execAsync = promisify(exec);

/**
 * Run at most one short-lived `globus` subprocess at a time (avoids token/config lock stalls when
 * parallel uploads spawn concurrent `transfer` / `task show`).
 *
 * Unwind without removing code: set env `SLIDERELABELER_GLOBUS_CLI_SERIALIZE=0` (or `false` / `no` / `off`),
 * or change the default below to `false`.
 */
const SERIALIZE_GLOBUS_CLI_SUBPROCESSES = !['0', 'false', 'no', 'off'].includes(
    (process.env.SLIDERELABELER_GLOBUS_CLI_SERIALIZE || '').trim().toLowerCase()
);

let globusCliExclusiveTail = Promise.resolve();

async function runGlobusCliExclusive(fn) {
    const prev = globusCliExclusiveTail;
    let release;
    globusCliExclusiveTail = new Promise((r) => {
        release = r;
    });
    await prev;
    try {
        return await fn();
    } finally {
        release();
    }
}

/** Verbose tracing: `SLIDERELABELER_GLOBUS_VERBOSE=1` forces on; in development default on unless `SLIDERELABELER_GLOBUS_VERBOSE=0`. */
const GLOBUS_API_VERBOSE_LOG =
    process.env.SLIDERELABELER_GLOBUS_VERBOSE === '1' ||
    (process.env.NODE_ENV === 'development' && process.env.SLIDERELABELER_GLOBUS_VERBOSE !== '0');

function globusApiVLog(...args) {
    if (GLOBUS_API_VERBOSE_LOG) {
        console.log(...args);
    }
}

class GlobusAPI {
    constructor() {
        globusApiVLog('[GlobusAPI] Initializing...');
        globusApiVLog('[GlobusAPI] process.resourcesPath:', process.resourcesPath);
        globusApiVLog('[GlobusAPI] NODE_ENV:', process.env.NODE_ENV);
        globusApiVLog('[GlobusAPI] process.platform:', process.platform);
        
        // Store reference to login process for submitting authorization code
        this._loginProcess = null;
        
        // SSL verification setting (default: false = SSL verification enabled)
        this._disableSslVerification = false;
        
        // Detect globus-cli executable path (similar to PythonBridge)
        // Determine expected executable name based on platform
        let globusCli = null;
        let globusCliExecutable = null;
        if (process.platform === 'win32') {
            globusCli = 'globus-cli.exe';
            globusCliExecutable = 'globus-cli.exe';
        } else {
            globusCli = 'globus-cli.app';
            globusCliExecutable = path.join('globus-cli.app', 'Contents', 'MacOS', 'globus-cli');
        }
        globusApiVLog('[GlobusAPI] Looking for:', globusCli);
        
        // Check for bundled globus-cli in resourcesPath (all platforms)
        const resourcesGlobusPath1 = path.join(process.resourcesPath, 'globus-cli', 'globus-cli');
        const resourcesGlobusPath2 = path.join(process.resourcesPath, 'globus-cli', 'globus-cli.app');
        const resourcesGlobusPath3 = path.join(process.resourcesPath, 'globus-cli', 'globus-cli.exe');
        globusApiVLog('[GlobusAPI] Checking resourcesPath paths:');
        globusApiVLog('[GlobusAPI]   -', resourcesGlobusPath1, 'exists:', fs.existsSync(resourcesGlobusPath1));
        globusApiVLog('[GlobusAPI]   -', resourcesGlobusPath2, 'exists:', fs.existsSync(resourcesGlobusPath2));
        globusApiVLog('[GlobusAPI]   -', resourcesGlobusPath3, 'exists:', fs.existsSync(resourcesGlobusPath3));
        
        // List contents of process.resourcesPath if it exists
        if (process.resourcesPath && fs.existsSync(process.resourcesPath)) {
            try {
                const resourcesContents = fs.readdirSync(process.resourcesPath);
                globusApiVLog('[GlobusAPI] Contents of process.resourcesPath:', resourcesContents);
                if (resourcesContents.includes('globus-cli')) {
                    const globusCliPath = path.join(process.resourcesPath, 'globus-cli');
                    const globusCliContents = fs.readdirSync(globusCliPath);
                    globusApiVLog('[GlobusAPI] Contents of globus-cli directory:', globusCliContents);
                }
            } catch (error) {
                globusApiVLog('[GlobusAPI] Error reading resourcesPath:', error.message);
            }
        }
        
        const usePyinstaller = process.argv.includes('pyinstaller') || 
            fs.existsSync(resourcesGlobusPath1) ||
            fs.existsSync(resourcesGlobusPath2) ||
            fs.existsSync(resourcesGlobusPath3);
        globusApiVLog('[GlobusAPI] usePyinstaller:', usePyinstaller);
        
        // Initialize conda environment tracking
        this._usingCondaEnv = false;
        this._condaPrefix = null;
        this._pathToGlobus = null;
        this._status = null;
        
        // Priority 1: Production mode - use bundled executable (always check this first)
        const bundledPath = path.join(process.resourcesPath, 'globus-cli', globusCli);
        globusApiVLog('[GlobusAPI] Checking bundled path:', bundledPath, 'exists:', fs.existsSync(bundledPath));
        if (fs.existsSync(bundledPath)) {
            if (process.platform === 'darwin') {
                // On macOS, .app bundles need to execute the binary inside
                const macExecutable = path.join(process.resourcesPath, 'globus-cli', globusCliExecutable);
                globusApiVLog('[GlobusAPI] Checking macOS executable:', macExecutable, 'exists:', fs.existsSync(macExecutable));
                if (fs.existsSync(macExecutable)) {
                    this._pathToGlobus = macExecutable;
                } else {
                    this._pathToGlobus = path.join(process.resourcesPath, 'globus-cli', globusCli);
                }
            } else {
                this._pathToGlobus = path.join(process.resourcesPath, 'globus-cli', globusCli);
            }
            this._status = 'Globus: using bundled executable from resourcesPath';
            globusApiVLog('[GlobusAPI] Found bundled executable at:', this._pathToGlobus);
        }
        // Priority 2: Local build for testing
        else {
            const localPath = path.join('./dist/globus-cli', globusCli);
            globusApiVLog('[GlobusAPI] Checking local build path:', localPath, 'exists:', fs.existsSync(localPath));
            if (fs.existsSync(localPath)) {
            if (process.platform === 'darwin') {
                // On macOS, .app bundles need to execute the binary inside
                const macExecutable = path.join('./dist/globus-cli', globusCliExecutable);
                if (fs.existsSync(macExecutable)) {
                    this._pathToGlobus = macExecutable;
                } else {
                    this._pathToGlobus = path.join('./dist/globus-cli', globusCli);
                }
            } else {
                this._pathToGlobus = path.join('./dist/globus-cli', globusCli);
            }
            this._status = 'Globus: using local build';
                globusApiVLog('[GlobusAPI] Found local build at:', this._pathToGlobus);
            }
            // Priority 3: Development mode - try conda environment first, then system globus
            else if (!usePyinstaller && process.env.NODE_ENV === 'development') {
                // Try conda environment's globus-cli first (from environment.yml)
                const condaPrefix = process.env.CONDA_PREFIX;
                if (condaPrefix) {
                    // On Windows, globus is typically in Scripts/, on Unix in bin/
                    const condaGlobusPath = process.platform === 'win32' 
                        ? path.join(condaPrefix, 'Scripts', 'globus.exe')
                        : path.join(condaPrefix, 'bin', 'globus');
                    
                    globusApiVLog('[GlobusAPI] Checking conda path:', condaGlobusPath, 'exists:', fs.existsSync(condaGlobusPath));
                    if (fs.existsSync(condaGlobusPath)) {
                        this._pathToGlobus = condaGlobusPath;
                        this._status = 'Globus: using conda environment globus-cli';
                        this._usingCondaEnv = true;
                        this._condaPrefix = condaPrefix;
                        globusApiVLog('[GlobusAPI] Found conda globus-cli at:', this._pathToGlobus);
                    }
                }
                
                // Fallback to system-installed globus (if available)
                if (!this._pathToGlobus) {
                    this._pathToGlobus = 'globus';
                    this._status = 'Globus: using system globus (development mode)';
                    globusApiVLog('[GlobusAPI] Using system globus');
                }
            }
        }
        
        // If no path was found, set error status
        if (!this._pathToGlobus) {
            this._status = 'Globus: No path detected, not available';
            globusApiVLog('[GlobusAPI] No globus-cli path found. Status:', this._status);
        }
        globusApiVLog('[GlobusAPI] Final pathToGlobus:', this._pathToGlobus);
        globusApiVLog('[GlobusAPI] Final status:', this._status);
    }

    sanitizeCliOutput(text) {
        if (!text) return text;
        // Remove PyInstaller bootloader chatter and other noisy loader lines from UI-facing output.
        return text
            .split(/\r?\n/)
            .filter((line) => {
                const trimmed = (line || '').trim();
                if (!trimmed) return true;
                if (/\[PYI-\d+:(DEBUG|INFO|WARN|ERROR)\]/.test(trimmed)) return false;
                if (/^(LOADER:|DYLIB:)/.test(trimmed)) return false;
                if (/^PYI-\d+:(DEBUG|INFO|WARN|ERROR)/.test(trimmed)) return false;
                return true;
            })
            .join('\n');
    }

    buildEnv(additionalEnv = {}) {
        const env = { ...process.env, ...(additionalEnv.env || {}) };

        // Add conda Python to PATH if using conda environment
        if (this._usingCondaEnv && this._condaPrefix) {
            const currentPath = env.PATH || '';
            const condaPath = process.platform === 'win32'
                ? path.join(this._condaPrefix, 'Scripts') + path.delimiter +
                  path.join(this._condaPrefix, 'Library', 'bin') + path.delimiter +
                  currentPath
                : path.join(this._condaPrefix, 'bin') + path.delimiter + currentPath;
            env.PATH = condaPath;
            env.CONDA_PREFIX = this._condaPrefix;
        }

        // SSL verification setting
        if (this._disableSslVerification) {
            env.GLOBUS_SDK_VERIFY_SSL = 'false';
        }

        // Suppress PyInstaller debug output by default (unless explicitly enabled)
        // Set GLOBUS_ENABLE_PYI_DEBUG=1 to enable PyInstaller debug output
        if (!env.GLOBUS_ENABLE_PYI_DEBUG || env.GLOBUS_ENABLE_PYI_DEBUG === '0') {
            Object.keys(env).forEach((k) => {
                if (k === 'PYI_DEBUG' || k === 'PYINSTALLER_DEBUG' || (k.startsWith('PYI_') && k.includes('DEBUG'))) {
                    delete env[k];
                }
            });
        }

        return env;
    }

    async executeCommand(args, useJsonFormat = true, additionalEnv = {}) {
        if (!this._pathToGlobus) {
            return [false, { 
                message: 'Globus CLI not available. For development: ensure globus-cli is installed in your conda environment (add to environment.yml and run conda env update). For production: use a packaged build.' 
            }];
        }

        if (SERIALIZE_GLOBUS_CLI_SUBPROCESSES) {
            return runGlobusCliExclusive(() => this._executeCommandImpl(args, useJsonFormat, additionalEnv));
        }
        return this._executeCommandImpl(args, useJsonFormat, additionalEnv);
    }

    /** Spawn + parse JSON/text; used by {@link executeCommand}. */
    async _executeCommandImpl(args, useJsonFormat = true, additionalEnv = {}) {
        // IMPORTANT: Do not run through a shell (Windows '&' splits commands).
        // Always spawn with an argv array so filenames are passed literally.
        const commandArgs = Array.isArray(args) ? args.slice() : [];
        if (useJsonFormat) {
            commandArgs.push('--format', 'json');
        }

        globusApiVLog('[GlobusAPI] executeCommand: Starting command execution');
        globusApiVLog('[GlobusAPI] executeCommand: Executable:', this._pathToGlobus);
        globusApiVLog('[GlobusAPI] executeCommand: Args:', commandArgs);
        globusApiVLog('[GlobusAPI] executeCommand: Additional env vars:', additionalEnv.env ? Object.keys(additionalEnv.env) : []);

        const finalEnv = this.buildEnv(additionalEnv);
        if (this._disableSslVerification) {
            globusApiVLog('[GlobusAPI] executeCommand: SSL verification disabled (GLOBUS_SDK_VERIFY_SSL=false)');
        }

        const relevantEnvVars = Object.keys(finalEnv).filter(k => k.startsWith('GLOBUS') || k === 'PATH' || k === 'CONDA_PREFIX');
        globusApiVLog('[GlobusAPI] executeCommand: Final env vars:', relevantEnvVars);
        if (finalEnv.GLOBUS_CLI_INTERACTIVE !== undefined) {
            globusApiVLog('[GlobusAPI] executeCommand: GLOBUS_CLI_INTERACTIVE value:', finalEnv.GLOBUS_CLI_INTERACTIVE);
        } else {
            globusApiVLog('[GlobusAPI] executeCommand: GLOBUS_CLI_INTERACTIVE NOT SET');
        }

        const spawnOptions = {
            env: finalEnv,
            windowsHide: true,
            shell: false,
        };

        const timeoutMs = 30000;
        const startTime = Date.now();

        return await new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let settled = false;

            const child = spawn(this._pathToGlobus, commandArgs, spawnOptions);

            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                try {
                    child.kill();
                } catch (e) {
                    // ignore
                }
                const combinedOutput = stdout + stderr;
                resolve([false, {
                    message: `Command timed out after ${timeoutMs}ms`,
                    stdout,
                    stderr,
                    combinedOutput,
                    isTimeout: true,
                }]);
            }, timeoutMs);

            child.stdout?.setEncoding?.('utf8');
            child.stderr?.setEncoding?.('utf8');
            child.stdout?.on('data', (chunk) => { stdout += chunk; });
            child.stderr?.on('data', (chunk) => { stderr += chunk; });

            child.on('error', (error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                const combinedOutput = stdout + stderr;
                resolve([false, {
                    message: error?.message || 'Unknown error',
                    stdout,
                    stderr,
                    combinedOutput,
                    exitCode: undefined,
                    connectionError: error?.message?.includes('Connection'),
                }]);
            });

            child.on('close', (code, signal) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                const duration = Date.now() - startTime;
                globusApiVLog('[GlobusAPI] executeCommand: Command completed in', duration, 'ms');
                globusApiVLog('[GlobusAPI] executeCommand: exit code:', code, 'signal:', signal);
                globusApiVLog('[GlobusAPI] executeCommand: stdout length:', stdout?.length || 0);
                globusApiVLog('[GlobusAPI] executeCommand: stderr length:', stderr?.length || 0);

                const combinedOutput = (stdout || '') + (stderr || '');

                if (code === 0) {
                    if (useJsonFormat) {
                        const candidate = (stdout && stdout.trim()) ? stdout : stderr;
                        try {
                            const result = JSON.parse(candidate);
                            resolve([true, result]);
                        } catch (e) {
                            resolve([false, { message: candidate || 'Invalid JSON output', stdout, stderr, combinedOutput }]);
                        }
                        return;
                    }

                    const msg = (stdout && stdout.trim()) ? stdout.trim()
                        : (stderr && stderr.trim()) ? stderr.trim()
                          : 'Command completed successfully';
                    resolve([true, { message: msg }]);
                    return;
                }

                // Non-zero exit
                // If JSON format was requested and stdout looks like JSON, try to return structured error.
                if (useJsonFormat) {
                    const candidate = (stdout && stdout.trim()) ? stdout : stderr;
                    try {
                        const errorResult = JSON.parse(candidate);
                        resolve([false, errorResult]);
                        return;
                    } catch (e) {
                        // fall through
                    }
                }

                resolve([false, {
                    message: (stderr && stderr.trim()) ? stderr.trim() : (stdout && stdout.trim()) ? stdout.trim() : 'Command failed',
                    stdout,
                    stderr,
                    combinedOutput,
                    exitCode: code,
                    isTimeout: false,
                    connectionError: (stderr || '').includes('ConnectionError') || (stderr || '').includes('Connection') || (stdout || '').includes('Connection'),
                }]);
            });
        });
    }

    async check_auth() {
        return this.executeCommand(['whoami']);
    }

    async getLocalEndpointId() {
        if (!this._pathToGlobus) {
            return [false, { message: 'Globus CLI not available.' }];
        }
        const result = await this.executeCommand(['endpoint', 'local-id', '--quiet'], false);
        if (!result || !result[0]) {
            const err = result?.[1] || {};
            const stderr = (err.stderr || '').trim();
            const message = (err.message || '').trim();
            const combined = `${stderr}\n${message}`.toLowerCase();
            let userMessage =
                'Globus Connect Personal does not appear configured for this Windows user on this machine, or the local endpoint could not be read.';
            if (
                err.exitCode === 4 ||
                /consent|login required|authentication|auth.*required|not logged in|consentrequired/.test(
                    combined
                )
            ) {
                userMessage =
                    'Log in to Globus in this app (Authentication) or run globus login, and ensure Globus Connect Personal is installed for this user.';
            } else if (stderr) {
                const lines = stderr.split(/\r?\n/).filter((line) => !/\[PYI-|^\s*LOADER:/i.test(line));
                const cleaned = lines.join(' ').trim();
                if (cleaned) userMessage = cleaned;
            }
            return [false, { message: userMessage, stderr: err.stderr, exitCode: err.exitCode }];
        }
        const text = (result[1]?.message || '').trim();
        const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l);
        if (!firstLine || !GLOBUS_ENDPOINT_UUID_RE.test(firstLine)) {
            return [
                false,
                {
                    message:
                        'Globus CLI did not return a valid endpoint UUID. Ensure Globus Connect Personal is installed and running for this user.',
                },
            ];
        }
        return [true, { id: firstLine }];
    }

    async getAuthStatus() {
        // Authoritative auth status via whoami (preferred over parsing login output)
        if (!this._pathToGlobus) {
            return { ok: false, isAuthenticated: false, classification: 'cliNotAvailable', message: 'Globus CLI not available' };
        }

        const whoami = await this.executeCommand(['whoami'], false);
        if (whoami && whoami[0]) {
            const username = (whoami?.[1]?.message || '').trim();
            return { ok: true, isAuthenticated: true, classification: 'success', username };
        }

        // If whoami fails, treat as not authenticated (do not assume network failure from generic stderr text)
        return { ok: true, isAuthenticated: false, classification: 'notAuthenticated' };
    }

    async loginWithSpawn(options = {}) {
        // Use spawn instead of exec for better control over stdin/stdout/stderr
        // This prevents the process from waiting for stdin input
        globusApiVLog('[GlobusAPI] loginWithSpawn() called');
        globusApiVLog('[GlobusAPI] Using globus-cli path:', this._pathToGlobus);
        
        return new Promise((resolve) => {
            // Prepare environment (includes conda PATH, SSL settings, and PyInstaller debug suppression)
            // Allow per-login overrides for developer toggles
            const baseEnv = this.buildEnv({
                env: options?.enablePyiDebug ? { GLOBUS_ENABLE_PYI_DEBUG: '1' } : {}
            });
            
            // Don't set GLOBUS_CLI_INTERACTIVE=0 - we need interactive mode to submit code
            // baseEnv.GLOBUS_CLI_INTERACTIVE = '0'; // Removed - we need stdin to submit code
            globusApiVLog('[GlobusAPI] loginWithSpawn: Using interactive mode to allow code submission');
            
            // Spawn the process with stdin piped so we can write to it
            // Verbose output is a dev toggle (default off)
            const args = options?.verbose ? ['login', '-v', '--no-local-server'] : ['login', '--no-local-server'];
            globusApiVLog('[GlobusAPI] loginWithSpawn: Spawning process with args:', args);
            
            const child = spawn(this._pathToGlobus, args, {
                env: baseEnv,
                stdio: ['pipe', 'pipe', 'pipe'], // stdin: pipe (to write code), stdout: pipe, stderr: pipe
                shell: false
            });
            
            // Store process reference so we can write to stdin later
            this._loginProcess = child;
            globusApiVLog('[GlobusAPI] loginWithSpawn: Stored process reference for code submission');
            
            let stdout = '';
            let stderr = '';
            let urlFound = false;
            let accessCode = null;
            let timeoutId = null;
            let promiseResolved = false; // Track if promise has been resolved
            
            // Set timeout (5 minutes for login since user needs time to complete browser flow)
            const timeout = 300000; // 5 minutes
            timeoutId = setTimeout(() => {
                if (!urlFound) {
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Timeout reached before URL found, killing process');
                    child.kill();
                    this._loginProcess = null;
                } else {
                    // URL found but no code submitted - kill after extended timeout
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Extended timeout reached, killing process');
                    child.kill();
                    this._loginProcess = null;
                }
            }, timeout);
            
            // Stream stdout in real-time
            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                stdout += chunk;
                globusApiVLog('[GlobusAPI] loginWithSpawn: stdout chunk:', chunk.substring(0, 200));
                
                // Try to extract URL as soon as it appears
                if (!urlFound && !promiseResolved) {
                    const urlMatch = chunk.match(/https?:\/\/[^\s\)]+/);
            if (urlMatch) {
                        urlFound = true;
                        globusApiVLog('[GlobusAPI] loginWithSpawn: URL found in stdout:', urlMatch[0]);
                        
                        // Extract access code from full accumulated output (not just chunk)
                        // Wait a moment for more output to arrive, then extract
                        setTimeout(() => {
                            const fullOutput = stdout + stderr;
                            const codePatterns = [
                                /enter\s+this\s+code[:\s]+([A-Z0-9-]{4,})/i,  // "Enter this code: XXXX"
                                /(?:access|authorization)\s+code[:\s]+([A-Z0-9-]{4,})/i,  // "Access code: XXXX" or "Authorization code: XXXX"
                                /code[:\s]+([A-Z0-9-]{4,})/i  // "Code: XXXX" (but only if it's clearly a code, not "here")
                            ];
                            
                            // Try patterns that require "code" keyword to avoid matching "here"
                            for (const pattern of codePatterns) {
                                const codeMatch = fullOutput.match(pattern);
                                if (codeMatch && codeMatch[1] && codeMatch[1].length >= 4) {
                                    // Make sure it's not matching "here" or other common words
                                    const potentialCode = codeMatch[1].trim();
                                    if (potentialCode.toLowerCase() !== 'here' && 
                                        potentialCode.toLowerCase() !== 'code' &&
                                        /^[A-Z0-9-]+$/i.test(potentialCode)) {
                                        accessCode = potentialCode;
                                        globusApiVLog('[GlobusAPI] loginWithSpawn: Access code found:', accessCode);
                                        break;
                                    }
                                }
                            }
                            
                            // Also try standalone code lines (usually appears after URL)
                            if (!accessCode) {
                                const lines = fullOutput.split('\n');
                                for (const line of lines) {
                                    const trimmed = line.trim();
                                    // Look for standalone codes that are 4-20 chars, alphanumeric with dashes
                                    if (/^[A-Z0-9-]{4,20}$/i.test(trimmed) && 
                                        trimmed.length >= 4 && 
                                        !trimmed.startsWith('http') &&
                                        trimmed.toLowerCase() !== 'here') {
                                        accessCode = trimmed;
                                        globusApiVLog('[GlobusAPI] loginWithSpawn: Access code found as standalone line:', accessCode);
                                        break;
                                    }
                                }
                            }
                            
                            // Resolve promise immediately with URL and access code
                            if (!promiseResolved) {
                                promiseResolved = true;
                                clearTimeout(timeoutId);
                                
                                const resolveValue = [true, {
                    url: urlMatch[0], 
                                    access_code: accessCode,
                    message: 'Authentication URL retrieved. Opening in browser...',
                                    hasConnectionWarning: fullOutput.includes('ConnectionError') || fullOutput.includes('Connection'),
                                    isTimeout: false
                                }];
                                
                                globusApiVLog('[GlobusAPI] loginWithSpawn: Resolving promise immediately with URL:', urlMatch[0], 'code:', accessCode || 'none');
                                globusApiVLog('[GlobusAPI] loginWithSpawn: Resolve value structure:', {
                                    isArray: Array.isArray(resolveValue),
                                    length: resolveValue.length,
                                    response0: resolveValue[0],
                                    response1: resolveValue[1],
                                    hasUrl: !!resolveValue[1]?.url,
                                    url: resolveValue[1]?.url,
                                    hasAccessCode: !!resolveValue[1]?.access_code,
                                    accessCode: resolveValue[1]?.access_code
                                });
                                
                                // Process stays alive for interactive use (code submission)
                                globusApiVLog('[GlobusAPI] loginWithSpawn: Process will stay alive for code submission');
                                resolve(resolveValue);
                            }
                        }, 500); // Wait 500ms for more output to arrive
                    }
                }
            });
            
            // Stream stderr in real-time
            child.stderr.on('data', (data) => {
                const chunk = data.toString();
                stderr += chunk;
                globusApiVLog('[GlobusAPI] loginWithSpawn: stderr chunk:', chunk.substring(0, 200));
                
                // Also check stderr for URL (some commands output to stderr)
                if (!urlFound && !promiseResolved) {
                    const urlMatch = chunk.match(/https?:\/\/[^\s\)]+/);
                    if (urlMatch) {
                        urlFound = true;
                        globusApiVLog('[GlobusAPI] loginWithSpawn: URL found in stderr:', urlMatch[0]);
                        
                        // Extract access code from full accumulated output (not just chunk)
                        // Wait a moment for more output to arrive, then extract
                        setTimeout(() => {
                            const fullOutput = stdout + stderr;
                            const codePatterns = [
                                /enter\s+this\s+code[:\s]+([A-Z0-9-]{4,})/i,  // "Enter this code: XXXX"
                                /(?:access|authorization)\s+code[:\s]+([A-Z0-9-]{4,})/i,  // "Access code: XXXX" or "Authorization code: XXXX"
                                /code[:\s]+([A-Z0-9-]{4,})/i  // "Code: XXXX" (but only if it's clearly a code, not "here")
                            ];
                            
                            // Try patterns that require "code" keyword to avoid matching "here"
                            for (const pattern of codePatterns) {
                                const codeMatch = fullOutput.match(pattern);
                                if (codeMatch && codeMatch[1] && codeMatch[1].length >= 4) {
                                    // Make sure it's not matching "here" or other common words
                                    const potentialCode = codeMatch[1].trim();
                                    if (potentialCode.toLowerCase() !== 'here' && 
                                        potentialCode.toLowerCase() !== 'code' &&
                                        /^[A-Z0-9-]+$/i.test(potentialCode)) {
                                        accessCode = potentialCode;
                                        globusApiVLog('[GlobusAPI] loginWithSpawn: Access code found in stderr:', accessCode);
                                        break;
                                    }
                                }
                            }
                            
                            // Also try standalone code lines (usually appears after URL)
                            if (!accessCode) {
                                const lines = fullOutput.split('\n');
                                for (const line of lines) {
                                    const trimmed = line.trim();
                                    // Look for standalone codes that are 4-20 chars, alphanumeric with dashes
                                    if (/^[A-Z0-9-]{4,20}$/i.test(trimmed) && 
                                        trimmed.length >= 4 && 
                                        !trimmed.startsWith('http') &&
                                        trimmed.toLowerCase() !== 'here') {
                                        accessCode = trimmed;
                                        globusApiVLog('[GlobusAPI] loginWithSpawn: Access code found as standalone line in stderr:', accessCode);
                                        break;
                                    }
                                }
                            }
                            
                            // Resolve promise immediately with URL and access code
                            if (!promiseResolved) {
                                promiseResolved = true;
                                clearTimeout(timeoutId);
                                
                                const resolveValue = [true, {
                                    url: urlMatch[0],
                                    access_code: accessCode,
                                    message: 'Authentication URL retrieved. Opening in browser...',
                                    hasConnectionWarning: fullOutput.includes('ConnectionError') || fullOutput.includes('Connection'),
                                    isTimeout: false
                                }];
                                
                                globusApiVLog('[GlobusAPI] loginWithSpawn: Resolving promise immediately with URL from stderr:', urlMatch[0], 'code:', accessCode || 'none');
                                globusApiVLog('[GlobusAPI] loginWithSpawn: Resolve value structure:', {
                                    isArray: Array.isArray(resolveValue),
                                    length: resolveValue.length,
                                    response0: resolveValue[0],
                                    response1: resolveValue[1],
                                    hasUrl: !!resolveValue[1]?.url,
                                    url: resolveValue[1]?.url,
                                    hasAccessCode: !!resolveValue[1]?.access_code,
                                    accessCode: resolveValue[1]?.access_code
                                });
                                
                                // Process stays alive for interactive use (code submission)
                                globusApiVLog('[GlobusAPI] loginWithSpawn: Process will stay alive for code submission');
                                resolve(resolveValue);
                            }
                        }, 500); // Wait 500ms for more output to arrive
                    }
                }
            });
            
            // Handle process exit
            child.on('exit', (code, signal) => {
                clearTimeout(timeoutId);
                globusApiVLog('[GlobusAPI] loginWithSpawn: Process exited with code:', code, 'signal:', signal);
                
                // Clear process reference
                if (this._loginProcess === child) {
                    this._loginProcess = null;
                }
                
                // If promise was already resolved (URL found), just clean up
                if (promiseResolved) {
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Process exited but promise already resolved, just cleaning up');
                    return;
                }
                
                // Promise not resolved yet - handle error cases
                const combinedOutput = stdout + stderr;
                
                // If URL was found but promise wasn't resolved (shouldn't happen, but handle it)
                if (urlFound) {
                    const urlMatch = combinedOutput.match(/https?:\/\/[^\s\)]+/);
                    if (urlMatch && !promiseResolved) {
                        globusApiVLog('[GlobusAPI] loginWithSpawn: WARNING - URL found but promise not resolved, resolving now');
                        promiseResolved = true;
                        
                        // Extract access code from full output if not already found
                        if (!accessCode) {
                            const codePatterns = [
                                /enter\s+this\s+code[:\s]+([A-Z0-9-]{4,})/i,
                                /(?:access|authorization)\s+code[:\s]+([A-Z0-9-]{4,})/i,
                                /code[:\s]+([A-Z0-9-]{4,})/i
                            ];
                            
                            for (const pattern of codePatterns) {
                                const codeMatch = combinedOutput.match(pattern);
                                if (codeMatch && codeMatch[1] && codeMatch[1].length >= 4) {
                                    const potentialCode = codeMatch[1].trim();
                                    if (potentialCode.toLowerCase() !== 'here' && 
                                        potentialCode.toLowerCase() !== 'code' &&
                                        /^[A-Z0-9-]+$/i.test(potentialCode)) {
                                        accessCode = potentialCode;
                                        break;
                                    }
                                }
                            }
                            
                            // Try standalone code lines
                            if (!accessCode) {
                                const lines = combinedOutput.split('\n');
                                for (const line of lines) {
                                    const trimmed = line.trim();
                                    if (/^[A-Z0-9-]{4,20}$/i.test(trimmed) && 
                                        trimmed.length >= 4 && 
                                        !trimmed.startsWith('http') &&
                                        trimmed.toLowerCase() !== 'here') {
                                        accessCode = trimmed;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        const resolveValue = [true, {
                    url: urlMatch[0], 
                            access_code: accessCode,
                            message: 'Authentication URL retrieved. Opening in browser...',
                            hasConnectionWarning: combinedOutput.includes('ConnectionError') || combinedOutput.includes('Connection'),
                            isTimeout: false
                        }];
                        globusApiVLog('[GlobusAPI] loginWithSpawn: Resolving from exit handler with URL:', urlMatch[0], 'code:', accessCode || 'none');
                        resolve(resolveValue);
                        return;
                    }
                }
                
                // If no URL found, check if it's a connection error
                if (combinedOutput.includes('ConnectionError') || combinedOutput.includes('Connection')) {
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Connection error detected in output');
                    if (!promiseResolved) {
                        promiseResolved = true;
                        const resolveValue = [false, {
                    message: 'Cannot connect to Globus authentication server. Please check your network connection and firewall settings.',
                            connectionError: true,
                            stdout: stdout,
                            stderr: stderr
                        }];
                        globusApiVLog('[GlobusAPI] loginWithSpawn: Resolving with connection error:', resolveValue);
                        resolve(resolveValue);
                    }
                    return;
                }
                
                // No URL found - return error
                if (!promiseResolved) {
                    promiseResolved = true;
                    globusApiVLog('[GlobusAPI] loginWithSpawn: No URL found in output');
                    globusApiVLog('[GlobusAPI] loginWithSpawn: urlFound flag:', urlFound);
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Combined output length:', combinedOutput.length);
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Stdout length:', stdout.length);
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Stderr length:', stderr.length);
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Combined output (first 500 chars):', combinedOutput.substring(0, 500));
                    const resolveValue = [false, {
                        message: 'Login command completed but no authentication URL was found. Please try again.',
                        stdout: stdout,
                        stderr: stderr,
                        combinedOutput: combinedOutput
                    }];
                    globusApiVLog('[GlobusAPI] loginWithSpawn: Resolving with error (no URL):', resolveValue);
                    resolve(resolveValue);
                }
            });
            
            // Handle process errors
            child.on('error', (error) => {
                clearTimeout(timeoutId);
                globusApiVLog('[GlobusAPI] loginWithSpawn: Process error:', error);
                if (this._loginProcess === child) {
                    this._loginProcess = null;
                }
                const raw = error?.message || 'Failed to start login command';
                resolve([false, {
                    message: formatGlobusLoginError(raw),
                    error: error
                }]);
            });
        });
    }
    
    async submitAuthorizationCode(code) {
        globusApiVLog('[GlobusAPI] submitAuthorizationCode() called with code:', code ? code.substring(0, 4) + '...' : 'null');
        
        if (!this._loginProcess) {
            globusApiVLog('[GlobusAPI] submitAuthorizationCode: No active login process');
            return [false, { message: 'No active login process. Please start login again.' }];
        }
        
        if (this._loginProcess.killed) {
            globusApiVLog('[GlobusAPI] submitAuthorizationCode: Login process has been killed');
            this._loginProcess = null;
            return [false, { message: 'Login process has ended. Please start login again.' }];
        }
        
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let exitCode = null;
            
            // Collect output from the process
            const stdoutHandler = (data) => {
                const chunk = data.toString();
                stdout += chunk;
                globusApiVLog('[GlobusAPI] submitAuthorizationCode: stdout chunk:', chunk.substring(0, 200));
            };
            
            const stderrHandler = (data) => {
                const chunk = data.toString();
                stderr += chunk;
                globusApiVLog('[GlobusAPI] submitAuthorizationCode: stderr chunk:', chunk.substring(0, 200));
            };
            
            // Attach handlers if not already attached
            if (!this._loginProcess.stdout.listenerCount('data')) {
                this._loginProcess.stdout.on('data', stdoutHandler);
            }
            if (!this._loginProcess.stderr.listenerCount('data')) {
                this._loginProcess.stderr.on('data', stderrHandler);
            }
            
            // Handle process exit after code submission
            const exitHandler = (code, signal) => {
                exitCode = code;
                globusApiVLog('[GlobusAPI] submitAuthorizationCode: Process exited with code:', code, 'signal:', signal);
                
                const combinedOutput = stdout + stderr;
                
                // Clear process reference
                this._loginProcess = null;
                
                // Check if authentication was successful
                if (code === 0) {
                    // Success - check output for confirmation
                    if (combinedOutput.includes('successfully') || 
                        combinedOutput.includes('logged in') ||
                        combinedOutput.includes('authenticated') ||
                        combinedOutput.length === 0) { // Sometimes success has no output
                        globusApiVLog('[GlobusAPI] submitAuthorizationCode: Authentication successful');
                        resolve([true, {
                            message: 'Authentication successful',
                            stdout: stdout,
                            stderr: stderr
                        }]);
                    } else {
                        // Exit code 0 but unclear output
                        globusApiVLog('[GlobusAPI] submitAuthorizationCode: Exit code 0 but unclear output');
                        resolve([true, {
                            message: 'Code submitted. Please check authentication status.',
                            stdout: stdout,
                            stderr: stderr
                        }]);
                    }
                } else {
                    // Non-zero exit code - likely failure
                    globusApiVLog('[GlobusAPI] submitAuthorizationCode: Authentication failed, exit code:', code);
                    resolve([false, {
                        message: 'Authentication failed. Please check the code and try again.',
                        exitCode: code,
                        stdout: stdout,
                        stderr: stderr
                    }]);
                }
            };
            
            // Remove existing exit handler and add new one
            this._loginProcess.removeAllListeners('exit');
            this._loginProcess.once('exit', exitHandler);
            
            // Write code to stdin
            try {
                globusApiVLog('[GlobusAPI] submitAuthorizationCode: Writing code to stdin');
                this._loginProcess.stdin.write(code + '\n', (err) => {
                    if (err) {
                        globusApiVLog('[GlobusAPI] submitAuthorizationCode: Error writing to stdin:', err);
                        this._loginProcess = null;
                        resolve([false, {
                            message: 'Failed to submit code: ' + err.message,
                            error: err
                        }]);
                    } else {
                        globusApiVLog('[GlobusAPI] submitAuthorizationCode: Code written to stdin, closing stdin');
                        // Close stdin to signal end of input
                        this._loginProcess.stdin.end();
                    }
                });
            } catch (error) {
                globusApiVLog('[GlobusAPI] submitAuthorizationCode: Exception writing to stdin:', error);
                this._loginProcess = null;
                resolve([false, {
                    message: 'Failed to submit code: ' + error.message,
                    error: error
                }]);
            }
        });
    }

    async login(options = {}) {
        // Robust login flow:
        // 1) Preflight whoami: if authenticated, return alreadyAuthenticated.
        // 2) Otherwise, run interactive login spawn (keeps process alive for code submission).
        // 3) Postflight whoami: if authenticated after a "failure", treat as authenticated and return success.
        globusApiVLog('[GlobusAPI] ===== login() called =====');
        globusApiVLog('[GlobusAPI] login(): options:', options);
        globusApiVLog('[GlobusAPI] Current _loginProcess state:', this._loginProcess ? 'exists' : 'null');

        try {
            const pre = await this.getAuthStatus();
            if (pre.ok && pre.isAuthenticated) {
                return {
                    ok: true,
                    isAuthenticated: true,
                    classification: 'alreadyAuthenticated',
                    username: pre.username,
                    message: 'Already authenticated'
                };
            }

            globusApiVLog('[GlobusAPI] login(): Not authenticated, calling loginWithSpawn()...');
            const result = await this.loginWithSpawn(options);
            globusApiVLog('[GlobusAPI] login(): loginWithSpawn returned (legacy tuple):', {
                result0: result?.[0],
                hasUrl: !!result?.[1]?.url,
                hasAccessCode: !!result?.[1]?.access_code,
                message: result?.[1]?.message
            });

            // If loginWithSpawn returned URL, we need browser auth
            if (result && result[0] && result[1]?.url) {
                return {
                    ok: true,
                    isAuthenticated: false,
                    classification: 'needsBrowserAuth',
                    url: result[1].url,
                    accessCode: result[1].access_code || null,
                    message: result[1].message || 'Complete authentication in your browser'
                };
            }

            // If output indicates already logged in, treat as authenticated
            const combined = `${result?.[1]?.stdout || ''}\n${result?.[1]?.stderr || ''}\n${result?.[1]?.combinedOutput || ''}`;
            if (/already logged in/i.test(combined)) {
                const post = await this.getAuthStatus();
                return {
                    ok: true,
                    isAuthenticated: !!post.isAuthenticated,
                    classification: 'alreadyAuthenticated',
                    username: post.username,
                    message: 'Already authenticated'
                };
            }

            // Postflight: if whoami works despite login failure, prefer that truth
            const post = await this.getAuthStatus();
            if (post.ok && post.isAuthenticated) {
                return {
                    ok: true,
                    isAuthenticated: true,
                    classification: 'alreadyAuthenticated',
                    username: post.username,
                    message: 'Authenticated (session already active)'
                };
            }

            // Otherwise return failure classification
            const rawMsg = result?.[1]?.message || 'Login failed';
            const interpreted = interpretGlobusCliFailure(rawMsg);
            const msg =
                interpreted.kind === GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE
                    ? `${interpreted.userSummary} ${interpreted.userDetail}`.trim()
                    : rawMsg;
            const isNetwork = /GlobusConnectionError|ConnectionError on request/i.test(combined);
            const isCliMissing = interpreted.kind === GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE;
            return {
                ok: false,
                isAuthenticated: false,
                classification: isCliMissing
                    ? 'cliUnavailable'
                    : (isNetwork ? 'networkError' : 'unknownError'),
                message: msg,
                raw: {
                    stdout: result?.[1]?.stdout || '',
                    stderr: result?.[1]?.stderr || ''
                },
                sanitized: {
                    stdout: this.sanitizeCliOutput(result?.[1]?.stdout || ''),
                    stderr: this.sanitizeCliOutput(result?.[1]?.stderr || '')
                }
            };
        } catch (error) {
            const message = formatGlobusLoginError(error?.message || error || 'Login failed unexpectedly');
            return { ok: false, isAuthenticated: false, classification: 'unknownError', message };
        } finally {
            globusApiVLog('[GlobusAPI] ===== login() complete =====');
        }
    }

    async logout() {
        // Non-interactive: exec() has no stdin; without --yes the CLI waits on
        // "Are you sure you want to logout? [y/N]:" and times out.
        return this.executeCommand(['logout', '--yes'], false);
    }

    async get_collection_info(collection_name) {
        return this.executeCommand(['collection', 'show', collection_name]);
    }

    async searchEndpoints(query) {
        const q = (query || '').trim();
        if (!q) {
            return [false, { message: 'Endpoint search query is required' }];
        }

        const response = await this.executeCommand(['endpoint', 'search', q], true);
        if (!response[0]) {
            const msg = this.sanitizeCliOutput(
                response?.[1]?.message ||
                response?.[1]?.stderr ||
                response?.[1]?.stdout ||
                'Endpoint search failed'
            );
            return [false, { message: msg || 'Endpoint search failed' }];
        }

        const raw = response[1];
        const rows = Array.isArray(raw?.DATA) ? raw.DATA : [];
        const data = rows
            .map((row) => ({
                id: row?.id ? String(row.id) : '',
                display_name: row?.display_name ? String(row.display_name) : '',
                owner: row?.owner_string ? String(row.owner_string) : (row?.owner ? String(row.owner) : ''),
            }))
            .filter((row) => row.id);

        return [true, { data }];
    }

    async validate_collection_path(collection_path) {
        return this.listDirectory(collection_path);
    }

    /**
     * List directory contents on a collection/endpoint for tree browsing.
     * @param {string} collectionPath - Full path e.g. "collection-id#/" or "collection-id#/folder/subdir/"
     * @returns {Promise<[boolean, { path?: string, endpoint?: string, data?: Array<{ name: string, type: string }> } | { message: string }]>}
     */
    async listDirectory(collectionPath) {
        if (!this._pathToGlobus) {
            return [false, { message: 'Globus CLI not available' }];
        }
        const pathToUse = collectionPath && collectionPath.trim() ? collectionPath.trim() : '';
        if (!pathToUse) {
            return [false, { message: 'Collection path is required' }];
        }
        // Globus CLI expects ENDPOINT_ID[:PATH]
        // Normalize to endpointUuid:/path/ style for directory browsing.
        let normalizedPath = pathToUse;
        if (!normalizedPath.includes(':')) {
            return [false, {
                message: 'Target endpoint path must be in format endpointUUID:/path. Use endpoint search and select a UUID first.'
            }];
        }
        if (/^[^:]+:$/.test(normalizedPath)) {
            normalizedPath += '/';
        }
        const [endpointId, endpointPath = '/'] = normalizedPath.split(':');
        const cleanEndpointId = (endpointId || '').trim();
        let cleanPath = (endpointPath || '/').trim();
        if (!cleanPath.startsWith('/')) {
            cleanPath = `/${cleanPath}`;
        }
        if (!cleanPath.endsWith('/')) {
            cleanPath += '/';
        }
        normalizedPath = `${cleanEndpointId}:${cleanPath}`;

        const result = await this.executeCommand(['ls', normalizedPath], true);
        if (!result[0]) {
            const rawMessage =
                result?.[1]?.message || result?.[1]?.stderr || result?.[1]?.stdout || 'List directory failed';
            const interp = interpretGlobusLsFailure(this.sanitizeCliOutput(rawMessage) || rawMessage);
            return [false, {
                message: interp.userSummary,
                userDetail: interp.userDetail || '',
                technical: interp.technical,
                kind: interp.kind,
            }];
        }
        const raw = result[1];
        const data = Array.isArray(raw?.DATA) ? raw.DATA.map((item) => ({
            name: item.name != null ? String(item.name) : '',
            type: item.type === 'dir' || item.type === 'directory' ? 'directory' : 'file'
        })) : [];
        return [true, {
            path: raw?.path ?? normalizedPath,
            endpoint: raw?.endpoint,
            data
        }];
    }

    async submit_transfer(source_path, destination_collection_path) {
        // Format: globus transfer <source> <dest>
        const args = ['transfer', source_path, destination_collection_path];
        return this.executeCommand(args);
    }

    async get_transfer_status(task_id) {
        return this.executeCommand(['task', 'show', task_id]);
    }

    async get_transfer_progress(task_id) {
        // Get task events for progress
        return this.executeCommand(['task', 'event-list', task_id]);
    }

    async cancel_transfer(task_id) {
        return this.executeCommand(['task', 'cancel', task_id]);
    }

    getStatus() {
        return this._status;
    }

    isAvailable() {
        return this._pathToGlobus !== null;
    }

    executeCommandStream(args, useJsonFormat = false, additionalEnv = {}, outputCallbacks = {}) {
        // Execute command with streaming output using spawn
        // outputCallbacks: { onStdout: (chunk) => {}, onStderr: (chunk) => {}, onComplete: (exitCode, stdout, stderr) => {}, onError: (error) => {} }
        // Returns the child process for potential cancellation
        
        if (!this._pathToGlobus) {
            if (outputCallbacks.onError) {
                outputCallbacks.onError(new Error('Globus CLI not available'));
            }
            return null;
        }
        
        globusApiVLog('[GlobusAPI] executeCommandStream: Starting streaming command execution');
        globusApiVLog('[GlobusAPI] executeCommandStream: Args:', args);
        globusApiVLog('[GlobusAPI] executeCommandStream: Use JSON format:', useJsonFormat);
        
        // Build command args
        const commandArgs = [...args];
        if (useJsonFormat) {
            commandArgs.push('--format', 'json');
        }
        
        // Prepare environment - start with process.env
        const finalEnv = this.buildEnv(additionalEnv);
        if (this._disableSslVerification) {
            globusApiVLog('[GlobusAPI] executeCommandStream: SSL verification disabled');
        }
        
        let stdout = '';
        let stderr = '';
        let processExited = false;
        let stderrBuffer = ''; // Buffer for incomplete stderr lines
        
        globusApiVLog('[GlobusAPI] executeCommandStream: Spawning process with args:', commandArgs);
        
        const child = spawn(this._pathToGlobus, commandArgs, {
            env: finalEnv,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });
        
        // Stream stdout
        child.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            globusApiVLog('[GlobusAPI] executeCommandStream: stdout chunk:', chunk.substring(0, 200));
            if (outputCallbacks.onStdout) {
                outputCallbacks.onStdout(chunk);
            }
        });
        
        // Stream stderr with line buffering to filter PyInstaller debug output
        child.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            globusApiVLog('[GlobusAPI] executeCommandStream: stderr chunk:', chunk.substring(0, 200));
            
            // Add chunk to buffer
            stderrBuffer += chunk;
            
            // Process complete lines (ending with \n)
            const lines = stderrBuffer.split('\n');
            // Keep the last incomplete line in the buffer
            stderrBuffer = lines.pop() || '';
            
            // Filter out PyInstaller debug output lines
            // Pattern: [PYI-XXXXX:DEBUG] ... or [PYI-XXXXX:INFO] etc.
            const filteredLines = lines.filter(line => {
                // Remove lines that match PyInstaller debug pattern
                // Match pattern anywhere in the line (not just at start) to catch chunked lines
                // Also match partial patterns that might occur due to chunking
                const trimmedLine = line.trim();
                return this.sanitizeCliOutput(trimmedLine) === trimmedLine;
            });
            
            // Send filtered complete lines
            if (filteredLines.length > 0 && outputCallbacks.onStderr) {
                const filteredOutput = filteredLines.join('\n') + (filteredLines.length > 0 ? '\n' : '');
                outputCallbacks.onStderr(filteredOutput);
            }
        });
        
        // Handle process exit
        child.on('exit', (code, signal) => {
            if (processExited) return;
            processExited = true;
            
            globusApiVLog('[GlobusAPI] executeCommandStream: Process exited with code:', code, 'signal:', signal);
            
            // Flush any remaining stderr buffer
            if (stderrBuffer && outputCallbacks.onStderr) {
                // Filter the remaining buffer content
                const trimmedBuffer = stderrBuffer.trim();
                if (!trimmedBuffer.match(/\[PYI-\d+:(DEBUG|INFO|WARN|ERROR)\]/) &&
                    !trimmedBuffer.match(/^PYI-\d+:(DEBUG|INFO|WARN|ERROR)/) &&
                    !trimmedBuffer.match(/^LOADER:/) &&
                    !trimmedBuffer.match(/^DYLIB:/)) {
                    outputCallbacks.onStderr(stderrBuffer);
                }
                stderrBuffer = '';
            }
            
            if (outputCallbacks.onComplete) {
                outputCallbacks.onComplete(code || 0, stdout, stderr);
            }
        });
        
        // Handle process errors
        child.on('error', (error) => {
            if (processExited) return;
            processExited = true;
            
            globusApiVLog('[GlobusAPI] executeCommandStream: Process error:', error);
            
            if (outputCallbacks.onError) {
                outputCallbacks.onError(error);
            }
        });
        
        return child;
    }

    setDisableSslVerification(disable) {
        globusApiVLog('[GlobusAPI] setDisableSslVerification() called with:', disable);
        this._disableSslVerification = disable;
        if (disable) {
            globusApiVLog('[GlobusAPI] SSL verification will be disabled for all globus-cli processes (GLOBUS_SDK_VERIFY_SSL=false)');
        } else {
            globusApiVLog('[GlobusAPI] SSL verification will be enabled (default behavior)');
        }
    }
}

export default GlobusAPI;
