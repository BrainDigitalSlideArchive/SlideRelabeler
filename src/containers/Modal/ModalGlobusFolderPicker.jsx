import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import * as globus_actions from '../../actions/globus';
import * as modal_actions from '../../actions/modal';
import Button from '../../components/controls/button/Button';
import GlobusTargetTree from '../../components/globus/GlobusTargetTree';
import GlobusUploadPathEditPopover from '../../components/globus/GlobusUploadPathEditPopover';
import {
  displayPathWithoutEndpointUuid,
  isGlobusEndpointRootPath,
} from '../../helpers/globus_helpers';
import { openGlobusLogin } from '../../helpers/globus_login_modal.js';
import ModalHeader from './ModalHeader';

import '../../components/upload/folder-picker.scss';
import './ModalNetwork.scss';

export default function ModalGlobusFolderPicker() {
  const dispatch = useDispatch();
  const store = useStore();
  const {
    api_auth,
    target_endpoint_id,
    target_endpoint_label,
    collection_path,
    globus_collection_exists,
    globus_directory_refresh_nonce,
  } = useSelector((state) => state.globus);

  const [draftPath, setDraftPath] = useState(collection_path || '');

  useEffect(() => {
    setDraftPath(collection_path || '');
  }, [collection_path]);

  const endpointId = String(target_endpoint_id || '').trim();
  const rootPath = endpointId ? `${endpointId}:/` : '';
  const pathDisplay = displayPathWithoutEndpointUuid(draftPath) || 'Root (/)';
  const canConfirm = Boolean(endpointId && String(draftPath || '').trim());

  function confirm() {
    if (!canConfirm) return;
    dispatch({
      type: globus_actions.SET_GLOBUS_COLLECTION_PATH,
      payload: draftPath,
    });
    dispatch({ type: modal_actions.CLOSE_MODAL });
  }

  return (
    <div className="__modal">
      <ModalHeader title="Choose Globus folder" type="globusFolderPicker" />
      <div className="__content __content--config">
        <div className="config-panel">
          <div className="config-panel__body">
            <p className="folder-picker__intro">
              Select the folder on{' '}
              <strong>{target_endpoint_label || endpointId || 'the destination endpoint'}</strong>{' '}
              where de-identified slides will be uploaded.
            </p>

            {!endpointId ? (
              <div className="folder-picker__error">
                No destination endpoint selected. Choose an endpoint first.
              </div>
            ) : (
              <>
                <div
                  className={
                    'globus-target-path__targetFolderBar' +
                    (globus_collection_exists === true
                      ? ' globus-target-path__targetFolderBar--ok'
                      : '') +
                    (globus_collection_exists === false
                      ? ' globus-target-path__targetFolderBar--bad'
                      : '')
                  }
                  role="status"
                  aria-live="polite"
                >
                  <span className="globus-target-path__targetFolderBar-label">
                    Upload target folder:
                  </span>
                  <span
                    className="globus-target-path__targetFolderBar-path"
                    title={draftPath || ''}
                  >
                    {pathDisplay}
                  </span>
                  <GlobusUploadPathEditPopover
                    targetEndpointId={endpointId}
                    collectionPath={draftPath || ''}
                    listDirectoryApi={window.electronAPI?.globusListDirectory}
                    disabled={!api_auth}
                    onApply={(normalizedPath) => setDraftPath(normalizedPath)}
                  />
                  {!isGlobusEndpointRootPath(draftPath, endpointId) ? (
                    <button
                      type="button"
                      className="globus-target-path__targetFolderBar-clear"
                      aria-label="Clear folder selection (reset to root)"
                      onClick={() => setDraftPath(`${endpointId}:/`)}
                    >
                      ×
                    </button>
                  ) : null}
                </div>

                <div className="folder-picker__panel" style={{ maxHeight: '26rem' }}>
                  {!api_auth ? (
                    <div className="folder-picker__muted">
                      <p style={{ margin: '0 0 0.45rem' }}>
                        Sign in to Globus before folder browsing works.
                      </p>
                      <Button
                        variant="onLight"
                        text="Sign in to Globus…"
                        onClick={() => openGlobusLogin(dispatch, store.getState)}
                      />
                    </div>
                  ) : (
                    <GlobusTargetTree
                      rootPath={rootPath}
                      selectedPath={draftPath || ''}
                      onSetUploadTarget={(path) => setDraftPath(path)}
                      disabled={!api_auth}
                      disabledReason={!api_auth ? 'auth' : undefined}
                      listDirectoryApi={window.electronAPI?.globusListDirectory}
                      refreshNonce={globus_directory_refresh_nonce}
                      suppressRootListError={!!api_auth}
                      onRetryListing={() => {
                        dispatch({ type: globus_actions.BUMP_GLOBUS_DIRECTORY_REFRESH });
                      }}
                    />
                  )}
                </div>
              </>
            )}

            {canConfirm ? (
              <p className="folder-picker__selection">
                Selected: <strong>{pathDisplay}</strong>
              </p>
            ) : (
              <p className="folder-picker__selection">
                {endpointId
                  ? 'Browse and use Upload here, or Edit a path to continue.'
                  : 'Select an endpoint before choosing a folder.'}
              </p>
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
                disabled={!canConfirm}
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
