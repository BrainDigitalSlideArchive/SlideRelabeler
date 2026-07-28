import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import * as modal_actions from '../../actions/modal';

import ModalHeader from './ModalHeader';
import ESMSearchCriteriaGrid from '../../components/esm/ESMSearchCriteriaGrid';
import ESMStagingPanel from '../../components/esm/ESMStagingPanel';
import ESMLoginCard from '../../components/esm/ESMLoginCard';
import ESMSessionBar from '../../components/esm/ESMSessionBar';
import { scrollConfigSectionIntoView } from '../../components/config-v2/ConfigV2Nav';
import { getActiveProfile, getEsmConnectionConfig } from '../../helpers/esm_profile_helpers';
import { selectedProfileSharesSwitchOriginHost } from '../../helpers/esm_session_helpers';

import '../../components/esm/esm_portal.scss';

function ModalESlideManager() {
  const esmState = useSelector((state) => state.esm);
  const profile = getActiveProfile(esmState);
  const profiles = useSelector((state) => state.esm.profiles);
  const activeProfileId = useSelector((state) => state.esm?.activeProfileId);
  const profileSwitchOpen = useSelector((state) => state.esm?.profileSwitchOpen === true);
  const { requestBase } = getEsmConnectionConfig(esmState);
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

  const showGate = !authenticated || profileSwitchOpen;
  const showWorkspace = authenticated && !profileSwitchOpen;
  const sameHostAsOrigin = profileSwitchOpen
    ? selectedProfileSharesSwitchOriginHost(esmState, profile)
    : false;

  const handlePasswordKeyPress = (e) => {
    if (e.key !== 'Enter' || username === '' || password === '' || loading || disable_changes) {
      return;
    }
    if (profileSwitchOpen && authenticated && sameHostAsOrigin) {
      return;
    }
    dispatch({ type: esm_actions.ESM_LOGIN });
  };

  const hasSearchResults = searchFeedback?.completed === true;

  function openApiIntegrationsConfig() {
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'config' } });
    requestAnimationFrame(() => {
      setTimeout(() => scrollConfigSectionIntoView('config-api-integrations'), 50);
    });
  }

  return (
    <div className="__modal">
      <ModalHeader title={'eSlideManager'} type={'esm'} />
      <div className="__content __content--config esm-portal">
        <div className="config-panel">
          {showWorkspace ? (
            <ESMSessionBar
              profileName={profile?.name}
              username={username}
              disabled={disable_changes || loading}
              onSwitchProfile={() => dispatch({ type: esm_actions.ESM_OPEN_PROFILE_SWITCH })}
              onSignOut={() => dispatch({ type: esm_actions.ESM_LOGOUT })}
            />
          ) : null}

          <div className={showGate ? 'config-panel__body config-panel__body--gate' : 'config-panel__body config-panel__body--workspace'}>
            {showGate ? (
              <ESMLoginCard
                profiles={profiles}
                activeProfileId={activeProfileId}
                username={username}
                password={password}
                rememberUsername={rememberUsername}
                authenticated={authenticated}
                profileSwitchOpen={profileSwitchOpen}
                sameHostAsOrigin={sameHostAsOrigin}
                loading={loading}
                error={error}
                errorMessage={errorMessage}
                requestBase={requestBase}
                disabled={disable_changes}
                onProfileChange={(e) => dispatch({
                  type: esm_actions.ESM_SET_ACTIVE_PROFILE_ID,
                  payload: e.target.value,
                })}
                onUsernameChange={(value) => dispatch({
                  type: esm_actions.SET_ESM_USERNAME,
                  payload: value,
                })}
                onPasswordChange={(value) => dispatch({
                  type: esm_actions.SET_ESM_PASSWORD,
                  payload: value,
                })}
                onRememberChange={(e) => dispatch({
                  type: esm_actions.SET_ESM_REMEMBER_USERNAME,
                  payload: e.target.checked,
                })}
                onSignIn={() => dispatch({ type: esm_actions.ESM_LOGIN })}
                onConfirmSwitch={() => dispatch({
                  type: esm_actions.ESM_CONFIRM_PROFILE_SWITCH,
                  payload: activeProfileId,
                })}
                onCancelSwitch={() => dispatch({ type: esm_actions.ESM_CLOSE_PROFILE_SWITCH })}
                onOpenConfig={openApiIntegrationsConfig}
                onPasswordKeyPress={handlePasswordKeyPress}
              />
            ) : (
              <div className="__config-controls">
                <section className="__config-control-section">
                  <div className="__config-control-section-title">Search for slides</div>
                  <div className="__config-control-section-description">
                    Enter search criteria below. Search loads each distinct accession, then filters the merged staging
                    table by optional block and stain (per row).
                  </div>
                  <ESMSearchCriteriaGrid
                    authenticated={authenticated}
                    disableChanges={disable_changes}
                    searchLoading={searchLoading}
                    searchFeedback={searchFeedback}
                    profile={profile}
                  />
                </section>

                {hasSearchResults && (
                  <>
                    <div className="__divider" />
                    <ESMStagingPanel disabled={disable_changes} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="__footer" />
    </div>
  );
}

export default ModalESlideManager;
