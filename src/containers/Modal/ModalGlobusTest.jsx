import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ModalHeader from './ModalHeader';
import Button from '../../components/controls/button/Button';
import InputText from '../../components/controls/input/InputText';
import Checkbox from '../../components/controls/checkbox/Checkbox';
import GlobusAuthPanel from '../../components/globus/GlobusAuthPanel';
import * as globus_actions from '../../actions/globus';

function ModalGlobusTest(props) {
  const [cliAvailable, setCliAvailable] = useState(null);
  const [cliStatus, setCliStatus] = useState('');
  const [authStatus, setAuthStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sourceEndpoint, setSourceEndpoint] = useState('');
  const [collectionPath, setCollectionPath] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginUrl, setLoginUrl] = useState(null);
  const [accessCode, setAccessCode] = useState(null);
  const [loginPending, setLoginPending] = useState(false);
  const [authorizationCodeInput, setAuthorizationCodeInput] = useState('');
  const dispatch = useDispatch();
  const disableSslVerification = useSelector(state => state.globus.disable_ssl_verification);
  const cleanupRef = useRef({ progress: null, complete: null, error: null });

  // Dev toggles (Globus Test)
  const [verboseLogin, setVerboseLogin] = useState(false);
  const [enablePyiDebug, setEnablePyiDebug] = useState(false);
  const [showRawCliOutput, setShowRawCliOutput] = useState(false);
  const [lastLoginDebug, setLastLoginDebug] = useState(null);
  
  // Terminal mode state
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [outputLines, setOutputLines] = useState([]);
  const [currentCommandId, setCurrentCommandId] = useState(null);
  const [useJsonFormat, setUseJsonFormat] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalOutputRef = useRef(null);
  const terminalCleanupRef = useRef({ output: null, complete: null, error: null });

  // Check CLI availability on mount
  useEffect(() => {
    checkCliAvailable();
    refreshAuthStatus();
    
    // Cleanup listeners on unmount
    return () => {
      if (cleanupRef.current.progress) cleanupRef.current.progress();
      if (cleanupRef.current.complete) cleanupRef.current.complete();
      if (cleanupRef.current.error) cleanupRef.current.error();
      // Cleanup terminal listeners
      if (terminalCleanupRef.current.output) terminalCleanupRef.current.output();
      if (terminalCleanupRef.current.complete) terminalCleanupRef.current.complete();
      if (terminalCleanupRef.current.error) terminalCleanupRef.current.error();
    };
  }, []);

  async function checkCliAvailable() {
    setIsLoading(true);
    try {
      const response = await window.electronAPI.globusCheckCliAvailable();
      if (response && response[0]) {
        setCliAvailable(true);
        setCliStatus(response[1].status || 'Available');
      } else {
        setCliAvailable(false);
        setCliStatus(response[1]?.status || 'Not available');
      }
    } catch (error) {
      setCliAvailable(false);
      setCliStatus('Error checking CLI availability');
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkAuth() {
    // Backwards-compat wrapper: keep name used by UI, but make it authoritative
    return refreshAuthStatus();
  }

  async function refreshAuthStatus() {
    setIsLoading(true);
    try {
      const response = await window.electronAPI.globusAuthStatus();
      if (response && response.ok && response.isAuthenticated) {
        setAuthStatus(true);
        setCurrentUser(response.username || 'Authenticated');
        // Clear login pending state on successful auth
        setLoginPending(false);
        setLoginUrl(null);
        setAccessCode(null);
        setAuthorizationCodeInput('');
        setErrorMessage('');
      } else {
        setAuthStatus(false);
        setCurrentUser('');
      }
    } catch (error) {
      setAuthStatus(false);
      setCurrentUser('');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin() {
    setIsLoading(true);
    setErrorMessage('');
    setConnectionWarning(false);
    setLoginUrl(null);
    setAccessCode(null);
    setLoginPending(false);
    setAuthorizationCodeInput('');
    try {
      const response = await window.electronAPI.globusLogin({ verbose: verboseLogin, enablePyiDebug: enablePyiDebug });
      setLastLoginDebug(response || null);

      // New typed response from backend
      if (response && response.ok) {
        if (response.classification === 'alreadyAuthenticated') {
          setAuthStatus(true);
          setCurrentUser(response.username || 'Authenticated');
          setErrorMessage('');
        } else if (response.classification === 'needsBrowserAuth' && response.url) {
          setLoginUrl(response.url);
          setAccessCode(response.accessCode || null);
          setLoginPending(true);
          setErrorMessage('');
        } else {
          setErrorMessage(response.message || 'Login started');
        }
      } else {
        const errorMsg = response?.message || 'Login failed';
        if (response?.classification === 'networkError') {
          setErrorMessage(`Connection Error: ${errorMsg}`);
        } else {
          setErrorMessage(errorMsg);
        }
      }
    } catch (error) {
      setErrorMessage(error.message || 'Login error');
    } finally {
      // Always refresh auth status after attempting login to avoid contradictory UI
      refreshAuthStatus();
      setIsLoading(false);
    }
  }

  async function handleSubmitAuthorizationCode() {
    if (!authorizationCodeInput || !authorizationCodeInput.trim()) {
      setErrorMessage('Please enter an authorization code');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await window.electronAPI.globusSubmitAuthorizationCode(authorizationCodeInput.trim());
      if (response && response[0]) {
        setAuthorizationCodeInput('');
        // Wait a moment for the auth to process, then check status
        setTimeout(() => {
          refreshAuthStatus();
        }, 1000);
      } else {
        setErrorMessage(response[1]?.message || 'Failed to submit authorization code');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Error submitting authorization code');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await window.electronAPI.globusLogout();
      if (response && response[0]) {
        setAuthStatus(false);
        setCurrentUser('');
      } else {
        setErrorMessage(response[1]?.message || 'Logout failed');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Logout error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectFile() {
    try {
      const files = await window.electronAPI.openFileSingleDialog();
      if (files && files.length > 0) {
        setSelectedFile(files[0].source.path);
        setErrorMessage('');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Error selecting file');
    }
  }

  async function handleValidatePath() {
    if (!collectionPath) {
      setErrorMessage('Please enter a collection path');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await window.electronAPI.globusCheckCollectionPath(collectionPath);
      if (response && response[0]) {
        setErrorMessage('Path is valid');
      } else {
        setErrorMessage(response[1]?.message || 'Path validation failed');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Error validating path');
    } finally {
      setIsLoading(false);
    }
  }

  // Terminal mode functions
  function parseCommand(input) {
    // Simple command parsing - split by spaces, handle basic quoted strings
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    // Remove 'globus' prefix if present (we'll add it in the backend)
    if (parts.length > 0 && parts[0].toLowerCase() === 'globus') {
      parts.shift();
    }
    
    return parts;
  }

  function addOutputLine(type, content) {
    setOutputLines(prev => [...prev, { 
      type: type, 
      content: content, 
      timestamp: new Date() 
    }]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (terminalOutputRef.current) {
        terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
      }
    }, 10);
  }

  async function handleExecuteCommand() {
    if (!commandInput.trim()) {
      return;
    }
    
    if (!cliAvailable) {
      addOutputLine('error', 'Error: Globus CLI not available');
      return;
    }
    
    if (isExecuting) {
      addOutputLine('error', 'Error: Command already executing');
      return;
    }
    
    const commandText = commandInput.trim();
    const args = parseCommand(commandText);
    
    if (args.length === 0) {
      addOutputLine('error', 'Error: Invalid command');
      return;
    }
    
    // Add command to history
    setCommandHistory(prev => {
      const newHistory = [...prev];
      if (newHistory.length === 0 || newHistory[newHistory.length - 1] !== commandText) {
        newHistory.push(commandText);
        // Keep only last 50 commands
        if (newHistory.length > 50) {
          newHistory.shift();
        }
      }
      return newHistory;
    });
    
    // Display command prompt
    addOutputLine('command', `$ globus ${args.join(' ')}`);
    
    setIsExecuting(true);
    setCommandInput('');
    
    // Cleanup previous listeners
    if (terminalCleanupRef.current.output) terminalCleanupRef.current.output();
    if (terminalCleanupRef.current.complete) terminalCleanupRef.current.complete();
    if (terminalCleanupRef.current.error) terminalCleanupRef.current.error();
    
    // Execute command first to get commandId
    let commandId = null;
    try {
      const response = await window.electronAPI.globusExecuteCommand(args, useJsonFormat);
      if (response && response[0]) {
        commandId = response[1].commandId;
        setCurrentCommandId(commandId);
      } else {
        setIsExecuting(false);
        addOutputLine('error', response[1]?.message || 'Failed to start command');
        return;
      }
    } catch (error) {
      setIsExecuting(false);
      addOutputLine('error', `Error: ${error.message || 'Unknown error'}`);
      return;
    }
    
    // Set up output listeners with captured commandId
    const outputListener = window.electronAPI.globusSetupCommandOutput((data) => {
      if (data.commandId === commandId) {
        if (data.type === 'stdout') {
          addOutputLine('stdout', data.chunk);
        } else if (data.type === 'stderr') {
          addOutputLine('stderr', data.chunk);
        }
      }
    });
    
    const completeListener = window.electronAPI.globusSetupCommandComplete((data) => {
      if (data.commandId === commandId) {
        setIsExecuting(false);
        setCurrentCommandId(null);
        if (data.exitCode !== 0) {
          addOutputLine('error', `Command exited with code ${data.exitCode}`);
        }
        // Cleanup listeners
        if (terminalCleanupRef.current.output) terminalCleanupRef.current.output();
        if (terminalCleanupRef.current.complete) terminalCleanupRef.current.complete();
        if (terminalCleanupRef.current.error) terminalCleanupRef.current.error();
        terminalCleanupRef.current = { output: null, complete: null, error: null };
      }
    });
    
    const errorListener = window.electronAPI.globusSetupCommandError((data) => {
      if (data.commandId === commandId) {
        setIsExecuting(false);
        setCurrentCommandId(null);
        addOutputLine('error', `Error: ${data.error}`);
        // Cleanup listeners
        if (terminalCleanupRef.current.output) terminalCleanupRef.current.output();
        if (terminalCleanupRef.current.complete) terminalCleanupRef.current.complete();
        if (terminalCleanupRef.current.error) terminalCleanupRef.current.error();
        terminalCleanupRef.current = { output: null, complete: null, error: null };
      }
    });
    
    terminalCleanupRef.current = {
      output: outputListener,
      complete: completeListener,
      error: errorListener
    };
  }

  function handleClearOutput() {
    setOutputLines([]);
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExecuteCommand();
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage('Please select a file');
      return;
    }
    if (!sourceEndpoint) {
      setErrorMessage('Please enter a source endpoint (e.g., endpoint-id:/path/to/file). For local files, use Globus Connect Personal.');
      return;
    }
    if (!collectionPath) {
      setErrorMessage('Please enter a collection path');
      return;
    }
    if (!authStatus) {
      setErrorMessage('Please login first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Initiating transfer...');
    setErrorMessage('');

    // Setup progress listeners
    const progressListener = (event, progress) => {
      setUploadProgress(progress.progress || 0);
      setUploadStatus(`Status: ${progress.status || 'Transferring'} - ${Math.round(progress.progress || 0)}%`);
    };

    const completeListener = (event, rowIdx) => {
      setUploadProgress(100);
      setUploadStatus('Transfer completed successfully!');
      setIsUploading(false);
      if (cleanupRef.current.progress) cleanupRef.current.progress();
      if (cleanupRef.current.complete) cleanupRef.current.complete();
      if (cleanupRef.current.error) cleanupRef.current.error();
      cleanupRef.current = { progress: null, complete: null, error: null };
    };

    const errorListener = (event, error) => {
      setErrorMessage(error.error || 'Upload failed');
      setUploadStatus('Transfer failed');
      setIsUploading(false);
      if (cleanupRef.current.progress) cleanupRef.current.progress();
      if (cleanupRef.current.complete) cleanupRef.current.complete();
      if (cleanupRef.current.error) cleanupRef.current.error();
      cleanupRef.current = { progress: null, complete: null, error: null };
    };

    cleanupRef.current.progress = window.electronAPI.globusSetupUploadProgress(progressListener);
    cleanupRef.current.complete = window.electronAPI.globusSetupUploadComplete(completeListener);
    cleanupRef.current.error = window.electronAPI.globusSetupUploadError(errorListener);

    try {
      // Use the source endpoint provided by user
      // Format should be: endpoint-id:/path/to/file
      const sourcePath = sourceEndpoint;
      const fileSize = selectedFileInfo?.__reserved?.bytes ?? null;
      const response = window.electronAPI.globusUploadFileWithSize
        ? await window.electronAPI.globusUploadFileWithSize(sourcePath, collectionPath, selectedFile, 0, fileSize)
        : await window.electronAPI.globusUploadFile(sourcePath, collectionPath, selectedFile, 0);
      
      if (!response || !response[0]) {
        setErrorMessage(response[1]?.message || 'Failed to initiate transfer');
        setIsUploading(false);
      }
      // Progress will be updated via event listeners
    } catch (error) {
      setErrorMessage(error.message || 'Upload error');
      setIsUploading(false);
    }
  }

  return (
    <div className="__modal">
      <ModalHeader title={"Globus Test"} type={"globus_test"} />
      <div className={"__content"}>
        <div className={"__divider"} />
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>CLI Status</div>
            <div className={"__config-control-section-description"}>
              Check if globus-cli is available and ready to use.
            </div>
            <div style={{ marginBottom: '1em' }}>
              <div style={{ 
                padding: '0.5em', 
                backgroundColor: '#ffffff',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                color: '#000000'
              }}>
                <strong>Status:</strong> {cliStatus || 'Checking...'}
              </div>
              {!cliAvailable && (
                <div style={{ marginTop: '0.5em', color: '#000000' }}>
                  <p>Globus CLI is not available. For development:</p>
                  <ul>
                    <li>Add globus-cli to environment.yml</li>
                    <li>Run: conda env update -f environment.yml</li>
                  </ul>
                  <p>For production: Use a packaged build with globus-cli bundled.</p>
                </div>
              )}
              <Button 
                text="Refresh Status" 
                onClick={checkCliAvailable}
                disabled={isLoading}
                extra_class_name="_align-center"
                style={{ marginTop: '0.5em' }}
              />
            </div>

            <div className={"__divider"} />
            <GlobusAuthPanel
              mode="test"
              cliAvailable={cliAvailable}
              authStatus={authStatus}
              currentUser={currentUser}
              authCheckPending={isLoading && !authStatus && !loginPending}
              loginPending={loginPending}
              loginUrl={loginUrl}
              accessCode={accessCode}
              authorizationCodeInput={authorizationCodeInput}
              disableSslVerification={disableSslVerification}
              errorMessage={errorMessage}
              connectionWarning={connectionWarning}
              busy={isLoading || isUploading}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onCheckAuth={refreshAuthStatus}
              onSubmitCode={handleSubmitAuthorizationCode}
              onAuthorizationCodeInputChange={setAuthorizationCodeInput}
              onToggleSsl={async (newValue) => {
                await window.electronAPI.globusSetSslVerification(newValue);
                dispatch({ type: globus_actions.TOGGLE_SSL_VERIFICATION });
                refreshAuthStatus();
              }}
              verboseLogin={verboseLogin}
              enablePyiDebug={enablePyiDebug}
              showRawCliOutput={showRawCliOutput}
              lastLoginDebug={lastLoginDebug}
              onToggleVerboseLogin={() => setVerboseLogin(!verboseLogin)}
              onToggleEnablePyiDebug={() => setEnablePyiDebug(!enablePyiDebug)}
              onToggleShowRawCliOutput={() => setShowRawCliOutput(!showRawCliOutput)}
            />

            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>File Selection</div>
            <div className={"__config-control-section-description"}>
              Select a file to upload to Globus. You'll need a source endpoint (e.g., from Globus Connect Personal).
            </div>
            <div style={{ marginBottom: '1em' }}>
              <Button 
                text="Select File" 
                onClick={handleSelectFile}
                disabled={isLoading || isUploading}
                extra_class_name="_align-center"
              />
              {selectedFile && (
                <div style={{ 
                  marginTop: '0.5em', 
                  padding: '0.5em',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cccccc',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                  color: '#000000'
                }}>
                  <strong>Selected:</strong> {selectedFile}
                </div>
              )}
              <div style={{ marginTop: '0.5em' }}>
                <InputText 
                  label="Source Endpoint (e.g., endpoint-id:/path/to/file)" 
                  value={sourceEndpoint} 
                  onChange={(new_value) => setSourceEndpoint(new_value)}
                  disabled={isLoading || isUploading}
                  placeholder="endpoint-id:/path/to/file"
                />
                <p style={{ fontSize: '0.9em', marginTop: '0.5em', color: '#333333' }}>
                  For local files, you need Globus Connect Personal installed to create a local endpoint.
                  Format: endpoint-id:/full/path/to/file
                </p>
              </div>
            </div>

            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>Collection Path</div>
            <div className={"__config-control-section-description"}>
              Enter the destination collection path (format: collectionname#/path/to/folder)
            </div>
            <div style={{ marginBottom: '1em' }}>
              <InputText 
                label="Collection Path" 
                value={collectionPath} 
                onChange={(new_value) => setCollectionPath(new_value)}
                disabled={isLoading || isUploading}
                placeholder="collectionname#/path/to/folder"
              />
              <Button 
                text="Validate Path" 
                onClick={handleValidatePath}
                disabled={isLoading || !collectionPath || isUploading}
                extra_class_name="_align-center"
                style={{ marginTop: '0.5em' }}
              />
            </div>

            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>Upload</div>
            <div style={{ marginBottom: '1em' }}>
              <Button 
                text={isUploading ? "Uploading..." : "Upload File"} 
                onClick={handleUpload}
                disabled={isLoading || !selectedFile || !sourceEndpoint || !collectionPath || !authStatus || isUploading || !cliAvailable}
                extra_class_name="_align-center"
              />
              
              {isUploading && (
                <div style={{ marginTop: '1em' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '20px', 
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #999999'
                  }}>
                    <div style={{ 
                      width: `${uploadProgress}%`, 
                      height: '100%', 
                      backgroundColor: '#666666',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ marginTop: '0.5em', textAlign: 'center', color: '#000000' }}>
                    {uploadStatus || `${Math.round(uploadProgress)}%`}
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div style={{ 
                marginTop: '1em',
                padding: '0.5em',
                backgroundColor: '#f5f5f5',
                border: '1px solid #333333',
                borderRadius: '4px',
                color: '#000000'
              }}>
                <strong>{errorMessage.includes('Error:') ? '' : 'Message: '}</strong>{errorMessage}
              </div>
            )}
            {connectionWarning && (
              <div style={{ 
                marginTop: '0.5em',
                padding: '0.5em',
                backgroundColor: '#fff8e1',
                border: '1px solid #ff9900',
                borderRadius: '4px',
                color: '#000000'
              }}>
                <strong>Note:</strong> Connection warning detected, but authentication URL was retrieved. You can still proceed with authentication.
              </div>
            )}

            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>Terminal Mode</div>
            <div className={"__config-control-section-description"}>
              Execute globus CLI commands directly and see output in real-time. Enter commands without the "globus" prefix (e.g., "endpoint search pitt#dtn").
              <br />
              <span style={{ fontSize: '0.9em', fontStyle: 'italic', color: '#666' }}>
                Note: SSL verification setting from the Authentication section above also applies to terminal commands.
              </span>
            </div>
            <div style={{ marginBottom: '1em' }}>
              <div style={{ marginBottom: '0.5em' }}>
                <Checkbox 
                  label={"Use JSON Format"} 
                  checked={useJsonFormat} 
                  onClick={() => setUseJsonFormat(!useJsonFormat)} 
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '0.5em', 
                marginBottom: '0.5em',
                alignItems: 'center'
              }}>
                <div style={{ 
                  padding: '0.25em 0.5em',
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  borderRadius: '2px',
                  whiteSpace: 'nowrap'
                }}>
                  $ globus
                </div>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isExecuting || !cliAvailable}
                  placeholder="endpoint search pitt#dtn"
                  style={{
                    flex: 1,
                    padding: '0.5em',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    border: '1px solid #cccccc',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    color: '#000000'
                  }}
                />
                <Button 
                  text={isExecuting ? "Executing..." : "Execute"} 
                  onClick={handleExecuteCommand}
                  disabled={isExecuting || !commandInput.trim() || !cliAvailable}
                  extra_class_name="_align-center"
                />
              </div>
              
              <div style={{ 
                marginTop: '0.5em',
                marginBottom: '0.5em'
              }}>
                <Button 
                  text="Clear Output" 
                  onClick={handleClearOutput}
                  disabled={outputLines.length === 0}
                  extra_class_name="_align-center"
                />
              </div>
              
              <div style={{ 
                backgroundColor: '#1e1e1e',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '0.75em',
                minHeight: '200px',
                maxHeight: '400px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.85em',
                color: '#d4d4d4',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }} ref={terminalOutputRef}>
                {outputLines.length === 0 ? (
                  <div style={{ color: '#888888', fontStyle: 'italic' }}>
                    No output yet. Enter a command above to get started.
                  </div>
                ) : (
                  outputLines.map((line, index) => {
                    let lineColor = '#d4d4d4';
                    if (line.type === 'command') {
                      lineColor = '#4ec9b0'; // Cyan for commands
                    } else if (line.type === 'stderr') {
                      lineColor = '#f48771'; // Orange/red for stderr
                    } else if (line.type === 'error') {
                      lineColor = '#f48771'; // Red for errors
                    }
                    
                    return (
                      <div 
                        key={index}
                        style={{ 
                          color: lineColor,
                          marginBottom: line.type === 'command' ? '0.25em' : '0',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {line.content}
                      </div>
                    );
                  })
                )}
                {isExecuting && (
                  <div style={{ color: '#888888' }}>
                    ▋
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalGlobusTest;
