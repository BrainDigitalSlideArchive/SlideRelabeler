import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import * as config_actions from '../../actions/config';
import * as globus_actions from '../../actions/globus';
import * as modal_actions from '../../actions/modal';
import { scrollConfigSectionIntoView } from '../../components/config-v2/ConfigV2Nav';
import Button from '../../components/controls/button/Button';
import InputText from '../../components/controls/input/InputText';
import GlobusTargetTree from '../../components/globus/GlobusTargetTree';
import {
  GLOBUS_LS_FAILURE_KIND,
  interpretGlobusCliFailure,
} from '../../helpers/globus_error_interpretation.js';
import { isGlobusEndpointUuid } from '../../helpers/globus_helpers';
import { openGlobusLogin } from '../../helpers/globus_login_modal.js';
import ModalHeader from './ModalHeader';

import '../../components/upload/folder-picker.scss';
import './ModalNetwork.scss';

function formatSearchError(raw) {
  const interpreted = interpretGlobusCliFailure(raw);
  if (interpreted.kind === GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE) {
    return `${interpreted.userSummary} ${interpreted.userDetail}`.trim();
  }
  if (interpreted.userDetail) {
    return `${interpreted.userSummary} ${interpreted.userDetail}`.trim();
  }
  return interpreted.userSummary || String(raw || 'Endpoint search failed.');
}

