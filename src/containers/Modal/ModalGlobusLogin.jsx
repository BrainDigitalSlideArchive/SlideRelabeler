import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as globus_actions from '../../actions/globus';
import * as modal_actions from '../../actions/modal';
import GlobusLoginFlow from '../../components/globus/GlobusLoginFlow';
import ModalHeader from './ModalHeader';

import '../../components/upload/folder-picker.scss';
import './ModalNetwork.scss';

/**
 * Compact stackable Globus login dialog. Closes on successful auth so the previous
 * modal (endpoint picker, Config, etc.) remains underneath.
 */
export default function ModalGlobusLogin() {
  const dispatch = useDispatch();
  const {
    api_auth,
    cli_available,
    login_error,
    login_error_message,
    login_url,
    access_code,
    login_pending,
    auth_check_pending,
    authorization_code_input,
  } = useSelector((state) => state.globus);

  const startedRef = useRef(false);

  function close() {
    dispatch({ type: modal_actions.CLOSE_MODAL });
  }

  useEffect(() => {
    let cancelled = false;
    async function ensureCliStatus() {
      if (cli_available != null) return;
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
  }, [cli_available, dispatch]);

  // Auto-start login once when the modal opens (CLI ready, not already pending/authed).
  useEffect(() => {
    if (startedRef.current) return;
    if (api_auth) return;
    if (cli_available === false) return;
    if (cli_available == null) return;
    if (login_pending || auth_check_pending) {
      startedRef.current = true;
      return;
    }
    startedRef.current = true;
    dispatch({ type: globus_actions.LOGIN });
  }, [api_auth, auth_check_pending, cli_available, dispatch, login_pending]);

  useEffect(() => {
    if (!api_auth) return;
    dispatch({ type: modal_actions.CLOSE_MODAL });
  }, [api_auth, dispatch]);

  return (
    <div className="__modal __modal--compact">
      <ModalHeader title="Sign in to Globus" type="globusLogin" />
      <div className="__content __content--config">
        <div className="config-panel">
          <div className="config-panel__body">
            <GlobusLoginFlow
              cliAvailable={cli_available}
              authCheckPending={auth_check_pending}
              loginPending={login_pending}
              loginUrl={login_url}
              accessCode={access_code}
              authorizationCodeInput={authorization_code_input}
              errorMessage={login_error ? login_error_message : null}
              onLogin={() => dispatch({ type: globus_actions.LOGIN })}
              onCheckAuth={() => dispatch({ type: globus_actions.CHECK_AUTH })}
              onSubmitCode={() => dispatch({ type: globus_actions.SUBMIT_AUTHORIZATION_CODE })}
              onAuthorizationCodeInputChange={(value) =>
                dispatch({ type: globus_actions.SET_AUTHORIZATION_CODE_INPUT, payload: value })
              }
              onCancel={close}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
