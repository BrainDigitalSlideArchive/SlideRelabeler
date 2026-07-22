import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as dsa_actions from '../../actions/dsa';
import * as modal_actions from '../../actions/modal';
import ModalHeader from './ModalHeader';
import Button from '../../components/controls/button/Button';

import '../../components/upload/folder-picker.scss';

function unwrapList(resp) {
  if (!resp || !resp[0]) {
    return { ok: false, error: resp?.[1]?.message || 'Request failed', items: [] };
  }
  const data = resp[1];
  const items = Array.isArray(data) ? data : [];
  return { ok: true, items, error: null };
}

function TreeRow({
  label,
  depth,
  expandable,
  expanded,
  selected,
  loading,
  onToggle,
  onSelect,
}) {
  return (
    <div
      className={`folder-picker__row${selected ? ' _selected' : ''}`}
      style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
    >
      {expandable ? (
        <button
          type="button"
          className="folder-picker__twist"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={onToggle}
        >
          {loading ? '…' : expanded ? '▾' : '▸'}
        </button>
      ) : (
        <span className="folder-picker__twist-spacer" />
      )}
      <button
        type="button"
        className="folder-picker__label"
        onClick={onSelect}
      >
        <i className="fi fi-rr-folder" aria-hidden="true" />
        <span>{label}</span>
      </button>
    </div>
  );
}

