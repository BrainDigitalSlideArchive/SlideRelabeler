import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class GlobusAPI {
    constructor() {
        // Debug logging
        console.log('[GlobusAPI] Initializing...');
        console.log('[GlobusAPI] process.resourcesPath:', process.resourcesPath);
        console.log('[GlobusAPI] NODE_ENV:', process.env.NODE_ENV);
        console.log('[GlobusAPI] process.platform:', process.platform);
        
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
        console.log('[GlobusAPI] Looking for:', globusCli);
        
        // Check for bundled globus-cli in resourcesPath (all platforms)
        const resourcesGlobusPath1 = path.join(process.resourcesPath, 'globus-cli', 'globus-cli');
        const resourcesGlobusPath2 = path.join(process.resourcesPath, 'globus-cli', 'globus-cli.app');
        const resourcesGlobusPath3 = path.join(process.resourcesPath, 'globus-cli', 'globus-cli.exe');
        console.log('[GlobusAPI] Checking resourcesPath paths:');
        console.log('[GlobusAPI]   -', resourcesGlobusPath1, 'exists:', fs.existsSync(resourcesGlobusPath1));
        console.log('[GlobusAPI]   -', resourcesGlobusPath2, 'exists:', fs.existsSync(resourcesGlobusPath2));
        console.log('[GlobusAPI]   -', resourcesGlobusPath3, 'exists:', fs.existsSync(resourcesGlobusPath3));
        
        // List contents of process.resourcesPath if it exists
        if (process.resourcesPath && fs.existsSync(process.resourcesPath)) {
            try {
                const resourcesContents = fs.readdirSync(process.resourcesPath);
                console.log('[GlobusAPI] Contents of process.resourcesPath:', resourcesContents);
                if (resourcesContents.includes('globus-cli')) {
                    const globusCliPath = path.join(process.resourcesPath, 'globus-cli');
                    const globusCliContents = fs.readdirSync(globusCliPath);
                    console.log('[GlobusAPI] Contents of globus-cli directory:', globusCliContents);
                }
            } catch (error) {
                console.log('[GlobusAPI] Error reading resourcesPath:', error.message);
            }
        }
        
        const usePyinstaller = process.argv.includes('pyinstaller') || 
            fs.existsSync(resourcesGlobusPath1) ||
            fs.existsSync(resourcesGlobusPath2) ||
            fs.existsSync(resourcesGlobusPath3);
        console.log('[GlobusAPI] usePyinstaller:', usePyinstaller);
        
        // Initialize conda environment tracking
        this._usingCondaEnv = false;
        this._condaPrefix = null;
        this._pathToGlobus = null;
        this._status = null;
        
        // Priority 1: Production mode - use bundled executable (always check this first)
        const bundledPath = path.join(process.resourcesPath, 'globus-cli', globusCli);
        console.log('[GlobusAPI] Checking bundled path:', bundledPath, 'exists:', fs.existsSync(bundledPath));
        if (fs.existsSync(bundledPath)) {
            if (process.platform === 'darwin') {
                // On macOS, .app bundles need to execute the binary inside
                const macExecutable = path.join(process.resourcesPath, 'globus-cli', globusCliExecutable);
                console.log('[GlobusAPI] Checking macOS executable:', macExecutable, 'exists:', fs.existsSync(macExecutable));
                if (fs.existsSync(macExecutable)) {
                    this._pathToGlobus = macExecutable;
                } else {
                    this._pathToGlobus = path.join(process.resourcesPath, 'globus-cli', globusCli);
                }
            } else {
                this._pathToGlobus = path.join(process.resourcesPath, 'globus-cli', globusCli);
            }
            this._status = 'Globus: using bundled executable from resourcesPath';
            console.log('[GlobusAPI] Found bundled executable at:', this._pathToGlobus);
        }
        // Priority 2: Local build for testing
        else {
            const localPath = path.join('./dist/globus-cli', globusCli);
            console.log('[GlobusAPI] Checking local build path:', localPath, 'exists:', fs.existsSync(localPath));
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
                console.log('[GlobusAPI] Found local build at:', this._pathToGlobus);
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
                    
                    console.log('[GlobusAPI] Checking conda path:', condaGlobusPath, 'exists:', fs.existsSync(condaGlobusPath));
                    if (fs.existsSync(condaGlobusPath)) {
                        this._pathToGlobus = condaGlobusPath;
                        this._status = 'Globus: using conda environment globus-cli';
                        this._usingCondaEnv = true;
                        this._condaPrefix = condaPrefix;
                        console.log('[GlobusAPI] Found conda globus-cli at:', this._pathToGlobus);
                    }
                }
                
                // Fallback to system-installed globus (if available)
                if (!this._pathToGlobus) {
                    this._pathToGlobus = 'globus';
                    this._status = 'Globus: using system globus (development mode)';
                    console.log('[GlobusAPI] Using system globus');
                }
            }
        }
        
        // If no path was found, set error status
        if (!this._pathToGlobus) {
            this._status = 'Globus: No path detected, not available';
            console.log('[GlobusAPI] No globus-cli path found. Status:', this._status);
        }
        console.log('[GlobusAPI] Final pathToGlobus:', this._pathToGlobus);
        console.log('[GlobusAPI] Final status:', this._status);
    }

    async executeCommand(args, useJsonFormat = true, additionalEnv = {}) {
        if (!this._pathToGlobus) {
            return [false, { 
                message: 'Globus CLI not available. For development: ensure globus-cli is installed in your conda environment (add to environment.yml and run conda env update). For production: use a packaged build.' 
            }];
        }
        
        // Build command with optional JSON format
        let command = `${this._pathToGlobus} ${args.join(' ')}`;
        if (useJsonFormat) {
            command += ' --format json';
        }
        
        console.log('[GlobusAPI] executeCommand: Starting command execution');
        console.log('[GlobusAPI] executeCommand: Command:', command);
        console.log('[GlobusAPI] executeCommand: Additional env vars:', additionalEnv.env ? Object.keys(additionalEnv.env) : []);
        
        // Prepare environment - start with process.env
        const baseEnv = { ...process.env };
        
        // Add conda Python to PATH if using conda environment
        if (this._usingCondaEnv && this._condaPrefix) {
            const currentPath = baseEnv.PATH || '';
            const condaPath = process.platform === 'win32'
                ? path.join(this._condaPrefix, 'Scripts') + path.delimiter + 
                  path.join(this._condaPrefix, 'Library', 'bin') + path.delimiter +
                  currentPath
                : path.join(this._condaPrefix, 'bin') + path.delimiter + currentPath;
            
            baseEnv.PATH = condaPath;
            baseEnv.CONDA_PREFIX = this._condaPrefix;
        }
        
        // Set SSL verification setting if disabled
        if (this._disableSslVerification) {
            baseEnv.GLOBUS_SDK_VERIFY_SSL = 'false';
            console.log('[GlobusAPI] executeCommand: SSL verification disabled (GLOBUS_SDK_VERIFY_SSL=false)');
        }
        
        // Merge additional environment variables (these override base env)
        const finalEnv = additionalEnv.env ? { ...baseEnv, ...additionalEnv.env } : baseEnv;
        
        // Log relevant environment variables
        const relevantEnvVars = Object.keys(finalEnv).filter(k => k.startsWith('GLOBUS') || k === 'PATH' || k === 'CONDA_PREFIX');
        console.log('[GlobusAPI] executeCommand: Final env vars:', relevantEnvVars);
        if (finalEnv.GLOBUS_CLI_INTERACTIVE !== undefined) {
            console.log('[GlobusAPI] executeCommand: GLOBUS_CLI_INTERACTIVE value:', finalEnv.GLOBUS_CLI_INTERACTIVE);
        } else {
            console.log('[GlobusAPI] executeCommand: GLOBUS_CLI_INTERACTIVE NOT SET');
        }
        
        // Prepare exec options
        const execOptions = {
            timeout: 30000, // 30 second timeout for all commands
            env: finalEnv
        };
        
        try {
            const startTime = Date.now();
            const { stdout, stderr } = await execAsync(command, execOptions);
            const duration = Date.now() - startTime;
            console.log('[GlobusAPI] executeCommand: Command completed in', duration, 'ms');
            console.log('[GlobusAPI] executeCommand: stdout length:', stdout?.length || 0);
            console.log('[GlobusAPI] executeCommand: stderr length:', stderr?.length || 0);
            
            if (useJsonFormat) {
                // Existing JSON parsing logic
                if (stderr && !stdout) {
                    // Some commands output to stderr even on success
                    try {
                        const result = JSON.parse(stderr);
                        return [true, result];
                    } catch (e) {
                        // If stderr is not JSON, treat as error
                        return [false, { message: stderr }];
                    }
                }
                const result = JSON.parse(stdout);
                return [true, result];
            } else {
                // For non-JSON commands, return success with text output
                // Exit code 0 means success
                if (stdout) {
                    return [true, { message: stdout.trim() }];
                } else if (stderr) {
                    // Some commands output to stderr even on success
                    return [true, { message: stderr.trim() }];
                } else {
                    return [true, { message: 'Command completed successfully' }];
                }
            }
        } catch (error) {
            const duration = Date.now() - (Date.now() - (error.killed ? 30000 : 0));
            console.log('[GlobusAPI] executeCommand: Command failed or timed out');
            console.log('[GlobusAPI] executeCommand: Error message:', error.message);
            console.log('[GlobusAPI] executeCommand: Killed (timeout):', error.killed || false);
            console.log('[GlobusAPI] executeCommand: stdout:', error.stdout?.substring(0, 500) || '');
            console.log('[GlobusAPI] executeCommand: stderr:', error.stderr?.substring(0, 500) || '');
            
            // Handle timeout errors - extract output even if process was killed
            const isTimeout = error.killed || error.message?.includes('timeout');
            if (isTimeout) {
                console.log('[GlobusAPI] executeCommand: Timeout detected, extracting partial output');
            }
            
            // Handle errors for both JSON and non-JSON commands
            if (useJsonFormat && error.stdout) {
                try {
                    const errorResult = JSON.parse(error.stdout);
                    return [false, errorResult];
                } catch (e) {
                    // Not JSON, fall through to text error handling
                }
            }
            
            // For non-JSON commands (like login), preserve both stdout and stderr
            // The login command may output URL to stdout/stderr even when it fails or times out
            const combinedOutput = (error.stdout || '') + (error.stderr || '');
            
            return [false, { 
                message: error.message || 'Unknown error', 
                stderr: error.stderr,
                stdout: error.stdout,
                combinedOutput: combinedOutput, // For easier URL extraction
                isTimeout: isTimeout, // Flag for timeout errors
                // Check if it's a connection error
                connectionError: error.message?.includes('Connection') || 
                                 error.stderr?.includes('ConnectionError') ||
                                 error.stderr?.includes('Connection')
            }];
        }
    }

    async check_auth() {
        return this.executeCommand(['whoami']);
    }

    async loginWithSpawn() {
        // Use spawn instead of exec for better control over stdin/stdout/stderr
        // This prevents the process from waiting for stdin input
        console.log('[GlobusAPI] loginWithSpawn() called');
        console.log('[GlobusAPI] Using globus-cli path:', this._pathToGlobus);
        
        return new Promise((resolve) => {
            // Prepare environment
            const baseEnv = { ...process.env };
            
            // Add conda Python to PATH if using conda environment
            if (this._usingCondaEnv && this._condaPrefix) {
                const currentPath = baseEnv.PATH || '';
                const condaPath = process.platform === 'win32'
                    ? path.join(this._condaPrefix, 'Scripts') + path.delimiter + 
                      path.join(this._condaPrefix, 'Library', 'bin') + path.delimiter +
                      currentPath
                    : path.join(this._condaPrefix, 'bin') + path.delimiter + currentPath;
                
                baseEnv.PATH = condaPath;
                baseEnv.CONDA_PREFIX = this._condaPrefix;
            }
            
            // Don't set GLOBUS_CLI_INTERACTIVE=0 - we need interactive mode to submit code
            // baseEnv.GLOBUS_CLI_INTERACTIVE = '0'; // Removed - we need stdin to submit code
            console.log('[GlobusAPI] loginWithSpawn: Using interactive mode to allow code submission');
            
            // Spawn the process with stdin piped so we can write to it
            const args = ['login', '-v', '--no-local-server'];
            console.log('[GlobusAPI] loginWithSpawn: Spawning process with args:', args);
            
            const child = spawn(this._pathToGlobus, args, {
                env: baseEnv,
                stdio: ['pipe', 'pipe', 'pipe'], // stdin: pipe (to write code), stdout: pipe, stderr: pipe
                shell: false
            });
            
            // Store process reference so we can write to stdin later
            this._loginProcess = child;
            console.log('[GlobusAPI] loginWithSpawn: Stored process reference for code submission');
            
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
                    console.log('[GlobusAPI] loginWithSpawn: Timeout reached before URL found, killing process');
                    child.kill();
                    this._loginProcess = null;
                } else {
                    // URL found but no code submitted - kill after extended timeout
                    console.log('[GlobusAPI] loginWithSpawn: Extended timeout reached, killing process');
                    child.kill();
                    this._loginProcess = null;
                }
            }, timeout);
            
            // Stream stdout in real-time
            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                stdout += chunk;
                console.log('[GlobusAPI] loginWithSpawn: stdout chunk:', chunk.substring(0, 200));
                
                // Try to extract URL as soon as it appears
                if (!urlFound && !promiseResolved) {
                    const urlMatch = chunk.match(/https?:\/\/[^\s\)]+/);
            if (urlMatch) {
                        urlFound = true;
                        console.log('[GlobusAPI] loginWithSpawn: URL found in stdout:', urlMatch[0]);
                        
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
                                        console.log('[GlobusAPI] loginWithSpawn: Access code found:', accessCode);
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
                                        console.log('[GlobusAPI] loginWithSpawn: Access code found as standalone line:', accessCode);
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
                                
                                console.log('[GlobusAPI] loginWithSpawn: Resolving promise immediately with URL:', urlMatch[0], 'code:', accessCode || 'none');
                                console.log('[GlobusAPI] loginWithSpawn: Resolve value structure:', {
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
                                console.log('[GlobusAPI] loginWithSpawn: Process will stay alive for code submission');
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
                console.log('[GlobusAPI] loginWithSpawn: stderr chunk:', chunk.substring(0, 200));
                
                // Also check stderr for URL (some commands output to stderr)
                if (!urlFound && !promiseResolved) {
                    const urlMatch = chunk.match(/https?:\/\/[^\s\)]+/);
                    if (urlMatch) {
                        urlFound = true;
                        console.log('[GlobusAPI] loginWithSpawn: URL found in stderr:', urlMatch[0]);
                        
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
                                        console.log('[GlobusAPI] loginWithSpawn: Access code found in stderr:', accessCode);
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
                                        console.log('[GlobusAPI] loginWithSpawn: Access code found as standalone line in stderr:', accessCode);
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
                                
                                console.log('[GlobusAPI] loginWithSpawn: Resolving promise immediately with URL from stderr:', urlMatch[0], 'code:', accessCode || 'none');
                                console.log('[GlobusAPI] loginWithSpawn: Resolve value structure:', {
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
                                console.log('[GlobusAPI] loginWithSpawn: Process will stay alive for code submission');
                                resolve(resolveValue);
                            }
                        }, 500); // Wait 500ms for more output to arrive
                    }
                }
            });
            
            // Handle process exit
            child.on('exit', (code, signal) => {
                clearTimeout(timeoutId);
                console.log('[GlobusAPI] loginWithSpawn: Process exited with code:', code, 'signal:', signal);
                
                // Clear process reference
                if (this._loginProcess === child) {
                    this._loginProcess = null;
                }
                
                // If promise was already resolved (URL found), just clean up
                if (promiseResolved) {
                    console.log('[GlobusAPI] loginWithSpawn: Process exited but promise already resolved, just cleaning up');
                    return;
                }
                
                // Promise not resolved yet - handle error cases
                const combinedOutput = stdout + stderr;
                
                // If URL was found but promise wasn't resolved (shouldn't happen, but handle it)
                if (urlFound) {
                    const urlMatch = combinedOutput.match(/https?:\/\/[^\s\)]+/);
                    if (urlMatch && !promiseResolved) {
                        console.log('[GlobusAPI] loginWithSpawn: WARNING - URL found but promise not resolved, resolving now');
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
                        console.log('[GlobusAPI] loginWithSpawn: Resolving from exit handler with URL:', urlMatch[0], 'code:', accessCode || 'none');
                        resolve(resolveValue);
                        return;
                    }
                }
                
                // If no URL found, check if it's a connection error
                if (combinedOutput.includes('ConnectionError') || combinedOutput.includes('Connection')) {
                    console.log('[GlobusAPI] loginWithSpawn: Connection error detected in output');
                    if (!promiseResolved) {
                        promiseResolved = true;
                        const resolveValue = [false, {
                    message: 'Cannot connect to Globus authentication server. Please check your network connection and firewall settings.',
                            connectionError: true,
                            stdout: stdout,
                            stderr: stderr
                        }];
                        console.log('[GlobusAPI] loginWithSpawn: Resolving with connection error:', resolveValue);
                        resolve(resolveValue);
                    }
                    return;
                }
                
                // No URL found - return error
                if (!promiseResolved) {
                    promiseResolved = true;
                    console.log('[GlobusAPI] loginWithSpawn: No URL found in output');
                    console.log('[GlobusAPI] loginWithSpawn: urlFound flag:', urlFound);
                    console.log('[GlobusAPI] loginWithSpawn: Combined output length:', combinedOutput.length);
                    console.log('[GlobusAPI] loginWithSpawn: Stdout length:', stdout.length);
                    console.log('[GlobusAPI] loginWithSpawn: Stderr length:', stderr.length);
                    console.log('[GlobusAPI] loginWithSpawn: Combined output (first 500 chars):', combinedOutput.substring(0, 500));
                    const resolveValue = [false, {
                        message: 'Login command completed but no authentication URL was found. Please try again.',
                        stdout: stdout,
                        stderr: stderr,
                        combinedOutput: combinedOutput
                    }];
                    console.log('[GlobusAPI] loginWithSpawn: Resolving with error (no URL):', resolveValue);
                    resolve(resolveValue);
                }
            });
            
            // Handle process errors
            child.on('error', (error) => {
                clearTimeout(timeoutId);
                console.log('[GlobusAPI] loginWithSpawn: Process error:', error);
                if (this._loginProcess === child) {
                    this._loginProcess = null;
                }
                resolve([false, {
                    message: error.message || 'Failed to start login command',
                    error: error
                }]);
            });
        });
    }
    
    async submitAuthorizationCode(code) {
        console.log('[GlobusAPI] submitAuthorizationCode() called with code:', code ? code.substring(0, 4) + '...' : 'null');
        
        if (!this._loginProcess) {
            console.log('[GlobusAPI] submitAuthorizationCode: No active login process');
            return [false, { message: 'No active login process. Please start login again.' }];
        }
        
        if (this._loginProcess.killed) {
            console.log('[GlobusAPI] submitAuthorizationCode: Login process has been killed');
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
                console.log('[GlobusAPI] submitAuthorizationCode: stdout chunk:', chunk.substring(0, 200));
            };
            
            const stderrHandler = (data) => {
                const chunk = data.toString();
                stderr += chunk;
                console.log('[GlobusAPI] submitAuthorizationCode: stderr chunk:', chunk.substring(0, 200));
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
                console.log('[GlobusAPI] submitAuthorizationCode: Process exited with code:', code, 'signal:', signal);
                
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
                        console.log('[GlobusAPI] submitAuthorizationCode: Authentication successful');
                        resolve([true, {
                            message: 'Authentication successful',
                            stdout: stdout,
                            stderr: stderr
                        }]);
                    } else {
                        // Exit code 0 but unclear output
                        console.log('[GlobusAPI] submitAuthorizationCode: Exit code 0 but unclear output');
                        resolve([true, {
                            message: 'Code submitted. Please check authentication status.',
                            stdout: stdout,
                            stderr: stderr
                        }]);
                    }
                } else {
                    // Non-zero exit code - likely failure
                    console.log('[GlobusAPI] submitAuthorizationCode: Authentication failed, exit code:', code);
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
                console.log('[GlobusAPI] submitAuthorizationCode: Writing code to stdin');
                this._loginProcess.stdin.write(code + '\n', (err) => {
                    if (err) {
                        console.log('[GlobusAPI] submitAuthorizationCode: Error writing to stdin:', err);
                        this._loginProcess = null;
                        resolve([false, {
                            message: 'Failed to submit code: ' + err.message,
                            error: err
                        }]);
                    } else {
                        console.log('[GlobusAPI] submitAuthorizationCode: Code written to stdin, closing stdin');
                        // Close stdin to signal end of input
                        this._loginProcess.stdin.end();
                    }
                });
            } catch (error) {
                console.log('[GlobusAPI] submitAuthorizationCode: Exception writing to stdin:', error);
                this._loginProcess = null;
                resolve([false, {
                    message: 'Failed to submit code: ' + error.message,
                    error: error
                }]);
            }
        });
    }

    async login() {
        // Use spawn-based method for better control over stdin/stdout
        // This prevents the process from hanging while waiting for stdin input
        console.log('[GlobusAPI] ===== login() called =====');
        console.log('[GlobusAPI] Using spawn-based login method');
        console.log('[GlobusAPI] Current _loginProcess state:', this._loginProcess ? 'exists' : 'null');
        
        try {
            // Use spawn method instead of exec for better stdin control
            console.log('[GlobusAPI] Calling loginWithSpawn()...');
            const result = await this.loginWithSpawn();
            console.log('[GlobusAPI] loginWithSpawn returned');
            console.log('[GlobusAPI] Result structure:', {
                isArray: Array.isArray(result),
                length: result?.length,
                result0: result?.[0],
                result1: result?.[1],
                hasUrl: !!result?.[1]?.url,
                url: result?.[1]?.url,
                hasAccessCode: !!result?.[1]?.access_code,
                accessCode: result?.[1]?.access_code,
                message: result?.[1]?.message,
                fullResult: result
            });
            
            // loginWithSpawn already handles all URL and access code extraction
            // Just return the result
            console.log('[GlobusAPI] ===== login() returning =====');
            return result;
        } catch (error) {
            console.log('[GlobusAPI] Exception caught in login():', error);
            console.log('[GlobusAPI] Error message:', error.message);
            
            return [false, { 
                message: error.message || 'Login failed unexpectedly',
                error: error
            }];
        }
    }

    async logout() {
        // globus logout doesn't support --format json
        return this.executeCommand(['logout'], false);
    }

    async get_collection_info(collection_name) {
        return this.executeCommand(['collection', 'show', collection_name]);
    }

    async validate_collection_path(collection_path) {
        // Try to list the path to see if it exists and is accessible
        return this.executeCommand(['ls', collection_path]);
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

    setDisableSslVerification(disable) {
        console.log('[GlobusAPI] setDisableSslVerification() called with:', disable);
        this._disableSslVerification = disable;
        if (disable) {
            console.log('[GlobusAPI] SSL verification will be disabled for all globus-cli processes (GLOBUS_SDK_VERIFY_SSL=false)');
        } else {
            console.log('[GlobusAPI] SSL verification will be enabled (default behavior)');
        }
    }
}

export default GlobusAPI;