export default function ModalGlobusEndpointPicker() {
  const dispatch = useDispatch();
  const store = useStore();
  const api_auth = useSelector((state) => state.globus.api_auth);
  const cliAvailable = useSelector((state) => state.globus.cli_available);
  const pickerMode = useSelector((state) => state.globus.endpoint_picker_mode) || 'session';
  const refreshNonce = useSelector((state) => state.globus.globus_directory_refresh_nonce);
  const isDurable = pickerMode === 'durable';
  const cliMissing = cliAvailable === false;

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [results, setResults] = useState([]);
  const [previewEndpoint, setPreviewEndpoint] = useState(null);
  const [previewRootListOk, setPreviewRootListOk] = useState(false);

  const closePreview = useCallback(() => {
    setPreviewEndpoint(null);
    setPreviewRootListOk(false);
  }, []);

  const closePicker = useCallback(() => {
    dispatch({ type: modal_actions.CLOSE_MODAL });
    if (isDurable) {
      requestAnimationFrame(() => {
        setTimeout(() => scrollConfigSectionIntoView('config-globus-upload'), 50);
      });
    }
  }, [dispatch, isDurable]);

  useEffect(() => {
    let cancelled = false;
    async function ensureCliStatus() {
      if (cliAvailable != null) return;
      try {
        const response = await window.electronAPI.globusCheckCliAvailable();
        if (cancelled) return;
        dispatch({
          type: globus_actions.CHECK_CLI_AVAILABLE,
          payload: !!(response && response[0]),
        });
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: globus_actions.CHECK_CLI_AVAILABLE, payload: false });
      }
    }
    ensureCliStatus();
    return () => {
      cancelled = true;
    };
  }, [cliAvailable, dispatch]);

  function commitEndpoint(id, label) {
    const endpointId = String(id || '').trim();
    if (!endpointId) return;
    const endpointLabel = String(label || endpointId).trim() || endpointId;

    if (isDurable) {
      dispatch({
        type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
        payload: {
          default_target_endpoint_id: endpointId,
          default_target_endpoint_label: endpointLabel,
        },
      });
    } else {
      dispatch({
        type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT,
        payload: { id: endpointId, label: endpointLabel },
      });
      dispatch({
        type: globus_actions.SET_GLOBUS_COLLECTION_PATH,
        payload: `${endpointId}:/`,
      });
    }
    closePicker();
  }

  async function findEndpoints() {
    const query = (searchQuery || '').trim();
    setSearchError(null);
    setResults([]);
    closePreview();
    if (cliMissing) {
      setSearchError(formatSearchError('spawn globus ENOENT'));
      return;
    }
    if (!query) {
      setSearchError('Enter an endpoint alias, display name, or UUID first.');
      return;
    }
    if (isGlobusEndpointUuid(query)) {
      setResults([{ id: query, display_name: query, owner: null }]);
      return;
    }

    setSearching(true);
    try {
      const response = await window.electronAPI.globusSearchEndpoints(query);
      if (!response || !response[0]) {
        setSearchError(formatSearchError(response?.[1]?.message || 'Endpoint search failed.'));
        return;
      }
      const data = Array.isArray(response?.[1]?.data) ? response[1].data : [];
      setResults(data);
      if (data.length === 0) {
        setSearchError('No endpoints found for this query.');
      }
    } catch (e) {
      setSearchError(formatSearchError(e));
    } finally {
      setSearching(false);
    }
  }

  function openPreview(endpoint) {
    const endpointId = endpoint?.id ? String(endpoint.id).trim() : '';
    if (!endpointId) return;
    const label = (endpoint?.display_name && String(endpoint.display_name).trim()) || endpointId;
    setPreviewEndpoint({ id: endpointId, label });
    setPreviewRootListOk(false);
  }

  function finishWithPath(canonicalPath) {
    if (!previewEndpoint?.id || !canonicalPath) return;
    if (isDurable) {
      dispatch({
        type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
        payload: {
          default_target_endpoint_id: previewEndpoint.id,
          default_target_endpoint_label: previewEndpoint.label || previewEndpoint.id,
        },
      });
      dispatch({
        type: globus_actions.SET_GLOBUS_COLLECTION_PATH,
        payload: canonicalPath,
      });
    } else {
      dispatch({
        type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT,
        payload: {
          id: previewEndpoint.id,
          label: previewEndpoint.label || previewEndpoint.id,
        },
      });
      dispatch({
        type: globus_actions.SET_GLOBUS_COLLECTION_PATH,
        payload: canonicalPath,
      });
    }
    closePicker();
  }

  const canSearch = !cliMissing && !searching && Boolean(String(searchQuery || '').trim());

  return (
    <div className="__modal">
      <ModalHeader
        title="Choose Globus endpoint"
        type="globusEndpointPicker"
        onClose={isDurable ? () => {
          requestAnimationFrame(() => {
            setTimeout(() => scrollConfigSectionIntoView('config-globus-upload'), 50);
          });
        } : undefined}
      />
      <div className="__content __content--config">
        <div className="config-panel">
          <div className="config-panel__body folder-picker--compact">
            <p className="folder-picker__intro">
              {isDurable
                ? 'Search for a Globus endpoint to save as the Configuration default destination.'
                : 'Search for a Globus endpoint to use for this session. Nothing is saved until you confirm.'}
            </p>

            {cliMissing ? (
              <div className="folder-picker__error" role="alert">
                Globus CLI is not available. Install Globus CLI (globus-cli) or use a packaged build,
                then try again.
              </div>
            ) : null}

            {!cliMissing && !api_auth ? (
              <div className="folder-picker__muted" style={{ padding: '0 0 0.5rem' }}>
                <p style={{ margin: '0 0 0.45rem' }}>
                  Sign in to Globus to browse folders after you pick an endpoint. You can still
                  search and select an endpoint UUID without signing in.
                </p>
                <Button
                  variant="onLight"
                  text="Sign in to Globus…"
                  onClick={() => openGlobusLogin(dispatch, store.getState)}
                />
              </div>
            ) : null}

            <div className="globus-target-path">
              <div className="globus-target-path__input-with-action">
                <InputText
                  omitLabel
                  compact
                  variant="onLight"
                  inputId="globus-endpoint-picker-search"
                  ariaLabel="Search for a destination endpoint"
                  value={searchQuery}
                  disabled={cliMissing}
                  onChange={setSearchQuery}
                  placeholder="Site name, alias, or endpoint UUID"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && canSearch) findEndpoints();
                  }}
                />
                <Button
                  variant="onLight"
                  text={searching ? 'Searching…' : 'Search'}
                  disabled={!canSearch}
                  onClick={findEndpoints}
                />
              </div>
              <p className="globus-target-path__field-hint">
                Type a site name (e.g. pitt#dtn) or paste a UUID, then click Search.
              </p>

              {searchError ? (
                <div className="folder-picker__error" role="alert">{searchError}</div>
              ) : null}

              {results.length > 0 ? (
                <div className="folder-picker__panel" style={{ marginTop: '0.65rem' }}>
                  <div className="globus-target-path__endpoint-list">
                    {results.map((endpoint) => (
                      <div key={endpoint.id} className="globus-target-path__endpoint-row">
                        <div className="globus-target-path__endpoint-row-main">
                          <strong>{endpoint.display_name || endpoint.id}</strong>
                          <div className="globus-target-path__endpoint-sub">
                            {endpoint.id}
                            {endpoint.owner ? ` - ${endpoint.owner}` : ''}
                          </div>
                        </div>
                        <Button
                          variant="onLight"
                          text="Test and view"
                          disabled={cliMissing}
                          onClick={() => openPreview(endpoint)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {previewEndpoint ? (
                <div
                  className="globus-endpoint-preview-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="globus-endpoint-picker-preview-title"
                >
                  <button
                    type="button"
                    className="globus-endpoint-preview-dialog__backdrop"
                    aria-label="Close preview"
                    onClick={closePreview}
                  />
                  <div className="globus-endpoint-preview-dialog__panel">
                    <h3
                      id="globus-endpoint-picker-preview-title"
                      className="globus-endpoint-preview-dialog__title"
                    >
                      {previewEndpoint.label || previewEndpoint.id}
                    </h3>
                    <p className="globus-endpoint-preview-dialog__uuid">{previewEndpoint.id}</p>
                    <p className="globus-endpoint-preview-dialog__hint">
                      Nothing is saved until <strong>Use this endpoint</strong> (root) or{' '}
                      <strong>Upload here</strong> on a folder below.
                    </p>
                    {!api_auth ? (
                      <p className="folder-picker__error">
                        Sign in to browse folders.{' '}
                        <button
                          type="button"
                          className="folder-picker__text-link"
                          onClick={() => openGlobusLogin(dispatch, store.getState)}
                        >
                          Sign in to Globus…
                        </button>{' '}
                        You can still use the endpoint root below if listing is unavailable.
                      </p>
                    ) : null}
                    <GlobusTargetTree
                      rootPath={`${previewEndpoint.id}:/`}
                      selectedPath=""
                      onSetUploadTarget={finishWithPath}
                      disabled={!api_auth}
                      disabledReason={!api_auth ? 'auth' : undefined}
                      listDirectoryApi={window.electronAPI?.globusListDirectory}
                      refreshNonce={refreshNonce}
                      suppressRootListError={false}
                      onRootLoadResult={setPreviewRootListOk}
                      onRetryListing={() => {
                        setPreviewRootListOk(false);
                        dispatch({ type: globus_actions.BUMP_GLOBUS_DIRECTORY_REFRESH });
                      }}
                    />
                    <div className="globus-endpoint-preview-dialog__actions">
                      <Button variant="onLight" text="Cancel" onClick={closePreview} />
                      <Button
                        variant="onLight"
                        text="Use this endpoint"
                        disabled={api_auth ? !previewRootListOk : false}
                        onClick={() =>
                          commitEndpoint(previewEndpoint.id, previewEndpoint.label)
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="folder-picker__actions folder-picker__actions--start">
              <Button variant="onLight" text="Cancel" onClick={closePicker} />
            </div>
          </div>
        </div>
      </div>
      <div className="__footer" />
    </div>
  );
}
