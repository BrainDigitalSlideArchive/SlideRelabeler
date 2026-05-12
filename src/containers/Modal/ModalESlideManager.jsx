import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';

import ModalHeader from './ModalHeader';
import InputText from '../../components/controls/input/InputText';
import Button from '../../components/controls/button/Button';
import ESMSearchCriteriaGrid from '../../components/esm/ESMSearchCriteriaGrid';
import ESMOutputSettingsPanel from '../../components/esm/ESMOutputSettingsPanel';
import ESMStagingPanel from '../../components/esm/ESMStagingPanel';

/**
 * Modal component for eSlideManager integration
 * Allows users to connect to eSlideManager and search for slides by accession number
 */
function ModalESlideManager() {
  const url = useSelector((state) => state.esm.url);
  const username = useSelector((state) => state.esm.username);
  const password = useSelector((state) => state.esm.password);
  const authenticated = useSelector((state) => state.esm.authenticated);
  const loading = useSelector((state) => state.esm.loading);
  const error = useSelector((state) => state.esm.error);
  const errorMessage = useSelector((state) => state.esm.errorMessage);
  const searchLoading = useSelector((state) => state.esm.searchLoading);
  const searchError = useSelector((state) => state.esm.searchError);
  const searchErrorMessage = useSelector((state) => state.esm.searchErrorMessage);
  const disable_changes = useSelector((state) => state.files.disable_changes);
  const slidesByAccession = useSelector((state) => state.esm.slidesByAccession);

  const dispatch = useDispatch();

  const handlePasswordKeyPress = (e) => {
    if (e.key === 'Enter' && username !== '' && password !== '' && !authenticated && !loading && !disable_changes) {
      dispatch({ type: esm_actions.ESM_LOGIN });
    }
  };

  const hasSearchBatch =
    slidesByAccession && typeof slidesByAccession === 'object' && Object.keys(slidesByAccession).length > 0;

  return (
    <div className="__modal">
      <ModalHeader title={'eSlideManager'} type={'esm'} />
      <div className={'__content'}>
        <div className={'__divider'} />
        <div className={'__config-controls'}>
          <div className={'__config-control-section'}>
            <div className={'__config-control-section-title'}>Connection Settings</div>
            <div className={'__config-control-section-description'}>
              Enter your eSlideManager URL and credentials to search for slides.
            </div>
            <div className={'__config-control-section-dsa-group'}>
              <div className={'__config-control-section-dsa-subgroup'}>
                <InputText
                  disabled={authenticated || disable_changes}
                  error={error}
                  label={'API URL'}
                  value={url}
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_URL, payload: new_value })}
                />
                <InputText
                  disabled={authenticated || disable_changes}
                  error={error}
                  label={'Username'}
                  value={username}
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_USERNAME, payload: new_value })}
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
                {!authenticated ? (
                  <Button
                    extra_class_name={'_align-center'}
                    disabled={!(username !== '' && password !== '' && !authenticated && !loading && !disable_changes)}
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
              <div className={'__config-control-section-dsa-subgroup'}>
                {authenticated && (
                  <div className={'__dsa-auth-group'}>
                    <div className={'__dsa-auth-item'}>
                      <div className={'__dsa-auth-item-label'}>API URL:</div>
                      <div className={'__dsa-auth-item-value'}>{url}</div>
                    </div>
                    <div className={'__dsa-auth-item'}>
                      <div className={'__dsa-auth-item-label'}>Username:</div>
                      <div className={'__dsa-auth-item-value'}>{username}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {authenticated && (
            <>
              <div className={'__divider'} />
              <div className={'__config-control-section'}>
                <div className={'__config-control-section-title'}>Output naming</div>
                <div className={'__config-control-section-description'}>
                  Configure filenames and normalization before running a search. The same settings apply to the staging
                  table after results load.
                </div>
                <ESMOutputSettingsPanel disabled={disable_changes} />
              </div>
            </>
          )}

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
              searchError={searchError}
            />
            {searchError && <div className={'__config-control-section-error'}>{searchErrorMessage}</div>}
          </div>

          {hasSearchBatch && (
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