function FolderBranch({ folder, depth, selectedId, onSelectFolder }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState(null);

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (children !== null) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await electronAPI.dsaListFolders(folder._id, 'folder');
      const { ok, items, error: err } = unwrapList(resp);
      if (!ok) {
        setError(err);
        setChildren([]);
      } else {
        setChildren(items);
      }
    } catch (e) {
      setError(e?.message || String(e));
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="folder-picker__branch">
      <TreeRow
        label={folder.name || folder._id}
        depth={depth}
        expandable
        expanded={expanded}
        selected={selectedId === folder._id}
        loading={loading}
        onToggle={toggle}
        onSelect={() => onSelectFolder(folder)}
      />
      {expanded ? (
        <div className="folder-picker__children">
          {error ? (
            <div className="folder-picker__muted" style={{ paddingLeft: `${0.5 + (depth + 1) * 1.1}rem` }}>
              {error}
            </div>
          ) : null}
          {(children || []).map((child) => (
            <FolderBranch
              key={child._id}
              folder={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelectFolder={onSelectFolder}
            />
          ))}
          {!loading && children && children.length === 0 && !error ? (
            <div className="folder-picker__muted" style={{ paddingLeft: `${0.5 + (depth + 1) * 1.1}rem` }}>
              No subfolders
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CollectionBranch({ collection, depth, selectedId, onSelectFolder }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState(null);

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (children !== null) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await electronAPI.dsaListFolders(collection._id, 'collection');
      const { ok, items, error: err } = unwrapList(resp);
      if (!ok) {
        setError(err);
        setChildren([]);
      } else {
        setChildren(items);
      }
    } catch (e) {
      setError(e?.message || String(e));
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="folder-picker__branch">
      <TreeRow
        label={collection.name || collection._id}
        depth={depth}
        expandable
        expanded={expanded}
        selected={false}
        loading={loading}
        onToggle={toggle}
        onSelect={toggle}
      />
      {expanded ? (
        <div className="folder-picker__children">
          {error ? (
            <div className="folder-picker__muted" style={{ paddingLeft: `${0.5 + (depth + 1) * 1.1}rem` }}>
              {error}
            </div>
          ) : null}
          {(children || []).map((child) => (
            <FolderBranch
              key={child._id}
              folder={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelectFolder={onSelectFolder}
            />
          ))}
          {!loading && children && children.length === 0 && !error ? (
            <div className="folder-picker__muted" style={{ paddingLeft: `${0.5 + (depth + 1) * 1.1}rem` }}>
              No folders
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function ModalDsaFolderPicker() {
  const dispatch = useDispatch();
  const currentFolderId = useSelector((state) => state.dsa.folder_id);
  const [tab, setTab] = useState('collections');
  const [selected, setSelected] = useState(null);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [rootError, setRootError] = useState(null);
  const [collections, setCollections] = useState([]);
  const [userFolders, setUserFolders] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingRoot(true);
      setRootError(null);
      try {
        if (tab === 'collections') {
          const resp = await electronAPI.dsaListCollections();
          if (cancelled) return;
          const { ok, items, error } = unwrapList(resp);
          if (!ok) setRootError(error);
          setCollections(ok ? items : []);
        } else {
          const userResp = await electronAPI.dsaGetCurrentUser();
          if (cancelled) return;
          if (!userResp?.[0] || !userResp[1]?._id) {
            setRootError(userResp?.[1]?.message || 'Could not load current user');
            setUserFolders([]);
            return;
          }
          const foldersResp = await electronAPI.dsaListFolders(userResp[1]._id, 'user');
          if (cancelled) return;
          const { ok, items, error } = unwrapList(foldersResp);
          if (!ok) setRootError(error);
          setUserFolders(ok ? items : []);
        }
      } catch (e) {
        if (!cancelled) setRootError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoadingRoot(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tab]);

  useEffect(() => {
    if (currentFolderId) {
      setSelected({ _id: currentFolderId, name: null });
    }
  }, [currentFolderId]);

  function confirm() {
    if (!selected?._id) return;
    dispatch({ type: dsa_actions.SET_DSA_FOLDER_ID, payload: selected._id });
    if (selected.name) {
      dispatch({ type: dsa_actions.SET_DSA_FOLDER_PATH, payload: selected.name });
    }
    dispatch({ type: modal_actions.CLOSE_MODAL });
  }

  return (
    <div className="__modal">
      <ModalHeader title="Choose DSA folder" type="dsaFolderPicker" />
      <div className="__content __content--config">
        <div className="config-panel">
          <div className="config-panel__body">
            <p className="folder-picker__intro">
              Select the Girder folder where de-identified slides will be uploaded.
            </p>
            <div className="folder-picker__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={`folder-picker__tab${tab === 'collections' ? ' _active' : ''}`}
                aria-selected={tab === 'collections'}
                onClick={() => setTab('collections')}
              >
                Collections
              </button>
              <button
                type="button"
                role="tab"
                className={`folder-picker__tab${tab === 'user' ? ' _active' : ''}`}
                aria-selected={tab === 'user'}
                onClick={() => setTab('user')}
              >
                My folders
              </button>
            </div>
            <div className="folder-picker__panel">
              {loadingRoot ? (
                <div className="folder-picker__muted">Loading…</div>
              ) : null}
              {rootError ? (
                <div className="folder-picker__error">{rootError}</div>
              ) : null}
              {!loadingRoot && tab === 'collections' ? (
                collections.length === 0 && !rootError ? (
                  <div className="folder-picker__muted">No collections found.</div>
                ) : (
                  collections.map((c) => (
                    <CollectionBranch
                      key={c._id}
                      collection={c}
                      depth={0}
                      selectedId={selected?._id}
                      onSelectFolder={setSelected}
                    />
                  ))
                )
              ) : null}
              {!loadingRoot && tab === 'user' ? (
                userFolders.length === 0 && !rootError ? (
                  <div className="folder-picker__muted">No folders under your user home.</div>
                ) : (
                  userFolders.map((f) => (
                    <FolderBranch
                      key={f._id}
                      folder={f}
                      depth={0}
                      selectedId={selected?._id}
                      onSelectFolder={setSelected}
                    />
                  ))
                )
              ) : null}
            </div>
            {selected?._id ? (
              <p className="folder-picker__selection">
                Selected: <strong>{selected.name || selected._id}</strong>
              </p>
            ) : (
              <p className="folder-picker__selection">Select a folder to continue.</p>
            )}
            <div className="folder-picker__actions">
              <Button
                variant="onLight"
                text="Cancel"
                onClick={() => dispatch({ type: modal_actions.CLOSE_MODAL })}
              />
              <Button
                variant="onLight"
                text="Use this folder"
                disabled={!selected?._id}
                onClick={confirm}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="__footer" />
    </div>
  );
}
