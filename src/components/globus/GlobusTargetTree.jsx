import React, { useState, useEffect, useCallback, useRef } from 'react';

import {
  normalizeGlobusCollectionPath as normalizeEndpointPath,
} from '../../helpers/globus_helpers';

import './GlobusTargetTree.scss';

function joinPath(base, name) {
  const b = (base || '').replace(/\/+$/, '');
  return b ? b + '/' + name : name;
}

/** Stable key for compare (preserves root as uuid:/) */
function globusPathKey(p) {
  if (!p || !p.includes(':')) return (p || '').trim();
  const i = p.indexOf(':');
  const ep = p.slice(0, i).trim();
  let tail = p.slice(i + 1).trim() || '/';
  if (!tail.startsWith('/')) tail = '/' + tail;
  tail = tail.replace(/\/+$/, '') || '/';
  return `${ep}:${tail}`;
}

function formatErrorMessage(message) {
  const text = (message || '').toString();
  if (!text) return '';
  return text
    .split(/\r?\n/)
    .filter((line) => line && !/\[PYI-\d+:(DEBUG|INFO|WARN|ERROR)\]/.test(line) && !/^(LOADER:|DYLIB:)/.test(line.trim()))
    .join('\n');
}

function buildFormattedError(message) {
  const details = formatErrorMessage(message).trim();
  if (!details) {
    return null;
  }

  let summary = '';
  if (/not a valid uuid/i.test(details)) {
    summary = 'Pick an endpoint from search results and select a UUID before browsing.';
  } else if (/"code"\s*:\s*"Conflict"/i.test(details) || /\bConflict\b/i.test(details)) {
    summary = 'Endpoint/path access conflict. Verify endpoint permissions and selected root path.';
  } else {
    const firstMeaningful = details
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => !!line);
    summary = firstMeaningful || 'Unable to list endpoint directory.';
  }

  return { summary, details };
}

function pathsMatch(a, b) {
  if (!a || !b) return false;
  return globusPathKey(a) === globusPathKey(b);
}

function highlightAllowedForUse(highlighted, rootNormalized) {
  if (!highlighted || !rootNormalized) return false;
  const hKey = globusPathKey(highlighted);
  const rKey = globusPathKey(rootNormalized);
  const hEp = highlighted.split(':')[0]?.trim();
  const rEp = rootNormalized.split(':')[0]?.trim();
  if (!hEp || hEp !== rEp) return false;
  if (hKey === rKey) return true;
  const ri = rKey.indexOf(':');
  const hi = hKey.indexOf(':');
  if (ri < 0 || hi < 0) return false;
  const rt = rKey.slice(ri + 1);
  const ht = hKey.slice(hi + 1);
  if (rt === '/') return ht === '/' || (ht.length > 1 && ht.startsWith('/'));
  return ht === rt || ht.startsWith(`${rt}/`);
}

function FolderIcon() {
  return (
    <svg className="GlobusTargetTree__folderIcon" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14.5 5H8.7L7.3 3.3A1 1 0 0 0 6.6 3H1.5Z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="GlobusTargetTree__refreshIcon" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.08a6 6 0 1 1-1.86-6.22L13 11h7V4l-2.35 2.35z"
      />
    </svg>
  );
}

