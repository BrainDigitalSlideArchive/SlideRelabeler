import React, { useState } from 'react';
import { useSelector, useDispatch } from "react-redux";

import * as esm_actions from "../../actions/esm";

import ModalHeader from './ModalHeader';
import InputText from '../../components/controls/input/InputText';
import Button from '../../components/controls/button/Button';

/**
 * Modal component for eSlideManager integration
 * Allows users to connect to eSlideManager and search for slides by accession number
 */
function ModalESlideManager(props) {
  const url = useSelector(state => state.esm.url);
  const username = useSelector(state => state.esm.username);
  const password = useSelector(state => state.esm.password);
  const authenticated = useSelector(state => state.esm.authenticated);
  const loading = useSelector(state => state.esm.loading);
  const error = useSelector(state => state.esm.error);
  const errorMessage = useSelector(state => state.esm.errorMessage);
  const searchLoading = useSelector(state => state.esm.searchLoading);
  const searchError = useSelector(state => state.esm.searchError);
  const searchErrorMessage = useSelector(state => state.esm.searchErrorMessage);
  const processing = useSelector(state => state.files.processing);
  const disable_changes = useSelector(state => state.files.disable_changes);

  const dispatch = useDispatch();

  const [accession, setAccession] = useState('');

  const handleSearch = () => {
    if (accession.trim() && authenticated) {
      dispatch({ type: esm_actions.ESM_SEARCH, payload: accession.trim() });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && accession.trim() && authenticated && !loading && !searchLoading) {
      handleSearch();
    }
  };

  return (
    <div className="__modal">
      <ModalHeader title={"eSlideManager"} type={"esm"} />
      <div className={"__content"}>
        <div className={"__divider"} />
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Connection Settings</div>
            <div className={"__config-control-section-description"}>
              Enter your eSlideManager URL and credentials to search for slides.
            </div>
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <InputText 
                  disabled={authenticated || processing || disable_changes} 
                  error={error} 
                  label={"API URL"} 
                  value={url} 
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_URL, payload: new_value })} 
                />
                <InputText 
                  disabled={authenticated || processing || disable_changes} 
                  error={error} 
                  label={"Username"} 
                  value={username} 
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_USERNAME, payload: new_value })} 
                />
                <InputText 
                  disabled={authenticated || processing || disable_changes} 
                  error={error} 
                  type={"password"} 
                  label={"Password"} 
                  value={password} 
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_PASSWORD, payload: new_value })} 
                />
                {
                  !authenticated ?
                    <Button 
                      extra_class_name={"_align-center"} 
                      disabled={!(username !== '' && password !== '' && !authenticated && !loading)} 
                      text={loading ? "Logging in..." : "Login"} 
                      onClick={() => dispatch({ type: esm_actions.ESM_LOGIN })} 
                    /> :
                    <Button 
                      extra_class_name={"_align-center"} 
                      disabled={!(username !== '' && password !== '' && authenticated)} 
                      text={"Logout"} 
                      onClick={() => dispatch({ type: esm_actions.ESM_LOGOUT })} 
                    />
                }
                {
                  error && <div className={"__config-control-section-error"}>{errorMessage}</div>
                }
              </div>
              <div className={"__config-control-section-dsa-subgroup"}>
                {
                  authenticated &&
                  <div className={"__dsa-auth-group"}>
                    <div className={"__dsa-auth-item"}>
                      <div className={"__dsa-auth-item-label"}>
                        API URL:
                      </div>
                      <div className={"__dsa-auth-item-value"}>
                        {url}
                      </div>
                    </div>
                    <div className={"__dsa-auth-item"}>
                      <div className={"__dsa-auth-item-label"}>
                        Username:
                      </div>
                      <div className={"__dsa-auth-item-value"}>
                        {username}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
          <div className={"__divider"} />
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Search for Slides</div>
            <div className={"__config-control-section-description"}>
              Enter an accession number to search for slides. Results will be added to the file table.
            </div>
            <div className={"__config-control-section-group"}>
              <InputText 
                disabled={!authenticated || processing || disable_changes || searchLoading} 
                error={searchError} 
                label={"Accession Number"} 
                value={accession} 
                onChange={(new_value) => setAccession(new_value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                disabled={!authenticated || !accession.trim() || processing || disable_changes || searchLoading} 
                text={searchLoading ? "Searching..." : "Search"} 
                onClick={handleSearch} 
              />
            </div>
            {
              searchError && <div className={"__config-control-section-error"}>{searchErrorMessage}</div>
            }
          </div>
        </div>
      </div>
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalESlideManager;
