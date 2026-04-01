import React, { useState, useEffect, useCallback } from 'react';

import './GlobusTargetTree.scss';

function joinPath(base, name) {
  const b = (base || '').replace(/\/+$/, '');
  return b ? b + '/' + name : name;
}

function normalizeEndpointPath(pathValue) {
  const raw = (pathValue || '').trim();
  if (!raw) return '';
  if (!raw.includes(':')) return '';

  const [endpointId, ...rest] = raw.split(':');
  const cleanEndpointId = (endpointId || '').trim();
  let endpointPath = rest.join(':').trim() || '/';
  if (!endpointPath.startsWith('/')) endpointPath = '/' + endpointPath;
  if (!endpointPath.endsWith('/')) endpointPath += '/';
  return `${cleanEndpointId}:${endpointPath}`;
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

function syncHighlightFromSelected(selectedPath, rootNormalized) {
  if (!selectedPath || !rootNormalized) return null;
  const selEp = selectedPath.split(':')[0]?.trim();
  const rootEp = rootNormalized.split(':')[0]?.trim();
  if (!selEp || selEp !== rootEp) return null;
  return globusPathKey(selectedPath);
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

function SavedIcon() {
  return (
    <svg className="GlobusTargetTree__savedIcon" width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 11.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

function GlobusTargetTree(props) {
  const {
    rootPath,
    selectedPath,
    onSelect,
    disabled,
    errorMessage,
    listDirectoryApi,
    refreshNonce = 0,
    onRetryListing
  } = props;

  const [loadingPath, setLoadingPath] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showExternalErrorDetails, setShowExternalErrorDetails] = useState(false);
  const [showLoadErrorDetails, setShowLoadErrorDetails] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [childrenByPath, setChildrenByPath] = useState({});
  const [highlightedPath, setHighlightedPath] = useState(null);
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
      setLoadError(msg);
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
    });
  }, [rootPath, disabled, api, fetchList, refreshNonce]);

  useEffect(() => {
    if (!rootPath || disabled || !api) {
      setHighlightedPath(null);
      return;
    }
    const root = normalizeEndpointPath(rootPath);
    if (!root) {
      setHighlightedPath(null);
      return;
    }
    setHighlightedPath(syncHighlightFromSelected(selectedPath, root));
  }, [rootPath, disabled, api, selectedPath, refreshNonce]);

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

  const onHighlightPath = useCallback((pathNoTrailing) => {
    setHighlightedPath(pathNoTrailing ? globusPathKey(pathNoTrailing) : null);
  }, []);

  const commitHighlight = useCallback(() => {
    if (!highlightedPath || !onSelect) return;
    if (!highlightAllowedForUse(highlightedPath, rootKey)) return;
    onSelect(highlightedPath);
  }, [highlightedPath, onSelect, rootKey]);

  const rootChildren = rootKey ? childrenByPath[rootKey] : null;
  const isLoadingRoot = loadingPath === rootKey;
  const formattedExternalError = buildFormattedError(errorMessage);
  const formattedLoadError = buildFormattedError(loadError);
  const canRetry = !!(rootKey && api && !disabled && onRetryListing);
  const canUseFolder =
    !!highlightedPath &&
    !disabled &&
    highlightAllowedForUse(highlightedPath, rootKey);
  const footerPathId = 'GlobusTargetTree-footer-path';

  return (
    <div className="GlobusTargetTree">
      {canRetry && (
        <div className="GlobusTargetTree__toolbar">
          <button
            type="button"
            className="GlobusTargetTree__retryBtn"
            onClick={onRetryListing}
          >
            Retry listing
          </button>
          {formattedLoadError && (
            <p className="GlobusTargetTree__retryHint">
              If you just finished logging in, click Retry listing.
            </p>
          )}
        </div>
      )}
      {formattedExternalError && (
        <div className="GlobusTargetTree__alert GlobusTargetTree__alert--danger">
          <div className="GlobusTargetTree__alertSummary">{formattedExternalError.summary}</div>
          <button
            type="button"
            className="GlobusTargetTree__alertToggle GlobusTargetTree__alertToggle--danger"
            onClick={() => setShowExternalErrorDetails((v) => !v)}
          >
            {showExternalErrorDetails ? 'Hide details' : 'Show details'}
          </button>
          {showExternalErrorDetails && (
            <div className="GlobusTargetTree__alertDetails">
              {formattedExternalError.details}
            </div>
          )}
        </div>
      )}
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
      {!rootKey && !loadingPath && (
        <div className="GlobusTargetTree__muted">Enter a target collection above to browse.</div>
      )}
      {isLoadingRoot && (
        <div className="GlobusTargetTree__muted">Loading…</div>
      )}
      {rootKey && rootChildren && rootChildren.length === 0 && !isLoadingRoot && (
        <div className="GlobusTargetTree__muted">No items</div>
      )}
      {rootChildren && rootChildren.length > 0 && (
        <div className="GlobusTargetTree__panel">
          <div className="GlobusTargetTree__panelHeader" aria-hidden>
            Name
          </div>
          <div className="GlobusTargetTree__panelScroll">
            <ul className="GlobusTargetTree__list" role="tree">
              {rootChildren.map((item) => (
                <TreeNode
                  key={item.name}
                  depth={0}
                  item={item}
                  parentPath={rootKey}
                  selectedPath={selectedPath}
                  highlightedPath={highlightedPath}
                  expanded={expanded}
                  childrenByPath={childrenByPath}
                  loadingPath={loadingPath}
                  onToggleExpand={toggleExpand}
                  onHighlightPath={onHighlightPath}
                  disabled={disabled}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
      {rootKey && rootChildren && rootChildren.length > 0 && (
        <div className="GlobusTargetTree__footer">
          <div className="GlobusTargetTree__footerPathRow">
            <span className="GlobusTargetTree__footerLabel">Folder:</span>
            <span
              id={footerPathId}
              className="GlobusTargetTree__footerPath"
              title={highlightedPath || ''}
            >
              {highlightedPath || '— click a folder in the list above —'}
            </span>
          </div>
          <button
            type="button"
            className="GlobusTargetTree__useBtn"
            disabled={!canUseFolder}
            onClick={commitHighlight}
            aria-describedby={footerPathId}
          >
            Use selected folder
          </button>
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
  highlightedPath,
  expanded,
  childrenByPath,
  loadingPath,
  onToggleExpand,
  onHighlightPath,
  disabled
}) {
  const isDir = item.type === 'directory';
  const fullPathWithSlash = joinPath(parentPath, item.name) + (isDir ? '/' : '');
  const fullPathNoSlash = fullPathWithSlash.replace(/\/$/, '');
  const isExpanded = expanded.has(fullPathWithSlash);
  const isHighlighted = isDir && pathsMatch(highlightedPath, fullPathNoSlash);
  const isCommitted = isDir && pathsMatch(selectedPath, fullPathNoSlash);
  const children = childrenByPath[fullPathWithSlash];
  const isLoading = loadingPath === fullPathWithSlash;

  const handleExpand = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!isDir || disabled) return;
    onToggleExpand(fullPathWithSlash);
  };

  const handleLabelClick = (e) => {
    e.stopPropagation();
    if (!isDir || disabled) return;
    onHighlightPath(fullPathNoSlash);
  };

  const handleLabelKeyDown = (e) => {
    if (!isDir || disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onHighlightPath(fullPathNoSlash);
    }
  };

  const rowClass = [
    'GlobusTargetTree__row',
    isDir && 'GlobusTargetTree__row--dir',
    isHighlighted && 'GlobusTargetTree__row--highlighted',
    isCommitted && 'GlobusTargetTree__row--committed',
    disabled && 'GlobusTargetTree__row--disabled'
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
              aria-selected={isHighlighted}
              onClick={handleLabelClick}
              onKeyDown={handleLabelKeyDown}
            >
              <FolderIcon />
              <span className="GlobusTargetTree__name GlobusTargetTree__name--dir">
                {item.name}/
              </span>
              {isCommitted && (
                <span className="GlobusTargetTree__savedBadge" title="Saved as target path">
                  <SavedIcon />
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
              highlightedPath={highlightedPath}
              expanded={expanded}
              childrenByPath={childrenByPath}
              loadingPath={loadingPath}
              onToggleExpand={onToggleExpand}
              onHighlightPath={onHighlightPath}
              disabled={disabled}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default GlobusTargetTree;