function GlobusTargetTree(props) {
  const {
    rootPath,
    selectedPath,
    onSetUploadTarget,
    disabled,
    disabledReason,
    listDirectoryApi,
    refreshNonce = 0,
    onRetryListing,
    suppressRootListError = false,
    showRootFailureRetryHint = false,
    onRootLoadResult,
  } = props;

  const [loadingPath, setLoadingPath] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showLoadErrorDetails, setShowLoadErrorDetails] = useState(false);
  const suppressRootRef = useRef(suppressRootListError);
  const rootPathRef = useRef(rootPath);
  suppressRootRef.current = !!suppressRootListError;
  rootPathRef.current = rootPath || '';
  const [expanded, setExpanded] = useState(() => new Set());
  const [childrenByPath, setChildrenByPath] = useState({});
  const api = listDirectoryApi || (typeof window !== 'undefined' && window.electronAPI?.globusListDirectory);

  const fetchList = useCallback(async (path) => {
    if (!api) return null;
    let pathWithSlash = normalizeEndpointPath(path);
    if (!pathWithSlash) {
      setLoadError('Select a valid endpoint UUID first.');
      return null;
    }
    setLoadingPath(pathWithSlash);
    setLoadError(null);
    try {
      const result = await api(pathWithSlash);
      if (result && result[0] && result[1]?.data) {
        return result[1].data;
      }
      const msg = result && result[1]?.message ? result[1].message : 'List failed';
      const normRoot = normalizeEndpointPath(rootPathRef.current);
      const isRootFetch = !!normRoot && pathWithSlash === normRoot;
      if (!isRootFetch || !suppressRootRef.current) {
        setLoadError(msg);
      } else {
        setLoadError(null);
      }
      setShowLoadErrorDetails(false);
      return null;
    } finally {
      setLoadingPath(null);
    }
  }, [api]);

  const rootKey = normalizeEndpointPath(rootPath);

  useEffect(() => {
    if (!rootPath || disabled || !api) return;
    const root = normalizeEndpointPath(rootPath);
    setExpanded(new Set());
    setLoadError(null);
    setChildrenByPath({});
    if (!root) return;
    fetchList(root).then((data) => {
      if (data != null) setChildrenByPath((p) => ({ ...p, [root]: data }));
      if (typeof onRootLoadResult === 'function') {
        onRootLoadResult(data != null);
      }
    });
  }, [rootPath, disabled, api, fetchList, refreshNonce, onRootLoadResult]);

  const loadChildren = useCallback(async (path) => {
    const pathWithSlash = normalizeEndpointPath(path);
    if (!pathWithSlash) return;
    if (childrenByPath[pathWithSlash]) return;
    const data = await fetchList(pathWithSlash);
    if (data != null) setChildrenByPath((p) => ({ ...p, [pathWithSlash]: data }));
  }, [childrenByPath, fetchList]);

  const toggleExpand = useCallback((pathWithSlash) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pathWithSlash)) next.delete(pathWithSlash);
      else next.add(pathWithSlash);
      return next;
    });
    loadChildren(pathWithSlash);
  }, [loadChildren]);

  const rootChildren = rootKey ? childrenByPath[rootKey] : null;
  const isLoadingRoot = loadingPath === rootKey;
  const formattedLoadError = buildFormattedError(loadError);
  const canRetry = !!(rootKey && api && !disabled && onRetryListing);

  return (
    <div className="GlobusTargetTree">
      {!rootKey && !loadingPath && (
        <div className="GlobusTargetTree__muted">
          {disabled && disabledReason === 'auth'
            ? 'Log in to Globus in the Authentication section above before you can browse folders.'
            : 'Select a destination endpoint above (Search or paste a UUID), then browse folders here.'}
        </div>
      )}
      {rootKey && (
        <div className="GlobusTargetTree__panel">
          <div className="GlobusTargetTree__panelHeader">
            <div className="GlobusTargetTree__panelHeaderTitle" aria-hidden>
              Browse files
            </div>
            {canRetry && (
              <button
                type="button"
                className="GlobusTargetTree__refreshBtn"
                onClick={onRetryListing}
                title="Refresh"
                aria-label="Refresh directory listing"
              >
                <RefreshIcon />
                <span className="GlobusTargetTree__refreshBtnLabel">Refresh</span>
              </button>
            )}
          </div>
          <div className="GlobusTargetTree__panelScroll">
            {(formattedLoadError || showRootFailureRetryHint) && (
              <div className="GlobusTargetTree__panelTop">
                {formattedLoadError && (
                  <div className="GlobusTargetTree__alert GlobusTargetTree__alert--warn">
                    <div className="GlobusTargetTree__alertSummary">{formattedLoadError.summary}</div>
                    <button
                      type="button"
                      className="GlobusTargetTree__alertToggle GlobusTargetTree__alertToggle--warn"
                      onClick={() => setShowLoadErrorDetails((v) => !v)}
                    >
                      {showLoadErrorDetails ? 'Hide details' : 'Show details'}
                    </button>
                    {showLoadErrorDetails && (
                      <div className="GlobusTargetTree__alertDetails">
                        {formattedLoadError.details}
                      </div>
                    )}
                  </div>
                )}
                {(formattedLoadError || showRootFailureRetryHint) && (
                  <p className="GlobusTargetTree__retryHint">
                    If you just finished logging in or approved access in Globus, click Refresh.
                  </p>
                )}
              </div>
            )}

            {isLoadingRoot && <div className="GlobusTargetTree__muted">Loading…</div>}

            {!isLoadingRoot && rootChildren && rootChildren.length === 0 && (
              <div className="GlobusTargetTree__muted">No items</div>
            )}

            {!isLoadingRoot && rootChildren && rootChildren.length > 0 && (
              <ul className="GlobusTargetTree__list" role="tree">
                {rootChildren.map((item) => (
                  <TreeNode
                    key={item.name}
                    depth={0}
                    item={item}
                    parentPath={rootKey}
                    selectedPath={selectedPath}
                    expanded={expanded}
                    childrenByPath={childrenByPath}
                    loadingPath={loadingPath}
                    onToggleExpand={toggleExpand}
                    disabled={disabled}
                    rootNormalized={rootKey}
                    onSetUploadTarget={onSetUploadTarget}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNode({
  depth,
  item,
  parentPath,
  selectedPath,
  expanded,
  childrenByPath,
  loadingPath,
  onToggleExpand,
  disabled,
  rootNormalized,
  onSetUploadTarget,
}) {
  const isDir = item.type === 'directory';
  const fullPathWithSlash = joinPath(parentPath, item.name) + (isDir ? '/' : '');
  const fullPathNoSlash = fullPathWithSlash.replace(/\/$/, '');
  const isExpanded = expanded.has(fullPathWithSlash);
  const isCommitted = isDir && pathsMatch(selectedPath, fullPathNoSlash);
  const children = childrenByPath[fullPathWithSlash];
  const isLoading = loadingPath === fullPathWithSlash;

  const handleExpand = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!isDir || disabled) return;
    onToggleExpand(fullPathWithSlash);
  };

  const handleLabelClick = handleExpand;

  const handleLabelKeyDown = (e) => {
    if (!isDir || disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleExpand(e);
    }
  };

  const handleSetUploadTarget = (e) => {
    e.stopPropagation();
    if (!isDir || disabled || !onSetUploadTarget) return;
    if (!highlightAllowedForUse(fullPathNoSlash, rootNormalized)) return;
    const canonical = normalizeEndpointPath(fullPathWithSlash);
    if (canonical) onSetUploadTarget(canonical);
  };

  const handleClearUploadTarget = (e) => {
    e.stopPropagation();
    if (disabled || !onSetUploadTarget) return;
    const canonicalRoot = normalizeEndpointPath(rootNormalized);
    if (canonicalRoot) onSetUploadTarget(canonicalRoot);
  };

  const rowClass = [
    'GlobusTargetTree__row',
    isDir && 'GlobusTargetTree__row--dir',
    isCommitted && 'GlobusTargetTree__row--committed',
    disabled && 'GlobusTargetTree__row--disabled',
  ].filter(Boolean).join(' ');

  return (
    <li className="GlobusTargetTree__node" role="none">
      <div className={rowClass} style={{ '--tree-depth': depth }}>
        <div className="GlobusTargetTree__rowMain">
          {isDir ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleExpand}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleExpand(e);
                }
              }}
              className="GlobusTargetTree__caret"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className="GlobusTargetTree__caret GlobusTargetTree__caret--placeholder" aria-hidden />
          )}
          {isDir ? (
            <div
              className="GlobusTargetTree__rowLabel"
              tabIndex={disabled ? undefined : 0}
              role="treeitem"
              onClick={handleLabelClick}
              onKeyDown={handleLabelKeyDown}
            >
              <FolderIcon />
              <span className="GlobusTargetTree__name GlobusTargetTree__name--dir">
                {item.name}/
              </span>
              {!isCommitted && onSetUploadTarget && !disabled && (
                <button
                  type="button"
                  className="GlobusTargetTree__uploadHereBtn"
                  onClick={handleSetUploadTarget}
                >
                  Upload here
                </button>
              )}
              {isCommitted && (
                <span className="GlobusTargetTree__currentTargetPill">
                  <span className="GlobusTargetTree__currentTargetText">Current upload target</span>
                  <span className="GlobusTargetTree__currentTargetDivider" aria-hidden>|</span>
                  <button
                    type="button"
                    className="GlobusTargetTree__currentTargetClear"
                    aria-label="Clear current upload target (reset to root)"
                    title="Clear current upload target"
                    onClick={handleClearUploadTarget}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          ) : (
            <span className="GlobusTargetTree__name">{item.name}</span>
          )}
        </div>
      </div>
      {isDir && isExpanded && (
        <ul className="GlobusTargetTree__nestedList" role="group">
          {isLoading && <li className="GlobusTargetTree__muted">Loading…</li>}
          {children && children.map((child) => (
            <TreeNode
              key={child.name}
              depth={depth + 1}
              item={child}
              parentPath={fullPathWithSlash}
              selectedPath={selectedPath}
              expanded={expanded}
              childrenByPath={childrenByPath}
              loadingPath={loadingPath}
              onToggleExpand={onToggleExpand}
              disabled={disabled}
              rootNormalized={rootNormalized}
              onSetUploadTarget={onSetUploadTarget}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default GlobusTargetTree;
