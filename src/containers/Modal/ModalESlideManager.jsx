import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import * as modal_actions from '../../actions/modal';

import ModalHeader from './ModalHeader';
import InputText from '../../components/controls/input/InputText';
import Button from '../../components/controls/button/Button';
import ESMSearchCriteriaGrid from '../../components/esm/ESMSearchCriteriaGrid';
import ESMStagingPanel from '../../components/esm/ESMStagingPanel';
import { getActiveProfile, getEsmConnectionConfig } from '../../helpers/esm_profile_helpers';

function ModalESlideManager() {
  const esmState = useSelector((state) => state.esm);
  const profile = getActiveProfile(esmState);
  const profiles = useSelector((state) => state.esm?.profiles) || [];
  const activeProfileId = useSelector((state) => state.esm?.activeProfileId);
  const {
    canonicalUrl,
    proxyUrl,
    requestBase,
  } = getEsmConnectionConfig(esmState);
  const username = useSelector((state) => state.esm.username);
  const rememberUsername = useSelector((state) => state.esm?.rememberUsername === true);
  const password = useSelector((state) => state.esm.password);
  const authenticated = useSelector((state) => state.esm.authenticated);
  const loading = useSelector((state) => state.esm.loading);
  const error = useSelector((state) => state.esm.error);
  const errorMessage = useSelector((state) => state.esm.errorMessage);
  const searchLoading = useSelector((state) => state.esm.searchLoading);
  const searchFeedback = useSelector((state) => state.esm.searchFeedback);
  const disable_changes = useSelector((state) => state.files.disable_changes);

  const dispatch = useDispatch();

  const handlePasswordKeyPress = (e) => {
    if (e.key === 'Enter' && username !== '' && password !== '' && !authenticated && !loading && !disable_changes) {
      dispatch({ type: esm_actions.ESM_LOGIN });
    }
  };

  const hasSearchResults = searchFeedback?.completed === true;

  const hasProfiles = profiles.length > 0;

  function openDataLoadingConfig() {
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'config' } });
  }

  return (
    <div className="__modal">
      <ModalHeader title={'eSlideManager'} type={'esm'} />
      <div className={'__content'}>
        <div className={'__divider'} />
        <div className={'__config-controls'}>
          <div className={'__config-control-section'}>
            <div className={'__config-control-section-title'}>Profile &amp; connection</div>
            <div className={'__config-control-section-description'}>
              Choose a saved profile, then log in with your credentials.
            </div>

            {hasProfiles ? (
              <div className="esm-modal-profile-picker config-filename-field">
                <label className="esm-modal-profile-picker__label" htmlFor="esm-active-profile">
                  Profile
                </label>
                <select
                  id="esm-active-profile"
                  className="esm-modal-profile-picker__select"
                  disabled={disable_changes}
                  value={activeProfileId ?? ''}
                  onChange={(e) => dispatch({
                    type: esm_actions.ESM_SET_ACTIVE_PROFILE_ID,
                    payload: e.target.value,
                  })}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.description?.trim() ? ` — ${p.description}` : ''}
                    </option>
                  ))}
                </select>
                <div className={'__dsa-auth-group'}>
                  <div className={'__dsa-auth-item'}>
                    <div className={'__dsa-auth-item-label'}>eSM server:</div>
                    <div className={'__dsa-auth-item-value'}>{canonicalUrl || '—'}</div>
                  </div>
                  {proxyUrl ? (
                    <div className={'__dsa-auth-item'}>
                      <div className={'__dsa-auth-item-label'}>Via proxy:</div>
                      <div className={'__dsa-auth-item-value'}>{proxyUrl}</div>
                    </div>
                  ) : null}
                  <div className={'__dsa-auth-item'}>
                    <div className={'__dsa-auth-item-label'}>Request base:</div>
                    <div className={'__dsa-auth-item-value'}>{requestBase || '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="esm-modal-profile-picker__empty">
                No profiles configured.{' '}
                <button type="button" className="esm-modal-config-link" onClick={openDataLoadingConfig}>
                  Add a profile in Configuration…
                </button>
              </p>
            )}

            <button
              type="button"
              className="esm-modal-config-link"
              disabled={disable_changes}
              onClick={openDataLoadingConfig}
            >
              Edit profiles in Configuration…
            </button>

            <InputText
              disabled={authenticated || disable_changes}
              label={'Username'}
              value={username}
              onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_USERNAME, payload: new_value })}
              onKeyPress={handlePasswordKeyPress}
            />
            <InputText
              disabled={authenticated || disable_changes}
              error={error}
              type={'password'}
              label={'Password'}
              value={password}
              onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_PASSWORD, payload: new_value })}
              onKeyPress={handlePasswordKeyPress}
            />
            <label className="esm-modal-remember-user">
              <input
                type="checkbox"
                disabled={disable_changes}
                checked={rememberUsername}
                onChange={(e) => dispatch({
                  type: esm_actions.SET_ESM_REMEMBER_USERNAME,
                  payload: e.target.checked,
                })}
              />
              Remember username
            </label>
            {!authenticated ? (
              <Button
                extra_class_name={'_align-center'}
                disabled={!(requestBase && username !== '' && password !== '' && !authenticated && !loading && !disable_changes)}
                text={loading ? 'Logging in...' : 'Login'}
                onClick={() => dispatch({ type: esm_actions.ESM_LOGIN })}
              />
            ) : (
              <Button
                extra_class_name={'_align-center'}
                disabled={!(username !== '' && password !== '' && authenticated && !disable_changes)}
                text={'Logout'}
                onClick={() => dispatch({ type: esm_actions.ESM_LOGOUT })}
              />
            )}
            {error && <div className={'__config-control-section-error'}>{errorMessage}</div>}
          </div>

          <div className={'__divider'} />
          <div className={'__config-control-section'}>
            <div className={'__config-control-section-title'}>Search for Slides</div>
            <div className={'__config-control-section-description'}>
              Enter search criteria below. Search loads each distinct accession, then filters the merged staging table by
              optional block and stain (per row).
            </div>
            <ESMSearchCriteriaGrid
              authenticated={authenticated}
              disableChanges={disable_changes}
              searchLoading={searchLoading}
              searchFeedback={searchFeedback}
              profile={profile}
            />
          </div>

          {hasSearchResults && (
            <>
              <div className={'__divider'} />
              <ESMStagingPanel disabled={disable_changes} />
            </>
          )}
        </div>
      </div>
      <div className={'__footer'} />
    </div>
  );
}

export default ModalESlideManager;
